import { shareScale } from "@/lib/shareOverlay";

export type ShareMapPosition = {
  /** Normalized center X (0–1) within the share canvas. */
  x: number;
  /** Normalized center Y (0–1) within the share canvas. */
  y: number;
};

export const DEFAULT_SHARE_MAP_POSITION: ShareMapPosition = { x: 0.5, y: 0.74 };

export function clampShareMapPosition(
  position: ShareMapPosition,
  canvasWidth: number,
  canvasHeight: number,
  stickerWidth: number,
  stickerHeight: number,
): ShareMapPosition {
  const halfW = stickerWidth / 2;
  const halfH = stickerHeight / 2;
  const minX = halfW / canvasWidth;
  const maxX = 1 - minX;
  const minY = halfH / canvasHeight;
  const maxY = 1 - minY;

  return {
    x: Math.min(maxX, Math.max(minX, position.x)),
    y: Math.min(maxY, Math.max(minY, position.y)),
  };
}

export function getShareMapStickerLayout(canvasWidth: number) {
  const scale = shareScale(canvasWidth);
  const cellSize = 5.5 * scale;
  const gap = 2 * scale;
  const weekCount = 12;
  const gridWidth = weekCount * cellSize + (weekCount - 1) * gap;
  const gridHeight = 7 * cellSize + 6 * gap;
  const paddingH = 12 * scale;
  const paddingV = 10 * scale;
  const labelHeight = 16 * scale;
  const labelGap = 6 * scale;

  return {
    scale,
    cellSize,
    gap,
    weekCount,
    width: gridWidth + paddingH * 2,
    height: gridHeight + paddingV * 2 + labelHeight + labelGap,
    paddingH,
    paddingV,
    labelHeight,
    labelGap,
  };
}

export function shareMapCenterToOffset(
  position: ShareMapPosition,
  canvasWidth: number,
  canvasHeight: number,
  stickerWidth: number,
  stickerHeight: number,
) {
  return {
    left: position.x * canvasWidth - stickerWidth / 2,
    top: position.y * canvasHeight - stickerHeight / 2,
  };
}
