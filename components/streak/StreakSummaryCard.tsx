/**
 * StreakSummaryCard — monthly active rate ring and completed/incomplete tally.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { ProgressRing } from "@/components/ProgressRing";
import type { StreakMonthSummary } from "@/lib/streakCalendar";
import { useThemeColors } from "@/hooks/useThemeColors";

type StreakSummaryCardProps = {
  month: StreakMonthSummary;
};

export function StreakSummaryCard({ month }: StreakSummaryCardProps) {
  const colors = useThemeColors();
  const progress = month.activePercent / 100;
  const tickCount = month.cells.filter((cell) => cell.day != null).length;

  return (
    <NeuCard contentStyle={{ paddingHorizontal: 18, paddingVertical: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <View style={{ alignItems: "center", gap: 6 }}>
          <View style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
            <ProgressRing progress={progress} size={72} strokeWidth={6} />
            <View
              style={{
                position: "absolute",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 18,
                  lineHeight: 22,
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {month.activePercent}%
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 12,
              lineHeight: 16,
              color: colors.streak,
            }}
          >
            Active
          </Text>
        </View>

        <View style={{ flex: 1, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 28 }}>
            {month.cells
              .filter((cell) => cell.day != null)
              .map((cell) => {
                const isHit = cell.goalHit;
                const isPartial = cell.status === "partial";
                return (
                  <View
                    key={cell.dateIso ?? `tick-${cell.day}`}
                    style={{
                      flex: 1,
                      maxWidth: 6,
                      height: isHit ? 22 : isPartial ? 14 : 8,
                      borderRadius: 2,
                      backgroundColor: isHit
                        ? colors.success
                        : isPartial
                          ? "rgba(61, 185, 110, 0.45)"
                          : colors.border,
                    }}
                  />
                );
              })}
            {tickCount < 28
              ? Array.from({ length: 28 - tickCount }).map((_, index) => (
                  <View
                    key={`spacer-${index}`}
                    style={{ flex: 1, maxWidth: 6, height: 4, borderRadius: 2 }}
                  />
                ))
              : null}
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.foreground,
                }}
              >
                {month.daysCompleted} day{month.daysCompleted === 1 ? "" : "s"} completed
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="ellipse-outline" size={16} color={colors.muted} />
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                }}
              >
                {month.daysIncomplete} day{month.daysIncomplete === 1 ? "" : "s"} incomplete
              </Text>
            </View>
          </View>
        </View>
      </View>
    </NeuCard>
  );
}
