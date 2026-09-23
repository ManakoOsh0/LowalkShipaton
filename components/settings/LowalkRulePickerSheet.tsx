/**
 * LowalkRulePickerSheet — single-choice picker for penalty tier and pre-lock duration.
 */
import { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { InlineFieldError } from "@/components/form/InlineFieldError";
import { SheetActionButton } from "@/components/SheetActionButton";
import { useThemeColors } from "@/hooks/useThemeColors";

type PickerOption<T extends string | number> = {
  value: T;
  label: string;
};

type CustomMinutesPickerConfig<T extends number> = {
  min: number;
  max: number;
  isPresetValue: (value: T) => boolean;
  formatDuration: (totalMinutes: number) => string;
  formatRange: () => string;
  splitTotal: (totalMinutes: number) => { hours: number; minutes: number };
  combineParts: (hours: number, minutes: number) => number;
};

type LowalkRulePickerSheetProps<T extends string | number> = {
  visible: boolean;
  title: string;
  description?: string;
  options: readonly PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  customMinutes?: CustomMinutesPickerConfig<T & number>;
};

type DurationStepperRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
};

function DurationStepperRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: DurationStepperRowProps) {
  const colors = useThemeColors();

  const adjust = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: "Poppins-SemiBold",
          fontSize: 15,
          color: colors.foreground,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            adjust(-step);
          }}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 20,
              lineHeight: 22,
              color: colors.foreground,
            }}
          >
            −
          </Text>
        </Pressable>
        <Text
          style={{
            minWidth: 28,
            textAlign: "center",
            fontFamily: "Poppins-SemiBold",
            fontSize: 17,
            color: colors.foreground,
          }}
        >
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            adjust(step);
          }}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 20,
              lineHeight: 22,
              color: colors.foreground,
            }}
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LowalkRulePickerSheet<T extends string | number>({
  visible,
  title,
  description,
  options,
  selected,
  onSelect,
  onClose,
  customMinutes,
}: LowalkRulePickerSheetProps<T>) {
  const colors = useThemeColors();
  const [customMode, setCustomMode] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutesPart, setCustomMinutesPart] = useState(0);
  const [customError, setCustomError] = useState<string | null>(null);

  const customTotal = useMemo(() => {
    if (!customMinutes) return 0;
    return customMinutes.combineParts(customHours, customMinutesPart);
  }, [customHours, customMinutes, customMinutesPart]);

  const customPreviewLabel = customMinutes
    ? customMinutes.formatDuration(customTotal)
    : "";

  useEffect(() => {
    if (!visible) return;
    if (customMinutes) {
      const preset = customMinutes.isPresetValue(selected as T & number);
      setCustomMode(!preset);
      const parts = customMinutes.splitTotal(selected as T & number);
      setCustomHours(parts.hours);
      setCustomMinutesPart(parts.minutes);
    } else {
      setCustomMode(false);
      setCustomHours(0);
      setCustomMinutesPart(0);
    }
    setCustomError(null);
  }, [visible, selected, customMinutes]);

  const setCustomParts = (hours: number, minutes: number) => {
    if (!customMinutes) return;
    const total = customMinutes.combineParts(hours, minutes);
    const normalized = customMinutes.splitTotal(total);
    setCustomHours(normalized.hours);
    setCustomMinutesPart(normalized.minutes);
    setCustomError(null);
  };

  const applyCustomMinutes = () => {
    if (!customMinutes) return;
    const total = customMinutes.combineParts(customHours, customMinutesPart);
    if (total < customMinutes.min || total > customMinutes.max) {
      setCustomError(`Choose ${customMinutes.formatRange()}.`);
      return;
    }
    setCustomError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(total as T);
    onClose();
  };

  const customSelected =
    customMinutes != null &&
    (customMode || !customMinutes.isPresetValue(selected as T & number));

  const customRowSubtitle =
    customMinutes && customSelected && !customMode
      ? customMinutes.formatDuration(selected as T & number)
      : null;

  const maxHours = customMinutes
    ? Math.floor(customMinutes.max / 60)
    : 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 8, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 18,
            lineHeight: 24,
            color: colors.foreground,
          }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={{
              marginBottom: 4,
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            {description}
          </Text>
        ) : null}

        {options.map((option, index) => {
          const isSelected =
            !customSelected && option.value === selected;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCustomMode(false);
                setCustomError(null);
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => ({
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isSelected ? colors.skyDeep : colors.border,
                backgroundColor: isSelected ? colors.surface : colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginTop: index === 0 ? 4 : 0,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  lineHeight: 20,
                  color: isSelected ? colors.skyDeep : colors.foreground,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}

        {customMinutes ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: customSelected }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCustomMode(true);
                const parts = customMinutes.splitTotal(selected as T & number);
                setCustomHours(parts.hours);
                setCustomMinutesPart(parts.minutes);
                setCustomError(null);
              }}
              style={({ pressed }) => ({
                borderRadius: 14,
                borderWidth: 1,
                borderColor: customSelected ? colors.skyDeep : colors.border,
                backgroundColor: customSelected ? colors.surface : colors.card,
                paddingHorizontal: 16,
                paddingVertical: 14,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  lineHeight: 20,
                  color: customSelected ? colors.skyDeep : colors.foreground,
                }}
              >
                Custom
              </Text>
              {customRowSubtitle ? (
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: "Poppins-Regular",
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.muted,
                  }}
                >
                  {customRowSubtitle}
                </Text>
              ) : null}
            </Pressable>

            {customMode ? (
              <View
                style={{
                  gap: 14,
                  marginTop: 4,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <DurationStepperRow
                  label="Hours"
                  value={customHours}
                  min={0}
                  max={maxHours}
                  step={1}
                  onChange={(hours) => setCustomParts(hours, customMinutesPart)}
                />
                <DurationStepperRow
                  label="Minutes"
                  value={customMinutesPart}
                  min={0}
                  max={59}
                  step={5}
                  onChange={(minutes) => setCustomParts(customHours, minutes)}
                />
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.muted,
                    textAlign: "center",
                  }}
                >
                  {customPreviewLabel}
                </Text>
                <SheetActionButton
                  label="Set duration"
                  onPress={applyCustomMinutes}
                />
              </View>
            ) : null}

            {customError ? <InlineFieldError message={customError} /> : null}
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}
