import { useMemo } from "react";

import {
  getHeroCaseStyle,
  type HeroCaseStyleTokens,
} from "@/lib/heroCaseStyle";
import { useHeroAppearanceStore } from "@/store/useHeroAppearanceStore";

/** Active case material pack (radius, lighting, lip) — independent of color. */
export function useHeroCaseStyle(): HeroCaseStyleTokens {
  const caseStyleId = useHeroAppearanceStore((state) => state.caseStyleId);
  return useMemo(() => getHeroCaseStyle(caseStyleId), [caseStyleId]);
}
