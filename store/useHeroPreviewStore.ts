/**
 * Dev-only Hero Card state override — preview every companion state on Home.
 * Cleared when leaving preview mode; never persisted.
 */
import { create } from "zustand";

import type { HeroCardState } from "@/types/dashboard";

type HeroPreviewState = {
  /** Null = use live schedule / presence mapping. */
  forcedState: HeroCardState | null;
  setForcedState: (state: HeroCardState | null) => void;
};

export const useHeroPreviewStore = create<HeroPreviewState>((set) => ({
  forcedState: null,
  setForcedState: (forcedState) => set({ forcedState }),
}));
