import { buildShareOverlayPayload } from "@/lib/shareOverlay";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useSessionCompleteStore, type SessionCompletePayload } from "@/store/useSessionCompleteStore";
import { useShareOverlayStore } from "@/store/useShareOverlayStore";
import { useUserStore } from "@/store/useUserStore";

export function openShareOverlayFromSessionComplete(payload: SessionCompletePayload) {
  const { focusNodes, anchors } = useScheduleStore.getState();
  const sharePayload = buildShareOverlayPayload(focusNodes, anchors, {
    context: "session_complete",
    nodeId: payload.nodeId,
    completedAt: payload.completedAt,
    durationMs: payload.durationMs,
    onSitePercent: payload.onSitePercent,
    presenceVerified: payload.presenceVerified,
    scheduleType: payload.scheduleType,
    streak: payload.streak,
    hitDailyGoal: payload.hitDailyGoal,
  });
  useShareOverlayStore.getState().open(sharePayload);
}

export function openShareOverlayFromDailyGoal(streak: number) {
  const { focusNodes, anchors } = useScheduleStore.getState();
  const sharePayload = buildShareOverlayPayload(focusNodes, anchors, {
    context: "daily_goal",
    streak,
    hitDailyGoal: true,
    completedAt: Date.now(),
  });
  useShareOverlayStore.getState().open(sharePayload);
}

export function openShareOverlayWeeklyRecap() {
  const { focusNodes, anchors } = useScheduleStore.getState();
  const streak = useUserStore.getState().streak;
  const sharePayload = buildShareOverlayPayload(focusNodes, anchors, {
    context: "weekly_recap",
    streak,
    completedAt: Date.now(),
  });
  useShareOverlayStore.getState().open(sharePayload, "weekly_grid");
}

export function openShareOverlayConsistencyRecap() {
  const { focusNodes, anchors } = useScheduleStore.getState();
  const streak = useUserStore.getState().streak;
  const sharePayload = buildShareOverlayPayload(focusNodes, anchors, {
    context: "weekly_recap",
    streak,
    completedAt: Date.now(),
  });
  useShareOverlayStore.getState().open(sharePayload, "weekly_grid", { showConsistencyMap: true });
}

/** Opens share editor from the session-complete screen without dismissing it. */
export function handleSessionCompleteShare() {
  const payload = useSessionCompleteStore.getState().payload;
  if (!payload) return;
  openShareOverlayFromSessionComplete(payload);
}
