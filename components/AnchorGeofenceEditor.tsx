/**
 * Editable geofence map for on-site anchoring — drag center and adjust radius before saving.
 */
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { GeofenceMapView } from "@/components/GeofenceMapView";
import { GeofenceRadiusSelector } from "@/components/GeofenceRadiusSelector";
import {
  clampGeofenceRadiusMeters,
  type AnchorRadiusPresetId,
} from "@/lib/geo";
import type { MapViewport } from "@/services/geocode";

const MAP_HEIGHT = 260;
const ANCHOR_MAP_ZOOM = 17;

type AnchorGeofenceEditorProps = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  anchorName: string;
  suggestedPresetId?: AnchorRadiusPresetId;
  onCenterChange: (coords: { latitude: number; longitude: number }) => void;
  onRadiusChange: (radiusMeters: number) => void;
};

export function AnchorGeofenceEditor({
  latitude,
  longitude,
  radiusMeters,
  anchorName,
  suggestedPresetId,
  onCenterChange,
  onRadiusChange,
}: AnchorGeofenceEditorProps) {
  const mapViewport = useMemo<MapViewport>(
    () => ({
      latitude,
      longitude,
      zoom: ANCHOR_MAP_ZOOM,
      label: anchorName,
    }),
    [anchorName, latitude, longitude],
  );

  const mapKey = useMemo(() => {
    const raw = `${anchorName}:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    let hash = 0;
    for (let index = 0; index < raw.length; index += 1) {
      hash = (hash * 31 + raw.charCodeAt(index)) % 2_147_483_647;
    }
    return hash;
  }, [anchorName, latitude, longitude]);

  const [mapCenter, setMapCenter] = useState({ latitude, longitude });

  useEffect(() => {
    setMapCenter({ latitude, longitude });
  }, [latitude, longitude]);

  const handleCenterChange = ({
    latitude: nextLat,
    longitude: nextLng,
  }: {
    latitude?: number;
    longitude?: number;
  }) => {
    if (nextLat === undefined || nextLng === undefined) return;
    setMapCenter({ latitude: nextLat, longitude: nextLng });
    onCenterChange({ latitude: nextLat, longitude: nextLng });
  };

  return (
    <View style={{ gap: 12 }}>
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
    </View>
  );
}
