/** Anchor — a physical location profile. Stores GPS and geofence radius only. */

export type Anchor = {
  id: string;
  name: string;
  /** Stable venue id from geocode (geo:lat,lng:name) — reuse across Focus Nodes. */
  placeId: string | null;
  formattedAddress: string | null;
  /** Map coords from Places at create time — kept after calibration for audit. */
  sourceLatitude: number;
  sourceLongitude: number;
  /** Active geofence center — starts as source coords; refined on first arrival. */
  latitude: number;
  longitude: number;
  radiusMeters: number;
  /**
   * False when coords come from Places only.
   * True after first-arrival GPS refine + radius selection.
   */
  calibrated: boolean;
};

export type AnchorInput = Omit<Anchor, "id">;
