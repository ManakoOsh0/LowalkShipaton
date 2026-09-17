import { isRunningInExpoGo } from "@/lib/appShieldStatus";
import {
  hasUsableCoordinates,
  isInsideGeofence,
  isInsideGeofenceForSessionResume,
  isOutsideGeofenceForSessionPause,
  PRESENCE_VERIFICATION_SECONDS,
  resolveAnchorForNode,
  SESSION_GEOFENCE_PAUSE_SECONDS,
  SESSION_GEOFENCE_RESUME_SECONDS,
  type Coordinates,
} from "@/lib/geo";
import {
  shouldCompleteClassOnDeparture,
} from "@/lib/classCompletion";
import {
  findClassMissPenaltyCandidate,
  resolveClassMissPenaltyDecision,
} from "@/lib/classMissPenalty";
import {
  getNodeShieldInterval,
  selectPrimaryObligationNode,
  type ShieldScheduleSettings,
} from "@/lib/shieldSchedule";
import {
  isPenaltyShieldActive,
  isStaleUnverifiedClassSession,
  PRESENCE_PENALTY_GRACE_MS,
} from "@/lib/sessionPenalty";
import {
  buildArrivalCelebrationPayload,
  shouldShowArrivalCelebration,
} from "@/lib/arrivalCelebration";
import { isDurationSessionExpired, isSessionExpired, toIsoDateString } from "@/lib/time";
import { selectAnchoringRequest } from "@/store/selectors";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

/** Shared debounce timestamps — used by foreground hook and headless background task. */
let outsideSince: number | null = null;
let insideSince: number | null = null;
/** When the user entered the geofence while awaiting presence verification. */
let verificationInsideSince: number | null = null;
/** Brief GPS blips during verify — do not reset the 5s timer immediately. */
let verificationOutsideSince: number | null = null;
/** Hero / arrival latch — holds through coarse fixes and brief exits. */
let displayInsideGeofence = false;
let displayOutsideSince: number | null = null;

const DISPLAY_GEOFENCE_HOLD_MS = 15_000;

export type PresenceTrackingContext = {
  needsLocation: boolean;
  presenceAnchor: Anchor | null;
  obligationNode: FocusNode | null;
  activeNode: FocusNode | null;
  activeSession: ActiveSessionSnapshot | null;
  anchoringRequest: ReturnType<typeof selectAnchoringRequest>;
};

function getShieldSettings(): ShieldScheduleSettings {
  const user = useUserStore.getState();
  return {
    classPreBufferMinutes: user.classPreBufferMinutes,
    sessionGapMergeMinutes: user.sessionGapMergeMinutes,
  };
}

/** Finalize a class before swapping sessions, clearing at expiry, or applying a miss penalty. */
function finalizeClassSessionIfEligible(
  session: ActiveSessionSnapshot,
  insideGeofence: boolean,
  now: number,
  focusNodes: FocusNode[],
): void {
  const store = useScheduleStore.getState();
  const settings = getShieldSettings();
  const todayIso = toIsoDateString(new Date(now));
  const node = focusNodes.find((item) => item.id === session.nodeId);

  const decision = resolveClassMissPenaltyDecision(
    session,
    node,
    todayIso,
    now,
    insideGeofence,
    settings,
  );

  switch (decision.action) {
    case "complete":
      store.completeActiveSession();
      return;
    case "keep_penalty":
      return;
    case "apply_penalty":
      store.applyClassMissPenalty();
      return;
    case "clear":
      store.setActiveSession(null);
      return;
  }
}

/** Resolves whether GPS tracking should run and which anchor drives presence checks. */
export function getPresenceTrackingContext(): PresenceTrackingContext {
  const { activeSession, focusNodes, anchors } = useScheduleStore.getState();
  const settings = getShieldSettings();
  const anchoringRequest = selectAnchoringRequest(focusNodes, anchors);
  const obligationNode = selectPrimaryObligationNode(
    focusNodes,
    activeSession,
    settings,
  );
  const activeNode = activeSession
    ? focusNodes.find((node) => node.id === activeSession.nodeId) ?? null
    : null;
  const presenceAnchor = resolveAnchorForNode(
    (obligationNode ?? activeNode)?.anchorId ?? null,
    anchors,
  );

  const now = Date.now();
  let needsLocation = false;

  if (anchoringRequest) {
    needsLocation = true;
  } else if (activeSession || obligationNode) {
    needsLocation = Boolean(presenceAnchor && hasUsableCoordinates(presenceAnchor));
  } else {
    const intervals = focusNodes
      .map((node) => getNodeShieldInterval(node, settings))
      .filter(Boolean);
    const upcomingSoon = intervals.some(
      (interval) => interval && interval.startsAtMs - now < 60 * 60 * 1000,
    );
    needsLocation = upcomingSoon;
  }

  return {
    needsLocation,
    presenceAnchor,
    obligationNode,
    activeNode,
    activeSession,
    anchoringRequest,
  };
}

