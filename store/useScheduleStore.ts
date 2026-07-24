import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { FocusNodeTemplateId } from "@/data/quickActions";
import { computeSessionEndsAt, nodeOverlapsExisting, toIsoDateString } from "@/lib/time";
import {
  computeRequiredOnSiteMs,
  computeShieldStartsAt,
  type ShieldScheduleSettings,
} from "@/lib/shieldSchedule";
import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
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
import { createNodeFromTemplate } from "@/store/seed";
import type { HeroCelebrationPayload } from "@/store/useHeroCelebrationStore";
import { useHeroCelebrationStore } from "@/store/useHeroCelebrationStore";
import { useStreakCelebrationStore } from "@/store/useStreakCelebrationStore";
import { useUserStore } from "@/store/useUserStore";

export type AddFocusNodeResult =
  | { success: true; nodeId: string }
  | { success: false; error: string };

export type UpdateFocusNodeResult =
  | { success: true }
  | { success: false; error: string };

export type CalibrateAnchorInput = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type ScheduleState = {
  focusNodes: FocusNode[];
  anchors: Anchor[];
  activeSession: ActiveSessionSnapshot | null;
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
    presenceVerified: false,
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

      addFocusNode: (input) => {
        const { focusNodes } = get();

        if (nodeOverlapsExisting(input.schedule, focusNodes)) {
          return {
            success: false,
            error: "This session overlaps with an existing Focus Node on the same day.",
          };
        }

        const node: FocusNode = {
          ...input,
          id: createNodeId(),
          locationLabel: input.locationLabel ?? null,
          completedDates: input.completedDates ?? [],
          skippedDates: input.skippedDates ?? [],
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

        if (nodeOverlapsExisting(input.schedule, focusNodes, nodeId)) {
          return {
            success: false,
            error: "This session overlaps with an existing Focus Node on the same day.",
          };
        }

        const updated: FocusNode = {
          ...existing,
          ...input,
          id: nodeId,
          completedDates: existing.completedDates,
          skippedDates: existing.skippedDates ?? [],
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
        set({
          focusNodes: focusNodes.filter((node) => node.id !== nodeId),
          activeSession: activeSession?.nodeId === nodeId ? null : activeSession,
        });
      },

      addAnchor: (input) => {
        const anchor: Anchor = { ...input, id: createAnchorId() };
        set({ anchors: [...get().anchors, anchor] });
        return anchor.id;
      },

      resolveAnchorForPlace: (place, radiusMeters = DEFAULT_PROVISIONAL_RADIUS_M) => {
        const { anchors } = get();
        const existing = anchors.find((anchor) => anchor.placeId === place.placeId);
        if (existing) return existing.id;

        const isDeferred =
          place.deferred === true || (place.latitude === 0 && place.longitude === 0);

        // Nearby reuse only for real map pins — never match deferred 0,0 placeholders.
        if (!isDeferred) {
          const nearby = anchors.find((anchor) => {
            if (anchor.latitude === 0 && anchor.longitude === 0) return false;
            const dLat = Math.abs(anchor.latitude - place.latitude);
            const dLng = Math.abs(anchor.longitude - place.longitude);
            return dLat < 0.0004 && dLng < 0.0004;
          });
          if (nearby) return nearby.id;
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
          radiusMeters,
          calibrated: false,
        });
      },

      calibrateAnchor: (anchorId, input) => {
        const { anchors } = get();
        const exists = anchors.some((anchor) => anchor.id === anchorId);
        if (!exists) return false;

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
        if (!nodeId) {
          set({ activeSession: null });
          return;
        }

        const node = get().focusNodes.find((focusNode) => focusNode.id === nodeId);
        if (!node) {
          set({ activeSession: null });
          return;
        }

        const sessionEndsAt = endsAt ?? computeSessionEndsAt(node.schedule);
        set({
          activeSession: createCalendarSessionFields(
            node,
            get().anchors,
            sessionEndsAt,
            getShieldSettings(),
          ),
        });
      },

      beginCalendarSession: (nodeId) => {
        const node = get().focusNodes.find((focusNode) => focusNode.id === nodeId);
        if (!node) return false;

        const endsAt = computeSessionEndsAt(node.schedule);
        set({
          activeSession: createCalendarSessionFields(
            node,
            get().anchors,
            endsAt,
            getShieldSettings(),
          ),
        });
        return true;
      },

      startSession: (nodeId) => {
        const node = get().focusNodes.find((focusNode) => focusNode.id === nodeId);
        if (!node) return false;

        const endsAt = computeSessionEndsAt(node.schedule);
        const settings = getShieldSettings();
        const snapshot = createCalendarSessionFields(node, get().anchors, endsAt, settings);
        set({
          activeSession: {
            ...snapshot,
            headline: buildActiveSessionSnapshot(node, get().anchors, endsAt).headline,
            presenceVerified: true,
            onSiteLastTickAt: new Date().toISOString(),
          },
        });
        return true;
      },

      tickOnSitePresence: (insideGeofence, now = Date.now()) => {
        const session = get().activeSession;
        if (!session) return;

        if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
          // On-site time only counts after the arrival verification window completes.
          if (insideGeofence && session.presenceVerified) {
            const lastTick = session.onSiteLastTickAt
              ? new Date(session.onSiteLastTickAt).getTime()
              : now;
            const delta = session.onSiteLastTickAt ? Math.max(now - lastTick, 0) : 0;
            const node = get().focusNodes.find((item) => item.id === session.nodeId);
            const headline = node
              ? buildActiveSessionSnapshot(node, get().anchors, session.endsAt).headline
              : session.headline;

            set({
              activeSession: {
                ...session,
                onSiteAccumulatedMs: session.onSiteAccumulatedMs + delta,
                onSiteLastTickAt: new Date(now).toISOString(),
                headline,
              },
            });
          } else if (session.onSiteLastTickAt) {
            const lastTick = new Date(session.onSiteLastTickAt).getTime();
            const delta = Math.max(now - lastTick, 0);
            set({
              activeSession: {
                ...session,
                onSiteAccumulatedMs: session.onSiteAccumulatedMs + delta,
                onSiteLastTickAt: null,
              },
            });
          }
          return;
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
      },

      applyPresencePenalty: () => {
        const session = get().activeSession;
        if (!session?.awaySince || session.penaltyShieldEndsAt) return;

        const tierMinutes = useUserStore.getState().penaltyTierMinutes;
        const penaltyShieldEndsAt = new Date(
          Date.now() + tierMinutes * 60 * 1000,
        ).toISOString();

        set({
          activeSession: {
            ...session,
            penaltyShieldEndsAt,
            penaltyMinutes: tierMinutes,
          },
        });
      },

      markSessionPresenceVerified: () => {
        const session = get().activeSession;
        if (!session || session.presenceVerified) return;

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
        if (isShieldActiveForNodes(get().focusNodes, session, settings)) {
          set({ activeSession: session });
        } else {
          set({ activeSession: null });
        }

        if (!alreadyCompleted) {
          const focusNodes = get().focusNodes;
          const completedToday = countCompletedSessionsToday(focusNodes);
          const target = getDailyGoalTarget(focusNodes);
          const result = useUserStore
            .getState()
            .checkDailyGoalReward(completedToday, target);

          // Brief Hero beat before the next stop — skipped when the day/week modal takes over.
          useHeroCelebrationStore.getState().show({
            nodeId: session.nodeId,
            nodeTitle: session.nodeTitle,
            hitDailyGoal: result.hitDailyGoal,
          });

          if (result.hitDailyGoal && (result.coinAwarded || result.streakIncremented)) {
            useStreakCelebrationStore.getState().show({
              streak: result.streak,
              coinAwarded: result.coinAwarded,
            });
          }
        }
      },

      /** Clears an incomplete gym/library session at end-of-day without awarding completion. */
      expireActiveSessionAsMissed: () => {
        const session = get().activeSession;
        if (!session || session.scheduleType !== "duration") return;
        set({ activeSession: null });
      },

      markNodeCompleted: (nodeId, dateIso) => {
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
        });
      },

      getDailyGoal: () => selectDailyGoal(get().focusNodes),

      getHeroCardData: (presence) =>
        selectHeroCardData(
          get().focusNodes,
          get().anchors,
          get().activeSession,
          presence,
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
            presenceVerified: state.activeSession.presenceVerified ?? false,
          };
        }
      },
    },
  ),
);
