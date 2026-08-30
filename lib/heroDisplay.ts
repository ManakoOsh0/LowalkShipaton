/**
 * Hero display FSM — one e-ink screen, five journey phases.
 * Each phase answers exactly one question; nothing competes with the primary read.
 */
import { isPreBufferHeroMessage } from "@/lib/preBufferCopy";
import { formatStartClock24 } from "@/lib/time";
import type { HeroCelebrationPayload } from "@/store/useHeroCelebrationStore";
import type { HeroCardData } from "@/types/dashboard";

/** Journey phases for the single hero display. */
export type HeroDisplayPhase =
  | "waiting"
  | "travel"
  | "arrived"
  | "session"
  | "complete"
  | "idle"
  | "weekly";

/** Distinct idle hero moods — day won vs empty calendar vs mid-day break. */
export type HeroIdleMood = "day_complete" | "no_sessions" | "free_break";

/** Up next — relaxed wait vs leave-now urgency. */
export type HeroWaitingMood = "upcoming" | "now";

/** Arrived phase — verify check-in vs stepped out / penalty countdown. */
export type HeroArrivedMoment = "verify" | "stepped_out" | "penalty";

/** Minutes until primary reads "now" or the urgent pose kicks in. */
export const HERO_WAITING_NOW_THRESHOLD_MINUTES = 15;

/** Metric clock/distance vs multi-line session title (pre-buffer). */
export type HeroPrimaryPresentation = "metric" | "heading";

export type HeroDisplayModel = {
  phase: HeroDisplayPhase;
  kindLabel: string;
  statusLabel: string;
  /** Distinct idle copy mood when phase is idle. */
  idleMood?: HeroIdleMood;
  /** Up-next urgency — upcoming vs leave now. */
  waitingMood?: HeroWaitingMood;
  /** Arrived sub-state — verify, stepped out, or penalty. */
  arrivedMoment?: HeroArrivedMoment;
  /** Small label above the primary (e.g. "Check in"). */
  eyebrow?: string;
  /** The one thing your eyes should land on. */
  primary: string;
  /** How the primary line is typeset in HeroDisplay. */
  primaryPresentation?: HeroPrimaryPresentation;
  secondary?: string;
  tertiary?: string;
  detail?: string;
  footnote?: string;
  progressRatio?: number | null;
  showProgress: boolean;
  verifyPulse: boolean;
  showCheckmark?: boolean;
};

const TRAVEL_PROGRESS_CAP_METERS = 500;

/** Compact duration for the primary read — "1h 15m", "24m". */
export function formatCompactDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "now";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatPreBufferStartsInLine(
  hero: HeroCardData,
  startsInMinutes: number | null,
): string {
  if (hero.upNext?.startsInLabel) return hero.upNext.startsInLabel;
  if (startsInMinutes == null) return "Starting soon";
  if (startsInMinutes <= 0) return "Starting now";
  if (startsInMinutes === 1) return "Starts in 1 minute";
  if (startsInMinutes < 60) return `Starts in ${startsInMinutes} minutes`;

  const hours = Math.floor(startsInMinutes / 60);
  const minutes = startsInMinutes % 60;
  if (minutes === 0) {
    return hours === 1 ? "Starts in 1 hour" : `Starts in ${hours} hours`;
  }
  const hourPart = hours === 1 ? "1 hour" : `${hours} hours`;
  const minutePart = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  return `Starts in ${hourPart} ${minutePart}`;
}

function resolvePreBufferSessionTitle(hero: HeroCardData): string {
  if (hero.upNext?.sessionTitle) return hero.upNext.sessionTitle;
  return hero.title.replace(/\s+in\s+.+$/i, "").trim() || hero.title;
}

