import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useForegroundLocation } from "@/hooks/useForegroundLocation";
import { resolveClassCompletionOutcome } from "@/lib/classCompletion";
import {
  getPresenceTrackingContext,
  getVerificationSecondsRemaining,
  resetPresenceTimers,
  runPresenceTick,
} from "@/lib/presenceEngine";
import {
  hasUsableCoordinates,
  isInsideGeofence,
} from "@/lib/geo";
import { DEFAULT_SESSION_GAP_MERGE_MINUTES } from "@/lib/shieldSchedule";
import {
  getBackgroundPermissionStatus,
  type LocationPermissionStatus,
} from "@/services/location";
import type { PresenceContext } from "@/store/selectors";
import { useArrivalCelebrationStore } from "@/store/useArrivalCelebrationStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { ScheduleItemKind } from "@/types/dashboard";
import type { FocusNodeKind } from "@/types/focusNode";

function toScheduleKind(kind: FocusNodeKind | "study"): ScheduleItemKind {
  if (kind === "study") return "library";
  return kind;
}

/**
 * App-wide presence engine — calendar sessions, on-site time, away penalties.
 * Mounted once from SessionPresenceProvider.
 */
export function useSessionPresenceEngine(): PresenceContext {
  const activeSession = useScheduleStore((state) => state.activeSession);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const setActiveSession = useScheduleStore((state) => state.setActiveSession);

  const [timerTick, setTimerTick] = useState(0);
  const [backgroundPermission, setBackgroundPermission] =
    useState<LocationPermissionStatus>("undetermined");

  const trackingContext = useMemo(() => {
    void timerTick;
    return getPresenceTrackingContext();
  }, [activeSession, focusNodes, anchors, timerTick]);

  const { needsLocation, presenceAnchor, obligationNode, anchoringRequest } = trackingContext;
  const wasInsideGeofenceRef = useRef(false);
  const prevAwaySinceRef = useRef<string | null>(null);
  const prevPenaltyEndsAtRef = useRef<string | null>(null);

  const { position, accurateEnough, permission, error } = useForegroundLocation(
    needsLocation,
    4000,
  );

  const insideGeofence = useMemo(() => {
    if (!accurateEnough || !position || !presenceAnchor || !hasUsableCoordinates(presenceAnchor)) {
      return false;
    }
    return isInsideGeofence(position, presenceAnchor);
  }, [accurateEnough, position, presenceAnchor]);

  const verificationSecondsRemaining = useMemo(() => {
    void timerTick;
    if (!insideGeofence || activeSession?.presenceVerified) return null;
    return getVerificationSecondsRemaining(Date.now());
  }, [activeSession?.presenceVerified, insideGeofence, timerTick]);

  const presence: PresenceContext = {
    userPosition: position,
    isInsideGeofence: insideGeofence,
    verificationSecondsRemaining,
    locationUnavailable: permission === "denied" || Boolean(error),
    backgroundLocationDenied: backgroundPermission === "denied",
  };

  const completeActiveSession = useScheduleStore((state) => state.completeActiveSession);

  useEffect(() => {
    return useScheduleStore.persist.onFinishHydration(() => {
      const session = useScheduleStore.getState().activeSession;
      if (!session) return;
      if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
        if (session.onSiteAccumulatedMs >= session.requiredOnSiteMs) {
          setActiveSession(null);
        }
        return;
      }
      if (new Date(session.endsAt).getTime() <= Date.now()) {
        const penaltyEnd = session.penaltyShieldEndsAt
          ? new Date(session.penaltyShieldEndsAt).getTime()
          : 0;
        if (penaltyEnd > Date.now()) return;

        if (session.scheduleType === "class") {
          const { classPreBufferMinutes } = useUserStore.getState();
          const outcome = resolveClassCompletionOutcome(
            session,
            {
              classPreBufferMinutes,
              sessionGapMergeMinutes: DEFAULT_SESSION_GAP_MERGE_MINUTES,
            },
            Date.now(),
            false,
          );
          if (outcome === "complete") {
            completeActiveSession();
          } else {
            setActiveSession(null);
          }
          return;
        }

        setActiveSession(null);
      }
    });
  }, [completeActiveSession, setActiveSession]);

  useEffect(() => {
    const tickMs = activeSession || needsLocation ? 1000 : 5000;
    const interval = setInterval(() => setTimerTick((tick) => tick + 1), tickMs);
    return () => clearInterval(interval);
  }, [activeSession, needsLocation]);

  useEffect(() => {
    if (!needsLocation) return;

    void getBackgroundPermissionStatus().then(setBackgroundPermission);
    const interval = setInterval(() => {
      void getBackgroundPermissionStatus().then(setBackgroundPermission);
    }, 8000);

    return () => clearInterval(interval);
  }, [needsLocation]);

  useEffect(() => {
    if (!needsLocation) {
      resetPresenceTimers();
    }
  }, [needsLocation]);

  useEffect(() => {
    runPresenceTick(position, Date.now(), accurateEnough);
  }, [position, accurateEnough, timerTick]);

  // Foreground haptics when the user steps out or incurs a penalty (notifications handle background).
  useEffect(() => {
    if (AppState.currentState !== "active") {
      prevAwaySinceRef.current = activeSession?.awaySince ?? null;
      prevPenaltyEndsAtRef.current = activeSession?.penaltyShieldEndsAt ?? null;
      return;
    }

    const awaySince = activeSession?.awaySince ?? null;
    const penaltyEndsAt = activeSession?.penaltyShieldEndsAt ?? null;

    if (
      activeSession?.presenceVerified &&
      awaySince &&
      awaySince !== prevAwaySinceRef.current
    ) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    if (penaltyEndsAt && penaltyEndsAt !== prevPenaltyEndsAtRef.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    prevAwaySinceRef.current = awaySince;
    prevPenaltyEndsAtRef.current = penaltyEndsAt;
  }, [
    activeSession?.awaySince,
    activeSession?.penaltyShieldEndsAt,
    activeSession?.presenceVerified,
  ]);

  // Arrival card when entering the venue during a calendar travel phase.
  useEffect(() => {
    if (!activeSession || activeSession.presenceVerified) {
      wasInsideGeofenceRef.current = insideGeofence;
      return;
    }

    if (!insideGeofence) {
      wasInsideGeofenceRef.current = false;
      return;
    }

    const justEntered = !wasInsideGeofenceRef.current;
    wasInsideGeofenceRef.current = true;

    if (!justEntered || anchoringRequest || !obligationNode) {
      return;
    }

    const anchorName = presenceAnchor?.name ?? "your location";
    useArrivalCelebrationStore.getState().show({
      nodeId: obligationNode.id,
      nodeTitle: obligationNode.title,
      anchorName,
      kind: toScheduleKind(obligationNode.kind),
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [
    activeSession,
    anchoringRequest,
    insideGeofence,
    obligationNode,
    presenceAnchor?.name,
  ]);

  return presence;
}
