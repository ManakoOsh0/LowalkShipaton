/**
 * TRMNL Framework 3.2 tokens — Classic bundle, 1-bit defaults (ui-scale = 1).
 * @see https://trmnl.com/framework/docs/3.2/tokens
 */
import type { HeroDisplayPhase } from "@/lib/heroDisplay";

/** Framework Classic font families bundled in the app. */
export const TRMNL_FONT_CLASSIC = {
  blockKie: "BlockKie",
  nicoClean: "NicoClean-Regular",
  nicoPups: "NicoPups-Regular",
} as const;

/** Framework gap scale. */
export const TRMNL_GAP = {
  /** Hero well — tight inter-zone rhythm. */
  xxsmall: 2,
  xsmall: 5,
  small: 7,
  base: 10,
  medium: 16,
  large: 20,
  xlarge: 30,
  xxlarge: 40,
} as const;

export type TrmnlGap = keyof typeof TRMNL_GAP;

/** Value size ladder — 1-bit Classic (BlockKie / NicoClean at small tiers). */
export const TRMNL_VALUE_SIZE = {
  xxsmall: { fontSize: 16, lineHeight: 16, family: TRMNL_FONT_CLASSIC.nicoClean },
  xsmall: { fontSize: 20, lineHeight: 24, family: TRMNL_FONT_CLASSIC.nicoClean },
  small: { fontSize: 26, lineHeight: 29, family: TRMNL_FONT_CLASSIC.blockKie },
  base: { fontSize: 38, lineHeight: 42, family: TRMNL_FONT_CLASSIC.blockKie },
  large: { fontSize: 58, lineHeight: 70, family: TRMNL_FONT_CLASSIC.blockKie },
  xlarge: { fontSize: 74, lineHeight: 86, family: TRMNL_FONT_CLASSIC.blockKie },
} as const;

export type TrmnlValueSize = keyof typeof TRMNL_VALUE_SIZE;

export const TRMNL_LABEL = {
  base: {
    family: TRMNL_FONT_CLASSIC.nicoClean,
    fontSize: 16,
    lineHeight: 20,
    uppercase: true,
  },
  small: {
    family: TRMNL_FONT_CLASSIC.nicoPups,
    fontSize: 16,
    lineHeight: 16,
    uppercase: true,
  },
} as const;

export type TrmnlLabelSize = keyof typeof TRMNL_LABEL;

export const TRMNL_DESCRIPTION = {
  base: {
    family: TRMNL_FONT_CLASSIC.nicoPups,
    fontSize: 16,
    lineHeight: 16,
    uppercase: false,
  },
  large: {
    family: TRMNL_FONT_CLASSIC.nicoClean,
    fontSize: 16,
    lineHeight: 20,
    uppercase: false,
  },
} as const;

export type TrmnlDescriptionSize = keyof typeof TRMNL_DESCRIPTION;

export const TRMNL_TITLE = {
  base: {
    family: TRMNL_FONT_CLASSIC.blockKie,
    fontSize: 26,
    lineHeight: 26,
    uppercase: true,
  },
  small: {
    family: TRMNL_FONT_CLASSIC.nicoClean,
    fontSize: 16,
    lineHeight: 16,
    uppercase: true,
  },
} as const;

/** Title bar strip — compact variant for hero well. */
export const TRMNL_TITLE_BAR = {
  height: 20,
  paddingTop: 0,
  fontSize: 16,
  lineHeight: 16,
  family: TRMNL_FONT_CLASSIC.nicoClean,
  borderRadius: 10,
} as const;

/** Divider defaults to border level 6 in Framework. */
export const TRMNL_DIVIDER_LEVEL = 6;
export const TRMNL_BORDER_LEVELS = 16;

/** Maps hero journey phase → Framework value tier. */
export function resolveHeroValueSize(phase: HeroDisplayPhase): TrmnlValueSize {
  switch (phase) {
    case "session":
      return "large";
    case "travel":
    case "waiting":
    case "complete":
      return "base";
    default:
      return "base";
  }
}

/** Border level → Bayer dither density (0–1). */
export function borderLevelDensity(level: number): number {
  const clamped = Math.min(Math.max(level, 1), TRMNL_BORDER_LEVELS);
  return clamped / TRMNL_BORDER_LEVELS;
}
