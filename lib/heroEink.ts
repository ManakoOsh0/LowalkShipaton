/**
 * TRMNL hero tokens — soft framed paper card on the dark dashboard.
 * CSS mirrors in theme/trmnl.css for NativeWind utilities.
 */

export const TRMNL_THEME = {
  bg: "#000000",
  /** Outer hero frame — bright off-white plastic case. */
  paper: "#F0F0F0",
  /** Soft-touch case — warm matte rubber with crown-to-foot volume. */
  frameShellTop: "#F4F4F1",
  frameShellBottom: "#D8D8D4",
  border: "#FFFFFF",
  textPrimary: "#000000",
  textInverse: "#FFFFFF",
  muted: "#8E8E93",
  /** Orange accent for progress fills and verifying pulse. */
  accent: "#F26430",
  /** Inner LCD well — muted sage-olive, clearly darker than the case. */
  wellBgTop: "#C6CAC2",
  wellBgBottom: "#B4B8B0",
  /** Flat fallback for borders and single-color surfaces. */
  wellBg: "#BABEB6",
  /** Plaque on the LCD — lighter sage tint, still on-screen. */
  plaque: "#D0D4CB",
  plaqueBorder: "rgba(0, 0, 0, 0.06)",
  /** Subtle hairline when a border is still required. */
  wellBorder: "rgba(0, 0, 0, 0.1)",
  /** Muted labels on the LCD well — same ink as primary for legibility. */
  mutedOnWell: "#000000",
  /** Recessed pill controls carved into the light case rail. */
  recessed: "#E0E0E0",
  /** @deprecated Use recessed — kept for legacy imports. */
  raised: "#E0E0E0",
  /** Outer shell stroke on the dark dashboard. */
  shellStroke: "rgba(0, 0, 0, 0.06)",
  /** Split-flap panels — sage tints on the LCD well. */
  flipHours: "#D2D6CE",
  flipMinutes: "#C8CCC4",
  flipSeconds: "#BEC2BA",
  flipSeam: "rgba(0, 0, 0, 0.14)",
} as const;

/** Split-flap clock sizing for the hero active-session read. */
export const HERO_FLIP_CLOCK = {
  cardRadius: 10,
  cardHeight: 70,
  cardMinWidth: 82,
  digitSize: 40,
  digitLineHeight: 42,
  wellPadding: 8,
  cardGap: 6,
} as const;

/** Halftone travel-progress pillars — e-ink stipple along the route. */
export const HERO_HALFTONE_PROGRESS_SEGMENTS = 10;

export const HERO_HALFTONE_PILLAR = {
  width: 16,
  height: 38,
  radius: 7,
  gap: 4,
  rows: 10,
  cols: 4,
  dotSize: 2,
} as const;

/** Inset carve on well top/left (case lip meets LCD). */
export const HERO_BENTO_WELL_INSET_OPACITY = 0.32;

/** Inset rim shadow on well bottom/right — dark, not bright highlights. */
export const HERO_BENTO_WELL_INSET_BOTTOM_RIGHT_OPACITY = 0.18;

/** Raised edge highlight on the extruded outer frame shell (top/left). */
export const HERO_BENTO_FRAME_RAISED_OPACITY = 0.12;

/** Drop shadow on the extruded frame shell (bottom/right). */
export const HERO_BENTO_FRAME_SHADOW_OPACITY = 0.24;

/** Soft rubber shell — pillow AO on the outer silhouette (top/left rim). */
export const HERO_BENTO_FRAME_AMBIENT_OPACITY = 0.1;

/** Stronger bottom/right AO so the case mass sits down. */
export const HERO_BENTO_FRAME_AMBIENT_RIM_OPACITY = 0.16;

export const HERO_BENTO_FRAME_AMBIENT_EDGE = 52;

/** Wide diffuse crown — matte rubber highlight, not a sharp plastic bevel. */
export const HERO_BENTO_FRAME_CROWN_OPACITY = 0.08;

export const HERO_BENTO_FRAME_CROWN_EDGE = 24;

/** Soft case lip where rubber wraps into the LCD cutout (top/left). */
export const HERO_BENTO_FRAME_OPENING_LIP_OPACITY = 0.16;

/** Weaker wrap on the far sides of the cutout. */
export const HERO_BENTO_FRAME_OPENING_LIP_RIM_OPACITY = 0.1;

export const HERO_BENTO_FRAME_OPENING_LIP_DEPTH = 24;

/** Case lip shadow where the frame opening meets the LCD well (top/left). */
export const HERO_BENTO_WELL_BEZEL_OPACITY = 0.28;

/** Far-side well occlusion so the screen sits in the case. */
export const HERO_BENTO_WELL_BEZEL_RIM_OPACITY = 0.12;

export const HERO_BENTO_WELL_BEZEL_SIZE = 16;

/** Tight contact shadow — the case sitting on the dashboard. */
export const HERO_BENTO_FRAME_CONTACT_SHADOW =
  "0px 2px 6px rgba(0, 0, 0, 0.18)";

