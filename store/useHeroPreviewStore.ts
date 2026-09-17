/**
 * Dev-only Hero Card preview — every display phase can be forced on Home.
 * Cleared when leaving preview mode; never persisted.
 */
import { create } from "zustand";

import type { FocusNodeKind } from "@/types/focusNode";

import { useHeroCelebrationStore } from "./useHeroCelebrationStore";

/** Focus node kind for dev preview fixtures — drives copy and accents. */
export type HeroPreviewKind = FocusNodeKind;

/** Used by preview context builders for the verifying inset. */
export type HeroPreviewVariant = "verifying";

export const HERO_PREVIEW_KINDS: HeroPreviewKind[] = [
  "class",
  "gym",
  "library",
  "custom",
];

/**
 * Every distinct hero display moment — maps 1:1 to HeroDisplay phases / idle moods.
 * (Not the same as HeroCardState, which only has three storage buckets.)
 */
export type HeroPreviewScenario =
  | "up_next"
  | "pre_buffer"
  | "traveling"
  | "traveling_location_denied"
  | "traveling_gps_wait"
  | "traveling_background_location"
  | "verifying"
  | "arrived"
  | "active_session"
  | "active_pre_start"
  | "stepped_out"
  | "apps_locked"
  | "add_place"
  | "deferred_anchor"
  | "day_complete"
  | "no_sessions"
  | "nothing_left";

export const HERO_PREVIEW_SCENARIOS: HeroPreviewScenario[] = [
  "up_next",
  "pre_buffer",
  "traveling",
  "traveling_location_denied",
  "traveling_gps_wait",
  "traveling_background_location",
  "verifying",
  "arrived",
  "active_session",
  "active_pre_start",
  "stepped_out",
  "apps_locked",
  "add_place",
  "deferred_anchor",
  "day_complete",
  "no_sessions",
  "nothing_left",
];

export const HERO_PREVIEW_SCENARIO_LABELS: Record<HeroPreviewScenario, string> = {
  up_next: "Up next",
  pre_buffer: "Pre-buffer",
  traveling: "Traveling",
  traveling_location_denied: "Traveling · location off",
  traveling_gps_wait: "Traveling · GPS wait",
  traveling_background_location: "Traveling · background location",
  verifying: "Verifying",
  arrived: "Arrived",
  active_session: "Active session",
  active_pre_start: "Active · pre-start countdown",
  stepped_out: "Stepped out",
  apps_locked: "Apps locked",
  add_place: "Add a place",
  deferred_anchor: "Deferred anchor",
  day_complete: "Day complete",
  no_sessions: "No sessions today",
  nothing_left: "Nothing left",
};

type HeroPreviewState = {
  /** Null = use live schedule / presence mapping. */
  forcedScenario: HeroPreviewScenario | null;
  /** Session kind for preview fixtures (titles, accents). */
  forcedKind: HeroPreviewKind;
  setForcedScenario: (scenario: HeroPreviewScenario | null) => void;
  setForcedKind: (kind: HeroPreviewKind) => void;
};

export const useHeroPreviewStore = create<HeroPreviewState>((set) => ({
  forcedScenario: null,
  forcedKind: "library",
  setForcedScenario: (forcedScenario) => {
    if (forcedScenario != null) {
      useHeroCelebrationStore.getState().dismiss();
    }
    set({ forcedScenario });
  },
  setForcedKind: (forcedKind) => set({ forcedKind }),
}));
