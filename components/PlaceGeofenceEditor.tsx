/**
 * Map preview for a searched venue — drag the geofence and adjust radius before saving.
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { GeofenceMapView } from "@/components/GeofenceMapView";
import { GeofenceRadiusSelector } from "@/components/GeofenceRadiusSelector";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  buildGeocodePlaceId,
  clampGeofenceRadiusMeters,
  type AnchorRadiusPresetId,
} from "@/lib/geo";
import type { MapViewport } from "@/services/geocode";
import type { PlaceSelection } from "@/types/place";

const MAP_HEIGHT = 300;
const PLACE_MAP_ZOOM = 16;

function placeToMapViewport(place: PlaceSelection): MapViewport {
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    zoom: PLACE_MAP_ZOOM,
    label: place.name,
  };
}

type PlaceGeofenceEditorProps = {
  place: PlaceSelection;
  radiusMeters: number;
  suggestedPresetId?: AnchorRadiusPresetId;
  onPlaceChange: (place: PlaceSelection) => void;
  onRadiusChange: (radiusMeters: number) => void;
  /** Optional text-link confirm — omit on create flow (footer Create saves). */
  onConfirm?: () => void;
  confirmLabel?: string;
  /** Parent shows venue title — keeps the map step visually focused. */
  showPlaceHeader?: boolean;
};

export function PlaceGeofenceEditor({
  place,
  radiusMeters,
  suggestedPresetId,
  onPlaceChange,
  onRadiusChange,
  onConfirm,
  confirmLabel = "Use this place",
  showPlaceHeader = true,
}: PlaceGeofenceEditorProps) {
  const colors = useThemeColors();

  const mapViewport = useMemo(() => placeToMapViewport(place), [
    place.latitude,
    place.longitude,
    place.name,
  ]);

  const mapKey = useMemo(() => {
    const raw = `${place.placeId}:${place.latitude.toFixed(5)},${place.longitude.toFixed(5)}`;
    let hash = 0;
    for (let index = 0; index < raw.length; index += 1) {
      hash = (hash * 31 + raw.charCodeAt(index)) % 2_147_483_647;
    }
    return hash;
  }, [place.placeId, place.latitude, place.longitude]);

  const [mapCenter, setMapCenter] = useState({
    latitude: place.latitude,
    longitude: place.longitude,
  });

  useEffect(() => {
    setMapCenter({ latitude: place.latitude, longitude: place.longitude });
  }, [place.latitude, place.longitude]);

  const handleCenterChange = ({
    latitude,
    longitude,
  }: {
    latitude?: number;
    longitude?: number;
  }) => {
    if (latitude === undefined || longitude === undefined) return;
    setMapCenter({ latitude, longitude });
    onPlaceChange({
      ...place,
      latitude,
      longitude,
      placeId: buildGeocodePlaceId(place.name, latitude, longitude),
    });
  };

  return (
    <View style={{ gap: 12 }}>
      {showPlaceHeader ? (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 15,
              color: colors.foreground,
            }}
          >
            {place.name}
          </Text>
          {place.formattedAddress ? (
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                color: colors.muted,
              }}
            >
              {place.formattedAddress}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ height: MAP_HEIGHT, borderRadius: 14, overflow: "hidden" }}>
        <GeofenceMapView
          mode="adjustable"
          viewport={mapViewport}
          center={mapCenter}
          radiusMeters={radiusMeters}
          mapKey={mapKey}
          height={MAP_HEIGHT}
          onCenterChange={handleCenterChange}
        />
      </View>

      <GeofenceRadiusSelector
        radiusMeters={radiusMeters}
        onRadiusChange={(value) => onRadiusChange(clampGeofenceRadiusMeters(value))}
        suggestedPresetId={suggestedPresetId}
      />

      {onConfirm ? (
        <Pressable accessibilityRole="button" onPress={onConfirm} hitSlop={8}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              color: colors.primary,
              textAlign: "center",
            }}
          >
            {confirmLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
