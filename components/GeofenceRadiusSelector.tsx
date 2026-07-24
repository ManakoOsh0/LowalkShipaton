/**
 * Geofence radius picker — preset chips + custom meters input for venue placement.
 * Used when dropping a pin or confirming a searched place before Anchor save.
 */
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";
import {
  ANCHOR_RADIUS_PRESETS,
  clampGeofenceRadiusMeters,
  MAX_GEOFENCE_RADIUS_METERS,
  MIN_GEOFENCE_RADIUS_METERS,
  type AnchorRadiusPresetId,
} from "@/lib/geo";

type GeofenceRadiusSelectorProps = {
  radiusMeters: number;
  onRadiusChange: (radiusMeters: number) => void;
  disabled?: boolean;
  suggestedPresetId?: AnchorRadiusPresetId;
};

export function GeofenceRadiusSelector({
  radiusMeters,
  onRadiusChange,
  disabled = false,
  suggestedPresetId,
}: GeofenceRadiusSelectorProps) {
  const colors = useThemeColors();
  const [showCustom, setShowCustom] = useState(
    () => !ANCHOR_RADIUS_PRESETS.some((preset) => preset.radiusMeters === radiusMeters),
  );
  const [customDraft, setCustomDraft] = useState(String(radiusMeters));
  const [customError, setCustomError] = useState<string | null>(null);

  const activePresetId = ANCHOR_RADIUS_PRESETS.find(
    (preset) => preset.radiusMeters === radiusMeters,
  )?.id;

  const handlePresetPress = (presetRadius: number) => {
    if (disabled) return;
    setShowCustom(false);
    setCustomError(null);
    onRadiusChange(clampGeofenceRadiusMeters(presetRadius));
  };

  const handleCustomApply = () => {
    if (disabled) return;
    const parsed = Number(customDraft);
    if (!Number.isFinite(parsed)) {
      setCustomError(`Enter a number between ${MIN_GEOFENCE_RADIUS_METERS} and ${MAX_GEOFENCE_RADIUS_METERS}.`);
      return;
    }
    if (parsed < MIN_GEOFENCE_RADIUS_METERS || parsed > MAX_GEOFENCE_RADIUS_METERS) {
      setCustomError(`Use ${MIN_GEOFENCE_RADIUS_METERS}–${MAX_GEOFENCE_RADIUS_METERS} meters.`);
      return;
    }
    setCustomError(null);
    onRadiusChange(clampGeofenceRadiusMeters(parsed));
  };

  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 13,
          lineHeight: 18,
          color: colors.foreground,
        }}
      >
        Geofence size
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {ANCHOR_RADIUS_PRESETS.map((preset) => {
          const selected = !showCustom && activePresetId === preset.id;
          const suggested = preset.id === suggestedPresetId;
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => handlePresetPress(preset.radiusMeters)}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.iconTile : colors.background,
                paddingHorizontal: 12,
                paddingVertical: 10,
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: selected ? colors.primary : colors.foreground,
                }}
              >
                {preset.label}
                {suggested && !disabled ? " · suggested" : ""}
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: "Poppins-Regular",
                  fontSize: 11,
                  color: colors.muted,
                }}
              >
                {preset.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          if (disabled) return;
          setShowCustom(true);
          setCustomDraft(String(radiusMeters));
        }}
        style={{ opacity: disabled ? 0.55 : 1 }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 13,
            color: showCustom ? colors.primary : colors.foreground,
          }}
        >
          Custom radius
        </Text>
      </Pressable>

      {showCustom && !disabled ? (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            accessibilityLabel="Custom geofence radius in meters"
            value={customDraft}
            onChangeText={setCustomDraft}
            onSubmitEditing={handleCustomApply}
            keyboardType="number-pad"
            placeholder={`${MIN_GEOFENCE_RADIUS_METERS}–${MAX_GEOFENCE_RADIUS_METERS}`}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontFamily: "Poppins-Regular",
              fontSize: 15,
              color: colors.foreground,
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={handleCustomApply}
            style={{
              borderRadius: 12,
              backgroundColor: colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 14,
                color: "#F0EDE9",
              }}
            >
              Apply
            </Text>
          </Pressable>
        </View>
      ) : null}

      {customError ? (
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 12,
            color: colors.error,
          }}
        >
          {customError}
        </Text>
      ) : null}

      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 12,
          lineHeight: 17,
          color: colors.muted,
        }}
      >
        Covers ~{radiusMeters}m around the pin
      </Text>
    </View>
  );
}
