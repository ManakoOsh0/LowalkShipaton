/**
 * Hero Card presentation helpers — accents, walk estimates, and preview fixtures.
 * Keeps the shared shell free of schedule / presence business rules.
 */
import type {
  HeroCardData,
  HeroCardState,
  HeroIconId,
} from "@/types/dashboard";
import {
  buildPreviewFocusLedger,
} from "@/lib/heroFocusLedger";

/** Minutes before start when the Hero nudges the user to leave. */
export const TIME_TO_LEAVE_MINUTES = 45;

/** Average walking pace for coarse ETA copy (metres per minute). */
const WALK_METERS_PER_MINUTE = 80;

export type HeroAccent = {
  /** Single accent color for flat hero stripe and icons. */
  color: string;
  /** Subtle tinted background for icon tile. */
  tint: string;
  name: string;
};

/** State → flat accent palette (Dawn Path). */
export const HERO_ACCENTS: Record<HeroCardState, HeroAccent> = {
  up_next: { name: "sky", color: "#8FAFD4", tint: "rgba(205, 222, 242, 0.45)" },
  on_the_way: { name: "skyDeep", color: "#6B8FB8", tint: "rgba(139, 175, 212, 0.2)" },
  active: { name: "skyDeep", color: "#6B8FB8", tint: "rgba(139, 175, 212, 0.2)" },
  weekly_report: { name: "green", color: "#2D9B5A", tint: "rgba(45, 155, 90, 0.12)" },
};

/** Compact hero layout for weekly ledger. */
export const HERO_COMPACT_STATES: HeroCardState[] = ["weekly_report"];

export const HERO_STATE_LABELS: Record<HeroCardState, string> = {
  up_next: "Up Next",
  on_the_way: "On The Way",
  active: "Active Focus Session",
  weekly_report: "Weekly Ledger",
};

export const ALL_HERO_STATES = Object.keys(HERO_STATE_LABELS) as HeroCardState[];

/** Coarse foot-ETA from metres outside the fence. */
export function formatWalkEtaLabel(metersAway: number): string {
  const minutes = Math.max(1, Math.round(metersAway / WALK_METERS_PER_MINUTE));
  if (minutes === 1) return "Approximately 1 minute on foot.";
  return `Approximately ${minutes} minutes on foot.`;
}

/** Scannable pill label for hero travel distance. */
export function formatTravelDistanceBadge(meters: number): string {
  if (meters < 1000) {
    const rounded = Math.max(10, Math.round(meters / 10) * 10);
    return `${rounded} m`;
  }
  const km = Math.round(meters / 100) / 10;
  return `${km} km`;
}

/** Scannable pill label for hero walk-time estimate. */
export function formatTravelDurationBadge(metersAway: number): string {
  const minutes = Math.max(1, Math.round(metersAway / WALK_METERS_PER_MINUTE));
  return minutes === 1 ? "1 min" : `${minutes} mins`;
}

export function buildTravelStats(metersAway: number) {
  return {
    distance: formatTravelDistanceBadge(metersAway),
    duration: formatTravelDurationBadge(metersAway),
  };
}

export function formatCountdownMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Human “starts in …” for upcoming / leave windows. */
export function formatStartsInLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "starting now";
  if (totalMinutes < 60) {
    return totalMinutes === 1 ? "1 minute" : `${totalMinutes} minutes`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  const hourPart = hours === 1 ? "1 hour" : `${hours} hours`;
  const minutePart = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  return `${hourPart} ${minutePart}`;
}

/** Deterministic fixtures so every Hero state can be previewed from Settings. */
export function buildHeroPreviewData(state: HeroCardState): HeroCardData {
  const fixtures: Record<HeroCardState, HeroCardData> = {
    up_next: {
      state,
      title: "Up next",
      subtitle: "",
      icon: "target",
      action: null,
      nodeId: "preview-node",
      upNext: {
        sessionTitle: "Library Session",
        timeLabel: "2:00 PM",
        locationLabel: "Engineering Library",
        startsInLabel: "Starts in 1 hour 15 minutes",
      },
    },
    on_the_way: {
      state,
      title: "Time to head out.",
      subtitle: "Library Session starts in 30 minutes.",
      icon: "walk",
      action: null,
      nodeId: "preview-node",
      latitude: -25.7545,
      longitude: 28.2314,
    },
    active: {
      state,
      title: "Library Session",
      subtitle: "41 minutes remaining.",
      icon: "flame",
      action: null,
      countdownLabel: "41:00",
      progressRatio: 0.35,
      locationLabel: "Engineering Library",
      nodeId: "preview-node",
    },
    weekly_report: {
      state,
      title: "Focus Ledger",
      subtitle: "",
      icon: null,
      action: null,
      focusLedger: buildPreviewFocusLedger(),
    },
  };

  return fixtures[state];
}

export function defaultIconForState(state: HeroCardState): HeroIconId | null {
  return buildHeroPreviewData(state).icon;
}
