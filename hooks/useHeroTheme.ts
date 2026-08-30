import { useMemo } from "react";

import {
  getHeroBackgroundColor,
  resolveHeroTheme,
  type HeroThemeColors,
} from "@/lib/heroAppearance";
import { useHeroAppearanceStore } from "@/store/useHeroAppearanceStore";

/** Resolved hero case + LCD colors for the current persisted swatch IDs. */
export function useHeroTheme(): HeroThemeColors {
  const caseId = useHeroAppearanceStore((state) => state.caseId);
  const wellId = useHeroAppearanceStore((state) => state.wellId);

  return useMemo(() => resolveHeroTheme(caseId, wellId), [caseId, wellId]);
}

/** Home dashboard fill from the selected background swatch. */
export function useHeroBackgroundColor(): string {
  const backgroundId = useHeroAppearanceStore((state) => state.backgroundId);
  return getHeroBackgroundColor(backgroundId);
}
