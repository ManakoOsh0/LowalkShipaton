/**
 * HeroStreakCard — weekly review summary with completion rate and streak.
 */
import { Text, View } from "react-native";

import { StreakFlame } from "@/components/StreakFlame";
import { StatsCardShell } from "@/components/stats/StatsCardShell";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { WeeklyProgress } from "@/types/stats";

type HeroStreakCardProps = {
  streak: number;
  weeklyProgress: WeeklyProgress;
  missedCount?: number;
  skippedCount?: number;
};

export function HeroStreakCard({
  streak,
  weeklyProgress,
  missedCount = 0,
  skippedCount = 0,
}: HeroStreakCardProps) {
  const colors = useThemeColors();
  const percent = weeklyProgress.percent;

  return (
    <StatsCardShell>
      <View style={{ paddingHorizontal: 20, paddingVertical: 20, gap: 14 }}>
        <Text
          style={{
            fontFamily: "Poppins-Medium",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          Weekly review
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 36,
                lineHeight: 42,
                color: colors.foreground,
              }}
            >
              {percent}%
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              completion rate
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <StreakFlame height={16} />
              <Text
                selectable
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.foreground,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {streak}-day streak
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 12,
                lineHeight: 16,
                color: colors.muted,
              }}
            >
              {missedCount} missed · {skippedCount} skipped
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 6,
            borderRadius: 999,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${percent}%`,
              borderRadius: 999,
              backgroundColor: colors.skyDeep,
            }}
          />
        </View>

        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          {weeklyProgress.completed} of {weeklyProgress.target} sessions this week
        </Text>
      </View>
    </StatsCardShell>
  );
}
