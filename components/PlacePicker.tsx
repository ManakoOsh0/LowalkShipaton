/**
 * Place picker — free geocode search for Focus Node creation at home.
 * Fallbacks when search fails: drop a pin on the venue map, or set GPS on first arrival.
 * Never uses the user's current (home) GPS as the venue pin.
 */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  GeofenceMapView,
  type GeofenceMapCenter,
  type GeofenceMapViewHandle,
} from "@/components/GeofenceMapView";
import { GeofenceRadiusSelector } from "@/components/GeofenceRadiusSelector";
import { MapPinPicker } from "@/components/MapPinPicker";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  buildDeferredPlaceId,
  buildGeocodePlaceId,
  clampGeofenceRadiusMeters,
  type AnchorRadiusPresetId,
} from "@/lib/geo";
import { geocodeSearch, placeFromSuggestion, type MapViewport } from "@/services/geocode";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { PlaceSelection, PlaceSuggestion } from "@/types/place";

type PlacePickerProps = {
  visible: boolean;
  initialPlace: PlaceSelection | null;
  /** Kind-based default geofence radius applied when saving the Anchor. */
  radiusMeters: number;
  suggestedPresetId?: AnchorRadiusPresetId;
  /** Example query shown in the search field hint. */
  searchHint?: string;
  onClose: () => void;
  onSelect: (place: PlaceSelection, anchorId: string) => void;
};

type FallbackMode = "none" | "defer";

const PREVIEW_MAP_ZOOM = 16;
const PREVIEW_MAP_HEIGHT = 280;

function placeToMapViewport(place: PlaceSelection): MapViewport {
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    zoom: PREVIEW_MAP_ZOOM,
  };
}

