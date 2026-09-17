/**
 * Curated hero look swatches and contrast-safe theme resolution.
 * Case, LCD well, and home background are independent; ink is derived from luminance.
 */
import { TRMNL_THEME } from "@/lib/heroEink";

export const DEFAULT_HERO_CASE_ID = "paper" as const;
export const DEFAULT_HERO_WELL_ID = "sage" as const;
export const DEFAULT_HERO_BACKGROUND_ID = "dawn" as const;

export type HeroCaseSwatch = {
  id: string;
  label: string;
  top: string;
  bottom: string;
  recessed: string;
};

export type HeroWellSwatch = {
  id: string;
  label: string;
  top: string;
  bottom: string;
};

export type HeroBackgroundSwatch = {
  id: string;
  label: string;
  color: string;
};

export const HERO_CASE_SWATCHES = [
  {
    id: DEFAULT_HERO_CASE_ID,
    label: "Paper",
    top: TRMNL_THEME.frameShellTop,
    bottom: TRMNL_THEME.frameShellBottom,
    recessed: TRMNL_THEME.recessed,
  },
  {
    id: "graphite",
    label: "Graphite",
    top: "#6B6B6E",
    bottom: "#5A5A5D",
    recessed: "#4F4F52",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    top: "#2C2C2E",
    bottom: "#1C1C1E",
    recessed: "#161618",
  },
  {
    id: "sage",
    label: "Sage",
    top: "#A8B5A0",
    bottom: "#8F9C88",
    recessed: "#819078",
  },
  {
    id: "sky",
    label: "Sky",
    top: "#8FB4C9",
    bottom: "#6F98B0",
    recessed: "#5E879C",
  },
  {
    id: "blush",
    label: "Blush",
    top: "#E8C4C0",
    bottom: "#D4A8A4",
    recessed: "#C89894",
  },
  {
    id: "orange",
    label: "Orange",
    top: "#E8894A",
    bottom: "#D47232",
    recessed: "#C46628",
  },
  {
    id: "cream",
    label: "Cream",
    top: "#F5E6C8",
    bottom: "#E8D4A8",
    recessed: "#DCC898",
  },
] as const satisfies readonly HeroCaseSwatch[];

export const HERO_WELL_SWATCHES = [
  {
    id: DEFAULT_HERO_WELL_ID,
    label: "Sage",
    top: TRMNL_THEME.wellBgTop,
    bottom: TRMNL_THEME.wellBgBottom,
  },
  {
    id: "paper",
    label: "Paper",
    top: "#E8E8E4",
    bottom: "#D8D8D4",
  },
  {
    id: "slate",
    label: "Slate",
    top: "#9AA3A8",
    bottom: "#868F94",
  },
  {
    id: "olive",
    label: "Olive",
    top: "#B5B89A",
    bottom: "#A3A688",
  },
  {
    id: "ink",
    label: "Ink",
    top: "#2A2A28",
    bottom: "#1A1A18",
  },
  {
    id: "sand",
    label: "Sand",
    top: "#D4C8B0",
    bottom: "#C4B89E",
  },
  {
    id: "cool",
    label: "Cool",
    top: "#C5CDD4",
    bottom: "#B3BBC2",
  },
  {
    id: "matcha",
    label: "Matcha",
    top: "#C5D4B8",
    bottom: "#B3C4A4",
  },
] as const satisfies readonly HeroWellSwatch[];

export const HERO_BACKGROUND_SWATCHES = [
  {
    id: DEFAULT_HERO_BACKGROUND_ID,
    label: "Dawn",
    color: "#141210",
  },
  {
    id: "black",
    label: "Black",
    color: "#000000",
  },
  {
    id: "espresso",
    label: "Espresso",
    color: "#1C1612",
  },
  {
    id: "navy",
    label: "Navy",
    color: "#12141C",
  },
  {
    id: "forest",
    label: "Forest",
    color: "#121612",
  },
  {
    id: "plum",
    label: "Plum",
    color: "#18141A",
  },
  {
    id: "slate",
    label: "Slate",
    color: "#16181C",
  },
] as const satisfies readonly HeroBackgroundSwatch[];

export type HeroCaseId = (typeof HERO_CASE_SWATCHES)[number]["id"];
export type HeroWellId = (typeof HERO_WELL_SWATCHES)[number]["id"];
export type HeroBackgroundId = (typeof HERO_BACKGROUND_SWATCHES)[number]["id"];

