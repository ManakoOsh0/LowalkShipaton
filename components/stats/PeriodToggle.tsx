/**
 * PeriodToggle — Week / Month / Year segmented control for Statistics.
 */
import { Pressable, Text, View } from "react-native";

import { CARD_RADIUS_SM, CARD_RADIUS_XS } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { StatsPeriod } from "@/types/stats";

const OPTIONS: { id: StatsPeriod; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

type PeriodToggleProps = {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
};

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        borderRadius: CARD_RADIUS_SM,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        padding: 4,
        gap: 4,
      }}
    >
      {OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={{
              flex: 1,
              borderRadius: CARD_RADIUS_XS,
              borderCurve: "continuous",
              backgroundColor: selected ? colors.primarySoft : "transparent",
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: selected ? "Poppins-SemiBold" : "Poppins-Medium",
                fontSize: 14,
                lineHeight: 18,
                color: selected ? colors.skyDeep : colors.muted,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
