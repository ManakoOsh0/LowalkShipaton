/** Active-session timer row for the focus widget — start clock + compact remaining. */
import type { HeroWidgetSnapshot } from "@/types/heroWidget";

export type ActiveSessionTimer = {
  progressRatio: number;
  startLabel: string;
  remainingLabel: string;
};

export function formatSessionStartLabel(startMs: number, referenceDate = new Date(startMs)): string {
  const hours = referenceDate.getHours();
  const minutes = referenceDate.getMinutes();
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/** Compact H:MM remaining — e.g. 1:37, 0:41 (not mm:ss). */
export function formatRemainingCompact(remainingMs: number): string {
  const totalMinutes = Math.max(0, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}`;
  return `0:${String(minutes).padStart(2, "0")}`;
}

export function buildActiveSessionTimer(
  snapshot: HeroWidgetSnapshot,
  nowMs = Date.now(),
): ActiveSessionTimer | null {
  if (snapshot.state !== "active") return null;

  const startsAt = snapshot.sessionStartsAtMs;
  const endsAt = snapshot.sessionEndsAtMs;
  if (startsAt == null || endsAt == null) return null;

  const totalMs = Math.max(1, endsAt - startsAt);
  const remainingMs = Math.max(0, endsAt - nowMs);
  const progressRatio =
    snapshot.progressRatio ?? Math.min(1, Math.max(0, (totalMs - remainingMs) / totalMs));

  return {
    progressRatio,
    startLabel: formatSessionStartLabel(startsAt),
    remainingLabel: formatRemainingCompact(remainingMs),
  };
}
