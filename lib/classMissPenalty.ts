import { resolveClassCompletionOutcome } from "@/lib/classCompletion";
import { getNodeShieldInterval, type ShieldScheduleSettings } from "@/lib/shieldSchedule";
import { toIsoDateString } from "@/lib/time";
import type { FocusNode } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

export type ClassMissPenaltyDecision =
  | { action: "complete" }
  | { action: "keep_penalty" }
  | { action: "clear" }
  | { action: "apply_penalty" };

/** Decide how to finalize a class session once its nominal window has ended. */
export function resolveClassMissPenaltyDecision(
  session: ActiveSessionSnapshot,
  node: FocusNode | undefined,
  todayIso: string,
  nowMs: number,
  insideGeofence: boolean,
  settings: ShieldScheduleSettings,
): ClassMissPenaltyDecision {
  if (node?.completedDates.includes(todayIso)) {
    return { action: "clear" };
  }

  const outcome = resolveClassCompletionOutcome(session, settings, nowMs, insideGeofence);
  if (outcome === "complete") {
    return { action: "complete" };
  }

  const penaltyEndMs = session.penaltyShieldEndsAt
    ? new Date(session.penaltyShieldEndsAt).getTime()
    : 0;
  if (penaltyEndMs > nowMs) {
    return { action: "keep_penalty" };
  }
  if (penaltyEndMs > 0) {
    return { action: "clear" };
  }

  if ((node?.skippedDates ?? []).includes(todayIso)) {
    return { action: "clear" };
  }

  if ((node?.missPenaltyDates ?? []).includes(todayIso)) {
    return { action: "clear" };
  }

  return { action: "apply_penalty" };
}

/**
 * Finds a class occurrence that ended without completion and still needs a miss penalty.
 * Used when the app reopens after class end without an active session snapshot.
 */
export function findClassMissPenaltyCandidate(
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  nowMs: number,
  referenceDate = new Date(),
): FocusNode | null {
  const todayIso = toIsoDateString(referenceDate);
  const todayWeekday = referenceDate.getDay();

  for (const node of nodes) {
    if (node.schedule.type !== "class") continue;
    if (node.schedule.weekday !== todayWeekday) continue;
    if (node.completedDates.includes(todayIso)) continue;
    if ((node.skippedDates ?? []).includes(todayIso)) continue;
    if ((node.missPenaltyDates ?? []).includes(todayIso)) continue;

    const interval = getNodeShieldInterval(node, settings, referenceDate);
    if (!interval || nowMs < interval.nominalEndsAtMs) continue;

    if (activeSession?.nodeId === node.id) {
      const penaltyEndMs = activeSession.penaltyShieldEndsAt
        ? new Date(activeSession.penaltyShieldEndsAt).getTime()
        : 0;
      if (penaltyEndMs > nowMs) continue;
    }

    return node;
  }

  return null;
}