export function resetPresenceTimers(): void {
  outsideSince = null;
  insideSince = null;
  verificationInsideSince = null;
  verificationOutsideSince = null;
  displayInsideGeofence = false;
  displayOutsideSince = null;
}

/** Debounced inside signal for Hero and arrival — avoids GPS accuracy flapping. */
export function getDisplayInsideGeofence(): boolean {
  return displayInsideGeofence;
}

function updateDisplayInsideGeofence(rawInside: boolean, now: number): void {
  if (rawInside) {
    displayOutsideSince = null;
    displayInsideGeofence = true;
    return;
  }

  if (!displayInsideGeofence) return;

  if (!displayOutsideSince) displayOutsideSince = now;
  const holdMs =
    verificationInsideSince != null
      ? SESSION_GEOFENCE_PAUSE_SECONDS * 1000
      : DISPLAY_GEOFENCE_HOLD_MS;
  if (now - displayOutsideSince >= holdMs) {
    displayInsideGeofence = false;
    displayOutsideSince = null;
  }
}

function tryShowArrivalOnVerificationStart(
  obligationNode: FocusNode | null,
  presenceAnchor: Anchor | null,
  activeSession: ActiveSessionSnapshot | null,
  anchoringRequest: ReturnType<typeof selectAnchoringRequest>,
): void {
  if (!obligationNode || !presenceAnchor) return;

  const lastCelebratedSessionNodeId =
    useArrivalCelebrationStore.getState().lastCelebratedSessionNodeId;

  if (
    !shouldShowArrivalCelebration({
      activeSession,
      obligationNodeId: obligationNode.id,
      anchoringRequest: Boolean(anchoringRequest),
      insideGeofence: true,
      lastCelebratedSessionNodeId,
    })
  ) {
    return;
  }

  useArrivalCelebrationStore.getState().show(
    buildArrivalCelebrationPayload({
      node: obligationNode,
      anchorName: presenceAnchor.name ?? "your location",
    }),
  );
}

/** Countdown for Hero Card arrived / verification beats — null when not verifying. */
export function getVerificationSecondsRemaining(now = Date.now()): number | null {
  if (verificationInsideSince == null) return null;
  const elapsedSeconds = (now - verificationInsideSince) / 1000;
  const remaining = Math.ceil(PRESENCE_VERIFICATION_SECONDS - elapsedSeconds);
  return remaining > 0 ? remaining : null;
}

/**
 * Imperative presence tick — calendar sessions, on-site accumulation, class away penalties.
 * Callable from React hooks and TaskManager headless handlers.
 */
