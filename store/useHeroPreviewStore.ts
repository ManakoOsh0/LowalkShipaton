/**
 * Dev-only Hero Card state override — preview every companion state on Home.
 * Cleared when leaving preview mode; never persisted.
 */
import { create } from "zustand";

import type { HeroCardState } from "@/types/dashboard";
import type { FocusNodeKind } from "@/types/focusNode";

import { useHeroCelebrationStore } from "./useHeroCelebrationStore";

/** Optional visual sub-states layered on top of a forced HeroCardState. */
export type HeroPreviewVariant = "verifying";

/** Focus node kind for dev preview fixtures — drives kaomoji and copy. */
export type HeroPreviewKind = FocusNodeKind;

export const HERO_PREVIEW_KINDS: HeroPreviewKind[] = [
  "class",
  "gym",
  "library",
  "custom",
];

type HeroPreviewState = {
  /** Null = use live schedule / presence mapping. */
  forcedState: HeroCardState | null;
  forcedVariant: HeroPreviewVariant | null;
  /** Session kind for preview fixtures (kaomoji, titles, accents). */
  forcedKind: HeroPreviewKind;
  setForcedState: (state: HeroCardState | null) => void;
  setForcedVariant: (variant: HeroPreviewVariant | null) => void;
  setForcedKind: (kind: HeroPreviewKind) => void;
};

export const useHeroPreviewStore = create<HeroPreviewState>((set) => ({
  forcedState: null,
  forcedVariant: null,
  forcedKind: "library",
  setForcedState: (forcedState) => {
    if (forcedState != null) {
      useHeroCelebrationStore.getState().dismiss();
    }
    set({ forcedState });
  },
  setForcedVariant: (forcedVariant) => {
    if (forcedVariant != null) {
      useHeroCelebrationStore.getState().dismiss();
    }
    set({ forcedVariant });
  },
  setForcedKind: (forcedKind) => set({ forcedKind }),
}));
