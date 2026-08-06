/**
 * Hero Card presentation helpers — accents, walk estimates, and preview fixtures.
 * Keeps the shared shell free of schedule / presence business rules.
 */
import {
    buildPreviewFocusLedger,
} from "@/lib/heroFocusLedger";
import { buildPreviewHeroContext, mergeBlockedAppsIntoHero } from "@/lib/heroIntel";
import type { HeroPreviewKind, HeroPreviewVariant } from "@/store/useHeroPreviewStore";
import type {
    HeroCardData,
    HeroCardState,
    HeroIconId,
} from "@/types/dashboard";

/** Minutes before start when the Hero nudges the user to leave. */
export const TIME_TO_LEAVE_MINUTES = 45;

/**
 * Fixed "now" for dev Hero previews — 1:30 PM so leave-by / start copy stays readable
 * regardless of when you open Settings.
 */
export function getHeroPreviewReferenceDate(referenceDate = new Date()): Date {
  const preview = new Date(referenceDate);
  preview.setHours(13, 30, 0, 0);
  return preview;
}

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

export const HERO_PREVIEW_KIND_LABELS: Record<HeroPreviewKind, string> = {
  class: "CLASS",
  gym: "GYM",
  library: "LIBRARY",
  custom: "FOCUS",
};

type HeroPreviewKindFixture = {
  sessionTitle: string;
  locationLabel: string;
  timeLabel: string;
  endTimeLabel: string;
  leaveByLabel: string;
  startsInLabel: string;
  startsInShortLabel: string;
};

const HERO_PREVIEW_KIND_FIXTURES: Record<HeroPreviewKind, HeroPreviewKindFixture> = {
  class: {
    sessionTitle: "Statistics Lecture",
    locationLabel: "EMS Building",
    timeLabel: "9:00 AM – 10:30 AM",
    endTimeLabel: "10:30 AM",
    leaveByLabel: "8:45 AM",
    startsInLabel: "Starts in 1 hour 15 minutes",
    startsInShortLabel: "Starts in 30 minutes",
  },
  gym: {
    sessionTitle: "Gym Workout",
    locationLabel: "Virgin Active",
    timeLabel: "5:00 PM – 6:00 PM",
    endTimeLabel: "6:00 PM",
    leaveByLabel: "4:45 PM",
    startsInLabel: "Starts in 1 hour 15 minutes",
    startsInShortLabel: "Starts in 30 minutes",
  },
  library: {
    sessionTitle: "Library Session",
    locationLabel: "Engineering Library",
    timeLabel: "2:00 PM – 4:00 PM",
    endTimeLabel: "4:00 PM",
    leaveByLabel: "1:45 PM",
    startsInLabel: "Starts in 1 hour 15 minutes",
    startsInShortLabel: "Starts in 30 minutes",
  },
  custom: {
    sessionTitle: "Deep Work Block",
    locationLabel: "Home Office",
    timeLabel: "3:00 PM – 5:00 PM",
    endTimeLabel: "5:00 PM",
    leaveByLabel: "2:45 PM",
    startsInLabel: "Starts in 1 hour 15 minutes",
    startsInShortLabel: "Starts in 30 minutes",
  },
};

export function getHeroPreviewKindFixture(kind: HeroPreviewKind) {
  return HERO_PREVIEW_KIND_FIXTURES[kind];
}

function previewUpNextFields(kind: HeroPreviewKind, startsInLabel: string) {
  const fixture = HERO_PREVIEW_KIND_FIXTURES[kind];
  return {
    sessionTitle: fixture.sessionTitle,
    timeLabel: fixture.timeLabel,
    locationLabel: fixture.locationLabel,
    startsInLabel,
    endTimeLabel: fixture.endTimeLabel,
    kindLabel: HERO_PREVIEW_KIND_LABELS[kind],
    leaveByLabel: fixture.leaveByLabel,
  };
}

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
export function buildHeroPreviewData(
  state: HeroCardState,
  variant?: HeroPreviewVariant | null,
  kind: HeroPreviewKind = "library",
): HeroCardData {
  const fixture = HERO_PREVIEW_KIND_FIXTURES[kind];

  if (variant === "verifying") {
    const verifyingHero: HeroCardData = {
      state: "on_the_way",
      title: "You're here.",
      subtitle: "Stay inside while we verify your location.",
      icon: "arrived",
      action: null,
      nodeId: "preview-node",
      countdownLabel: "04:59",
      progressRatio: 0.2,
      blockedAppsCount: 0,
      upNext: previewUpNextFields(kind, fixture.startsInShortLabel),
    };
    return mergeBlockedAppsIntoHero(
      {
        ...verifyingHero,
        context: buildPreviewHeroContext("on_the_way", variant, kind),
      },
      0,
    );
  }

  const fixtures: Record<HeroCardState, HeroCardData> = {
    up_next: {
      state,
      title: "Up next",
      subtitle: "",
      icon: "target",
      action: null,
      nodeId: "preview-node",
      blockedAppsCount: 8,
      upNext: previewUpNextFields(kind, fixture.startsInLabel),
    },
    on_the_way: {
      state,
      title: "Time to head out.",
      subtitle: `${fixture.sessionTitle} starts in 30 minutes.`,
      icon: "walk",
      action: null,
      nodeId: "preview-node",
      latitude: -25.7545,
      longitude: 28.2314,
      travelStats: { distance: "340 m", duration: "5 mins" },
      blockedAppsCount: 8,
      upNext: previewUpNextFields(kind, fixture.startsInShortLabel),
    },
    active: {
      state,
      title: fixture.sessionTitle,
      subtitle: "41 minutes remaining.",
      icon: "flame",
      action: null,
      countdownLabel: "41:00",
      progressRatio: 0.35,
      locationLabel: fixture.locationLabel,
      nodeId: "preview-node",
      blockedAppsCount: 12,
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

  const hero = fixtures[state];
  return mergeBlockedAppsIntoHero(
    {
      ...hero,
      context: buildPreviewHeroContext(state, variant, kind),
    },
    hero.blockedAppsCount ?? 0,
  );
}

export function defaultIconForState(state: HeroCardState): HeroIconId | null {
  return buildHeroPreviewData(state).icon;
}
