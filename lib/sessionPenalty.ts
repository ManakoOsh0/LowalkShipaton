import type { ActiveSessionSnapshot } from "@/types/session";
import type { FocusNode } from "@/types/focusNode";

import {
  formatDurationClock,
  formatOnSiteRemainingLabel,
  getSessionNominalStartMs,
  isAppShieldActive,
  type ShieldScheduleSettings,
} from "@/lib/shieldSchedule";
import {
  getClassEarlyCompleteRemainingMs,
  getClassNominalStartMs,
} from "@/lib/classCompletion";
import { isDurationSessionExpired } from "@/lib/time";

const DEFAULT_SHIELD_SETTINGS: ShieldScheduleSettings = {
  classPreBufferMinutes: 30,
  sessionGapMergeMinutes: 30,
};

/** Grace before a class presence penalty locks apps for the Settings tier duration. */
export const PRESENCE_PENALTY_GRACE_MS = 5 * 60 * 1000;

/** Gym/library/custom: on-site time is paused; shield holds until quota or midnight. */
export const DURATION_AWAY_HERO_SUBTITLE =
  "Return to finish · locked until midnight";

export const DURATION_AWAY_LEAVE_SHEET_BODY =
  "On-site time is paused. Return to finish your session, or apps stay blocked until midnight.";

export const CLASS_AWAY_LEAVE_SHEET_BODY =
  "Return to the focus zone within 5 minutes to avoid a penalty";

export function isDurationQuotaSession(session: ActiveSessionSnapshot): boolean {
  return session.scheduleType === "duration" && session.requiredOnSiteMs != null;
}

export function getDurationOnSiteRemainingMs(
  session: ActiveSessionSnapshot,
): number | null {
  if (!isDurationQuotaSession(session) || session.requiredOnSiteMs == null) {
    return null;
  }
  return Math.max(session.requiredOnSiteMs - session.onSiteAccumulatedMs, 0);
}

export function getLeaveSessionWarningBody(
  scheduleType: ActiveSessionSnapshot["scheduleType"] | null | undefined,
): string {
  if (scheduleType === "duration") return DURATION_AWAY_LEAVE_SHEET_BODY;
  return CLASS_AWAY_LEAVE_SHEET_BODY;
}

export function formatDurationAwayNotificationBody(zoneLabel: string): string {
  const zone = zoneLabel.trim() || "your venue";
  return `Return to ${zone} to finish. Apps stay locked until you complete, or midnight.`;
}

export const PENALTY_TIER_OPTIONS = [
  { minutes: 30 as const, label: "30 minutes" },
  { minutes: 60 as const, label: "1 hour" },
  { minutes: 120 as const, label: "2 hours" },
] as const;

export type PenaltyTierMinutes = (typeof PENALTY_TIER_OPTIONS)[number]["minutes"];

export const DEFAULT_PENALTY_TIER_MINUTES: PenaltyTierMinutes = 30;

export function getShieldEndsAt(session: ActiveSessionSnapshot): string {
  const sessionEnd = new Date(session.endsAt).getTime();
  const penaltyEnd = session.penaltyShieldEndsAt
    ? new Date(session.penaltyShieldEndsAt).getTime()
    : 0;
  return new Date(Math.max(sessionEnd, penaltyEnd)).toISOString();
}

/** @deprecated Use isAppShieldActive with focus nodes + settings. */
export function isShieldActive(
  session: ActiveSessionSnapshot | null,
  now = Date.now(),
): boolean {
  if (!session) return false;
  if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
    if (isDurationSessionExpired(session.shieldStartsAt, new Date(now))) return false;
    if (
      now >= new Date(session.shieldStartsAt).getTime() &&
      session.onSiteAccumulatedMs < session.requiredOnSiteMs
    ) {
      return true;
    }
  }
  return new Date(getShieldEndsAt(session)).getTime() > now;
}

