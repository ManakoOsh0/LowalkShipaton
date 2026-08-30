/**
 * TRMNL Framework border/divider rendering — Bayer dither for 1-bit rails.
 * @see https://trmnl.com/framework/docs/3.2/divider
 */
import { halftoneDotVisible } from "@/lib/heroHalftone";
import {
  borderLevelDensity,
  TRMNL_DIVIDER_LEVEL,
} from "@/lib/trmnlFramework";

export type TrmnlBorderDirection = "horizontal" | "vertical";

/** Dot pitch for divider rails on mobile (logical px). */
export const TRMNL_BORDER_DOT = 2;
export const TRMNL_BORDER_DOT_GAP = 2;

export function dividerDensity(level = TRMNL_DIVIDER_LEVEL): number {
  return borderLevelDensity(level);
}

/** How many dots fit across a rail at the given length. */
export function borderDotCount(
  length: number,
  direction: TrmnlBorderDirection = "horizontal",
): number {
  const pitch = TRMNL_BORDER_DOT + TRMNL_BORDER_DOT_GAP;
  return Math.max(8, Math.floor(length / pitch));
}

/** Whether a cell in the border tile should render ink. */
export function borderDotVisible(
  index: number,
  level = TRMNL_DIVIDER_LEVEL,
): boolean {
  const density = dividerDensity(level);
  return halftoneDotVisible(0, index, density);
}
