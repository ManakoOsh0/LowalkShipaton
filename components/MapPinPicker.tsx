/**
 * Drop-a-pin on the venue — find your city/campus first, tap the building, drag the geofence.
 * Map never opens in a random place; area search is required before pin drop.
 */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GeofenceMapView, type GeofenceMapViewHandle } from "@/components/GeofenceMapView";
import { GeofenceRadiusSelector } from "@/components/GeofenceRadiusSelector";
import { InlineFieldError } from "@/components/form/InlineFieldError";
import { useModalAnimationType } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  buildGeocodePlaceId,
  clampGeofenceRadiusMeters,
  haversineDistanceMeters,
  type AnchorRadiusPresetId,
} from "@/lib/geo";
import {
  FAR_PIN_DISTANCE_METERS,
  geocodeMapCenter,
  geocodeSearch,
  MIN_PIN_CONFIRM_ZOOM,
  reverseGeocodeCoordinates,
  type MapViewport,
} from "@/services/geocode";
import { getCurrentPosition } from "@/services/location";
import type { PlaceSelection, PlaceSuggestion } from "@/types/place";

type MapPinPickerProps = {
  visible: boolean;
  initialName?: string;
  initialRadiusMeters?: number;
  suggestedPresetId?: AnchorRadiusPresetId;
  /** Failed venue search — used to find the area on the map, not to place the pin. */
  initialQuery?: string;
  onClose: () => void;
  onConfirm: (place: PlaceSelection, radiusMeters: number) => void;
};

/** Pin-drop map height — fixed slot inside the scroll area so the form can scroll on smaller screens. */
const AREA_VIEWPORT_ZOOM = 14;
const MAP_HEIGHT = 280;

type InitialMapState = {
  viewport: MapViewport | null;
  coarsePosition: { latitude: number; longitude: number } | null;
  areaResolved: boolean;
};

function suggestionToViewport(suggestion: PlaceSuggestion): MapViewport {
  const label = suggestion.secondaryText
    ? `${suggestion.primaryText} · ${suggestion.secondaryText}`
    : suggestion.primaryText;
  return {
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    zoom: AREA_VIEWPORT_ZOOM,
    label,
  };
}

/** Resolve a city, suburb, or campus from free text — tries map-center geocode then broader search. */
async function resolveAreaFromQuery(query: string): Promise<MapViewport | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return null;

  const mapCenter = await geocodeMapCenter(trimmed);
  if (mapCenter) {
    return { ...mapCenter, zoom: Math.max(mapCenter.zoom, AREA_VIEWPORT_ZOOM) };
  }

  const searchResult = await geocodeSearch(trimmed);
  if (searchResult.success && searchResult.data.length > 0) {
    return suggestionToViewport(searchResult.data[0]);
  }

  return null;
}

async function resolveInitialMapState(initialQuery: string): Promise<InitialMapState> {
  const trimmedQuery = initialQuery.trim();

  if (trimmedQuery.length >= 3) {
    const viewport = await resolveAreaFromQuery(trimmedQuery);
    if (viewport) {
      return {
        viewport,
        coarsePosition: null,
        areaResolved: true,
      };
    }
  }

  const positionResult = await getCurrentPosition();
  if (positionResult.success) {
    const label = await reverseGeocodeCoordinates(
      positionResult.position.latitude,
      positionResult.position.longitude,
    );
    return {
      viewport: {
        latitude: positionResult.position.latitude,
        longitude: positionResult.position.longitude,
        zoom: AREA_VIEWPORT_ZOOM,
        label: label ?? undefined,
      },
      coarsePosition: positionResult.position,
      areaResolved: true,
    };
  }

  return {
    viewport: null,
    coarsePosition: null,
    areaResolved: false,
  };
}

function inputStyle(colors: ReturnType<typeof useThemeColors>) {
  return {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins-Regular" as const,
    fontSize: 15,
    color: colors.foreground,
  };
}

