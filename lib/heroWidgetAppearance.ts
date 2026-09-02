/**
 * Neutral home-screen widget palette — light gray tile, dark text (iOS-style).
 * Colors pair with lib/widgetLayoutSpec.ts (layout sizes/margins).
 */
export const WIDGET_NEUTRAL_THEME = {
  tileBg: "#DEDEDE",
  textPrimary: "#1C1C1E",
  textMuted: "#636366",
  dateAccent: "#6B8FB8",
} as const;

export type WidgetTileAppearancePayload = {
  tileBg: string;
  textPrimary: string;
  textMuted: string;
  dateAccent: string;
};

/** @deprecated Use WidgetTileAppearancePayload */
export type HeroWidgetAppearancePayload = WidgetTileAppearancePayload;

export function buildWidgetTileAppearance(): WidgetTileAppearancePayload {
  return { ...WIDGET_NEUTRAL_THEME };
}

/** @deprecated Use buildWidgetTileAppearance */
export function buildHeroWidgetAppearance(): WidgetTileAppearancePayload {
  return buildWidgetTileAppearance();
}
