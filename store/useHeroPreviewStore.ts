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
 * (Not the same as HeroCardState, which only has four storage buckets.)
 */
export type HeroPreviewScenario =
  | "up_next"
  | "pre_buffer"
  | "traveling"
  | "verifying"
  | "arrived"
  | "active_session"
  | "stepped_out"
  | "apps_locked"
  | "day_complete"
  | "no_sessions"
  | "nothing_left"
  | "weekly_ledger";

export const HERO_PREVIEW_SCENARIOS: HeroPreviewScenario[] = [
  "up_next",
  "pre_buffer",
  "traveling",
  "verifying",
  "arrived",
  "active_session",
  "stepped_out",
  "apps_locked",
  "day_complete",
  "no_sessions",
  "nothing_left",
  "weekly_ledger",
];

export const HERO_PREVIEW_SCENARIO_LABELS: Record<HeroPreviewScenario, string> = {
  up_next: "Up next",
  pre_buffer: "Pre-buffer",
  traveling: "Traveling",
  verifying: "Verifying",
  arrived: "Arrived",
  active_session: "Active session",
  stepped_out: "Stepped out",
  apps_locked: "Apps locked",
  day_complete: "Day complete",
  no_sessions: "No sessions today",
  nothing_left: "Nothing left",
  weekly_ledger: "Weekly ledger",
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