export function runPresenceTick(
  position: Coordinates | null,
  now = Date.now(),
  accurateEnough = true,
): void {
  const store = useScheduleStore.getState();
  let { activeSession, focusNodes, anchors } = store;
  const settings = getShieldSettings();

  // Expired penalty metadata blocks miss-penalty bookkeeping — strip it once time is up.
  if (
    activeSession?.penaltyShieldEndsAt &&
    !isPenaltyShieldActive(activeSession, now)
  ) {
    useScheduleStore.setState({
      activeSession: {
        ...activeSession,
        penaltyShieldEndsAt: null,
        penaltyMinutes: null,
        penaltyOriginNodeId: null,
      },
    });
    activeSession = useScheduleStore.getState().activeSession;
  }

  // Drop stale or end-of-day duration sessions so shielding cannot carry overnight.
  if (
    activeSession?.scheduleType === "duration" &&
    isDurationSessionExpired(activeSession.shieldStartsAt, new Date(now))
  ) {
    store.expireActiveSessionAsMissed();
    activeSession = useScheduleStore.getState().activeSession;
  }

  const anchoringRequest = selectAnchoringRequest(focusNodes, anchors);
  const obligationNode = selectPrimaryObligationNode(
    focusNodes,
    activeSession,
    settings,
    now,
  );

  const sessionBeforeSwitch = useScheduleStore.getState().activeSession;
  const nodeBeforeSwitch = sessionBeforeSwitch
    ? focusNodes.find((node) => node.id === sessionBeforeSwitch.nodeId) ?? null
    : null;
  const anchorBeforeSwitch = resolveAnchorForNode(nodeBeforeSwitch?.anchorId ?? null, anchors);
  const insideBeforeSwitch =
    accurateEnough &&
    Boolean(position && anchorBeforeSwitch && hasUsableCoordinates(anchorBeforeSwitch)) &&
    isInsideGeofence(position!, anchorBeforeSwitch!);

  const shouldFinalizeClassHandoff =
    sessionBeforeSwitch?.scheduleType === "class" &&
    (sessionBeforeSwitch.presenceVerified ||
      isStaleUnverifiedClassSession(sessionBeforeSwitch, now));

  if (
    !anchoringRequest &&
    obligationNode &&
    sessionBeforeSwitch &&
    sessionBeforeSwitch.nodeId !== obligationNode.id &&
    shouldFinalizeClassHandoff
  ) {
    finalizeClassSessionIfEligible(
      sessionBeforeSwitch,
      insideBeforeSwitch,
      now,
      focusNodes,
    );
    activeSession = useScheduleStore.getState().activeSession;
    focusNodes = useScheduleStore.getState().focusNodes;
  }

  if (!anchoringRequest && obligationNode) {
    const interval = getNodeShieldInterval(obligationNode, settings, new Date(now));
    if (interval && now >= interval.startsAtMs) {
      if (!activeSession || activeSession.nodeId !== obligationNode.id) {
        store.beginCalendarSession(obligationNode.id);
        resetPresenceTimers();
      }
    }
  }

  const currentSession = useScheduleStore.getState().activeSession;
  const activeNode = currentSession
    ? focusNodes.find((node) => node.id === currentSession.nodeId) ?? null
    : null;
  const presenceAnchor = resolveAnchorForNode(activeNode?.anchorId ?? null, anchors);

  const insideGeofence =
    accurateEnough &&
    Boolean(position && presenceAnchor && hasUsableCoordinates(presenceAnchor)) &&
    isInsideGeofence(position!, presenceAnchor!);

  updateDisplayInsideGeofence(insideGeofence, now);

  const canResumeSession =
    accurateEnough &&
    Boolean(position && presenceAnchor && hasUsableCoordinates(presenceAnchor)) &&
    isInsideGeofenceForSessionResume(position!, presenceAnchor!);

  const shouldMarkAway =
    accurateEnough &&
    Boolean(position && presenceAnchor && hasUsableCoordinates(presenceAnchor)) &&
    isOutsideGeofenceForSessionPause(position!, presenceAnchor!);

  const sessionAwaitingVerification =
    currentSession != null && !currentSession.presenceVerified;

  if (sessionAwaitingVerification) {
    if (insideGeofence) {
      verificationOutsideSince = null;
      if (!verificationInsideSince) {
        verificationInsideSince = now;
        tryShowArrivalOnVerificationStart(
          obligationNode,
          presenceAnchor,
          currentSession,
          anchoringRequest,
        );
      }
      const insideSeconds = (now - verificationInsideSince) / 1000;
      if (insideSeconds >= PRESENCE_VERIFICATION_SECONDS) {
        store.markSessionPresenceVerified();
        verificationInsideSince = null;
        verificationOutsideSince = null;
      }
    } else if (verificationInsideSince != null) {
      if (!verificationOutsideSince) verificationOutsideSince = now;
      const outsideSeconds = (now - verificationOutsideSince) / 1000;
      if (outsideSeconds >= SESSION_GEOFENCE_PAUSE_SECONDS) {
        verificationInsideSince = null;
        verificationOutsideSince = null;
      }
    } else {
      verificationInsideSince = null;
      verificationOutsideSince = null;
    }
  } else {
    verificationInsideSince = null;
    verificationOutsideSince = null;
  }

  if (currentSession) {
    store.tickOnSitePresence(insideGeofence, now);
  }

  const sessionAfterTick = useScheduleStore.getState().activeSession;
  if (
    !sessionAfterTick ||
    !sessionAfterTick.presenceVerified ||
    !presenceAnchor ||
    !hasUsableCoordinates(presenceAnchor)
  ) {
    outsideSince = null;
    insideSince = null;
  } else if (shouldMarkAway) {
    insideSince = null;

    if (!outsideSince) outsideSince = now;
    const outsideSeconds = (now - outsideSince) / 1000;
    if (outsideSeconds >= SESSION_GEOFENCE_PAUSE_SECONDS) {
      const session = useScheduleStore.getState().activeSession;
      // Foreground GPS in Expo Go is too unreliable for away penalties — dev builds only.
      if (session && !session.awaySince && !isRunningInExpoGo()) {
        useScheduleStore.getState().markSessionAway();
      }
      outsideSince = null;
    }
  } else {
    outsideSince = null;

    if (canResumeSession) {
      if (!insideSince) insideSince = now;
      const insideSeconds = (now - insideSince) / 1000;
      if (insideSeconds >= SESSION_GEOFENCE_RESUME_SECONDS) {
        const session = useScheduleStore.getState().activeSession;
        if (session?.awaySince) {
          useScheduleStore.getState().clearSessionAway();
        }
        insideSince = null;
      }
    } else {
      insideSince = null;
    }
  }

  const sessionAfterAway = useScheduleStore.getState().activeSession;
  if (
    sessionAfterAway?.presenceVerified &&
    sessionAfterAway.awaySince &&
    !sessionAfterAway.penaltyShieldEndsAt
  ) {
    if (shouldCompleteClassOnDeparture(sessionAfterAway, settings, now)) {
      const todayIso = toIsoDateString(new Date(now));
      const completedNode = focusNodes.find((node) => node.id === sessionAfterAway.nodeId);
      if (completedNode?.completedDates.includes(todayIso)) {
        useScheduleStore.getState().setActiveSession(null);
      } else {
        useScheduleStore.getState().completeActiveSession();
      }
      return;
    }

    // Duration sessions stay away without a penalty — shield already holds until quota or midnight.
    if (sessionAfterAway.scheduleType === "class") {
      const awayMs = now - new Date(sessionAfterAway.awaySince).getTime();
      if (awayMs >= PRESENCE_PENALTY_GRACE_MS) {
        useScheduleStore.getState().applyPresencePenalty();
      }
    }
  }

  const sessionForExpiry = useScheduleStore.getState().activeSession;

  if (sessionForExpiry) {
    if (
      sessionForExpiry.scheduleType === "duration" &&
      isDurationSessionExpired(sessionForExpiry.shieldStartsAt, new Date(now))
    ) {
      if (sessionForExpiry.presenceVerified) {
        useScheduleStore.getState().expireActiveSessionAsMissed();
      }
    } else if (
      sessionForExpiry.scheduleType === "duration" &&
      sessionForExpiry.requiredOnSiteMs != null
    ) {
      if (
        sessionForExpiry.presenceVerified &&
        sessionForExpiry.onSiteAccumulatedMs >= sessionForExpiry.requiredOnSiteMs &&
        insideGeofence
      ) {
        const todayIso = toIsoDateString(new Date(now));
        const completedNode = focusNodes.find((node) => node.id === sessionForExpiry.nodeId);
        if (completedNode?.completedDates.includes(todayIso)) {
          useScheduleStore.getState().setActiveSession(null);
        } else {
          useScheduleStore.getState().completeActiveSession();
        }
      }
    } else if (sessionForExpiry.scheduleType === "class") {
      if (isSessionExpired(sessionForExpiry.endsAt, new Date(now))) {
        const penaltyEnd = sessionForExpiry.penaltyShieldEndsAt
          ? new Date(sessionForExpiry.penaltyShieldEndsAt).getTime()
          : 0;
        if (penaltyEnd <= now) {
          finalizeClassSessionIfEligible(sessionForExpiry, insideGeofence, now, focusNodes);
        }
      }
    }
  }

  const storeState = useScheduleStore.getState();
  const missedClassCandidate = findClassMissPenaltyCandidate(
    storeState.focusNodes,
    storeState.activeSession,
    settings,
    now,
    new Date(now),
  );
  if (missedClassCandidate) {
    const obligation = selectPrimaryObligationNode(
      useScheduleStore.getState().focusNodes,
      useScheduleStore.getState().activeSession,
      settings,
      now,
    );
    const active = useScheduleStore.getState().activeSession;
    if (obligation && obligation.id !== missedClassCandidate.id) {
      // Later session is live — apply the miss lock without stealing the Hero / GPS target.
      useScheduleStore.getState().applyClassMissPenalty(missedClassCandidate.id);
    } else {
      if (!active || active.nodeId !== missedClassCandidate.id) {
        storeState.beginCalendarSession(missedClassCandidate.id);
        resetPresenceTimers();
      }
      useScheduleStore.getState().applyClassMissPenalty();
    }
  }
}