export function MapPinPicker({
  visible,
  initialName = "",
  initialRadiusMeters = 30,
  suggestedPresetId,
  initialQuery = "",
  onClose,
  onConfirm,
}: MapPinPickerProps) {
  const colors = useThemeColors();
  const modalAnimationType = useModalAnimationType("slide");
  const mapRef = useRef<GeofenceMapViewHandle>(null);

  const [name, setName] = useState(initialName);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoadingAreaSuggestions, setIsLoadingAreaSuggestions] = useState(false);
  const [areaResolved, setAreaResolved] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(() =>
    clampGeofenceRadiusMeters(initialRadiusMeters),
  );
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [isJumpingToArea, setIsJumpingToArea] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [coarsePosition, setCoarsePosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const resetPin = () => {
    setCenter(null);
    setZoom(null);
    setResolvedAddress(null);
    mapRef.current?.clearPin();
  };

  const applyAreaViewport = (viewport: MapViewport) => {
    resetPin();
    setMapViewport(viewport);
    setAreaResolved(true);
    setAreaSuggestions([]);
    setMapKey((key) => key + 1);
  };

  useEffect(() => {
    if (!visible) return;

    setName(initialName);
    setAreaQuery(initialQuery.trim());
    setAreaSuggestions([]);
    setRadiusMeters(clampGeofenceRadiusMeters(initialRadiusMeters));
    setCenter(null);
    setZoom(null);
    setResolvedAddress(null);
    setError(null);
    setAreaResolved(false);
    setMapViewport(null);
    setIsKeyboardVisible(false);

    void (async () => {
      setIsInitializing(true);
      const initial = await resolveInitialMapState(initialQuery);
      setCoarsePosition(initial.coarsePosition);
      if (initial.areaResolved && initial.viewport) {
        applyAreaViewport(initial.viewport);
      }
      setIsInitializing(false);
    })();
  }, [visible, initialName, initialQuery, initialRadiusMeters]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const trimmed = areaQuery.trim();
    if (trimmed.length < 3) {
      setAreaSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setIsLoadingAreaSuggestions(true);
        const result = await geocodeSearch(trimmed);
        setIsLoadingAreaSuggestions(false);
        if (result.success) {
          setAreaSuggestions(result.data.slice(0, 4));
        } else {
          setAreaSuggestions([]);
        }
      })();
    }, 450);

    return () => clearTimeout(timeout);
  }, [areaQuery, visible]);

  useEffect(() => {
    if (!center) {
      setResolvedAddress(null);
      return;
    }

    setIsResolvingAddress(true);
    const timeout = setTimeout(() => {
      void (async () => {
        const label = await reverseGeocodeCoordinates(center.latitude, center.longitude);
        setResolvedAddress(label);
        setIsResolvingAddress(false);
      })();
    }, 400);

    return () => clearTimeout(timeout);
  }, [center?.latitude, center?.longitude]);

  const handleAreaSearch = async () => {
    const trimmed = areaQuery.trim();
    if (trimmed.length < 3) {
      setError("Enter at least 3 characters — e.g. Hatfield or Pretoria campus.");
      return;
    }

    setIsSearchingArea(true);
    setError(null);
    const viewport = await resolveAreaFromQuery(trimmed);
    setIsSearchingArea(false);

    if (!viewport) {
      setError("Area not found. Try a city, suburb, or campus name.");
      return;
    }

    applyAreaViewport(viewport);
  };

  const handleSelectAreaSuggestion = (suggestion: PlaceSuggestion) => {
    setAreaQuery(suggestion.primaryText);
    applyAreaViewport(suggestionToViewport(suggestion));
    setError(null);
  };

  const handleJumpToMyArea = async () => {
    setIsJumpingToArea(true);
    setError(null);

    const positionResult = await getCurrentPosition();
    if (!positionResult.success) {
      setIsJumpingToArea(false);
      setError(positionResult.error);
      return;
    }

    setCoarsePosition(positionResult.position);
    const label = await reverseGeocodeCoordinates(
      positionResult.position.latitude,
      positionResult.position.longitude,
    );

    applyAreaViewport(
      {
        latitude: positionResult.position.latitude,
        longitude: positionResult.position.longitude,
        zoom: AREA_VIEWPORT_ZOOM,
        label: label ?? undefined,
      },
    );
    setIsJumpingToArea(false);
  };

  const finishConfirm = (place: PlaceSelection, confirmedRadius: number) => {
    onConfirm(place, confirmedRadius);
    setCenter(null);
    setZoom(null);
    setResolvedAddress(null);
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name this venue (e.g. Campus Gym).");
      return;
    }
    if (!areaResolved) {
      setError("Find your city or campus on the map first.");
      return;
    }
    if (!center) {
      setError("Tap the map to drop a pin on your venue.");
      return;
    }
    if (zoom === null || zoom < MIN_PIN_CONFIRM_ZOOM) {
      setError(`Zoom in closer (level ${MIN_PIN_CONFIRM_ZOOM}+) until you can see the building.`);
      return;
    }
    if (!resolvedAddress && !isResolvingAddress) {
      setError(
        "We could not identify this spot. Zoom in on the building, or use “When I arrive” instead.",
      );
      return;
    }
    if (isResolvingAddress) return;

    const formattedAddress =
      resolvedAddress ?? `Pinned · ${center.latitude.toFixed(5)}, ${center.longitude.toFixed(5)}`;

    const place: PlaceSelection = {
      placeId: buildGeocodePlaceId(trimmed, center.latitude, center.longitude),
      name: trimmed,
      formattedAddress,
      latitude: center.latitude,
      longitude: center.longitude,
    };

    const confirmedRadius = clampGeofenceRadiusMeters(radiusMeters);

    if (coarsePosition) {
      const distanceMeters = haversineDistanceMeters(coarsePosition, center);
      if (distanceMeters > FAR_PIN_DISTANCE_METERS) {
        Alert.alert(
          "Pin looks far away",
          "This pin is far from your current area. Save it only if you are placing a venue you plan to visit later.",
          [
            { text: "Keep editing", style: "cancel" },
            {
              text: "Use this pin",
              onPress: () => finishConfirm(place, confirmedRadius),
            },
          ],
        );
        return;
      }
    }

    setIsConfirming(true);
    finishConfirm(place, confirmedRadius);
    setIsConfirming(false);
  };

  return (
    <Modal visible={visible} animationType={modalAnimationType} presentationStyle="fullScreen">
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
              fontSize: 18,
              color: colors.foreground,
            }}
          >
            Drop a pin
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

        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                color: colors.muted,
              }}
            >
              Find your area
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={areaQuery}
                onChangeText={(value) => {
                  setAreaQuery(value);
                  setError(null);
                }}
                onSubmitEditing={() => void handleAreaSearch()}
                returnKeyType="search"
                placeholder="City, suburb, or campus"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                autoCorrect={false}
                style={[inputStyle(colors), { flex: 1, backgroundColor: colors.background }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Find area on map"
                onPress={() => void handleAreaSearch()}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 14,
                  minWidth: 52,
                }}
              >
                {isSearchingArea ? (
                  <ActivityIndicator color="#F0EDE9" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Poppins-Bold",
                      fontSize: 14,
                      color: "#F0EDE9",
                    }}
                  >
                    Go
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: colors.muted,
                }}
              >
                Venue name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Main Library"
                placeholderTextColor={colors.muted}
                style={[inputStyle(colors), { backgroundColor: colors.background }]}
              />
            </View>

            {isLoadingAreaSuggestions ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}

            {areaSuggestions.length > 0 ? (
              <View style={{ gap: 6 }}>
                {areaSuggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.placeId}
                    accessibilityRole="button"
                    onPress={() => handleSelectAreaSuggestion(suggestion)}
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 14,
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
                          fontSize: 12,
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

            <Pressable
              accessibilityRole="button"
              onPress={() => void handleJumpToMyArea()}
              disabled={isJumpingToArea}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: colors.primary,
                }}
              >
                {isJumpingToArea ? "Finding your area…" : "Use my current area"}
              </Text>
            </Pressable>

            <View
              style={{
                height: MAP_HEIGHT,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {isInitializing ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.border,
                  }}
                >
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : areaResolved && mapViewport ? (
                <GeofenceMapView
                  ref={mapRef}
                  mode="pindrop"
                  viewport={mapViewport}
                  center={center}
                  radiusMeters={radiusMeters}
                  mapKey={mapKey}
                  height={MAP_HEIGHT}
                  onCenterChange={({ latitude, longitude, zoom: nextZoom }) => {
                    setZoom(nextZoom);
                    setError(null);
                    if (latitude !== undefined && longitude !== undefined) {
                      setCenter({ latitude, longitude });
                    }
                  }}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 24,
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 14,
                      color: colors.foreground,
                      textAlign: "center",
                    }}
                  >
                    Map appears after area search
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.muted,
                      textAlign: "center",
                    }}
                  >
                    Search above — e.g. Hatfield, Sandton, or your campus name.
                  </Text>
                </View>
              )}
            </View>

            {center ? (
              <View style={{ gap: 2 }}>
                {isResolvingAddress ? (
                  <Text
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      color: colors.muted,
                    }}
                  >
                    Identifying this spot…
                  </Text>
                ) : resolvedAddress ? (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      fontFamily: "Poppins-Regular",
                      fontSize: 12,
                      color: colors.muted,
                    }}
                  >
                    {resolvedAddress}
                  </Text>
                ) : null}
                {zoom !== null && zoom < MIN_PIN_CONFIRM_ZOOM ? (
                  <InlineFieldError message="Zoom in closer until you can see the building." />
                ) : null}
              </View>
            ) : null}

            <GeofenceRadiusSelector
              radiusMeters={radiusMeters}
              onRadiusChange={setRadiusMeters}
              suggestedPresetId={suggestedPresetId}
            />

            {error ? <InlineFieldError message={error} /> : null}
          </ScrollView>

          {!isKeyboardVisible ? (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleConfirm()}
                disabled={isConfirming || isResolvingAddress}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  opacity: isConfirming || isResolvingAddress ? 0.7 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 16,
                    color: "#F0EDE9",
                  }}
                >
                  {isConfirming ? "Saving…" : "Use this pin"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
