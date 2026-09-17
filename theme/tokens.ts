/**
 * Lowalk design tokens — Dawn Path dark palette derived from Lowalk2 logo.
 * (charts, shadows, non-NativeWind contexts). CSS mirrors these in theme/*.css.
 */

export const colors = {
  primary: "#FF8F33",
  primaryDeep: "#FF7700",
  blue: "#9BB8D9",
  sky: "#9BB8D9",
  skyDeep: "#6B8FB8",
  green: "#3DB96E",
  success: "#3DB96E",
  warning: "#FFB84D",
  streak: "#FF8F33",
  error: "#D4847A",
  info: "#9BB8D9",
  foreground: "#F5F2ED",
  /** Brighter than muted — subtitles and secondary lines on dark cards. */
  foregroundSubtle: "#C5C0B9",
  muted: "#A39E97",
  border: "#4A4540",
  card: "#2F2B25",
  cardStroke: "rgba(255, 255, 255, 0.15)",
  iconTile: "rgba(143, 175, 212, 0.22)",
  primarySoft: "rgba(255, 143, 51, 0.14)",
  /** Neutral ring for upcoming / incomplete task indicators. */
  ring: "rgba(255, 255, 255, 0.3)",
  cardShadow: "#000000",
  surface: "#141210",
  background: "#141210",
} as const;

/** @deprecated Use `colors` — app is dark-only. */
export const darkColors = colors;

export type ThemeColors = {
  readonly primary: string;
  readonly primaryDeep: string;
  readonly blue: string;
  readonly sky: string;
  readonly skyDeep: string;
  readonly green: string;
  readonly success: string;
  readonly warning: string;
  readonly streak: string;
  readonly error: string;
  readonly info: string;
  readonly foreground: string;
  readonly foregroundSubtle: string;
  readonly muted: string;
  readonly border: string;
  readonly card: string;
  readonly cardStroke: string;
  readonly iconTile: string;
  readonly primarySoft: string;
  readonly ring: string;
  readonly cardShadow: string;
  readonly surface: string;
  readonly background: string;
};

export function getThemeColors(): ThemeColors {
  return colors;
}

export const typography = {
  h1: { size: 32, lineHeight: 1.2, weight: "bold" as const },
  h2: { size: 24, lineHeight: 1.3, weight: "semibold" as const },
  h3: { size: 20, lineHeight: 1.3, weight: "semibold" as const },
  h4: { size: 16, lineHeight: 1.4, weight: "medium" as const },
  bodyLg: { size: 16, lineHeight: 1.6, weight: "regular" as const },
  bodyMd: { size: 14, lineHeight: 1.6, weight: "regular" as const },
  bodySm: { size: 13, lineHeight: 1.6, weight: "regular" as const },
  caption: { size: 11, lineHeight: 1.4, weight: "regular" as const },
} as const;

export type ColorToken = keyof typeof colors;
export type TypographyToken = keyof typeof typography;