/** Larger ambient shadow — optical thickness in air. */
export const HERO_BENTO_FRAME_AMBIENT_SHADOW =
  "0px 14px 32px rgba(0, 0, 0, 0.16)";

/** Specular glass streak over the recessed well — keep faint for matte plastic. */
export const HERO_BENTO_GLASS_GLOSS_OPACITY = 0.02;

/** Soft top wash that sells the protective glass layer. */
export const HERO_BENTO_GLASS_WASH_OPACITY = 0.018;

/** @deprecated Use TRMNL_THEME — kept for existing hero imports. */
export const HERO_EINK = {
  paper: TRMNL_THEME.paper,
  paperAlt: TRMNL_THEME.paper,
  ink: TRMNL_THEME.textPrimary,
  inkOnDark: TRMNL_THEME.textInverse,
  inkMuted: TRMNL_THEME.muted,
  rule: TRMNL_THEME.textPrimary,
  border: TRMNL_THEME.border,
  accent: TRMNL_THEME.accent,
  frame: TRMNL_THEME.paper,
  frameStroke: TRMNL_THEME.shellStroke,
} as const;

/** Soft squircle shell — thick outer frame channel around the inner well. */
export const HERO_EINK_FRAME_RADIUS = 36;

/** Visible frame rail between outer edge and inner display well. */
/** Case rail thickness — wider bezel sells a handheld object, not a flat card. */
export const HERO_EINK_FRAME_PADDING = 16;

export const HERO_EINK_FRAME_BG = TRMNL_THEME.frameShellTop;

export const HERO_EINK_FRAME_STROKE = TRMNL_THEME.shellStroke;

/** Concentric inner radius — nested corners stay parallel (Apple continuous curve). */
export const HERO_EINK_PAPER_RADIUS = HERO_EINK_FRAME_RADIUS - HERO_EINK_FRAME_PADDING;

/** Paper plaque on the gray display well. */
export const HERO_TIMER_PLAQUE_RADIUS = 18;

/** @deprecated Use HERO_EINK_PAPER_RADIUS */
export const HERO_EINK_RADIUS = HERO_EINK_PAPER_RADIUS;

/** Full pill radius for hero footer CTAs on the outer frame rail. */
export const HERO_EINK_BUTTON_RADIUS = 999;

/** Neumorphic shell — depth from shadow pairs, not hairline strokes. */
export const HERO_EINK_BORDER_WIDTH = 0;

export const HERO_EINK_PADDING = 10;

export const HERO_EINK_FOOTER_HEIGHT = 44;

/** Meta row + rule (+ title when not compact). */
export const HERO_EINK_UP_NEXT_HEADER_BLOCK = 46;

/** Active header — meta row + rule only. */
export const HERO_EINK_ACTIVE_HEADER_BLOCK = 20;

/**
 * Body band — tallest idle layout (route + timer + intel + one upcoming row).
 */
export const HERO_EINK_UP_NEXT_BODY_HEIGHT = 190;

/** Gray display well — fixed so content math stays exact. */
export const HERO_EINK_INNER_WELL_HEIGHT =
  HERO_EINK_PADDING * 2 +
  HERO_EINK_UP_NEXT_HEADER_BLOCK +
  HERO_EINK_UP_NEXT_BODY_HEIGHT;

/** Active-session timer ring and digit sizes. */
export const HERO_ACTIVE_RING_SIZE = 64;
export const HERO_ACTIVE_TIMER_SIZE = 22;
export const HERO_ACTIVE_BLOCKED_HEIGHT = 36;

/** Route arc SVG band inside the day-route slot. */
export const HERO_ZONE_DAY_ARC_HEIGHT = 14;

/** Route arc + position label — fixed so single-session days don't jump. */
export const HERO_ZONE_ROUTE_SLOT_HEIGHT = HERO_ZONE_DAY_ARC_HEIGHT + 14;

/** Space between the titled header and the day-route position label. */
export const HERO_ROUTE_HEADER_GAP = 8;
export const HERO_ZONE_FOCUS_HEIGHT = 72;
/** @deprecated Use HERO_ZONE_FOCUS_HEIGHT */
export const HERO_ZONE_RAILS_HEIGHT = HERO_ZONE_FOCUS_HEIGHT;
/** Intel / context-rail row — label + single value line. */
export const HERO_ZONE_INTEL_HEIGHT = 28;
export const HERO_ZONE_UPCOMING_HEIGHT = 32;

/** @deprecated Use HERO_EINK_UP_NEXT_BODY_HEIGHT. */
export const HERO_EINK_MIDDLE_MIN_HEIGHT = HERO_EINK_UP_NEXT_BODY_HEIGHT;

/** @deprecated Use HERO_EINK_UP_NEXT_BODY_HEIGHT. */
export const HERO_EINK_MIDDLE_SLOT_HEIGHT = HERO_EINK_UP_NEXT_BODY_HEIGHT;

/** Single vertical rhythm between hero body zones and context stack items. */
export const HERO_EINK_BODY_GAP = 6;

