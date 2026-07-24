/**
 * TRMNL hero tokens — 2-bit grayscale paper card on the dark dashboard.
 * CSS mirrors in theme/trmnl.css for NativeWind utilities.
 */

export const TRMNL_THEME = {
  bg: "#000000",
  paper: "#F4F4F0",
  border: "#FFFFFF",
  textPrimary: "#000000",
  textInverse: "#FFFFFF",
  muted: "#8E8E93",
} as const;

/** @deprecated Use TRMNL_THEME — kept for existing hero imports. */
export const HERO_EINK = {
  paper: TRMNL_THEME.paper,
  paperAlt: TRMNL_THEME.paper,
  ink: TRMNL_THEME.textPrimary,
  inkOnDark: TRMNL_THEME.textInverse,
  inkMuted: TRMNL_THEME.muted,
  rule: TRMNL_THEME.textPrimary,
  border: TRMNL_THEME.border,
  accent: TRMNL_THEME.textPrimary,
  frame: "#2F2B25",
  frameStroke: "rgba(255, 255, 255, 0.18)",
} as const;

/** Outer e-reader bezel wrapping the paper screen. */
export const HERO_EINK_FRAME_RADIUS = 28;

export const HERO_EINK_FRAME_PADDING = 8;

export const HERO_EINK_FRAME_BG = "#2F2B25";

export const HERO_EINK_FRAME_STROKE = "rgba(255, 255, 255, 0.18)";

/** Concentric inner radius — paper flush against the bezel channel. */
export const HERO_EINK_PAPER_RADIUS =
  HERO_EINK_FRAME_RADIUS - HERO_EINK_FRAME_PADDING;

/** @deprecated Use HERO_EINK_PAPER_RADIUS */
export const HERO_EINK_RADIUS = HERO_EINK_PAPER_RADIUS;

/** Pill radius for hero footer CTAs. */
export const HERO_EINK_BUTTON_RADIUS = 10;

export const HERO_EINK_BORDER_WIDTH = 2;

export const HERO_EINK_PADDING = 12;

export const HERO_EINK_FOOTER_HEIGHT = 44;

/** Two title lines (BlockKie 26×2) + divider rule. */
export const HERO_EINK_HEADER_SLOT_HEIGHT = 70;

/** Minimum middle band — verifying stack, stats grid, or subtitle. */
export const HERO_EINK_MIDDLE_MIN_HEIGHT = 96;

/** @deprecated Use HERO_EINK_MIDDLE_MIN_HEIGHT — middle slot is flex-driven in HeroCard. */
export const HERO_EINK_MIDDLE_SLOT_HEIGHT = HERO_EINK_MIDDLE_MIN_HEIGHT;

export const HERO_EINK_BODY_GAP = 0;

export const HERO_EINK_FOOTER_GAP = 12;

export const HERO_EINK_SHELL_HEIGHT =
  HERO_EINK_PADDING +
  HERO_EINK_HEADER_SLOT_HEIGHT +
  HERO_EINK_MIDDLE_MIN_HEIGHT +
  HERO_EINK_FOOTER_GAP +
  HERO_EINK_FOOTER_HEIGHT +
  HERO_EINK_PADDING;

export const HERO_EINK_OUTER_HEIGHT =
  HERO_EINK_SHELL_HEIGHT +
  HERO_EINK_FRAME_PADDING * 2 +
  HERO_EINK_BORDER_WIDTH * 2;

/** Dense vertical segments for countdown progress (see HeroCounterProgress). */
export const HERO_COUNTER_SEGMENT_COUNT = 56;

export const HERO_COUNTER_SEGMENT_HEIGHT = 22;

export const HERO_COUNTER_SEGMENT_GAP = 2;

/** Large mono digits for the active-session digital clock. */
export const HERO_DIGITAL_CLOCK_SIZE = 46;

export const HERO_DIGITAL_CLOCK_LINE_HEIGHT = 50;

export const HERO_DIGITAL_CLOCK_LETTER_SPACING = 3;

/** @deprecated Use HERO_COUNTER_* — kept for legacy imports. */
export const HERO_EINK_SEGMENT_COUNT = 5;

/** @deprecated Use HERO_COUNTER_* */
export const HERO_EINK_SEGMENT_SIZE = 10;

/** @deprecated Use HERO_COUNTER_SEGMENT_GAP */
export const HERO_EINK_SEGMENT_GAP = 6;

export const HERO_EINK_FLASH_MS = 100;

export { formatTrmnlActionLabel } from "@/lib/trmnlTypography";
