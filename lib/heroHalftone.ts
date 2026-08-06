/**
 * Hero halftone dither — Bayer stipple patterns for e-ink progress fills.
 */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

/** Returns whether a cell should render ink at the given density (0–1). */
export function halftoneDotVisible(
  row: number,
  col: number,
  density: number,
): boolean {
  if (density >= 0.98) return true;
  if (density <= 0.02) return false;
  const threshold = density * 16;
  return BAYER_4X4[row % 4]![col % 4]! < threshold;
}
