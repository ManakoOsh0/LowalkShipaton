import type { Anchor } from "@/types/anchor";
import type { FocusNodeKind } from "@/types/focusNode";

/** Earth radius in meters — used by Haversine distance checks for geofencing. */
const EARTH_RADIUS_M = 6_371_000;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** PRODUCT.md radius presets — used for optional calibration fine-tune. */
export const ANCHOR_RADIUS_PRESETS = [
  { id: "small_room", label: "Small Room", description: "15–20m", radiusMeters: 18 },
  { id: "classroom", label: "Classroom", description: "25–35m", radiusMeters: 30 },
  { id: "library", label: "Library Floor", description: "40–50m", radiusMeters: 45 },
  { id: "large_gym", label: "Large Gym / Building", description: "50–75m", radiusMeters: 60 },
] as const;

export type AnchorRadiusPresetId = (typeof ANCHOR_RADIUS_PRESETS)[number]["id"];

/** Sane bounds for user-chosen geofence radius at venue pick time. */
export const MIN_GEOFENCE_RADIUS_METERS = 10;
export const MAX_GEOFENCE_RADIUS_METERS = 150;

export function clampGeofenceRadiusMeters(radiusMeters: number): number {
  if (!Number.isFinite(radiusMeters)) return MIN_GEOFENCE_RADIUS_METERS;
  return Math.min(
    MAX_GEOFENCE_RADIUS_METERS,
    Math.max(MIN_GEOFENCE_RADIUS_METERS, Math.round(radiusMeters)),
  );
}

/** Suggested preset chip for GeofenceRadiusSelector based on Focus Node kind. */
export function presetIdForKind(kind: FocusNodeKind): AnchorRadiusPresetId {
  switch (kind) {
    case "gym":
      return "large_gym";
    case "library":
      return "library";
    case "class":
      return "classroom";
    case "custom":
    default:
      return "classroom";
  }
}

/** If a new GPS point is within this distance of an Anchor, offer reuse. */
export const NEARBY_ANCHOR_MATCH_METERS = 50;

/** Max map drag from the on-site GPS capture — seat fine-tune only, not relocation. */
export const MAX_CALIBRATION_MAP_NUDGE_METERS = 50;

/**
 * Max distance from the venue pin (source coords) for calibration capture/save.
 * Covers large-building presets (up to 150m radius) with margin for GPS offset.
 */
export const MAX_CALIBRATION_DRIFT_FROM_SOURCE_METERS = 175;

/** Seconds inside the geofence before a session may start — brief presence verification. */
export const PRESENCE_VERIFICATION_SECONDS = 5;

/**
 * Reject GPS fixes worse than this during presence verification so indoor bounce
 * does not auto-start a session from a fuzzy pin hundreds of metres away.
 */
export const MAX_PRESENCE_ACCURACY_METERS = 50;

/**
 * Active-session pause/resume — wider exit threshold + debounce in useSessionPresenceEngine
 * so GPS jitter at the geofence edge doesn't flip Hero state every poll.
 */
export const GEOFENCE_EXIT_BUFFER_METERS = 15;
export const SESSION_GEOFENCE_PAUSE_SECONDS = 6;
export const SESSION_GEOFENCE_RESUME_SECONDS = 3;

/** Kind-based default geofence when saving a searched venue at home. */
export function defaultRadiusForKind(kind: FocusNodeKind): number {
  switch (kind) {
    case "gym":
      return 60;
    case "library":
      return 45;
    case "class":
      return 30;
    case "custom":
    default:
      return 30;
  }
}

/** Stable local identity for geocoded venues (no Google place id). */
export function buildGeocodePlaceId(
  name: string,
  latitude: number,
  longitude: number,
): string {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  return `geo:${latitude.toFixed(5)},${longitude.toFixed(5)}:${normalized}`;
}

/** Named venue saved at home without coords — GPS captured on first arrival. */
export function buildDeferredPlaceId(name: string): string {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  return `deferred:${normalized}`;
}