/** Resolved hero palette — same fields as TRMNL_THEME plus case-rail ink. */
export type HeroThemeColors = {
  bg: string;
  paper: string;
  frameShellTop: string;
  frameShellBottom: string;
  border: string;
  textPrimary: string;
  textInverse: string;
  muted: string;
  accent: string;
  wellBgTop: string;
  wellBgBottom: string;
  wellBg: string;
  plaque: string;
  plaqueBorder: string;
  wellBorder: string;
  mutedOnWell: string;
  recessed: string;
  raised: string;
  shellStroke: string;
  flipHours: string;
  flipMinutes: string;
  flipSeconds: string;
  flipSeam: string;
  inkOnCase: string;
  mutedOnCase: string;
};

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean.slice(0, 6);
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function toHex({ r, g, b }: Rgb): string {
  const clamp = (channel: number) =>
    Math.round(Math.min(255, Math.max(0, channel)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

function mixHex(from: string, to: string, amount: number): string {
  const start = parseHex(from);
  const end = parseHex(to);
  return toHex({
    r: start.r + (end.r - start.r) * amount,
    g: start.g + (end.g - start.g) * amount,
    b: start.b + (end.b - start.b) * amount,
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const linear = [r, g, b].map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function isLightSurface(hex: string): boolean {
  return relativeLuminance(hex) > 0.45;
}

function contrastInk(background: string): {
  primary: string;
  inverse: string;
  muted: string;
} {
  if (isLightSurface(background)) {
    return { primary: "#000000", inverse: "#FFFFFF", muted: "#000000" };
  }
  return { primary: "#FFFFFF", inverse: "#000000", muted: "#D4D4D4" };
}

/** Contrast-safe ink for flat widget tiles on the hero dashboard background. */
export function getContrastInkForHex(hex: string): {
  primary: string;
  muted: string;
  inverse: string;
} {
  return contrastInk(hex);
}

export function isHeroCaseId(value: string): value is HeroCaseId {
  return HERO_CASE_SWATCHES.some((swatch) => swatch.id === value);
}

export function isHeroWellId(value: string): value is HeroWellId {
  return HERO_WELL_SWATCHES.some((swatch) => swatch.id === value);
}

export function isHeroBackgroundId(value: string): value is HeroBackgroundId {
  return HERO_BACKGROUND_SWATCHES.some((swatch) => swatch.id === value);
}

export function getHeroCaseSwatch(id: string): HeroCaseSwatch {
  return (
    HERO_CASE_SWATCHES.find((swatch) => swatch.id === id) ?? HERO_CASE_SWATCHES[0]
  );
}

export function getHeroWellSwatch(id: string): HeroWellSwatch {
  return (
    HERO_WELL_SWATCHES.find((swatch) => swatch.id === id) ?? HERO_WELL_SWATCHES[0]
  );
}

export function getHeroBackgroundSwatch(id: string): HeroBackgroundSwatch {
  return (
    HERO_BACKGROUND_SWATCHES.find((swatch) => swatch.id === id) ??
    HERO_BACKGROUND_SWATCHES[0]
  );
}

export function getHeroBackgroundColor(id: string): string {
  return getHeroBackgroundSwatch(id).color;
}

/** Mid-tone well color — matches the hero card LCD screen fill. */
export function getHeroWellColor(id: string): string {
  const well = getHeroWellSwatch(id);
  return mixHex(well.top, well.bottom, 0.5);
}

/** Build a full hero palette from independently chosen case and well swatches. */
export function resolveHeroTheme(caseId: string, wellId: string): HeroThemeColors {
  const caseSwatch = getHeroCaseSwatch(caseId);
  const wellSwatch = getHeroWellSwatch(wellId);
  const wellMid = mixHex(wellSwatch.top, wellSwatch.bottom, 0.5);
  const wellInk = contrastInk(wellMid);
  const caseInk = contrastInk(caseSwatch.top);
  const wellIsLight = isLightSurface(wellMid);
  const caseIsLight = isLightSurface(caseSwatch.top);
  const plaque = mixHex(wellMid, wellInk.inverse, wellIsLight ? 0.22 : 0.18);
  const paper = mixHex(wellMid, wellInk.inverse, wellIsLight ? 0.4 : 0.28);

  return {
    bg: TRMNL_THEME.bg,
    paper,
    frameShellTop: caseSwatch.top,
    frameShellBottom: caseSwatch.bottom,
    border: wellInk.inverse,
    textPrimary: wellInk.primary,
    textInverse: wellInk.inverse,
    muted: wellInk.muted,
    accent: TRMNL_THEME.accent,
    wellBgTop: wellSwatch.top,
    wellBgBottom: wellSwatch.bottom,
    wellBg: wellMid,
    plaque,
    plaqueBorder: hexToRgba(wellInk.primary, wellIsLight ? 0.06 : 0.1),
    wellBorder: hexToRgba(wellInk.primary, wellIsLight ? 0.1 : 0.16),
    mutedOnWell: wellInk.muted,
    recessed: caseSwatch.recessed,
    raised: caseSwatch.recessed,
    shellStroke: hexToRgba(caseIsLight ? "#000000" : "#FFFFFF", caseIsLight ? 0.06 : 0.1),
    flipHours: mixHex(wellMid, wellInk.inverse, 0.16),
    flipMinutes: mixHex(wellMid, wellInk.inverse, 0.12),
    flipSeconds: mixHex(wellMid, wellInk.primary, 0.06),
    flipSeam: hexToRgba(wellInk.primary, wellIsLight ? 0.14 : 0.22),
    inkOnCase: caseInk.primary,
    mutedOnCase: caseInk.muted,
  };
}
