/**
 * Step 2 of Focus Node create/edit — inline venue search with recent places.
 */
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ScrollEdgeFade } from "@/components/ScrollEdgeFade";
import { FormSectionCard } from "@/components/form/FormSectionCard";
import { InlineFieldError } from "@/components/form/InlineFieldError";
import { PlaceGeofenceEditor } from "@/components/PlaceGeofenceEditor";
import { PlaceSearchCore } from "@/components/PlaceSearchCore";
import { defaultRadiusForKind, presetIdForKind } from "@/lib/geo";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { ThemeColors } from "@/theme/tokens";
import type { Anchor } from "@/types/anchor";
import type { FocusNodeKind } from "@/types/focusNode";
import type { PlaceSelection } from "@/types/place";

function placeFieldCopy(kind: FocusNodeKind): { label: string; emptyHint: string } {
  switch (kind) {
    case "gym":
      return {
        label: "Gym venue",
        emptyHint: "Virgin Active Hatfield",
      };
    case "library":
      return {
        label: "Library venue",
        emptyHint: "Merensky Library",
      };
    case "class":
      return {
        label: "Building / campus place",
        emptyHint: "IT Building",
      };
    default:
      return {
        label: "Place",
        emptyHint: "Search for a place",
      };
  }
}

function anchorToPlace(anchor: Anchor): PlaceSelection {
  const latitude = anchor.sourceLatitude ?? anchor.latitude;
  const longitude = anchor.sourceLongitude ?? anchor.longitude;

  return {
    placeId:
      anchor.placeId ??
      `geo:${latitude.toFixed(5)},${longitude.toFixed(5)}:${anchor.name.trim().toLowerCase()}`,
    name: anchor.name,
    formattedAddress: anchor.formattedAddress ?? "",
    latitude,
    longitude,
  };
}

type FocusNodeLocationStepProps = {
  kind: FocusNodeKind;
  summaryLine: string;
  selectedPlace: PlaceSelection | null;
  anchors: Anchor[];
  selectedAnchorId: string | null;
  onPlaceSelected: (place: PlaceSelection, anchorId: string) => void;
  locationError?: string;
  colors: ThemeColors;
};

export function FocusNodeLocationStep({
  kind,
  summaryLine,
  selectedPlace,
  anchors,
  selectedAnchorId,
  onPlaceSelected,
  locationError,
  colors,
}: FocusNodeLocationStepProps) {
  const resolveAnchorForPlace = useScheduleStore((state) => state.resolveAnchorForPlace);
  const placeCopy = placeFieldCopy(kind);
  const defaultRadius = defaultRadiusForKind(kind);
  const suggestedPresetId = presetIdForKind(kind);

  const [previewPlace, setPreviewPlace] = useState<PlaceSelection | null>(null);
  const [previewRadius, setPreviewRadius] = useState(defaultRadius);

  const usableAnchors = anchors
    .filter((anchor) => !(anchor.latitude === 0 && anchor.longitude === 0))
    .slice(0, 5);

  const showRecentPlaces = usableAnchors.length > 0;

  const syncPreviewToParent = (place: PlaceSelection, radius: number) => {
    const anchorId = resolveAnchorForPlace(place, radius);
    onPlaceSelected(place, anchorId);
  };

  const handlePendingPlaceChange = (place: PlaceSelection | null) => {
    setPreviewPlace(place);
    if (!place) return;
    const existing = anchors.find((anchor) => anchor.placeId === place.placeId) ?? null;
    const radius = existing?.radiusMeters ?? defaultRadius;
    setPreviewRadius(radius);
    syncPreviewToParent(place, radius);
  };

  const handlePreviewPlaceChange = (place: PlaceSelection) => {
    setPreviewPlace(place);
    syncPreviewToParent(place, previewRadius);
  };

  const handlePreviewRadiusChange = (radius: number) => {
    setPreviewRadius(radius);
    if (previewPlace) {
      syncPreviewToParent(previewPlace, radius);
    }
  };

  const handleSelectRecentAnchor = (anchor: Anchor) => {
    const place = anchorToPlace(anchor);
    syncPreviewToParent(place, anchor.radiusMeters);
  };

  const handleChangePlace = () => {
    setPreviewPlace(null);
  };

  const isAdjustingGeofence = previewPlace && !previewPlace.deferred;

  return (
    <View style={{ flex: 1, minHeight: 0, gap: 12 }}>
      {isAdjustingGeofence ? (
        <View style={{ gap: 12 }}>
          <View style={{ gap: 4 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                >
                  {previewPlace.name}
                </Text>
                {previewPlace.formattedAddress ? (
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.muted,
                    }}
                  >
                    {previewPlace.formattedAddress}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleChangePlace}
                hitSlop={8}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 14,
                    color: colors.primary,
                  }}
                >
                  Change
                </Text>
              </Pressable>
            </View>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              Drag the circle to align the fence, then pick a radius.
            </Text>
          </View>

          <PlaceGeofenceEditor
            place={previewPlace}
            radiusMeters={previewRadius}
            suggestedPresetId={suggestedPresetId}
            showPlaceHeader={false}
            onPlaceChange={handlePreviewPlaceChange}
            onRadiusChange={handlePreviewRadiusChange}
          />

          {locationError ? <InlineFieldError message={locationError} /> : null}
        </View>
      ) : (
        <ScrollEdgeFade edgeColor={colors.surface}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 20, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            nestedScrollEnabled={false}
          >
          <FormSectionCard title="Location">
            {summaryLine ? (
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                  paddingTop: 12,
                  paddingBottom: 4,
                }}
              >
                {summaryLine}
              </Text>
            ) : null}

            <View style={{ gap: 12, paddingVertical: 8 }}>
              <PlaceSearchCore
                key={previewPlace ? "search-reset" : "search"}
                initialPlace={selectedPlace}
                radiusMeters={defaultRadius}
                suggestedPresetId={suggestedPresetId}
                searchHint={placeCopy.emptyHint}
                geofenceEditor="external"
                onPendingPlaceChange={handlePendingPlaceChange}
                onSelect={(place, anchorId) => {
                  onPlaceSelected(place, anchorId);
                  setPreviewPlace(null);
                }}
              />
            </View>
          </FormSectionCard>

          {showRecentPlaces ? (
            <FormSectionCard title="Recent places">
              <View style={{ gap: 10, paddingTop: 10, paddingBottom: 14 }}>
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.muted,
                  }}
                >
                  Reuse a venue you have saved before.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {usableAnchors.map((anchor) => {
                    const selected = selectedAnchorId === anchor.id;
                    return (
                      <Pressable
                        key={anchor.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => handleSelectRecentAnchor(anchor)}
                        style={({ pressed }) => ({
                          borderRadius: 12,
                          borderCurve: "continuous",
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          backgroundColor: selected ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor: selected ? colors.primary : colors.border,
                          opacity: pressed ? 0.88 : 1,
                        })}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: "Poppins-SemiBold",
                            fontSize: 13,
                            color: selected ? "#F0EDE9" : colors.foreground,
                          }}
                        >
                          {anchor.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </FormSectionCard>
          ) : null}

          {locationError ? <InlineFieldError message={locationError} /> : null}
          </ScrollView>
        </ScrollEdgeFade>
      )}
    </View>
  );
}
