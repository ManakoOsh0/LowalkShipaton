/**
 * Resolved hero appearance for the Android home screen widget.
 * Colors are computed in JS so Kotlin only applies hex values from the sync bundle.
 */
import {
  getHeroBackgroundColor,
  resolveHeroTheme,
  type HeroBackgroundId,
  type HeroCaseId,
  type HeroWellId,
} from "@/lib/heroAppearance";
import {
  getHeroCaseStyle,
  getHeroStylePaperRadius,
  type HeroCaseStyleId,
} from "@/lib/heroCaseStyle";
import { HERO_EINK_FRAME_PADDING } from "@/lib/heroEink";

/** Widget scales hero radii down to fit the 4×2 cell layout. */
const WIDGET_RADIUS_SCALE = 0.72;

export type HeroWidgetAppearancePayload = {
  caseId: HeroCaseId;
  wellId: HeroWellId;
  caseStyleId: HeroCaseStyleId;
  backgroundId: HeroBackgroundId;
  dashboardBg: string;
  frameShellTop: string;
  frameShellBottom: string;
  wellBg: string;
  plaque: string;
  textPrimary: string;
  textMuted: string;
  textMutedLight: string;
  accent: string;
  frameRadiusDp: number;
  wellRadiusDp: number;
};

export function buildHeroWidgetAppearance(input: {
  caseId: HeroCaseId;
  wellId: HeroWellId;
  caseStyleId: HeroCaseStyleId;
  backgroundId: HeroBackgroundId;
}): HeroWidgetAppearancePayload {
  const theme = resolveHeroTheme(input.caseId, input.wellId);
  const style = getHeroCaseStyle(input.caseStyleId);
  const paperRadius = getHeroStylePaperRadius(style);

  return {
    caseId: input.caseId,
    wellId: input.wellId,
    caseStyleId: input.caseStyleId,
    backgroundId: input.backgroundId,
    dashboardBg: getHeroBackgroundColor(input.backgroundId),
    frameShellTop: theme.frameShellTop,
    frameShellBottom: theme.frameShellBottom,
    wellBg: theme.wellBg,
    plaque: theme.plaque,
    textPrimary: theme.textPrimary,
    textMuted: theme.mutedOnWell,
    textMutedLight: theme.muted,
    accent: theme.accent,
    frameRadiusDp: Math.max(Math.round(style.radius * WIDGET_RADIUS_SCALE), 16),
    wellRadiusDp: Math.max(Math.round(paperRadius * WIDGET_RADIUS_SCALE), 12),
  };
}
