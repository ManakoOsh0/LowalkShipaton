import type { ActiveSessionSnapshot } from "@/types/session";
import type { FocusNode } from "@/types/focusNode";

import {
  formatDurationClock,
  formatOnSiteRemainingLabel,
  isAppShieldActive,
  type ShieldScheduleSettings,
} from "@/lib/shieldSchedule";
import { isDurationSessionExpired } from "@/lib/time";

/** Grace before a presence penalty locks apps for the Settings tier duration. */
export const PRESENCE_PENALTY_GRACE_MS = 5 * 60 * 1000;

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

export function getAwayGraceRemainingMs(
  session: ActiveSessionSnapshot,
  now = Date.now(),
): number | null {
  if (!session.awaySince || session.penaltyShieldEndsAt) return null;
  const awayMs = now - new Date(session.awaySince).getTime();
  const remaining = PRESENCE_PENALTY_GRACE_MS - awayMs;
  return remaining > 0 ? remaining : 0;
}

/** Hero detail line — calendar shield + on-site quota + class penalties. */
export function formatSessionDetailLabel(
  session: ActiveSessionSnapshot,
  now = new Date(),
): string {
  const nowMs = now.getTime();

  if (session.scheduleType === "duration" && session.requiredOnSiteMs != null) {
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
    const graceRemaining = getAwayGraceRemainingMs(session, nowMs);
    if (session.awaySince && graceRemaining != null && graceRemaining > 0) {
      return `${onSiteLabel} · Return within ${formatDurationClock(graceRemaining)}`;
    }
    if (session.awaySince) {
      return `${onSiteLabel} · Away from venue`;
    }
    if (nowMs >= new Date(session.endsAt).getTime()) {
      return `Finish before midnight · ${onSiteLabel}`;
    }
    return onSiteLabel;
  }

  const sessionRemainingMs = Math.max(new Date(session.endsAt).getTime() - nowMs, 0);
  const sessionLabel = `${formatDurationClock(sessionRemainingMs)} left`;

  if (!session.presenceVerified) {
    const untilStartMs = Math.max(
      new Date(session.endsAt).getTime() - nowMs,
      0,
    );
    return `Head to venue · class ends in ${formatDurationClock(untilStartMs)}`;
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
  if (session.awaySince && graceRemaining != null && graceRemaining > 0) {
    return `${sessionLabel} · Return within ${formatDurationClock(graceRemaining)}`;
  }

  if (session.awaySince) {
    return `${sessionLabel} · Away from venue`;
  }

  return sessionLabel;
}

export function isShieldActiveForNodes(
  nodes: FocusNode[],
  session: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now = Date.now(),
): boolean {
  return isAppShieldActive(nodes, session, settings, now, new Date(now));
}