export function isSessionTimerExpired(
  session: ActiveSessionSnapshot,
  now = Date.now(),
): boolean {
  if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
    return session.onSiteAccumulatedMs >= session.requiredOnSiteMs;
  }
  return new Date(session.endsAt).getTime() <= now;
}

/** Class-only — gym/library leaving pauses quota without a grace countdown. */
export function getAwayGraceRemainingMs(
  session: ActiveSessionSnapshot,
  now = Date.now(),
): number | null {
  if (session.scheduleType !== "class") return null;
  if (!session.awaySince || session.penaltyShieldEndsAt) return null;
  const awayMs = now - new Date(session.awaySince).getTime();
  const remaining = PRESENCE_PENALTY_GRACE_MS - awayMs;
  return remaining > 0 ? remaining : 0;
}

/** Hero detail line — calendar shield + on-site quota + class penalties. */
export function formatSessionDetailLabel(
  session: ActiveSessionSnapshot,
  now = new Date(),
  settings: ShieldScheduleSettings = DEFAULT_SHIELD_SETTINGS,
): string {
  const nowMs = now.getTime();

  if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
    const nominalStartMs = getSessionNominalStartMs(session, settings);
    if (nowMs < nominalStartMs) {
      const startsInMs = nominalStartMs - nowMs;
      return `Head to venue · session starts in ${formatDurationClock(startsInMs)}`;
    }

    const onSiteLabel = formatOnSiteRemainingLabel(
      session.onSiteAccumulatedMs,
      session.requiredOnSiteMs,
    );
    if (!session.presenceVerified) {
      return `Go now · ${onSiteLabel}`;
    }
    if (session.penaltyShieldEndsAt && session.penaltyMinutes) {
      const lockRemainingMs = Math.max(
        new Date(session.penaltyShieldEndsAt).getTime() - nowMs,
        0,
      );
      return `${onSiteLabel} · +${session.penaltyMinutes}m lock (${formatDurationClock(lockRemainingMs)})`;
    }
    if (session.awaySince) {
      return `${onSiteLabel} · return to finish, or locked until midnight`;
    }
    if (nowMs >= new Date(session.endsAt).getTime()) {
      return `Finish before midnight · ${onSiteLabel}`;
    }
    return onSiteLabel;
  }

  const nominalStartMs = getClassNominalStartMs(session, settings);
  if (nowMs < nominalStartMs) {
    const startsInMs = nominalStartMs - nowMs;
    return `Head to venue · class starts in ${formatDurationClock(startsInMs)}`;
  }

  const sessionRemainingMs = Math.max(new Date(session.endsAt).getTime() - nowMs, 0);
  const sessionLabel = `${formatDurationClock(sessionRemainingMs)} left`;

  if (!session.presenceVerified) {
    return `Head to venue · ${sessionLabel}`;
  }

  if (session.penaltyShieldEndsAt && session.penaltyMinutes) {
    const lockRemainingMs = Math.max(
      new Date(session.penaltyShieldEndsAt).getTime() - nowMs,
      0,
    );
    const lockLabel = formatDurationClock(lockRemainingMs);
    return `${sessionLabel} · +${session.penaltyMinutes}m lock (${lockLabel})`;
  }

  const graceRemaining = getAwayGraceRemainingMs(session, nowMs);
  const earlyCompleteRemaining = getClassEarlyCompleteRemainingMs(
    session,
    settings,
    nowMs,
  );
  if (session.awaySince && earlyCompleteRemaining != null && earlyCompleteRemaining > 0) {
    return `${sessionLabel} · Return within ${formatDurationClock(earlyCompleteRemaining)}`;
  }
  if (session.awaySince && graceRemaining != null && graceRemaining > 0) {
    return `${sessionLabel} · Return within ${formatDurationClock(graceRemaining)}`;
  }

  if (session.awaySince) {
    return `${sessionLabel} · Away from venue`;
  }

  return sessionLabel;
}