function parseStartsInMinutes(startsInLabel: string): number | null {
  const lower = startsInLabel.toLowerCase();
  if (lower.includes("starting now")) return 0;

  const hourMatch = lower.match(/(\d+)\s*hour/);
  const minuteMatch = lower.match(/(\d+)\s*minute/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  if (hours === 0 && minutes === 0) return null;
  return hours * 60 + minutes;
}

function minutesUntilClockLabel(
  clockLabel: string,
  referenceDate: Date,
): number | null {
  const match = clockLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hours = Number.parseInt(match[1]!, 10);
  const minutes = Number.parseInt(match[2]!, 10);
  const period = match[3]!.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const target = new Date(referenceDate);
  target.setHours(hours, minutes, 0, 0);
  return Math.ceil((target.getTime() - referenceDate.getTime()) / 60_000);
}

function isArrivedMoment(hero: HeroCardData): boolean {
  if (!hero.countdownLabel) return false;
  if (hero.icon === "arrived") return true;
  const subtitle = hero.subtitle?.toLowerCase() ?? "";
  if (subtitle.includes("verify") || subtitle.includes("stay inside")) return true;
  if (hero.context?.metaRight.label === "ARRIVED") return true;
  return false;
}

function isPenaltyOrAwayMoment(hero: HeroCardData): boolean {
  const title = hero.title.toLowerCase();
  return title.includes("locked") || title.includes("stepped out");
}

export function resolveArrivedMoment(hero: HeroCardData): HeroArrivedMoment | undefined {
  if (hero.title.toLowerCase().includes("stepped out")) {
    return "stepped_out";
  }
  if (hero.title.toLowerCase().includes("locked")) {
    return "penalty";
  }
  if (isArrivedMoment(hero)) {
    return "verify";
  }
  return undefined;
}

export function shouldShowHeroVerifyingPulse(model: HeroDisplayModel): boolean {
  return model.verifyPulse;
}

function resolveWaitingPrimaryMinutes(
  hero: HeroCardData,
  referenceDate: Date,
): number | null {
  if (!hero.upNext) return null;

  const leaveInMinutes = hero.upNext.leaveByLabel
    ? minutesUntilClockLabel(hero.upNext.leaveByLabel, referenceDate)
    : null;
  const startsInMinutes = parseStartsInMinutes(hero.upNext.startsInLabel);
  return leaveInMinutes ?? startsInMinutes;
}

/** Waiting hero — relaxed upcoming vs leave-now urgency. */
export function resolveWaitingMood(
  hero: HeroCardData,
  primary: string,
  primaryMinutes: number | null,
): HeroWaitingMood {
  if (primary === "now") return "now";
  if (isPreBufferHeroMessage(hero)) return "now";
  if (
    primaryMinutes != null &&
    primaryMinutes <= HERO_WAITING_NOW_THRESHOLD_MINUTES
  ) {
    return "now";
  }
  return "upcoming";
}

export function resolveWaitingMoodFromHero(
  hero: HeroCardData,
  referenceDate: Date = new Date(),
): HeroWaitingMood {
  const primaryMinutes = resolveWaitingPrimaryMinutes(hero, referenceDate);
  const primary =
    primaryMinutes != null ? formatCompactDuration(primaryMinutes) : "—";
  return resolveWaitingMood(hero, primary, primaryMinutes);
}

/** Idle shell copy maps to a display mood (see selectors idle branches). */
export function resolveIdleMood(hero: HeroCardData): HeroIdleMood {
  if (hero.title === "Day complete.") return "day_complete";
  if (hero.subtitle?.includes("No Focus Nodes are scheduled today")) {
    return "no_sessions";
  }
  return "free_break";
}

function withIdleMood(
  model: HeroDisplayModel,
  hero: HeroCardData,
): HeroDisplayModel {
  if (model.phase !== "idle") return model;
  return { ...model, idleMood: resolveIdleMood(hero) };
}

export function resolveHeroDisplayPhase(
  hero: HeroCardData,
  celebration?: HeroCelebrationPayload | null,
): HeroDisplayPhase {
  if (celebration) return "complete";
  if (hero.state === "weekly_report") return "weekly";
  if (hero.state === "active") return "session";

  if (hero.state === "up_next") {
    return hero.upNext ? "waiting" : "idle";
  }

  if (hero.state === "on_the_way") {
    if (!hero.upNext && !hero.nodeId) return "idle";
    if (isPreBufferHeroMessage(hero)) return "travel";
    if (hero.travelStats) return "travel";
    if (isPenaltyOrAwayMoment(hero)) return "arrived";
    if (hero.countdownLabel && isArrivedMoment(hero)) return "arrived";
    if (hero.countdownLabel) return "arrived";
    if (hero.upNext) return "waiting";
    return "idle";
  }

  return "idle";
}

export function resolveHeroStatusLabel(phase: HeroDisplayPhase): string {
  switch (phase) {
    case "waiting":
      return "UP NEXT";
    case "idle":
      return "READY";
    case "travel":
      return "TRAVELING";
    case "arrived":
      return "ARRIVED";
    case "session":
      return "FOCUS";
    case "complete":
      return "COMPLETE";
    case "weekly":
      return "COMPLETE";
    default:
      return "READY";
  }
}

function formatAppsLockedFootnote(count: number | undefined): string | undefined {
  if (count == null || count <= 0) return undefined;
  return "Apps locked";
}

function formatAppsUnlockedFootnote(count: number | undefined): string | undefined {
  if (count == null || count <= 0) return undefined;
  return count === 1 ? "1 app unlocked" : `${count} apps unlocked`;
}

/** Build the single display model consumed by HeroDisplay. */
export function buildHeroDisplayModel(
  hero: HeroCardData,
  options?: {
    celebration?: HeroCelebrationPayload | null;
    travelMetersAway?: number | null;
    referenceDate?: Date;
  },
): HeroDisplayModel {
  const referenceDate = options?.referenceDate ?? new Date();
  const travelMetersAway =
    options?.travelMetersAway ?? hero.context?.travelMetersAway ?? null;
  const phase = resolveHeroDisplayPhase(hero, options?.celebration);
  const context = hero.context;
  const kindLabel = context?.metaLeft.label ?? "FOCUS";
  const statusLabel = resolveHeroStatusLabel(phase);

  if (phase === "complete" && options?.celebration) {
    return {
      phase,
      kindLabel,
      statusLabel,
      primary: "Focus secured",
      secondary: options.celebration.nodeTitle,
      footnote: options.celebration.hitDailyGoal
        ? "Daily goal reached"
        : formatAppsUnlockedFootnote(hero.blockedAppsCount),
      showProgress: false,
      verifyPulse: false,
      showCheckmark: true,
    };
  }

  if (phase === "weekly") {
    return {
      phase,
      kindLabel,
      statusLabel,
      primary: context?.center.headline ?? "Week complete",
      secondary: context?.center.subline,
      showProgress: false,
      verifyPulse: false,
    };
  }

  if (phase === "session") {
    const countdown =
      hero.countdownLabel ?? context?.center.countdownLabel ?? context?.center.headline ?? "—";
    return {
      phase,
      kindLabel,
      statusLabel,
      primary: countdown,
      secondary: hero.title ?? context?.sessionTitle,
      tertiary: hero.locationLabel ?? undefined,
      showProgress: false,
      footnote: formatAppsLockedFootnote(hero.blockedAppsCount),
      verifyPulse: false,
    };
  }

  if (phase === "travel" && isPreBufferHeroMessage(hero)) {
    const startsInMinutes = hero.upNext
      ? parseStartsInMinutes(hero.upNext.startsInLabel)
      : parseStartsInMinutes(hero.title);

    return {
      phase,
      kindLabel,
      statusLabel: "BLOCKED",
      primary: resolvePreBufferSessionTitle(hero),
      primaryPresentation: "heading",
      secondary: formatPreBufferStartsInLine(hero, startsInMinutes),
      detail: hero.subtitle.replace(/\n/g, " · "),
      footnote: formatAppsLockedFootnote(hero.blockedAppsCount),
      waitingMood: "now",
      showProgress: false,
      verifyPulse: false,
    };
  }

  if (phase === "travel" && hero.travelStats) {
    const metersAway = travelMetersAway;
    const travelProgress =
      metersAway != null
        ? 1 - Math.min(Math.max(metersAway / TRAVEL_PROGRESS_CAP_METERS, 0), 1)
        : 0.35;

    return {
      phase,
      kindLabel,
      statusLabel,
      primary: hero.travelStats.distance,
      secondary: `${hero.travelStats.duration} walk`,
      progressRatio: travelProgress,
      showProgress: true,
      verifyPulse: false,
    };
  }

  if (phase === "arrived") {
    const countdown = hero.countdownLabel ?? "—";
    const arrivedMoment = resolveArrivedMoment(hero);
    const isVerify = arrivedMoment === "verify";

    return {
      phase,
      kindLabel,
      statusLabel: isVerify ? "ARRIVED" : statusLabel,
      arrivedMoment,
      eyebrow: isVerify ? "Check in" : undefined,
      primary: countdown,
      secondary: isVerify
        ? "Stay inside"
        : hero.subtitle.replace(/\n/g, " · "),
      progressRatio: hero.progressRatio ?? null,
      showProgress: isVerify && hero.progressRatio != null,
      verifyPulse: isVerify,
    };
  }

  if (phase === "waiting" && hero.upNext) {
    const leaveInMinutes = hero.upNext.leaveByLabel
      ? minutesUntilClockLabel(hero.upNext.leaveByLabel, referenceDate)
      : null;
    const startsInMinutes = parseStartsInMinutes(hero.upNext.startsInLabel);
    const primaryMinutes = leaveInMinutes ?? startsInMinutes;
    const moodPrimary =
      primaryMinutes != null ? formatCompactDuration(primaryMinutes) : "—";
    const primary = formatStartClock24(hero.upNext.timeLabel);

    return {
      phase,
      kindLabel,
      statusLabel,
      primary,
      secondary: hero.upNext.sessionTitle,
      detail: hero.upNext.locationLabel,
      footnote: hero.upNext.leaveByLabel
        ? `Leave by ${hero.upNext.leaveByLabel}`
        : undefined,
      waitingMood: resolveWaitingMood(hero, moodPrimary, primaryMinutes),
      showProgress: false,
      verifyPulse: false,
    };
  }

  return withIdleMood(
    {
      phase,
      kindLabel,
      statusLabel,
      primary: context?.center.headline ?? hero.title,
      secondary:
        context?.center.subline ??
        (hero.subtitle.replace(/\n/g, " · ") || undefined),
      showProgress: false,
      verifyPulse: false,
    },
    hero,
  );
}

export function buildHeroDisplayTransitionKey(
  hero: HeroCardData,
  celebration?: HeroCelebrationPayload | null,
  referenceDate: Date = new Date(),
): string {
  const phase = resolveHeroDisplayPhase(hero, celebration);
  if (phase === "idle") {
    return `${phase}:${resolveIdleMood(hero)}`;
  }
  if (phase === "waiting") {
    return `${phase}:${hero.nodeId ?? "none"}:${resolveWaitingMoodFromHero(hero, referenceDate)}`;
  }
  if (phase === "arrived") {
    return `${phase}:${hero.nodeId ?? "none"}:${resolveArrivedMoment(hero) ?? "arrived"}`;
  }
  return `${phase}:${hero.nodeId ?? "none"}`;
}
