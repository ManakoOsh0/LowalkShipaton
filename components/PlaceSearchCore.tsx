/**
 * PlaceSearchCore — inline venue search with deferred + pin fallbacks for Focus Node creation.
 */
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { InlineFieldError } from "@/components/form/InlineFieldError";
import { MapPinPicker } from "@/components/MapPinPicker";
import { NeuCard } from "@/components/NeuCard";
import { PlaceGeofenceEditor } from "@/components/PlaceGeofenceEditor";
import { PlaceSearchResultsSkeleton } from "@/components/skeleton/PlaceSearchResultsSkeleton";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_LG } from "@/lib/cardStyle";
import {
  buildDeferredPlaceId,
  clampGeofenceRadiusMeters,
  type AnchorRadiusPresetId,
} from "@/lib/geo";
import { geocodeSearch, placeFromSuggestion } from "@/services/geocode";
import { useScheduleStore } from "@/store/useScheduleStore";
import type { PlaceSelection, PlaceSuggestion } from "@/types/place";
import type { ThemeColors } from "@/theme/tokens";

type FallbackMode = "none" | "defer";

type LocationOptionButtonProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  iconBackground: string;
  iconColor: string;
  showDivider?: boolean;
  onPress: () => void;
  colors: ThemeColors;
};

function LocationOptionButton({
  icon,
  title,
  subtitle,
  iconBackground,
  iconColor,
  showDivider = false,
  onPress,
  colors,
}: LocationOptionButtonProps) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 4,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: iconBackground,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 15,
              lineHeight: 20,
              color: colors.foreground,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 12,
              lineHeight: 16,
              color: colors.foregroundSubtle,
            }}
          >
            {subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>
      {showDivider ? (
        <View
          style={{
            height: 1,
            marginLeft: 60,
            backgroundColor: colors.border,
          }}
        />
      ) : null}
    </>
  );
}

type PlaceSearchCoreProps = {
  initialPlace: PlaceSelection | null;
  radiusMeters: number;
  suggestedPresetId?: AnchorRadiusPresetId;
  searchHint?: string;
  onSelect: (place: PlaceSelection, anchorId: string) => void;
  /** When external, parent renders PlaceGeofenceEditor outside scroll areas. */
  geofenceEditor?: "inline" | "external";
  onPendingPlaceChange?: (place: PlaceSelection | null) => void;
};