/** Check-in hero detail — omits the pre-start countdown; the main subtitle carries travel guidance. */
export function formatAwaitingCheckInDetailLine(
  session: ActiveSessionSnapshot,
  now = new Date(),
  settings: ShieldScheduleSettings = DEFAULT_SHIELD_SETTINGS,
): string | undefined {
  const nowMs = now.getTime();
  const nominalStartMs =
    session.scheduleType === "duration" && session.requiredOnSiteMs != null
      ? getSessionNominalStartMs(session, settings)
      : getClassNominalStartMs(session, settings);

  if (nowMs < nominalStartMs) {
    return undefined;
  }

  return formatSessionDetailLabel(session, now, settings);
}

export function isShieldActiveForNodes(
  nodes: FocusNode[],
  session: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now = Date.now(),
): boolean {
  return isAppShieldActive(nodes, session, settings, now, new Date(now));
}

/** True while the live session still has extra penalty lock time remaining. */
export function isPenaltyShieldActive(
  session: ActiveSessionSnapshot | null,
  now = Date.now(),
): boolean {
  if (!session?.penaltyShieldEndsAt) return false;
  return new Date(session.penaltyShieldEndsAt).getTime() > now;
}

/**
 * Missed class snapshots can outlive their penalty. They must not keep pinning
 * the Hero or block the next calendar obligation from taking over.
 */
export function isStaleUnverifiedClassSession(
  session: ActiveSessionSnapshot,
  now = Date.now(),
): boolean {
  if (session.scheduleType !== "class" || session.presenceVerified) return false;
  if (new Date(session.endsAt).getTime() > now) return false;
  return !isPenaltyShieldActive(session, now);
}

/** Node that incurred the lock — the live node when the penalty was not carried. */
export function getPenaltyOriginNodeId(session: ActiveSessionSnapshot): string {
  return session.penaltyOriginNodeId ?? session.nodeId;
}

export type CarriedPenaltyFields = {
  penaltyShieldEndsAt: string;
  penaltyMinutes: number;
  penaltyOriginNodeId: string;
};

/** Remaining lock to copy onto the next live session. Null if none or expired. */
export function getCarriedPenaltyFields(
  session: ActiveSessionSnapshot | null,
  now = Date.now(),
): CarriedPenaltyFields | null {
  if (!session?.penaltyShieldEndsAt || !isPenaltyShieldActive(session, now)) {
    return null;
  }
  return {
    penaltyShieldEndsAt: session.penaltyShieldEndsAt,
    penaltyMinutes: session.penaltyMinutes ?? DEFAULT_PENALTY_TIER_MINUTES,
    penaltyOriginNodeId: getPenaltyOriginNodeId(session),
  };
}

/**
 * True when Hero should treat the penalty as the primary beat (return to this
 * venue). False when the lock was carried onto a later overlapping session.
 */
export function isPenaltyTakeoverForLiveSession(
  session: ActiveSessionSnapshot | null,
  now = Date.now(),
): boolean {
  if (!session || !isPenaltyShieldActive(session, now)) return false;
  return getPenaltyOriginNodeId(session) === session.nodeId;
}

export type FocusNodeRemovalLockReason = "active" | "penalty";

/** Why delete is blocked — penalty takes precedence for clearer UI copy. */
export function getFocusNodeRemovalLockReason(
  nodeId: string,
  session: ActiveSessionSnapshot | null,
  now = Date.now(),
): FocusNodeRemovalLockReason | null {
  if (!session || session.nodeId !== nodeId) return null;
  if (isPenaltyShieldActive(session, now)) return "penalty";
  return "active";
}

/**
 * Deleting the live node would drop `activeSession` and end focus enforcement.
 * Other Focus Nodes stay editable so the rest of the schedule can still be managed.
 */
export function isFocusNodeRemovalLocked(
  nodeId: string,
  session: ActiveSessionSnapshot | null,
  now = Date.now(),
): boolean {
  return getFocusNodeRemovalLockReason(nodeId, session, now) != null;
}
