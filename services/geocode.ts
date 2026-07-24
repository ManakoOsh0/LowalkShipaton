import * as Location from "expo-location";
import { Platform } from "react-native";

import { buildGeocodePlaceId } from "@/lib/geo";
import type { PlaceSelection, PlaceSuggestion } from "@/types/place";

type GeocodeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Ensures Android can call the OS geocoder (required by expo-location). */
async function ensureGeocodePermission(): Promise<boolean> {
  // Web has no native geocoder — Nominatim covers search there.
  if (Platform.OS === "web") return true;

  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === Location.PermissionStatus.GRANTED) return true;

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === Location.PermissionStatus.GRANTED;
}

function formatSuggestionAddress(address: Location.LocationGeocodedAddress): string {
  const parts = [
    address.street,
    address.city,
    address.region,
    address.country,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return address.formattedAddress?.trim() || parts.join(", ");
}

async function searchNative(trimmed: string): Promise<PlaceSuggestion[]> {
  if (Platform.OS === "web") return [];

  const locations = await Location.geocodeAsync(trimmed);
  if (locations.length === 0) return [];

  const limited = locations.slice(0, 6);
  const suggestions: PlaceSuggestion[] = [];

  for (const location of limited) {
    let primaryText = trimmed;
    let secondaryText = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      const address = addresses[0];
      if (address) {
        primaryText = address.name?.trim() || address.street?.trim() || trimmed;
        secondaryText = formatSuggestionAddress(address) || secondaryText;
      }
    } catch {
      // Keep coordinate fallback if reverse geocode fails.
    }

    suggestions.push({
      placeId: buildGeocodePlaceId(primaryText, location.latitude, location.longitude),
      primaryText,
      secondaryText,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }

  return suggestions;
}

/**
 * OpenStreetMap Nominatim — free POI search (gyms, libraries, campuses).
 * Used when native geocode returns nothing; better for named venues.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
async function searchNominatim(trimmed: string): Promise<PlaceSuggestion[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=0&q=` +
    encodeURIComponent(trimmed);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      // Nominatim requires a valid identifying User-Agent.
      "User-Agent": "Lowalk/1.0 (local-first focus companion; contact@lowalk.app)",
    },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as Array<{
    place_id?: number;
    display_name?: string;
    lat?: string;
    lon?: string;
    name?: string;
  }>;

  return payload
    .map((item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      const displayName = item.display_name?.trim() || trimmed;
      const primaryText =
        item.name?.trim() || displayName.split(",")[0]?.trim() || trimmed;
      const secondaryText =
        displayName === primaryText
          ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : displayName;

      return {
        placeId: buildGeocodePlaceId(primaryText, latitude, longitude),
        primaryText,
        secondaryText,
        latitude,
        longitude,
      } satisfies PlaceSuggestion;
    })
    .filter((item): item is PlaceSuggestion => item != null);
}

/**
 * Free venue search: native geocode first, then Nominatim for POIs
 * (gyms / libraries often miss native forward-geocode).
 */
export async function geocodeSearch(
  query: string,
): Promise<GeocodeResult<PlaceSuggestion[]>> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return { success: true, data: [] };
  }

  const allowed = await ensureGeocodePermission();
  if (!allowed) {
    return {
      success: false,
      error: "Location permission is required to search for places.",
    };
  }

  try {
    const nativeResults = await searchNative(trimmed);
    if (nativeResults.length > 0) {
      return { success: true, data: nativeResults };
    }

    const nominatimResults = await searchNominatim(trimmed);
    return { success: true, data: nominatimResults };
  } catch {
    try {
      const nominatimResults = await searchNominatim(trimmed);
      if (nominatimResults.length > 0) {
        return { success: true, data: nominatimResults };
      }
    } catch {
      // Fall through to error.
    }

    return {
      success: false,
      error: "Unable to search places. Try a more specific venue name.",
    };
  }
}

/** Builds a PlaceSelection from a geocode suggestion (coords already resolved). */
export function placeFromSuggestion(
  suggestion: PlaceSuggestion,
  queryFallback: string,
): PlaceSelection {
  return {
    placeId: suggestion.placeId,
    name: suggestion.primaryText || queryFallback.trim(),
    formattedAddress: suggestion.secondaryText,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
  };
}

/** Suggested map viewport when centering the drop-pin map on a search or area query. */
export type MapViewport = {
  latitude: number;
  longitude: number;
  zoom: number;
  label?: string;
};

/** Minimum Leaflet zoom before the user may confirm a crosshair pin. */
export const MIN_PIN_CONFIRM_ZOOM = 16;

/** Soft distance check — confirm if the pin is farther than this from coarse GPS. */
export const FAR_PIN_DISTANCE_METERS = 80_000;

/**
 * Centers the drop-pin map near a failed venue search — viewport only, never auto-places the pin.
 * Nominatim is tried first so map panning works even without device GPS permission.
 */
export async function geocodeMapCenter(query: string): Promise<MapViewport | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return null;

  const nominatimResults = await searchNominatim(trimmed);
  if (nominatimResults.length > 0) {
    const first = nominatimResults[0];
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      zoom: 14,
      label: first.secondaryText,
    };
  }

  const allowed = await ensureGeocodePermission();
  if (!allowed) return null;

  const nativeResults = await searchNative(trimmed);
  if (nativeResults.length === 0) return null;

  const first = nativeResults[0];
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    zoom: 14,
    label: first.secondaryText,
  };
}

async function reverseNominatim(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Lowalk/1.0 (local-first focus companion; contact@lowalk.app)",
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { display_name?: string };
    return payload.display_name?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Human-readable label for a map coordinate — native reverse geocode, then Nominatim.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  if (Platform.OS !== "web") {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addresses[0];
      if (address) {
        const formatted = formatSuggestionAddress(address);
        if (formatted) return formatted;
      }
    } catch {
      // Fall through to Nominatim.
    }
  }

  return reverseNominatim(latitude, longitude);
}
