/**
 * Map-pin art from the shared 32×32 location-pin SVG (used on all sheet mascots).
 */
export const MAP_PIN_PATH =
  "M23.747,6.197C21.672,4.134,18.923,3,16,3H15.94C10.172,3.03,5.275,7.747,5.024,13.515c-0.235,5.411,2.852,10.969,8.055,14.507c0.236,0.16,0.475,0.315,0.718,0.465c0.669,0.413,1.435,0.618,2.206,0.618c0.832,0,1.669-0.239,2.399-0.715c4.134-2.696,8.583-8.354,8.583-14.404C26.984,11.04,25.834,8.274,23.747,6.197zM16,17c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S18.206,17,16,17z";

export const MAP_PIN_VIEW_SIZE = 80;

export const MAP_PIN_TRANSFORM = {
  scale: 2.4,
  tx: (MAP_PIN_VIEW_SIZE - 32 * 2.4) / 2,
  ty: 5,
} as const;

/** Inner cutout path — must match the hole subpath in MAP_PIN_PATH exactly. */
export const MAP_PIN_INNER_HOLE_PATH =
  "M16,17c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S18.206,17,16,17z";

/** Inner cutout center in source coords (path starts at bottom, center is (16,13)). */
export const MAP_PIN_INNER_HOLE = { cx: 16, cy: 13, r: 4 } as const;

function mapPinToViewBox(cx: number, cy: number) {
  return {
    cx: MAP_PIN_TRANSFORM.tx + cx * MAP_PIN_TRANSFORM.scale,
    cy: MAP_PIN_TRANSFORM.ty + cy * MAP_PIN_TRANSFORM.scale,
  };
}

const innerHoleView = mapPinToViewBox(
  MAP_PIN_INNER_HOLE.cx,
  MAP_PIN_INNER_HOLE.cy,
);

/**
 * Checkmark in pin-local coords, sized for the r=4 inner hole.
 * Slightly smaller than the hole with an up/right nudge so the
 * bottom-left vertex doesn't pull the check off-center.
 */
export const MAP_PIN_ARRIVAL_CHECK_LOCAL = (() => {
  const { cx, cy } = MAP_PIN_INNER_HOLE;
  const scale = 0.8;
  const ox = 0.12;
  const oy = -0.62;
  const x = (dx: number) => +(cx + dx * scale + ox).toFixed(3);
  const y = (dy: number) => +(cy + dy * scale + oy).toFixed(3);
  return `M${x(-2.4)} ${y(0.2)} L${x(-0.9)} ${y(1.7)} L${x(2.4)} ${y(-2)} L${x(3.4)} ${y(-1)} L${x(-0.9)} ${y(3.3)} L${x(-3.4)} ${y(0.8)}Z`;
})();

/** Radiance halo anchor behind the pin head. */
export const MAP_PIN_HALO_CY = innerHoleView.cy;

/** Pulse rings — sized to bloom past the pin head without swallowing the stem. */
export const MAP_PIN_HALO_RADIUS = 22;

export function mapPinTransformString(): string {
  const { scale, tx, ty } = MAP_PIN_TRANSFORM;
  return `translate(${tx}, ${ty}) scale(${scale})`;
}
