/**
 * LowalkRulePickerSheet — single-choice picker for penalty tier and pre-lock duration.
 */
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { useThemeColors } from "@/hooks/useThemeColors";

type PickerOption<T extends string | number> = {
  value: T;
  label: string;
};

type LowalkRulePickerSheetProps<T extends string | number> = {
  visible: boolean;
  title: string;
  description?: string;
  options: readonly PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function LowalkRulePickerSheet<T extends string | number>({
  visible,
  title,
  description,
  options,
  selected,
  onSelect,
  onClose,
}: LowalkRulePickerSheetProps<T>) {
  const colors = useThemeColors();

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
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      </View>
    </BottomSheet>
  );
}
