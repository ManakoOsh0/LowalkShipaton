/**
 * StatsPeriodSheet — Brick-style "Select view" picker for week / month / year.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_MD } from "@/lib/cardStyle";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { StatsPeriod } from "@/types/stats";

const OPTIONS: { id: StatsPeriod; label: string; hint: string }[] = [
  { id: "week", label: "Weekly", hint: "Average focus time and active days" },
  { id: "month", label: "Monthly", hint: "Total focus time by week" },
  { id: "year", label: "Yearly", hint: "Year totals and consistency" },
];

type StatsPeriodSheetProps = {
  visible: boolean;
  value: StatsPeriod;
  onClose: () => void;
  onChange: (period: StatsPeriod) => void;
};

export function StatsPeriodSheet({
  visible,
  value,
  onClose,
  onChange,
}: StatsPeriodSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 16, paddingBottom: 8 }}>
        <Text
          style={textStyle("h3", colors.foreground, {
            fontFamily: FONT_FAMILY.bold,
          })}
        >
          Select view
        </Text>

        <View style={{ gap: 8 }}>
          {OPTIONS.map((option) => {
            const selected = option.id === value;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange(option.id);
                  onClose();
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.75 : 1,
                  borderRadius: CARD_RADIUS_MD,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: selected ? colors.foreground : colors.cardStroke,
                  backgroundColor: colors.surface,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                })}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: FONT_FAMILY.semibold,
                      fontSize: 16,
                      lineHeight: 22,
                      color: colors.foreground,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text style={textStyle("bodySm", colors.muted)}>{option.hint}</Text>
                </View>
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={selected ? colors.foreground : colors.muted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}
