/**
 * Maps in-app Hero Card view models to a flat snapshot for the Android widget.
 * Keeps widget-specific fields separate from dashboard presentation types.
 */
import { formatMinutesToLabel } from "@/lib/time";
import type { DailyGoal, HeroCardData } from "@/types/dashboard";
import type { ActiveSessionSnapshot } from "@/types/session";
import type { HeroWidgetSnapshot } from "@/types/heroWidget";

function parseMs(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
}

/** Parses MM:SS countdown copy into an approximate end timestamp for widget alarms. */
function endsAtFromCountdownLabel(
  countdownLabel: string | undefined,
  referenceDate: Date,
): number | undefined {
  if (!countdownLabel?.includes(":")) return undefined;
  const [minutesPart, secondsPart] = countdownLabel.split(":");
  const minutes = Number.parseInt(minutesPart, 10);
  const seconds = Number.parseInt(secondsPart, 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return undefined;
  return referenceDate.getTime() + (minutes * 60 + seconds) * 1000;
}

function formatMsLabel(ms: number | undefined): string | undefined {
  if (ms == null || !Number.isFinite(ms)) return undefined;
  const date = new Date(ms);
  return formatMinutesToLabel(date.getHours() * 60 + date.getMinutes());
}

function buildUpNextFooter(
  hero: HeroCardData,
): string | undefined {
  const row = hero.context?.upcomingToday?.[0];
  if (!row) return undefined;
  const locationSuffix = row.locationLabel ? ` · ${row.locationLabel}` : "";
  return `Up next: ${row.title} at ${row.timeLabel}${locationSuffix}`;
}

function buildTravelLabel(hero: HeroCardData): string | undefined {
  const stats = hero.travelStats;
  if (!stats) return undefined;
  return `${stats.distance} · ${stats.duration}`;
}

/** Derives widget copy from the same HeroCardData the dashboard renders. */
export function buildHeroWidgetSnapshot(
  hero: HeroCardData,
  dailyGoal: DailyGoal,
  activeSession: ActiveSessionSnapshot | null,
  referenceDate = new Date(),
): HeroWidgetSnapshot {
  const context = hero.context;
  const sessionTitle = context?.sessionTitle ?? hero.title;
  const metaLeft = context?.metaLeft.label ?? "FOCUS";
  const metaRight = context?.metaRight.label ?? hero.state.toUpperCase().replace("_", " ");

  const headline =
    context?.center.headline ??
    hero.countdownLabel ??
    hero.title;

  const subline =
    context?.center.subline ??
    (hero.subtitle.trim() ? hero.subtitle : undefined) ??
    context?.tagline;

  const countdownLabel =
    context?.center.countdownLabel ??
    hero.countdownLabel ??
    undefined;

  const progressRatio =
    context?.center.progressRatio ??
    hero.progressRatio ??
    undefined;

  const sessionStartsAtMs =
    hero.state === "active"
      ? parseMs(activeSession?.shieldStartsAt)
      : undefined;

  const sessionEndsAtMs =
    hero.state === "active"
      ? parseMs(activeSession?.endsAt) ??
        endsAtFromCountdownLabel(
          countdownLabel ?? hero.countdownLabel ?? undefined,
          referenceDate,
        )
      : undefined;

  const timeWindowLabel =
    hero.upNext?.timeLabel ??
    (sessionStartsAtMs != null && sessionEndsAtMs != null
      ? `${formatMsLabel(sessionStartsAtMs)} – ${formatMsLabel(sessionEndsAtMs)}`
      : undefined);

  const locationLabel =
    hero.locationLabel ??
    hero.upNext?.locationLabel ??
    context?.upcomingToday[0]?.locationLabel;

  const blockedAppsLabel = context?.blockedAppsLabel;

  return {
    state: hero.state,
    sessionTitle,
    metaLeft,
    metaRight,
    headline,
    subline,
    countdownLabel,
    progressRatio,
    dailyGoalCompleted: dailyGoal.completed,
    dailyGoalTarget: dailyGoal.target,
    updatedAtMs: referenceDate.getTime(),
    sessionStartsAtMs,
    sessionEndsAtMs,
    timeWindowLabel,
    locationLabel,
    travelLabel: buildTravelLabel(hero),
    upNextFooter: buildUpNextFooter(hero),
    blockedAppsLabel,
  };
}

/** Stable JSON for debouncing — omits `updatedAtMs` so idle states do not rewrite native prefs every second. */
export function serializeHeroWidgetSnapshotForCompare(
  snapshot: HeroWidgetSnapshot,
): string {
  const { updatedAtMs: _updatedAtMs, ...rest } = snapshot;
  return JSON.stringify(rest);
}

/** Full payload serialization (includes `updatedAtMs` for native storage). */
export function serializeHeroWidgetSnapshot(snapshot: HeroWidgetSnapshot): string {
  return JSON.stringify(snapshot);
}
