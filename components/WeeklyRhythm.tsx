/**
 * Weekly rhythm — seven-day glance for the current week without percentages.
 * Completed days fill in; today gets a ring; future days stay open.
 */
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import type { WeeklyRhythmDay } from "@/lib/consistencyStats";
import { useThemeColors } from "@/hooks/useThemeColors";

type WeeklyRhythmProps = {
  days: WeeklyRhythmDay[];
};

export function WeeklyRhythm({ days }: WeeklyRhythmProps) {
  const colors = useThemeColors();

  return (
    <NeuCard
      contentStyle={{
        paddingHorizontal: 16,
        paddingVertical: 18,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 16,
          lineHeight: 22,
          color: colors.foreground,
        }}
      >
        This week
      </Text>
      <Text
        style={{
          marginTop: 4,
          marginBottom: 18,
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        A calm snapshot of how the week is unfolding.
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
        {days.map((day, index) => {
          const fill =
            day.status === "complete"
              ? colors.skyDeep
              : day.status === "partial"
                ? "rgba(107, 143, 184, 0.4)"
                : day.status === "today"
                  ? colors.surface
                  : colors.border;

          return (
            <View key={`${day.label}-${index}`} style={{ flex: 1, alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: fill,
                  borderWidth: day.isToday ? 2 : 0,
                  borderColor: day.isToday ? colors.skyDeep : "transparent",
                }}
              />
              <Text
                style={{
                  fontFamily: day.isToday ? "Poppins-Bold" : "Poppins-Regular",
                  fontSize: 11,
                  lineHeight: 14,
                  color: day.isToday ? colors.skyDeep : colors.muted,
                }}
              >
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </NeuCard>
  );
}
