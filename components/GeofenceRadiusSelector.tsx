/**
 * Geofence radius picker — compact horizontal presets with optional custom meters.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { InlineFieldError } from "@/components/form/InlineFieldError";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  ANCHOR_RADIUS_PRESETS,
  clampGeofenceRadiusMeters,
  MAX_GEOFENCE_RADIUS_METERS,
  MIN_GEOFENCE_RADIUS_METERS,
  type AnchorRadiusPresetId,
} from "@/lib/geo";

const PRESET_SHORT_LABELS: Record<AnchorRadiusPresetId, string> = {
  small_room: "Room",
  classroom: "Class",
  library: "Library",
  large_gym: "Gym",
};

type GeofenceRadiusSelectorProps = {
  radiusMeters: number;
  onRadiusChange: (radiusMeters: number) => void;
  disabled?: boolean;
  suggestedPresetId?: AnchorRadiusPresetId;
};

function isPresetRadius(radiusMeters: number): boolean {
  return ANCHOR_RADIUS_PRESETS.some((preset) => preset.radiusMeters === radiusMeters);
}

export function GeofenceRadiusSelector({
  radiusMeters,
  onRadiusChange,
  disabled = false,
  suggestedPresetId,
}: GeofenceRadiusSelectorProps) {
  const colors = useThemeColors();
  const [customMode, setCustomMode] = useState(() => !isPresetRadius(radiusMeters));
  const [customDraft, setCustomDraft] = useState(String(radiusMeters));
  const [customError, setCustomError] = useState<string | null>(null);

  const activePresetId = ANCHOR_RADIUS_PRESETS.find(
    (preset) => preset.radiusMeters === radiusMeters,
  )?.id;

  useEffect(() => {
    setCustomDraft(String(radiusMeters));
    if (isPresetRadius(radiusMeters)) {
      setCustomMode(false);
    }
  }, [radiusMeters]);

  const handlePresetPress = (presetRadius: number) => {
    if (disabled) return;
    setCustomMode(false);
    setCustomError(null);
    onRadiusChange(clampGeofenceRadiusMeters(presetRadius));
  };

  const applyCustomRadius = () => {
    if (disabled) return;
    const parsed = Number(customDraft);
    if (!Number.isFinite(parsed)) {
      setCustomError(`Enter ${MIN_GEOFENCE_RADIUS_METERS}–${MAX_GEOFENCE_RADIUS_METERS} meters.`);
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Area size
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            color: colors.muted,
          }}
        >
          {radiusMeters}m around pin
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {ANCHOR_RADIUS_PRESETS.map((preset) => {
          const selected = !customMode && activePresetId === preset.id;
          const suggested = preset.id === suggestedPresetId;
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => handlePresetPress(preset.radiusMeters)}
              style={{
                minWidth: 68,
                alignItems: "center",
                borderRadius: 12,
                borderWidth: suggested && !selected ? 2 : 1,
                borderColor: selected ? colors.primary : suggested ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.background,
                paddingHorizontal: 12,
                paddingVertical: 10,
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 15,
                  color: selected ? "#F0EDE9" : colors.foreground,
                }}
              >
                {preset.radiusMeters}m
              </Text>
              <Text
                style={{
                  marginTop: 2,
                  fontFamily: "Poppins-Regular",
                  fontSize: 11,
                  color: selected ? "#F0EDE9" : colors.muted,
                }}
              >
                {PRESET_SHORT_LABELS[preset.id]}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: customMode, disabled }}
          disabled={disabled}
          onPress={() => {
            if (disabled) return;
            setCustomMode(true);
            setCustomDraft(String(radiusMeters));
            setCustomError(null);
          }}
          style={{
            minWidth: 68,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: customMode ? colors.primary : colors.border,
            backgroundColor: customMode ? colors.primary : colors.background,
            paddingHorizontal: 12,
            paddingVertical: 10,
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 15,
              color: customMode ? "#F0EDE9" : colors.foreground,
            }}
          >
            Custom
          </Text>
        </Pressable>
      </ScrollView>

      {customMode && !disabled ? (
        <TextInput
          accessibilityLabel="Custom geofence radius in meters"
          value={customDraft}
          onChangeText={setCustomDraft}
          onSubmitEditing={applyCustomRadius}
          onEndEditing={applyCustomRadius}
          keyboardType="number-pad"
          returnKeyType="done"
          placeholder={`${MIN_GEOFENCE_RADIUS_METERS}–${MAX_GEOFENCE_RADIUS_METERS} m`}
          placeholderTextColor={colors.muted}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: "Poppins-Regular",
            fontSize: 15,
            color: colors.foreground,
          }}
        />
      ) : null}

      {customError ? <InlineFieldError message={customError} /> : null}
    </View>
  );
}