export function PlaceSearchCore({
  initialPlace,
  radiusMeters,
  suggestedPresetId,
  searchHint = "e.g. Virgin Active Hatfield",
  onSelect,
  geofenceEditor = "inline",
  onPendingPlaceChange,
}: PlaceSearchCoreProps) {
  const colors = useThemeColors();
  const anchors = useScheduleStore((state) => state.anchors);
  const resolveAnchorForPlace = useScheduleStore((state) => state.resolveAnchorForPlace);

  const [query, setQuery] = useState(initialPlace?.name ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlace, setPendingPlace] = useState<PlaceSelection | null>(initialPlace);
  const [selectedRadiusMeters, setSelectedRadiusMeters] = useState(() =>
    clampGeofenceRadiusMeters(radiusMeters),
  );
  const [pinPickerVisible, setPinPickerVisible] = useState(false);
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>("none");
  const [deferredName, setDeferredName] = useState("");

  const syncPendingPlace = (place: PlaceSelection | null) => {
    setPendingPlace(place);
    onPendingPlaceChange?.(place);
  };

  useEffect(() => {
    setQuery(initialPlace?.name ?? "");
    setSelectedRadiusMeters(clampGeofenceRadiusMeters(radiusMeters));
    setSuggestions([]);
    setError(null);
    setFallbackMode("none");
    setDeferredName("");
    if (geofenceEditor === "external") {
      setPendingPlace(null);
    } else {
      syncPendingPlace(initialPlace);
    }
  }, [initialPlace, radiusMeters, geofenceEditor]);

  const runSearch = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setFallbackMode("none");
    const result = await geocodeSearch(trimmed);
    setIsSearching(false);

    if (!result.success) {
      setError(result.error);
      setSuggestions([]);
      return;
    }

    setError(null);
    setSuggestions(result.data);
    if (result.data.length === 0) {
      setError("No places found. Try a more specific name, or use a fallback below.");
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || pendingPlace?.name === trimmed) {
      return;
    }

    const timeout = setTimeout(() => {
      void runSearch(trimmed);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query, pendingPlace?.name]);

  const existingAnchor = pendingPlace
    ? anchors.find((anchor) => anchor.placeId === pendingPlace.placeId) ?? null
    : null;

  const finishWithPlace = (place: PlaceSelection, confirmRadius: number) => {
    const anchorId = resolveAnchorForPlace(place, clampGeofenceRadiusMeters(confirmRadius));
    onSelect(place, anchorId);
  };

  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    const place = placeFromSuggestion(suggestion, query);
    const matchedAnchor = anchors.find((anchor) => anchor.placeId === place.placeId) ?? null;
    const nextRadius = matchedAnchor?.radiusMeters ?? clampGeofenceRadiusMeters(radiusMeters);
    setSelectedRadiusMeters(nextRadius);
    setQuery(place.name);
    setSuggestions([]);
    setError(null);
    setFallbackMode("none");
    syncPendingPlace(place);
  };

  const handleConfirmPending = () => {
    if (!pendingPlace) return;
    const confirmRadius = existingAnchor?.radiusMeters ?? selectedRadiusMeters;
    finishWithPlace(pendingPlace, confirmRadius);
  };

  const handlePinConfirm = (place: PlaceSelection, pinRadius: number) => {
    setSelectedRadiusMeters(clampGeofenceRadiusMeters(pinRadius));
    setQuery(place.name);
    setSuggestions([]);
    setError(null);
    setPinPickerVisible(false);
    finishWithPlace(place, pinRadius);
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

  const showSearchResults = suggestions.length > 0 && !pendingPlace;
  const showInlineGeofenceEditor =
    geofenceEditor === "inline" && pendingPlace && !pendingPlace.deferred;

  const handleChangePlace = () => {
    syncPendingPlace(null);
    setQuery("");
    setSuggestions([]);
    setError(null);
    setFallbackMode("none");
  };

  if (showInlineGeofenceEditor && pendingPlace) {
    return (
      <View style={{ gap: 12 }}>
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
              {pendingPlace.name}
            </Text>
            {pendingPlace.formattedAddress ? (
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                }}
              >
                {pendingPlace.formattedAddress}
              </Text>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" onPress={handleChangePlace} hitSlop={8}>
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

        <PlaceGeofenceEditor
          place={pendingPlace}
          radiusMeters={selectedRadiusMeters}
          suggestedPresetId={suggestedPresetId}
          showPlaceHeader={false}
          onPlaceChange={syncPendingPlace}
          onRadiusChange={setSelectedRadiusMeters}
          onConfirm={handleConfirmPending}
          confirmLabel="Use this place"
        />

        <MapPinPicker
          visible={pinPickerVisible}
          initialName={query.trim()}
          initialQuery={query.trim()}
          initialRadiusMeters={selectedRadiusMeters}
          suggestedPresetId={suggestedPresetId}
          onClose={() => setPinPickerVisible(false)}
          onConfirm={handlePinConfirm}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            syncPendingPlace(null);
          }}
          onSubmitEditing={() => void runSearch(query)}
          returnKeyType="search"
          placeholder={searchHint}
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          autoCorrect={false}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 48,
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
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            backgroundColor: colors.primary,
          }}
        >
          <Ionicons name="search" size={20} color="#F0EDE9" />
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.muted,
          }}
        >
          Other ways to set location
        </Text>
        <NeuCard
          borderRadius={CARD_RADIUS_LG}
          shadowVariant="sm"
          contentStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}
        >
          <LocationOptionButton
            icon="location-outline"
            title="Drop a pin"
            subtitle="Place it on the map yourself"
            iconBackground={colors.primarySoft}
            iconColor={colors.primary}
            showDivider
            colors={colors}
            onPress={() => {
              setFallbackMode("none");
              setPinPickerVisible(true);
            }}
          />
          <LocationOptionButton
            icon="navigate-outline"
            title="When I arrive"
            subtitle="Anchor location on your first visit"
            iconBackground={colors.iconTile}
            iconColor={colors.sky}
            colors={colors}
            onPress={() => {
              setFallbackMode("defer");
              setDeferredName(query.trim());
              setError(null);
              syncPendingPlace(null);
            }}
          />
        </NeuCard>
      </View>

      {isSearching ? <PlaceSearchResultsSkeleton /> : null}
      {error ? <InlineFieldError message={error} /> : null}

      {showSearchResults && !isSearching ? (
        <View style={{ gap: 8 }}>
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

      {fallbackMode === "defer" ? (
        <View style={{ gap: 8 }}>
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
            accessibilityLabel="Save for first arrival"
            onPress={handleDeferredConfirm}
            style={({ pressed }) => ({
              alignItems: "center",
              borderRadius: 14,
              backgroundColor: colors.primary,
              paddingVertical: 14,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 15,
                color: "#F0EDE9",
              }}
            >
              Save for first arrival
            </Text>
          </Pressable>
        </View>
      ) : null}

      <MapPinPicker
        visible={pinPickerVisible}
        initialName={query.trim()}
        initialQuery={query.trim()}
        initialRadiusMeters={selectedRadiusMeters}
        suggestedPresetId={suggestedPresetId}
        onClose={() => setPinPickerVisible(false)}
        onConfirm={handlePinConfirm}
      />
    </View>
  );
}
