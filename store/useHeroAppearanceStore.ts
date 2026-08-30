import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_HERO_BACKGROUND_ID,
  DEFAULT_HERO_CASE_ID,
  DEFAULT_HERO_WELL_ID,
  isHeroBackgroundId,
  isHeroCaseId,
  isHeroWellId,
  type HeroBackgroundId,
  type HeroCaseId,
  type HeroWellId,
} from "@/lib/heroAppearance";
import {
  DEFAULT_HERO_CASE_STYLE_ID,
  isHeroCaseStyleId,
  type HeroCaseStyleId,
} from "@/lib/heroCaseStyle";

type HeroAppearanceState = {
  caseId: HeroCaseId;
  wellId: HeroWellId;
  backgroundId: HeroBackgroundId;
  caseStyleId: HeroCaseStyleId;
  setCaseId: (caseId: HeroCaseId) => void;
  setWellId: (wellId: HeroWellId) => void;
  setBackgroundId: (backgroundId: HeroBackgroundId) => void;
  setCaseStyleId: (caseStyleId: HeroCaseStyleId) => void;
};

function sanitizeAppearance(
  persisted: Partial<HeroAppearanceState> | undefined,
): Pick<
  HeroAppearanceState,
  "caseId" | "wellId" | "backgroundId" | "caseStyleId"
> {
  const caseId =
    persisted?.caseId && isHeroCaseId(persisted.caseId)
      ? persisted.caseId
      : DEFAULT_HERO_CASE_ID;
  const wellId =
    persisted?.wellId && isHeroWellId(persisted.wellId)
      ? persisted.wellId
      : DEFAULT_HERO_WELL_ID;
  const backgroundId =
    persisted?.backgroundId && isHeroBackgroundId(persisted.backgroundId)
      ? persisted.backgroundId
      : DEFAULT_HERO_BACKGROUND_ID;
  const caseStyleId =
    persisted?.caseStyleId && isHeroCaseStyleId(persisted.caseStyleId)
      ? persisted.caseStyleId
      : DEFAULT_HERO_CASE_STYLE_ID;

  return { caseId, wellId, backgroundId, caseStyleId };
}

/** Persisted hero case color, style, LCD well, and home background IDs. */
export const useHeroAppearanceStore = create<HeroAppearanceState>()(
  persist(
    (set) => ({
      caseId: DEFAULT_HERO_CASE_ID,
      wellId: DEFAULT_HERO_WELL_ID,
      backgroundId: DEFAULT_HERO_BACKGROUND_ID,
      caseStyleId: DEFAULT_HERO_CASE_STYLE_ID,
      setCaseId: (caseId) => set({ caseId }),
      setWellId: (wellId) => set({ wellId }),
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      setCaseStyleId: (caseStyleId) => set({ caseStyleId }),
    }),
    {
      name: "lowalk-hero-appearance",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => persisted as Partial<HeroAppearanceState>,
      partialize: (state) => ({
        caseId: state.caseId,
        wellId: state.wellId,
        backgroundId: state.backgroundId,
        caseStyleId: state.caseStyleId,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeAppearance(persisted as Partial<HeroAppearanceState> | undefined),
      }),
    },
  ),
);
