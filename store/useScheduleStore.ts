import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { FocusNodeTemplateId } from "@/data/quickActions";
import { computeSessionEndsAt, findOverlappingNode, getScheduleWindow, isDurationSessionExpired, toIsoDateString } from "@/lib/time";
import {
  buildScheduleConflictDetails,
  formatScheduleConflictMessage,
  type ScheduleConflictDetails,
} from "@/lib/scheduleConflict";
import { isWithinClassNominalWindow } from "@/lib/classCompletion";
import {
  computeRequiredOnSiteMs,
  computeShieldStartsAt,
  getSessionNominalStartMs,
  type ShieldScheduleSettings,
} from "@/lib/shieldSchedule";
import {
  getCarriedPenaltyFields,
  isFocusNodeRemovalLocked,
  isShieldActiveForNodes,
} from "@/lib/sessionPenalty";
import { clampGeofenceRadiusMeters, validateCalibrationSave } from "@/lib/geo";
import { resetPresenceTimers } from "@/lib/presenceEngine";
import {
  cancelAllPresenceNotifications,
  clearSessionAwayNotifications,
  notifyPresencePenalty,
  notifyMissedClassPenalty,
  notifySessionAway,
} from "@/services/presenceReminders";
import { notifyDailyGoalAchieved } from "@/services/completionReminders";
import { cancelMissedSessionReminder } from "@/services/sessionReminders";
import type { Anchor, AnchorInput } from "@/types/anchor";
import type { FocusNode, FocusNodeInput } from "@/types/focusNode";
import type { PlaceSelection } from "@/types/place";
import type { ActiveSessionSnapshot } from "@/types/session";

import {
  buildActiveSessionSnapshot,
  countCompletedSessionsToday,
  getDailyGoalTarget,
  selectDailyGoal,
  selectHeroCardData,
  selectSessionDetail,
  selectTodaySchedule,
  selectWeekSchedule,
  type PresenceContext,
} from "@/store/selectors";
import { useSessionPenaltyStore, type SessionPenaltyReason } from "@/store/useSessionPenaltyStore";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { createNodeFromTemplate } from "@/store/seed";
import { useSessionCompleteStore } from "@/store/useSessionCompleteStore";
import { useUserStore } from "@/store/useUserStore";

export type AddFocusNodeResult =
  | { success: true; nodeId: string }
  | { success: false; error: string; conflict: ScheduleConflictDetails };

export type UpdateFocusNodeResult =
  | { success: true }
  | { success: false; error: string; conflict?: ScheduleConflictDetails };

export type CalibrateAnchorInput = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  /** GPS from hold-to-confirm — used to enforce on-site calibration. */
  capturedLatitude: number;
  capturedLongitude: number;
};

/** On-site progress parked when an incomplete duration session yields to a later node. */
export type DurationSessionHold = {
  onSiteAccumulatedMs: number;
};

type ScheduleState = {
  focusNodes: FocusNode[];
  anchors: Anchor[];
  activeSession: ActiveSessionSnapshot | null;
  durationSessionHold: Record<string, DurationSessionHold>;
  addFocusNode: (input: FocusNodeInput) => AddFocusNodeResult;
  addFocusNodeFromTemplate: (templateId: FocusNodeTemplateId) => AddFocusNodeResult;
  updateFocusNode: (nodeId: string, input: FocusNodeInput) => UpdateFocusNodeResult;
  removeFocusNode: (nodeId: string) => void;
  addAnchor: (input: AnchorInput) => string;
  resolveAnchorForPlace: (place: PlaceSelection, radiusMeters?: number) => string;
  calibrateAnchor: (anchorId: string, input: CalibrateAnchorInput) => boolean;
  linkNodeToAnchor: (nodeId: string, anchorId: string) => boolean;
  setActiveSession: (nodeId: string | null, endsAt?: string) => void;
  beginCalendarSession: (nodeId: string) => boolean;
  startSession: (nodeId: string) => boolean;
  tickOnSitePresence: (insideGeofence: boolean, now?: number) => void;
  markSessionAway: () => void;
  clearSessionAway: () => void;
  applyPresencePenalty: () => void;
  applyClassMissPenalty: (nodeId?: string) => void;
  markSessionPresenceVerified: () => void;
  completeActiveSession: () => void;
  expireActiveSessionAsMissed: () => void;
  markNodeCompleted: (nodeId: string, dateIso: string) => void;
  markNodeSkipped: (nodeId: string, dateIso: string) => void;
  getDailyGoal: () => ReturnType<typeof selectDailyGoal>;
  getHeroCardData: (
    presence?: PresenceContext | null,
  ) => ReturnType<typeof selectHeroCardData>;
  getTodaySchedule: () => ReturnType<typeof selectTodaySchedule>;
  getWeekSchedule: () => ReturnType<typeof selectWeekSchedule>;
  getSessionDetail: (nodeId: string, dateIso?: string) => ReturnType<typeof selectSessionDetail>;
  getCompletedSessionsToday: () => number;
};

function createNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAnchorId(): string {
  return `anchor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getShieldSettings(): ShieldScheduleSettings {
  const user = useUserStore.getState();
  return {
    classPreBufferMinutes: user.classPreBufferMinutes,
    sessionGapMergeMinutes: user.sessionGapMergeMinutes,
  };
}

type ScheduleStoreGetter = () => ScheduleState;
type ScheduleStoreSetter = (
  partial:
    | Partial<ScheduleState>
    | ((state: ScheduleState) => Partial<ScheduleState>),
) => void;

function markNodeMissPenalized(
  get: ScheduleStoreGetter,
  set: ScheduleStoreSetter,
  nodeId: string,
  dateIso: string,
): void {
  set({
    focusNodes: get().focusNodes.map((node) =>
      node.id === nodeId && !(node.missPenaltyDates ?? []).includes(dateIso)
        ? {
            ...node,
            missPenaltyDates: [...(node.missPenaltyDates ?? []), dateIso],
          }
        : node,
    ),
  });
}

function applyPenaltyLockToSession(
  set: ScheduleStoreSetter,
  session: ActiveSessionSnapshot,
  reason: SessionPenaltyReason,
  originNodeId = session.nodeId,
): void {
  const tierMinutes = useUserStore.getState().penaltyTierMinutes;
  const penaltyShieldEndsAt = new Date(
    Date.now() + tierMinutes * 60 * 1000,
  ).toISOString();

  set({
    activeSession: {
      ...session,
      penaltyShieldEndsAt,
      penaltyMinutes: tierMinutes,
      penaltyOriginNodeId: originNodeId,
    },
  });

  const originNode = useScheduleStore.getState().focusNodes.find((item) => item.id === originNodeId);
  const originTitle = originNode?.title ?? session.nodeTitle;
  const originZone = originNode?.locationLabel ?? session.zoneLabel;

  useSessionPenaltyStore.getState().show({
    nodeTitle: originTitle,
    anchorName: originZone,
    penaltyMinutes: tierMinutes,
    reason,
  });

  if (reason === "away") {
    void notifyPresencePenalty(session.zoneLabel, session.nodeId, tierMinutes);
  } else {
    void notifyMissedClassPenalty(originZone, originNodeId, tierMinutes);
  }
}

/** Skip per-second Zustand writes when only sub-second on-site ms changed. */
function shouldPublishOnSiteTick(
  prev: ActiveSessionSnapshot,
  next: ActiveSessionSnapshot,
): boolean {
  if (prev.onSiteLastTickAt !== next.onSiteLastTickAt) return true;
  if (prev.headline !== next.headline) return true;
  return (
    Math.floor(prev.onSiteAccumulatedMs / 1000) !==
    Math.floor(next.onSiteAccumulatedMs / 1000)
  );
}

function applyOnSitePresenceTick(
  session: ActiveSessionSnapshot,
  insideGeofence: boolean,
  now: number,
  focusNodes: FocusNode[],
  anchors: Anchor[],
): ActiveSessionSnapshot {
  if (insideGeofence && session.presenceVerified) {
    const lastTick = session.onSiteLastTickAt
      ? new Date(session.onSiteLastTickAt).getTime()
      : now;
    const delta = session.onSiteLastTickAt ? Math.max(now - lastTick, 0) : 0;
    const node = focusNodes.find((item) => item.id === session.nodeId);
    const headline = node
      ? buildActiveSessionSnapshot(node, anchors, session.endsAt).headline
      : session.headline;

    return {
      ...session,
      onSiteAccumulatedMs: session.onSiteAccumulatedMs + delta,
      onSiteLastTickAt: new Date(now).toISOString(),
      headline,
    };
  }

  if (!session.onSiteLastTickAt) return session;

  const lastTick = new Date(session.onSiteLastTickAt).getTime();
  const delta = Math.max(now - lastTick, 0);
  return {
    ...session,
    onSiteAccumulatedMs: session.onSiteAccumulatedMs + delta,
    onSiteLastTickAt: null,
  };
}

function createCalendarSessionFields(
  node: FocusNode,
  anchors: Anchor[],
  endsAt: string,
  settings: ShieldScheduleSettings,
): ActiveSessionSnapshot {
  const scheduleType = node.schedule.type === "class" ? "class" : "duration";
  const shieldStartsAt = computeShieldStartsAt(node, settings).toISOString();
  const zoneLabel = buildActiveSessionSnapshot(node, anchors, endsAt).zoneLabel;
  const travelHeadline =
    scheduleType === "duration"
      ? `Go to ${zoneLabel}`
      : `Head to ${zoneLabel} for class`;

  return {
    nodeId: node.id,
    zoneLabel,
    headline: travelHeadline,
    nodeTitle: node.title,
    scheduleType,
    shieldStartsAt,
    endsAt,
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: computeRequiredOnSiteMs(node),
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    penaltyOriginNodeId: null,
    presenceVerified: false,
  };
}

function withoutDurationHold(
  holds: Record<string, DurationSessionHold>,
  nodeId: string,
): Record<string, DurationSessionHold> {
  if (!(nodeId in holds)) return holds;
  const next = { ...holds };
  delete next[nodeId];
  return next;
}

function stashDurationHoldIfNeeded(
  session: ActiveSessionSnapshot | null,
  nextNodeId: string,
  holds: Record<string, DurationSessionHold>,
): Record<string, DurationSessionHold> {
  if (
    !session ||
    session.nodeId === nextNodeId ||
    session.scheduleType !== "duration" ||
    session.requiredOnSiteMs == null ||
    session.onSiteAccumulatedMs <= 0 ||
    session.onSiteAccumulatedMs >= session.requiredOnSiteMs ||
    isDurationSessionExpired(session.shieldStartsAt, new Date())
  ) {
    return holds;
  }
  return {
    ...holds,
    [session.nodeId]: { onSiteAccumulatedMs: session.onSiteAccumulatedMs },
  };
}

function applyCarriedPenalty(
  snapshot: ActiveSessionSnapshot,
  previous: ActiveSessionSnapshot | null,
): ActiveSessionSnapshot {
  const carried = getCarriedPenaltyFields(previous);
  if (!carried) return snapshot;
  return { ...snapshot, ...carried };
}

function restoreDurationHold(
  snapshot: ActiveSessionSnapshot,
  hold: DurationSessionHold | undefined,
): ActiveSessionSnapshot {
  if (!hold) return snapshot;
  return {
    ...snapshot,
    onSiteAccumulatedMs: hold.onSiteAccumulatedMs,
  };
}

/** Classroom-sized provisional geofence until first-arrival GPS refine. */
const DEFAULT_PROVISIONAL_RADIUS_M = 30;

/** Focus Nodes, Anchors, and session snapshots — the schedule store backbone. */
export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      focusNodes: [],
      anchors: [],
      // Real sessions start from the Hero Card — no seed active session.
      activeSession: null,
      durationSessionHold: {},

      addFocusNode: (input) => {
        const { focusNodes } = get();

        const conflictNode = findOverlappingNode(input.schedule, focusNodes);
        if (conflictNode) {
          const conflict = buildScheduleConflictDetails(conflictNode);
          return {
            success: false,
            error: formatScheduleConflictMessage(conflict),
            conflict,
          };
        }

        const node: FocusNode = {
          ...input,
          id: createNodeId(),
          locationLabel: input.locationLabel ?? null,
          completedDates: input.completedDates ?? [],
          skippedDates: input.skippedDates ?? [],
          missPenaltyDates: input.missPenaltyDates ?? [],
        };

        set({ focusNodes: [...focusNodes, node] });
        return { success: true, nodeId: node.id };
      },

      addFocusNodeFromTemplate: (templateId) => {
        const input = createNodeFromTemplate(templateId);
        return get().addFocusNode(input);
      },

      updateFocusNode: (nodeId, input) => {
        const { focusNodes, activeSession, anchors } = get();
        const existing = focusNodes.find((node) => node.id === nodeId);
        if (!existing) {
          return { success: false, error: "Focus Node not found." };
        }

        const conflictNode = findOverlappingNode(input.schedule, focusNodes, nodeId);
        if (conflictNode) {
          const conflict = buildScheduleConflictDetails(conflictNode);
          return {
            success: false,
            error: formatScheduleConflictMessage(conflict),
            conflict,
          };
        }

        const updated: FocusNode = {
          ...existing,
          ...input,
          id: nodeId,
          completedDates: existing.completedDates,
          skippedDates: existing.skippedDates ?? [],
          missPenaltyDates: existing.missPenaltyDates ?? [],
        };

        set({
          focusNodes: focusNodes.map((node) => (node.id === nodeId ? updated : node)),
          // Keep the live countdown label in sync when the active node is edited.
          activeSession:
            activeSession?.nodeId === nodeId
              ? {
                  ...createCalendarSessionFields(
                    updated,
                    anchors,
                    activeSession.endsAt,
                    getShieldSettings(),
                  ),
                  onSiteAccumulatedMs: activeSession.onSiteAccumulatedMs,
                  onSiteLastTickAt: activeSession.onSiteLastTickAt,
                  awaySince: activeSession.awaySince,
                  penaltyShieldEndsAt: activeSession.penaltyShieldEndsAt,
                  penaltyMinutes: activeSession.penaltyMinutes,
                  penaltyOriginNodeId: activeSession.penaltyOriginNodeId ?? null,
                  presenceVerified: activeSession.presenceVerified,
                  headline: activeSession.presenceVerified
                    ? buildActiveSessionSnapshot(updated, anchors, activeSession.endsAt).headline
                    : createCalendarSessionFields(
                        updated,
                        anchors,
                        activeSession.endsAt,
                        getShieldSettings(),
                      ).headline,
                }
              : activeSession,
        });

        return { success: true };
      },

      removeFocusNode: (nodeId) => {
        const { focusNodes, activeSession } = get();
        // Deleting the live node would clear activeSession and end focus enforcement.
        if (isFocusNodeRemovalLocked(nodeId, activeSession)) return;
        set({
          focusNodes: focusNodes.filter((node) => node.id !== nodeId),
          activeSession: activeSession?.nodeId === nodeId ? null : activeSession,
          durationSessionHold: withoutDurationHold(get().durationSessionHold, nodeId),
        });
      },

      addAnchor: (input) => {
        const anchor: Anchor = { ...input, id: createAnchorId() };
        set({ anchors: [...get().anchors, anchor] });
        return anchor.id;
      },

      resolveAnchorForPlace: (place, radiusMeters = DEFAULT_PROVISIONAL_RADIUS_M) => {
        const { anchors } = get();
        const clampedRadius = clampGeofenceRadiusMeters(radiusMeters);
        const isDeferred =
          place.deferred === true || (place.latitude === 0 && place.longitude === 0);

        const applyGeofenceToAnchor = (anchorId: string) => {
          if (isDeferred) return anchorId;

          set({
            anchors: get().anchors.map((anchor) =>
              anchor.id === anchorId
                ? {
                    ...anchor,
                    name: place.name,
                    formattedAddress: place.formattedAddress || anchor.formattedAddress,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    sourceLatitude: place.latitude,
                    sourceLongitude: place.longitude,
                    radiusMeters: clampedRadius,
                  }
                : anchor,
            ),
          });
          return anchorId;
        };

        const existing = anchors.find((anchor) => anchor.placeId === place.placeId);
        if (existing) return applyGeofenceToAnchor(existing.id);

        // Nearby reuse only for real map pins — never match deferred 0,0 placeholders.
        if (!isDeferred) {
          const nearby = anchors.find((anchor) => {
            if (anchor.latitude === 0 && anchor.longitude === 0) return false;
            const dLat = Math.abs(anchor.latitude - place.latitude);
            const dLng = Math.abs(anchor.longitude - place.longitude);
            return dLat < 0.0004 && dLng < 0.0004;
          });
          if (nearby) return applyGeofenceToAnchor(nearby.id);
        }

        // Deferred anchors wait for on-site GPS; searched/pinned coords work immediately.
        return get().addAnchor({
          name: place.name,
          placeId: place.placeId,
          formattedAddress: place.formattedAddress || null,
          sourceLatitude: place.latitude,
          sourceLongitude: place.longitude,
          latitude: place.latitude,
          longitude: place.longitude,
          radiusMeters: clampedRadius,
          calibrated: false,
        });
      },

      calibrateAnchor: (anchorId, input) => {
        const { anchors } = get();
        const anchor = anchors.find((item) => item.id === anchorId);
        if (!anchor) return false;

        const captured = {
          latitude: input.capturedLatitude,
          longitude: input.capturedLongitude,
        };
        const proposed = {
          latitude: input.latitude,
          longitude: input.longitude,
        };
        if (validateCalibrationSave(anchor, captured, proposed) != null) {
          return false;
        }

        set({
          anchors: anchors.map((anchor) => {
            if (anchor.id !== anchorId) return anchor;

            const wasDeferred = anchor.latitude === 0 && anchor.longitude === 0;
            return {
              ...anchor,
              latitude: input.latitude,
              longitude: input.longitude,
              // First on-site capture becomes the source of truth for deferred venues.
              sourceLatitude: wasDeferred ? input.latitude : anchor.sourceLatitude,
              sourceLongitude: wasDeferred ? input.longitude : anchor.sourceLongitude,
              radiusMeters: input.radiusMeters,
              calibrated: true,
              formattedAddress:
                wasDeferred && !anchor.formattedAddress
                  ? "Set on arrival"
                  : anchor.formattedAddress,
            };
          }),
        });
        return true;
      },

      linkNodeToAnchor: (nodeId, anchorId) => {
        const { focusNodes, anchors } = get();
        const node = focusNodes.find((focusNode) => focusNode.id === nodeId);
        const anchor = anchors.find((item) => item.id === anchorId);
        if (!node || !anchor) return false;

        set({
          focusNodes: focusNodes.map((focusNode) =>
            focusNode.id === nodeId ? { ...focusNode, anchorId } : focusNode,
          ),
        });
        return true;
      },

      setActiveSession: (nodeId, endsAt) => {
        const previous = get().activeSession;
        if (!nodeId) {
          if (previous) {
            void cancelAllPresenceNotifications(previous.nodeId);
          }
          set({ activeSession: null });
          return;
        }

        const node = get().focusNodes.find((focusNode) => focusNode.id === nodeId);
        if (!node) {
          if (previous) {
            void cancelAllPresenceNotifications(previous.nodeId);
          }
          set({ activeSession: null });
          return;
        }

        const sessionEndsAt = endsAt ?? computeSessionEndsAt(node.schedule);
        const holds = stashDurationHoldIfNeeded(
          previous,
          nodeId,
          get().durationSessionHold,
        );
        const snapshot = applyCarriedPenalty(
          restoreDurationHold(
            createCalendarSessionFields(
              node,
              get().anchors,
              sessionEndsAt,
              getShieldSettings(),
            ),
            holds[nodeId],
          ),
          previous,
        );
        set({
          activeSession: snapshot,
          durationSessionHold: withoutDurationHold(holds, nodeId),
        });
      },

      beginCalendarSession: (nodeId) => {
        const previous = get().activeSession;
        if (previous?.nodeId === nodeId) return true;

        const node = get().focusNodes.find((focusNode) => focusNode.id === nodeId);
        if (!node) return false;

        const endsAt = computeSessionEndsAt(node.schedule);
        const holds = stashDurationHoldIfNeeded(
          previous,
          nodeId,
          get().durationSessionHold,
        );
        const snapshot = applyCarriedPenalty(
          restoreDurationHold(
            createCalendarSessionFields(
              node,
              get().anchors,
              endsAt,
              getShieldSettings(),
            ),
            holds[nodeId],
          ),
          previous,
        );
        set({
          activeSession: snapshot,
          durationSessionHold: withoutDurationHold(holds, nodeId),
        });
        resetPresenceTimers();
        useArrivalCelebrationStore.getState().clearCelebrationMemory();
        return true;
      },

      startSession: (nodeId) => {
        const node = get().focusNodes.find((focusNode) => focusNode.id === nodeId);
        if (!node) return false;

        const previous = get().activeSession;
        const endsAt = computeSessionEndsAt(node.schedule);
        const settings = getShieldSettings();
        const holds = stashDurationHoldIfNeeded(
          previous,
          nodeId,
          get().durationSessionHold,
        );
        const snapshot = applyCarriedPenalty(
          restoreDurationHold(
            createCalendarSessionFields(node, get().anchors, endsAt, settings),
            holds[nodeId],
          ),
          previous,
        );
        set({
          activeSession: {
            ...snapshot,
            headline: buildActiveSessionSnapshot(node, get().anchors, endsAt).headline,
            presenceVerified: true,
            onSiteLastTickAt: new Date().toISOString(),
          },
          durationSessionHold: withoutDurationHold(holds, nodeId),
        });
        return true;
      },

      tickOnSitePresence: (insideGeofence, now = Date.now()) => {
        const session = get().activeSession;
        if (!session) return;

        const settings = getShieldSettings();
        const { focusNodes, anchors } = get();

        if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
          const countsTowardAttendance =
            insideGeofence &&
            session.presenceVerified &&
            now >= getSessionNominalStartMs(session, settings);

          const next = applyOnSitePresenceTick(
            session,
            countsTowardAttendance,
            now,
            focusNodes,
            anchors,
          );
          if (shouldPublishOnSiteTick(session, next)) {
            set({ activeSession: next });
          }
          return;
        }

        if (session.scheduleType === "class") {
          const countsTowardAttendance =
            insideGeofence &&
            session.presenceVerified &&
            isWithinClassNominalWindow(session, settings, now);

          const next = applyOnSitePresenceTick(
            session,
            countsTowardAttendance,
            now,
            focusNodes,
            anchors,
          );
          if (shouldPublishOnSiteTick(session, next)) {
            set({ activeSession: next });
          }
        }
      },

      markSessionAway: () => {
        const session = get().activeSession;
        if (!session || session.awaySince) return;

        set({
          activeSession: {
            ...session,
            awaySince: new Date().toISOString(),
          },
        });

        void notifySessionAway(
          session.zoneLabel,
          session.nodeId,
          session.scheduleType,
        );
      },

      clearSessionAway: () => {
        const session = get().activeSession;
        if (!session?.awaySince) return;

        set({
          activeSession: {
            ...session,
            awaySince: null,
          },
        });

        void clearSessionAwayNotifications(session.nodeId);
      },

      applyPresencePenalty: () => {
        const session = get().activeSession;
        if (!session?.awaySince || session.penaltyShieldEndsAt) return;
        // Gym/library already stay locked until on-site quota or midnight.
        if (session.scheduleType !== "class") return;
        const todayIso = toIsoDateString(new Date());
        markNodeMissPenalized(get, set, session.nodeId, todayIso);
        applyPenaltyLockToSession(set, session, "away");
      },

      applyClassMissPenalty: (nodeId) => {
        const session = get().activeSession;
        const targetId = nodeId ?? session?.nodeId;
        if (!targetId) return;

        const todayIso = toIsoDateString(new Date());
        const node = get().focusNodes.find((item) => item.id === targetId);
        if (!node || node.schedule.type !== "class") return;
        if (node.completedDates.includes(todayIso)) return;
        if ((node.skippedDates ?? []).includes(todayIso)) return;
        if ((node.missPenaltyDates ?? []).includes(todayIso)) return;

        markNodeMissPenalized(get, set, targetId, todayIso);

        const live = get().activeSession;
        if (!live) return;
        if (live.penaltyShieldEndsAt) return;
        applyPenaltyLockToSession(set, live, "missed", targetId);
      },

      markSessionPresenceVerified: () => {
        const session = get().activeSession;
        if (!session || session.presenceVerified) return;

        void cancelMissedSessionReminder(session.nodeId, toIsoDateString(new Date()));

        const node = get().focusNodes.find((item) => item.id === session.nodeId);
        const headline = node
          ? buildActiveSessionSnapshot(node, get().anchors, session.endsAt).headline
          : session.headline;
        const nowIso = new Date().toISOString();

        set({
          activeSession: {
            ...session,
            presenceVerified: true,
            headline,
            onSiteLastTickAt:
              session.scheduleType === "duration" && session.requiredOnSiteMs != null
                ? nowIso
                : session.onSiteLastTickAt,
          },
        });
      },

      completeActiveSession: () => {
        const session = get().activeSession;
        if (!session || !session.presenceVerified) return;

        const todayIso = toIsoDateString(new Date());
        const node = get().focusNodes.find((focusNode) => focusNode.id === session.nodeId);
        const alreadyCompleted = node?.completedDates.includes(todayIso) ?? false;

        get().markNodeCompleted(session.nodeId, todayIso);

        const settings = getShieldSettings();
        const holds = withoutDurationHold(get().durationSessionHold, session.nodeId);
        if (isShieldActiveForNodes(get().focusNodes, session, settings)) {
          set({ activeSession: session, durationSessionHold: holds });
        } else {
          void cancelAllPresenceNotifications(session.nodeId);
          set({ activeSession: null, durationSessionHold: holds });
        }

        if (!alreadyCompleted) {
          const focusNodes = get().focusNodes;
          const completedToday = countCompletedSessionsToday(focusNodes);
          const target = getDailyGoalTarget(focusNodes);
          const result = useUserStore
            .getState()
            .checkDailyGoalReward(completedToday, target);

          const anchor = node?.anchorId
            ? get().anchors.find((item) => item.id === node.anchorId) ?? null
            : null;
          const scheduleWindow = node ? getScheduleWindow(node.schedule) : null;
          const scheduledMs = scheduleWindow
            ? (scheduleWindow.endMinutes - scheduleWindow.startMinutes) * 60_000
            : 0;
          const onSiteMs = session.onSiteAccumulatedMs;
          const durationMs = onSiteMs > 0 ? onSiteMs : scheduledMs;
          const onSitePercent =
            scheduledMs > 0 ? Math.min(100, Math.round((onSiteMs / scheduledMs) * 100)) : null;

          useSessionCompleteStore.getState().show({
            nodeId: session.nodeId,
            nodeTitle: session.nodeTitle,
            kind: node?.kind ?? "custom",
            streak: result.streak,
            hitDailyGoal: result.hitDailyGoal,
            coinAwarded: result.coinAwarded,
            pendingStreakCelebration:
              result.hitDailyGoal && (result.coinAwarded || result.streakIncremented)
                ? { streak: result.streak, coinAwarded: result.coinAwarded }
                : null,
            durationMs,
            onSitePercent,
            presenceVerified: session.presenceVerified,
            scheduleType: session.scheduleType,
            venueName: anchor?.name ?? null,
          });

          if (result.hitDailyGoal && (result.coinAwarded || result.streakIncremented)) {
            void notifyDailyGoalAchieved(result.streak, result.coinAwarded);
          }
        }
      },

      /** Clears an incomplete gym/library session at end-of-day without awarding completion. */
      expireActiveSessionAsMissed: () => {
        const session = get().activeSession;
        if (!session || session.scheduleType !== "duration") return;
        void cancelAllPresenceNotifications(session.nodeId);
        set({
          activeSession: null,
          durationSessionHold: withoutDurationHold(get().durationSessionHold, session.nodeId),
        });
      },

      markNodeCompleted: (nodeId, dateIso) => {
        void cancelMissedSessionReminder(nodeId, dateIso);
        set({
          focusNodes: get().focusNodes.map((node) =>
            node.id === nodeId && !node.completedDates.includes(dateIso)
              ? {
                  ...node,
                  completedDates: [...node.completedDates, dateIso],
                  skippedDates: (node.skippedDates ?? []).filter((d) => d !== dateIso),
                }
              : node,
          ),
        });
      },

      markNodeSkipped: (nodeId, dateIso) => {
        void cancelMissedSessionReminder(nodeId, dateIso);
        const { focusNodes, activeSession } = get();
        set({
          focusNodes: focusNodes.map((node) =>
            node.id === nodeId && !(node.skippedDates ?? []).includes(dateIso)
              ? {
                  ...node,
                  skippedDates: [...(node.skippedDates ?? []), dateIso],
                  completedDates: node.completedDates.filter((d) => d !== dateIso),
                }
              : node,
          ),
          activeSession:
            activeSession?.nodeId === nodeId && dateIso === toIsoDateString(new Date())
              ? null
              : activeSession,
          durationSessionHold: withoutDurationHold(get().durationSessionHold, nodeId),
        });
      },

      getDailyGoal: () => selectDailyGoal(get().focusNodes),

      getHeroCardData: (presence) =>
        selectHeroCardData(
          get().focusNodes,
          get().anchors,
          get().activeSession,
          presence,
          new Date(),
          getShieldSettings(),
        ),

      getTodaySchedule: () =>
        selectTodaySchedule(
          get().focusNodes,
          get().anchors,
          get().activeSession?.nodeId ?? null,
        ),

      getWeekSchedule: () =>
        selectWeekSchedule(
          get().focusNodes,
          get().anchors,
          get().activeSession?.nodeId ?? null,
        ),

      getSessionDetail: (nodeId, dateIso) =>
        selectSessionDetail(
          get().focusNodes,
          get().anchors,
          get().activeSession,
          nodeId,
          dateIso,
        ),

      getCompletedSessionsToday: () => countCompletedSessionsToday(get().focusNodes),
    }),
    {
      name: "lowalk-schedule",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.focusNodes = state.focusNodes.map((node) => ({
          ...node,
          skippedDates: node.skippedDates ?? [],
        }));
        state.anchors = state.anchors.map((anchor) => ({
          ...anchor,
          placeId: anchor.placeId ?? null,
          formattedAddress: anchor.formattedAddress ?? null,
          sourceLatitude: anchor.sourceLatitude ?? anchor.latitude,
          sourceLongitude: anchor.sourceLongitude ?? anchor.longitude,
        }));
        if (state.activeSession) {
          const legacyPausedAt = state.activeSession.pausedAt ?? null;
          const node = state.focusNodes.find((item) => item.id === state.activeSession!.nodeId);
          const scheduleType =
            state.activeSession.scheduleType ??
            (node?.schedule.type === "class" ? "class" : "duration");
          state.activeSession = {
            ...state.activeSession,
            scheduleType,
            shieldStartsAt:
              state.activeSession.shieldStartsAt ?? state.activeSession.endsAt,
            onSiteAccumulatedMs: state.activeSession.onSiteAccumulatedMs ?? 0,
            onSiteLastTickAt: state.activeSession.onSiteLastTickAt ?? null,
            requiredOnSiteMs:
              state.activeSession.requiredOnSiteMs ??
              (node ? computeRequiredOnSiteMs(node) : null),
            awaySince: state.activeSession.awaySince ?? legacyPausedAt,
            penaltyShieldEndsAt: state.activeSession.penaltyShieldEndsAt ?? null,
            penaltyMinutes: state.activeSession.penaltyMinutes ?? null,
            penaltyOriginNodeId:
              state.activeSession.penaltyOriginNodeId ??
              (state.activeSession.penaltyShieldEndsAt
                ? state.activeSession.nodeId
                : null),
            presenceVerified: state.activeSession.presenceVerified ?? false,
          };
        }
        state.durationSessionHold = state.durationSessionHold ?? {};
      },
    },
  ),
);
