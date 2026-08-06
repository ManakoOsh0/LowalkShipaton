import type { ShieldScheduleSettings } from "@/lib/shieldSchedule";
import type { ActiveSessionSnapshot } from "@/types/session";

export const CLASS_EARLY_COMPLETE_STANDARD_RATIO = 0.5;
export const CLASS_EARLY_COMPLETE_FAST_RATIO = 0.8;
export const CLASS_EARLY_COMPLETE_FAST_AWAY_MS = 2 * 60_000;
/** Aligns with PRESENCE_PENALTY_GRACE_MS in sessionPenalty.ts */
export const CLASS_EARLY_COMPLETE_STANDARD_AWAY_MS = 5 * 60_000;

export type ClassAttendanceTier = "fast" | "standard";
export type ClassCompletionOutcome = "complete" | "incomplete";
export type ClassCountdownPhase = "pre_class" | "in_session";

export function meetsClassAttendanceThreshold(
  onSiteMs: number,
  scheduledMs: number,
  tier: ClassAttendanceTier,
): boolean {
  if (scheduledMs <= 0) return false;
  const ratio =
    tier === "fast"
      ? CLASS_EARLY_COMPLETE_FAST_RATIO
      : CLASS_EARLY_COMPLETE_STANDARD_RATIO;
  return onSiteMs >= scheduledMs * ratio;
}

/** Hero timer — nominal class window only; pre-buffer is a separate phase. */
export function getClassSessionCountdown(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
  nowMs: number,
): {
  countdownMs: number;
  progressRatio: number | null;
  phase: ClassCountdownPhase;
} {
  const nominalStartMs = getClassNominalStartMs(session, settings);
  const endsAtMs = new Date(session.endsAt).getTime();
  const scheduledMs = getClassScheduledDurationMs(session, settings);

  if (nowMs < nominalStartMs) {
    return {
      countdownMs: nominalStartMs - nowMs,
      progressRatio: 0,
      phase: "pre_class",
    };
  }

  const remainingMs = Math.max(endsAtMs - nowMs, 0);
  const elapsedMs = Math.min(Math.max(nowMs - nominalStartMs, 0), scheduledMs);
  return {
    countdownMs: remainingMs,
    progressRatio: scheduledMs > 0 ? elapsedMs / scheduledMs : null,
    phase: "in_session",
  };
}

/** Whether a verified class session should be marked complete at finalization time. */
export function resolveClassCompletionOutcome(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
  nowMs: number,
  insideGeofence: boolean,
): ClassCompletionOutcome {
  if (session.scheduleType !== "class" || !session.presenceVerified) {
    return "incomplete";
  }

  const endsAtMs = new Date(session.endsAt).getTime();
  const scheduledMs = getClassScheduledDurationMs(session, settings);

  if (insideGeofence && nowMs >= endsAtMs) {
    return "complete";
  }

  if (meetsClassAttendanceThreshold(session.onSiteAccumulatedMs, scheduledMs, "fast")) {
    return "complete";
  }

  if (
    nowMs >= endsAtMs &&
    meetsClassAttendanceThreshold(session.onSiteAccumulatedMs, scheduledMs, "standard")
  ) {
    return "complete";
  }

  return "incomplete";
}

/** Nominal class start — after the pre-buffer, when attendance counting begins. */
export function getClassNominalStartMs(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
): number {
  return (
    new Date(session.shieldStartsAt).getTime() +
    settings.classPreBufferMinutes * 60_000
  );
}

export function getClassScheduledDurationMs(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
): number {
  const startMs = getClassNominalStartMs(session, settings);
  const endMs = new Date(session.endsAt).getTime();
  return Math.max(endMs - startMs, 0);
}

/** True during the scheduled class window — pre-buffer time is excluded. */
export function isWithinClassNominalWindow(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
  nowMs: number,
): boolean {
  const startMs = getClassNominalStartMs(session, settings);
  const endMs = new Date(session.endsAt).getTime();
  return nowMs >= startMs && nowMs < endMs;
}

/** Milliseconds away before auto-complete, or null when attendance is too low. */
export function getClassAwayCompleteAfterMs(
  onSiteMs: number,
  scheduledMs: number,
): number | null {
  if (scheduledMs <= 0) return null;

  if (onSiteMs >= scheduledMs * CLASS_EARLY_COMPLETE_FAST_RATIO) {
    return CLASS_EARLY_COMPLETE_FAST_AWAY_MS;
  }
  if (onSiteMs >= scheduledMs * CLASS_EARLY_COMPLETE_STANDARD_RATIO) {
    return CLASS_EARLY_COMPLETE_STANDARD_AWAY_MS;
  }
  return null;
}

/** Time left before a verified class auto-completes on departure, or null. */
export function getClassEarlyCompleteRemainingMs(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
  nowMs: number,
): number | null {
  if (session.scheduleType !== "class" || !session.presenceVerified || !session.awaySince) {
    return null;
  }
  if (session.penaltyShieldEndsAt) return null;

  const endsAtMs = new Date(session.endsAt).getTime();
  if (nowMs >= endsAtMs) return null;

  const scheduledMs = getClassScheduledDurationMs(session, settings);
  const completeAfterMs = getClassAwayCompleteAfterMs(
    session.onSiteAccumulatedMs,
    scheduledMs,
  );
  if (completeAfterMs == null) return null;

  const awayMs = nowMs - new Date(session.awaySince).getTime();
  const remaining = completeAfterMs - awayMs;
  return remaining > 0 ? remaining : 0;
}

export function shouldCompleteClassOnDeparture(
  session: ActiveSessionSnapshot,
  settings: ShieldScheduleSettings,
  nowMs: number,
): boolean {
  if (session.scheduleType !== "class" || !session.presenceVerified || !session.awaySince) {
    return false;
  }
  if (session.penaltyShieldEndsAt) return false;

  const endsAtMs = new Date(session.endsAt).getTime();
  if (nowMs >= endsAtMs) return false;

  const scheduledMs = getClassScheduledDurationMs(session, settings);
  const completeAfterMs = getClassAwayCompleteAfterMs(
    session.onSiteAccumulatedMs,
    scheduledMs,
  );
  if (completeAfterMs == null) return false;

  const remainingClassMs = endsAtMs - nowMs;
  if (
    meetsClassAttendanceThreshold(session.onSiteAccumulatedMs, scheduledMs, "fast") &&
    remainingClassMs > 0 &&
    remainingClassMs < CLASS_EARLY_COMPLETE_FAST_AWAY_MS
  ) {
    return true;
  }

  const awayMs = nowMs - new Date(session.awaySince).getTime();
  return awayMs >= completeAfterMs;
}