/** Free OSM static pin preview — no API key. */
export function getOpenStreetMapPreviewUrl(latitude: number, longitude: number): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=16&size=600x300&markers=${latitude},${longitude},lightblue`;
}

/**
 * Haversine great-circle distance between two GPS points.
 * Returns meters — predictable boundary for inside/outside geofence checks.
 */
export function haversineDistanceMeters(
  pointA: Coordinates,
  pointB: Coordinates,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(pointB.latitude - pointA.latitude);
  const dLon = toRad(pointB.longitude - pointA.longitude);
  const lat1 = toRad(pointA.latitude);
  const lat2 = toRad(pointB.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** False for deferred anchors (0,0) saved when search couldn't find a venue. */
export function hasUsableCoordinates(
  anchor: Pick<Anchor, "latitude" | "longitude">,
): boolean {
  return (
    Number.isFinite(anchor.latitude) &&
    Number.isFinite(anchor.longitude) &&
    !(anchor.latitude === 0 && anchor.longitude === 0)
  );
}

/** True when the anchor still has a real venue pin from search or map drop. */
export function hasUsableSourceCoordinates(
  anchor: Pick<Anchor, "sourceLatitude" | "sourceLongitude">,
): boolean {
  return hasUsableCoordinates({
    latitude: anchor.sourceLatitude,
    longitude: anchor.sourceLongitude,
  });
}

/** Clamp a point to at most `maxMeters` from `origin` (small-offset map nudges). */
export function clampCoordinatesWithinMeters(
  origin: Coordinates,
  point: Coordinates,
  maxMeters: number,
): Coordinates {
  const distance = haversineDistanceMeters(origin, point);
  if (distance <= maxMeters) return point;

  const ratio = maxMeters / distance;
  return {
    latitude: origin.latitude + (point.latitude - origin.latitude) * ratio,
    longitude: origin.longitude + (point.longitude - origin.longitude) * ratio,
  };
}

/**
 * On-site checks for hold-to-capture GPS before calibration can continue.
 * Deferred anchors (0,0) skip venue checks until the first capture is saved.
 */
export function validateCalibrationCapture(
  anchor: Anchor,
  captured: Coordinates,
): string | null {
  if (!hasUsableCoordinates(anchor)) return null;

  if (anchor.calibrated && !isInsideGeofence(captured, anchor)) {
    return "Move into your focus zone to calibrate. Your GPS must be inside the current geofence.";
  }

  if (hasUsableSourceCoordinates(anchor)) {
    const fromSource = haversineDistanceMeters(captured, {
      latitude: anchor.sourceLatitude,
      longitude: anchor.sourceLongitude,
    });
    if (fromSource > MAX_CALIBRATION_DRIFT_FROM_SOURCE_METERS) {
      return "You're too far from the scheduled venue to calibrate. Go to your focus location first.";
    }
  }

  return null;
}

/** Validates proposed geofence center against capture + venue pin before persisting. */
export function validateCalibrationSave(
  anchor: Anchor,
  captured: Coordinates,
  proposed: Coordinates,
): string | null {
  const captureError = validateCalibrationCapture(anchor, captured);
  if (captureError) return captureError;

  const nudge = haversineDistanceMeters(captured, proposed);
  if (nudge > MAX_CALIBRATION_MAP_NUDGE_METERS) {
    return `Keep the pin within ${MAX_CALIBRATION_MAP_NUDGE_METERS}m of where you stood — only fine-tune your seat.`;
  }

  if (hasUsableSourceCoordinates(anchor)) {
    const fromSource = haversineDistanceMeters(proposed, {
      latitude: anchor.sourceLatitude,
      longitude: anchor.sourceLongitude,
    });
    if (fromSource > MAX_CALIBRATION_DRIFT_FROM_SOURCE_METERS) {
      return "This spot is too far from your venue. Calibrate only near where you study or train.";
    }
  }

  return null;
}

/** True when the user coordinate lies within the Anchor's geofence radius. */
export function isInsideGeofence(
  user: Coordinates,
  anchor: Pick<Anchor, "latitude" | "longitude" | "radiusMeters">,
): boolean {
  // Presence uses searched coords immediately — calibration is optional fine-tune only.
  if (!hasUsableCoordinates(anchor)) return false;

  const distance = haversineDistanceMeters(user, {
    latitude: anchor.latitude,
    longitude: anchor.longitude,
  });

  return distance <= anchor.radiusMeters;
}

function distanceToAnchorCenterMeters(
  user: Coordinates,
  anchor: Pick<Anchor, "latitude" | "longitude">,
): number {
  return haversineDistanceMeters(user, {
    latitude: anchor.latitude,
    longitude: anchor.longitude,
  });
}

/** Strict inside check — used to resume an active session after a confirmed leave. */
export function isInsideGeofenceForSessionResume(
  user: Coordinates,
  anchor: Pick<Anchor, "latitude" | "longitude" | "radiusMeters">,
): boolean {
  if (!hasUsableCoordinates(anchor)) return false;
  return distanceToAnchorCenterMeters(user, anchor) <= anchor.radiusMeters;
}

/**
 * Must be clearly outside the boundary before pausing — hysteresis gap between
 * this threshold and isInsideGeofenceForSessionResume reduces edge flicker.
 */
export function isOutsideGeofenceForSessionPause(
  user: Coordinates,
  anchor: Pick<Anchor, "latitude" | "longitude" | "radiusMeters">,
): boolean {
  if (!hasUsableCoordinates(anchor)) return true;
  return (
    distanceToAnchorCenterMeters(user, anchor) >
    anchor.radiusMeters + GEOFENCE_EXIT_BUFFER_METERS
  );
}

/**
 * Straight-line meters outside the geofence edge (0 when already inside).
 * Used for walking Hero copy — not turn-by-turn routing.
 */
export function distanceOutsideGeofenceMeters(
  user: Coordinates,
  anchor: Pick<Anchor, "latitude" | "longitude" | "radiusMeters">,
): number | null {
  if (!hasUsableCoordinates(anchor)) return null;

  const toCenter = haversineDistanceMeters(user, {
    latitude: anchor.latitude,
    longitude: anchor.longitude,
  });

  return Math.max(0, toCenter - anchor.radiusMeters);
}

/** Coarse label so GPS jitter doesn’t make the Hero bounce every meter. */
export function formatDistanceAwayLabel(meters: number): string {
  if (meters <= 15) return "Almost there — step into the boundary";

  if (meters < 100) {
    const rounded = Math.max(10, Math.round(meters / 10) * 10);
    return `About ${rounded}m away`;
  }

  if (meters < 1000) {
    const rounded = Math.round(meters / 50) * 50;
    return `About ${rounded}m away`;
  }

  const km = Math.round(meters / 100) / 10;
  return `About ${km} km away`;
}

/** Finds the closest Anchor within the match threshold, if any. */
export function findNearbyAnchor(
  anchors: Anchor[],
  position: Coordinates,
  maxDistanceMeters = NEARBY_ANCHOR_MATCH_METERS,
  options?: { preferPlaceId?: string | null; excludeAnchorId?: string },
): Anchor | null {
  const { preferPlaceId, excludeAnchorId } = options ?? {};

  if (preferPlaceId) {
    const samePlace = anchors.find(
      (anchor) =>
        anchor.placeId === preferPlaceId &&
        hasUsableCoordinates(anchor) &&
        anchor.id !== excludeAnchorId,
    );
    if (samePlace) return samePlace;
  }

  let closest: Anchor | null = null;
  let closestDistance = Infinity;

  for (const anchor of anchors) {
    if (!hasUsableCoordinates(anchor) || anchor.id === excludeAnchorId) continue;

    const distance = haversineDistanceMeters(position, {
      latitude: anchor.latitude,
      longitude: anchor.longitude,
    });

    if (distance <= maxDistanceMeters && distance < closestDistance) {
      closest = anchor;
      closestDistance = distance;
    }
  }

  return closest;
}

export function resolveAnchorForNode(
  anchorId: string | null,
  anchors: Anchor[],
): Anchor | null {
  if (!anchorId) return null;
  return anchors.find((anchor) => anchor.id === anchorId) ?? null;
}