/** @deprecated Use HERO_EINK_BODY_GAP */
export const HERO_CONTEXT_STACK_GAP = HERO_EINK_BODY_GAP;

export const HERO_EINK_FOOTER_GAP = 12;

/** Paper height for the canonical up_next hero card (equals inner well). */
export const HERO_EINK_STANDARD_SHELL_HEIGHT = HERO_EINK_INNER_WELL_HEIGHT;

/** Inner paper height when using the active-session compact header. */
export const HERO_EINK_ACTIVE_SHELL_HEIGHT =
  HERO_EINK_PADDING * 2 +
  HERO_EINK_ACTIVE_HEADER_BLOCK +
  HERO_EINK_UP_NEXT_BODY_HEIGHT;

/** @deprecated Tall shell with footer — hero card is fixed to up_next size instead. */
export const HERO_EINK_SHELL_HEIGHT = HERO_EINK_STANDARD_SHELL_HEIGHT;

/** Dense vertical segments for countdown progress (see HeroCounterProgress). */
export const HERO_COUNTER_SEGMENT_COUNT = 56;

export const HERO_COUNTER_SEGMENT_HEIGHT = 16;

export const HERO_COUNTER_SEGMENT_GAP = 2;

/** Session-title heading — between body copy and the metric clock scale. */
export const HERO_SESSION_HEADING_SIZE = 28;

export const HERO_SESSION_HEADING_LINE_HEIGHT = 32;

/** Idle hero copy — dominant read without clock-scale metrics. */
export const HERO_IDLE_HEADLINE_SIZE = 40;

export const HERO_IDLE_HEADLINE_LINE_HEIGHT = 44;

/** Session-complete celebration beat — trophy + secured copy inside the hero well. */
export const HERO_CELEBRATION_ICON_SIZE = 64;

export const HERO_CELEBRATION_HEADLINE_SIZE = 32;

export const HERO_CELEBRATION_HEADLINE_LINE_HEIGHT = 36;

export const HERO_CELEBRATION_BODY_SIZE = 20;

export const HERO_CELEBRATION_BODY_LINE_HEIGHT = 24;

/** Hero countdown — BlockKie display size (waiting, idle, arrived, travel). */
export const HERO_DIGITAL_CLOCK_SIZE = 50;

export const HERO_DIGITAL_CLOCK_LINE_HEIGHT = 52;

export const HERO_DIGITAL_CLOCK_LETTER_SPACING = 0;

/** Idle / walking — between title and active timer scale. */
export const HERO_DIGITAL_CLOCK_SIZE_COMPACT = 28;

export const HERO_DIGITAL_CLOCK_LINE_HEIGHT_COMPACT = 30;

/** Footer rail below the inner well (button + gap). */
export const HERO_EINK_FOOTER_RAIL_HEIGHT =
  HERO_EINK_FOOTER_HEIGHT + HERO_EINK_FRAME_PADDING;

/** Fixed gray display well inside the outer frame. */
export function getHeroInnerWellHeight(): number {
  return HERO_EINK_INNER_WELL_HEIGHT;
}

/** Body band below the header — derived from the fixed well shell. */
export function getHeroBodyHeight(isActiveHeader: boolean): number {
  const headerBlock = isActiveHeader
    ? HERO_EINK_ACTIVE_HEADER_BLOCK
    : HERO_EINK_UP_NEXT_HEADER_BLOCK;

  return (
    HERO_EINK_INNER_WELL_HEIGHT -
    HERO_EINK_PADDING * 2 -
    headerBlock
  );
}

/** Fixed outer shell height — grows when the CTA sits on the frame rail. */
export function getHeroOuterHeight(includeFooterRail = false): number {
  const base =
    HERO_EINK_INNER_WELL_HEIGHT +
    HERO_EINK_FRAME_PADDING * 2 +
    HERO_EINK_BORDER_WIDTH * 2;

  return base + (includeFooterRail ? HERO_EINK_FOOTER_RAIL_HEIGHT : 0);
}

/** @deprecated Use getHeroOuterHeight() — default shell without footer rail. */
export const HERO_EINK_OUTER_HEIGHT = getHeroOuterHeight(false);

/** @deprecated Use HERO_COUNTER_* — kept for legacy imports. */
export const HERO_EINK_SEGMENT_COUNT = 5;

/** @deprecated Use HERO_COUNTER_* */
export const HERO_EINK_SEGMENT_SIZE = 10;

/** @deprecated Use HERO_COUNTER_SEGMENT_GAP */
export const HERO_EINK_SEGMENT_GAP = 6;

export const HERO_EINK_FLASH_MS = 100;

/** Full-well invert pulse when hero state changes. */
export const HERO_EINK_REFRESH_MS = 150;

/** Soft pill CTA copy on the outer frame rail. */
export function formatSoftActionLabel(label: string): string {
  return `${label.toUpperCase()} →`;
}

export { formatTrmnlActionLabel } from "@/lib/trmnlTypography";
