/**
 * Hero Card presentation helpers — accents, walk estimates, and preview fixtures.
 * Keeps the shared shell free of schedule / presence business rules.
 */
import {
    buildPreviewFocusLedger,
} from "@/lib/heroFocusLedger";
import { buildPreBufferBody, buildPreBufferTitle } from "@/lib/preBufferCopy";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";
import { buildPreviewHeroContext, mergeBlockedAppsIntoHero } from "@/lib/heroIntel";
import type {
    HeroPreviewKind,
    HeroPreviewScenario,
} from "@/store/useHeroPreviewStore";
import type {
    HeroCardContext,
    HeroCardData,
    HeroCardState,
    HeroIconId,
} from "@/types/dashboard";

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

function buildIdlePreviewContext(
  kind: HeroPreviewKind,
  title: string,
  subtitle: string,
): HeroCardContext {
  const kindLabel = HERO_PREVIEW_KIND_LABELS[kind];
  return {
    metaLeft: { label: kindLabel },
    metaRight: { label: "READY" },
    sessionTitle: title,
    dayArc: { positionLabel: "0 of 0", markers: [] },
    center: { headline: title, subline: subtitle.replace(/\n/g, " · ") },
    intelCells: [],
    upcomingToday: [],
  };
}

/** Deterministic fixtures for every hero display scenario (Settings dev preview). */
export function buildHeroPreviewData(
  scenario: HeroPreviewScenario,
  kind: HeroPreviewKind = "library",
): HeroCardData {
  const fixture = HERO_PREVIEW_KIND_FIXTURES[kind];
  const upNextLong = previewUpNextFields(kind, fixture.startsInLabel);
  const upNextShort = previewUpNextFields(kind, fixture.startsInShortLabel);

  switch (scenario) {
    case "up_next":
      return mergeBlockedAppsIntoHero(
        {
          state: "up_next",
          title: "Up next",
          subtitle: "",
          icon: "target",
          action: null,
          nodeId: "preview-node",
          blockedAppsCount: 8,
          upNext: upNextLong,
          context: buildPreviewHeroContext("up_next", null, kind),
        },
        8,
      );

    case "pre_buffer": {
      const previewNode = {
        title: fixture.sessionTitle,
        anchorId: "preview-anchor",
      } as FocusNode;
      const previewAnchors = [
        {
          id: "preview-anchor",
          name: fixture.locationLabel,
          latitude: -25.7545,
          longitude: 28.2314,
          radiusMeters: 30,
          calibrated: true,
        },
      ] as Anchor[];
      const preBufferTitle = buildPreBufferTitle(previewNode, 30);
      const preBufferBody = buildPreBufferBody(previewNode, previewAnchors);

      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: preBufferTitle,
          subtitle: preBufferBody,
          icon: "walk",
          action: null,
          nodeId: "preview-node",
          latitude: -25.7545,
          longitude: 28.2314,
          blockedAppsCount: 8,
          upNext: {
            ...upNextShort,
            startsInLabel: "Starts in 30 minutes",
          },
          context: buildPreviewHeroContext("on_the_way", null, kind),
        },
        8,
      );
    }

    case "traveling":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "On your way.",
          subtitle: "On your way to the venue.",
          icon: "traveller",
          action: null,
          nodeId: "preview-node",
          latitude: -25.7545,
          longitude: 28.2314,
          travelStats: { distance: "340 m", duration: "5 mins" },
          blockedAppsCount: 8,
          upNext: upNextShort,
          context: buildPreviewHeroContext("on_the_way", null, kind),
        },
        8,
      );

    case "verifying":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "Locking in...",
          subtitle: "Stay inside the area to begin your session.",
          icon: null,
          action: null,
          nodeId: "preview-node",
          countdownLabel: "02:30",
          progressRatio: 0.55,
          blockedAppsCount: 0,
          upNext: upNextShort,
          context: buildPreviewHeroContext("on_the_way", "verifying", kind),
        },
        0,
      );

    case "arrived":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "You're here.",
          subtitle: "Stay inside while we verify your location.",
          icon: "arrived",
          action: null,
          nodeId: "preview-node",
          countdownLabel: "04:59",
          progressRatio: 0.2,
          blockedAppsCount: 0,
          upNext: upNextShort,
          context: buildPreviewHeroContext("on_the_way", "verifying", kind),
        },
        0,
      );

    case "active_session":
      return mergeBlockedAppsIntoHero(
        {
          state: "active",
          title: fixture.sessionTitle,
          subtitle: "41 minutes remaining.",
          icon: "flame",
          action: null,
          countdownLabel: "41:00",
          progressRatio: 0.35,
          locationLabel: fixture.locationLabel,
          nodeId: "preview-node",
          blockedAppsCount: 12,
          context: buildPreviewHeroContext("active", null, kind),
        },
        12,
      );

    case "stepped_out":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "Stepped out.",
          subtitle: "Return within 02:30",
          icon: "traveller",
          action: null,
          nodeId: "preview-node",
          countdownLabel: "02:30",
          blockedAppsCount: 8,
          context: {
            metaLeft: { label: HERO_PREVIEW_KIND_LABELS[kind] },
            metaRight: { label: "TRAVELING" },
            sessionTitle: fixture.sessionTitle,
            dayArc: { positionLabel: "Session 2 of 3", markers: [] },
            center: {
              headline: "02:30",
              subline: "Return within 02:30",
              countdownLabel: "02:30",
            },
            intelCells: [],
            upcomingToday: [],
            travelMetersAway: null,
          },
        },
        8,
      );

    case "apps_locked":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "Apps locked.",
          subtitle: `+30m penalty · return to ${fixture.locationLabel}`,
          icon: "traveller",
          action: null,
          nodeId: "preview-node",
          countdownLabel: "29:45",
          blockedAppsCount: 12,
          context: {
            metaLeft: { label: HERO_PREVIEW_KIND_LABELS[kind] },
            metaRight: { label: "TRAVELING" },
            sessionTitle: fixture.sessionTitle,
            dayArc: { positionLabel: "Session 2 of 3", markers: [] },
            center: {
              headline: "29:45",
              subline: `+30m penalty · return to ${fixture.locationLabel}`,
              countdownLabel: "29:45",
            },
            intelCells: [],
            upcomingToday: [],
            travelMetersAway: null,
          },
        },
        12,
      );

    case "day_complete":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "Day complete.",
          subtitle: "Every Focus Node completed.\nEnjoy the rest of your day.",
          icon: "sparkle",
          action: null,
          blockedAppsCount: 0,
          context: buildIdlePreviewContext(
            kind,
            "Day complete.",
            "Every Focus Node completed. Enjoy the rest of your day.",
          ),
        },
        0,
      );

    case "no_sessions":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "Nothing scheduled today.",
          subtitle: "Your day is clear.",
          icon: "sunrise",
          action: null,
          blockedAppsCount: 0,
          context: buildIdlePreviewContext(kind, "Nothing scheduled today.", "Your day is clear."),
        },
        0,
      );

    case "nothing_left":
      return mergeBlockedAppsIntoHero(
        {
          state: "on_the_way",
          title: "Nothing left today.",
          subtitle: "Enjoy your break or create a new one.",
          icon: "sunrise",
          action: null,
          blockedAppsCount: 0,
          context: buildIdlePreviewContext(
            kind,
            "Nothing left today.",
            "Enjoy your break or create a new one.",
          ),
        },
        0,
      );

    case "weekly_ledger":
      return mergeBlockedAppsIntoHero(
        {
          state: "weekly_report",
          title: "Focus Ledger",
          subtitle: "",
          icon: null,
          action: null,
          focusLedger: buildPreviewFocusLedger(),
          context: buildPreviewHeroContext("weekly_report", null, kind),
        },
        0,
      );

    default:
      return buildHeroPreviewData("up_next", kind);
  }
}

export function defaultIconForState(state: HeroCardState): HeroIconId | null {
  const scenarioByState: Record<HeroCardState, HeroPreviewScenario> = {
    up_next: "up_next",
    on_the_way: "traveling",
    active: "active_session",
    weekly_report: "weekly_ledger",
  };
  return buildHeroPreviewData(scenarioByState[state], "library").icon;
}