export function PlacePicker({
  visible,
  initialPlace,
  radiusMeters,
  suggestedPresetId,
  searchHint = "e.g. Virgin Active Hatfield",
  onClose,
  onSelect,
}: PlacePickerProps) {
  const colors = useThemeColors();
  const anchors = useScheduleStore((state) => state.anchors);
  const resolveAnchorForPlace = useScheduleStore((state) => state.resolveAnchorForPlace);
  const previewMapRef = useRef<GeofenceMapViewHandle>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlace, setPendingPlace] = useState<PlaceSelection | null>(initialPlace);
  const pendingPlaceRef = useRef(pendingPlace);
  pendingPlaceRef.current = pendingPlace;
  const [selectedRadiusMeters, setSelectedRadiusMeters] = useState(() =>
    clampGeofenceRadiusMeters(radiusMeters),
  );
  const [searchedEmpty, setSearchedEmpty] = useState(false);
  const [pinPickerVisible, setPinPickerVisible] = useState(false);
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>("none");
  const [deferredName, setDeferredName] = useState("");
  const [previewMapKey, setPreviewMapKey] = useState(0);
  const [mapInitialViewport, setMapInitialViewport] = useState<MapViewport | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPendingPlace(initialPlace);
    setQuery(initialPlace?.name ?? "");
    setSelectedRadiusMeters(clampGeofenceRadiusMeters(radiusMeters));
    setSuggestions([]);
    setError(null);
    setSearchedEmpty(false);
    setPinPickerVisible(false);
    setFallbackMode("none");
    setDeferredName("");
    setMapInitialViewport(
      initialPlace && !initialPlace.deferred ? placeToMapViewport(initialPlace) : null,
    );
    setPreviewMapKey((key) => key + 1);
  }, [visible, initialPlace, radiusMeters]);

  const runSearch = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setError(null);
      setSearchedEmpty(false);
      return;
    }

    setIsSearching(true);
    setFallbackMode("none");
    const result = await geocodeSearch(trimmed);
    setIsSearching(false);

    if (!result.success) {
      setError(result.error);
      setSuggestions([]);
      setSearchedEmpty(true);
      return;
    }

    setError(null);
    setSuggestions(result.data);
    setSearchedEmpty(result.data.length === 0);
    if (result.data.length === 0) {
      setError("No places found. Try a more specific name, or use a fallback below.");
    }
  };

  useEffect(() => {
    if (!visible) return;

    const trimmed = query.trim();
    if (trimmed.length < 3 || pendingPlace?.name === trimmed) {
      return;
    }

    const timeout = setTimeout(() => {
      void runSearch(trimmed);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query, visible]);

  const existingAnchor = pendingPlace
    ? anchors.find((anchor) => anchor.placeId === pendingPlace.placeId) ?? null
    : null;

  const displayRadiusMeters = existingAnchor?.radiusMeters ?? selectedRadiusMeters;

  const showPreviewMap = Boolean(pendingPlace && !pendingPlace.deferred && mapInitialViewport);

  // Fly the preview map only when the viewport target changes — not when the user drags the geofence.
  useEffect(() => {
    if (!showPreviewMap || !mapInitialViewport) return;
    previewMapRef.current?.flyTo(mapInitialViewport);
    const place = pendingPlaceRef.current;
    if (place && !existingAnchor) {
      previewMapRef.current?.setCenter(place.latitude, place.longitude);
    }
  }, [mapInitialViewport, showPreviewMap, existingAnchor?.id]);

  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    const place = placeFromSuggestion(suggestion, query);
    setPendingPlace(place);
    setSelectedRadiusMeters(clampGeofenceRadiusMeters(radiusMeters));
    setQuery(place.name);
    setSuggestions([]);
    setError(null);
    setSearchedEmpty(false);
    setFallbackMode("none");
    setMapInitialViewport(placeToMapViewport(place));
  };

  const handlePreviewCenterChange = (center: GeofenceMapCenter) => {
    if (existingAnchor) return;
    setPendingPlace((prev) => {
      if (!prev || prev.deferred) return prev;
      return {
        ...prev,
        latitude: center.latitude,
        longitude: center.longitude,
        placeId: buildGeocodePlaceId(prev.name, center.latitude, center.longitude),
      };
    });
  };

  const finishWithPlace = (place: PlaceSelection, confirmRadius: number) => {
    const anchorId = resolveAnchorForPlace(place, clampGeofenceRadiusMeters(confirmRadius));
    onSelect(place, anchorId);
    onClose();
  };

  const handleConfirm = () => {
    if (!pendingPlace) return;
    const confirmRadius = existingAnchor?.radiusMeters ?? selectedRadiusMeters;
    finishWithPlace(pendingPlace, confirmRadius);
  };

  const handlePinConfirm = (place: PlaceSelection, pinRadius: number) => {
    setPendingPlace(place);
    setSelectedRadiusMeters(clampGeofenceRadiusMeters(pinRadius));
    setQuery(place.name);
    setSuggestions([]);
    setSearchedEmpty(false);
    setError(null);
    setPinPickerVisible(false);
    setMapInitialViewport(placeToMapViewport(place));
  };

  const handleDeferredConfirm = () => {
    const trimmed = deferredName.trim() || query.trim();
    if (!trimmed) {
      setError("Enter a name for this venue first.");
      return;
    }

    finishWithPlace(
      {
        placeId: buildDeferredPlaceId(trimmed),
        name: trimmed,
        formattedAddress: "Location will be set when you arrive",
        latitude: 0,
        longitude: 0,
        deferred: true,
      },
      selectedRadiusMeters,
    );
  };

  const showFallbacks =
    searchedEmpty || fallbackMode !== "none" || (!pendingPlace && query.trim().length >= 3);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 20,
              color: colors.foreground,
            }}
          >
            Choose a place
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 15,
                color: colors.primary,
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>

        {showPreviewMap && mapInitialViewport && pendingPlace ? (
          <View
            style={{
              height: PREVIEW_MAP_HEIGHT,
              marginHorizontal: 16,
              marginBottom: 8,
            }}
          >
            <GeofenceMapView
              ref={previewMapRef}
              mode={existingAnchor ? "fixed" : "adjustable"}
              viewport={mapInitialViewport}
              center={{
                latitude: pendingPlace.latitude,
                longitude: pendingPlace.longitude,
              }}
              radiusMeters={displayRadiusMeters}
              mapKey={previewMapKey}
              height={PREVIEW_MAP_HEIGHT}
              onCenterChange={existingAnchor ? undefined : handlePreviewCenterChange}
            />
          </View>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            Search for a real venue while you plan at home. If search fails, drop a pin on
            the venue map — never use your home GPS.
          </Text>

          <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setPendingPlace(null);
                setMapInitialViewport(null);
                setSearchedEmpty(false);
              }}
              onSubmitEditing={() => void runSearch(query)}
              returnKeyType="search"
              placeholder={searchHint}
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              autoCorrect={false}
              style={{
                flex: 1,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: "Poppins-Regular",
                fontSize: 15,
                color: colors.foreground,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search"
              onPress={() => void runSearch(query)}
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 14,
                  color: "#F0EDE9",
                }}
              >
                Search
              </Text>
            </Pressable>
          </View>

          {isSearching ? (
            <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
          ) : null}

          {error ? (
            <Text
              style={{
                marginTop: 12,
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                color: colors.error,
              }}
            >
              {error}
            </Text>
          ) : null}

          {suggestions.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.placeId}
                  accessibilityRole="button"
                  onPress={() => handleSelectSuggestion(suggestion)}
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 15,
                      color: colors.foreground,
                    }}
                  >
                    {suggestion.primaryText}
                  </Text>
                  {suggestion.secondaryText ? (
                    <Text
                      style={{
                        marginTop: 2,
                        fontFamily: "Poppins-Regular",
                        fontSize: 13,
                        color: colors.muted,
                      }}
                    >
                      {suggestion.secondaryText}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {showFallbacks && !pendingPlace ? (
            <View style={{ marginTop: 20, gap: 12 }}>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  color: colors.foreground,
                }}
              >
                Can&apos;t find it?
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setFallbackMode("none");
                  setPinPickerVisible(true);
                }}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                >
                  Drop a pin on the venue
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: "Poppins-Regular",
                    fontSize: 13,
                    color: colors.muted,
                  }}
                >
                  Pan the map to your area, tap the building, then drag the geofence circle before saving.
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setFallbackMode("defer");
                  setDeferredName(query.trim());
                  setError(null);
                }}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                >
                  Set location when I arrive
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: "Poppins-Regular",
                    fontSize: 13,
                    color: colors.muted,
                  }}
                >
                  Save the name now; capture GPS the first time you get there.
                  </Text>
              </Pressable>

              {fallbackMode === "defer" ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={deferredName}
                    onChangeText={setDeferredName}
                    placeholder="Venue name"
                    placeholderTextColor={colors.muted}
                    style={{
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontFamily: "Poppins-Regular",
                      fontSize: 15,
                      color: colors.foreground,
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleDeferredConfirm}
                    style={{
                      alignItems: "center",
                      borderRadius: 14,
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins-Bold",
                        fontSize: 16,
                        color: "#F0EDE9",
                      }}
                    >
                      Save for first arrival
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          {pendingPlace ? (
            <View style={{ marginTop: 20, gap: 12 }}>
              {pendingPlace.deferred ? (
                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      color: colors.muted,
                    }}
                  >
                    GPS will be captured when you arrive at this venue — not from your home.
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 14,
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                >
                  {pendingPlace.name}
                </Text>
                {pendingPlace.formattedAddress ? (
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      color: colors.muted,
                    }}
                  >
                    {pendingPlace.formattedAddress}
                  </Text>
                ) : null}
                {existingAnchor ? (
                  <Text
                    style={{
                      marginTop: 4,
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      color: colors.primary,
                    }}
                  >
                    Reuses saved geofence for this place ({existingAnchor.radiusMeters}m).
                  </Text>
                ) : null}
              </View>

              {!pendingPlace.deferred && !existingAnchor ? (
                <GeofenceRadiusSelector
                  radiusMeters={selectedRadiusMeters}
                  onRadiusChange={setSelectedRadiusMeters}
                  suggestedPresetId={suggestedPresetId}
                />
              ) : null}

              {!pendingPlace.deferred && existingAnchor ? (
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors.muted,
                  }}
                >
                  Geofence size is locked because this venue already has a saved anchor.
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleConfirm}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 16,
                    color: "#F0EDE9",
                  }}
                >
                  Use this place
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <MapPinPicker
          visible={pinPickerVisible}
          initialName={query.trim()}
          initialQuery={query.trim()}
          initialRadiusMeters={selectedRadiusMeters}
          suggestedPresetId={suggestedPresetId}
          onClose={() => setPinPickerVisible(false)}
          onConfirm={handlePinConfirm}
        />
      </SafeAreaView>
    </Modal>
  );
}
