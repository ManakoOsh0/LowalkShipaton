/**
 * StatsActivityHero — period title, streak context, and one huge focus-time number.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { StreakFlame } from "@/components/StreakFlame";
import { useThemeColors } from "@/hooks/useThemeColors";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { PeriodStats } from "@/types/stats";

type StatsActivityHeroProps = {
  stats: PeriodStats;
  streak: number;
  onPressPeriod: () => void;
};

function trendCopy(stats: PeriodStats): {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
} | null {
  const { trend } = stats;
  if (trend.direction === "new") {
    return { icon: "sparkles-outline", text: "First activity in this period" };
  }
  if (trend.percentChange == null) return null;
  if (trend.direction === "up") {
    return {
      icon: "arrow-up",
      text: `${trend.percentChange}% ${trend.comparisonLabel}`,
    };
  }
  if (trend.direction === "down") {
    return {
      icon: "arrow-down",
      text: `${trend.percentChange}% ${trend.comparisonLabel}`,
    };
  }
  return { icon: "remove", text: `Same ${trend.comparisonLabel}` };
}

export function StatsActivityHero({
  stats,
  streak,
  onPressPeriod,
}: StatsActivityHeroProps) {
  const colors = useThemeColors();
  const trend = trendCopy(stats);

  return (
    <View style={{ gap: 28, paddingTop: 4 }}>
      <View style={{ gap: 10, alignItems: "center" }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Change period, currently ${stats.activityTitle}`}
          onPress={onPressPeriod}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Text
            style={{
              fontFamily: FONT_FAMILY.bold,
              fontSize: 28,
              lineHeight: 34,
              color: colors.foreground,
            }}
          >
            {stats.activityTitle}
          </Text>
          <Ionicons name="chevron-down" size={22} color={colors.muted} />
        </PressableScale>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StreakFlame height={14} color={colors.streak} />
          <Text
            style={{
              fontFamily: FONT_FAMILY.semibold,
              fontSize: 14,
              lineHeight: 18,
              color: colors.streak,
              fontVariant: ["tabular-nums"],
            }}
          >
            {streak}-day streak
          </Text>
          <Text style={{ color: colors.border }}>·</Text>
          <Text
            style={{
              fontFamily: FONT_FAMILY.semibold,
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 1.4,
              color: colors.muted,
              textTransform: "uppercase",
            }}
          >
            {stats.sectionTitle}
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontFamily: FONT_FAMILY.medium,
            fontSize: 15,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {stats.heroLabel}
        </Text>
        <Text
          style={{
            fontFamily: FONT_FAMILY.bold,
            fontSize: 56,
            lineHeight: 62,
            letterSpacing: -1.5,
            color: colors.foreground,
            fontVariant: ["tabular-nums"],
          }}
        >
          {stats.heroValue}
        </Text>
        {trend ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name={trend.icon} size={15} color={colors.foregroundSubtle} />
            <Text style={textStyle("bodyMd", colors.foregroundSubtle)}>{trend.text}</Text>
          </View>
        ) : (
          <Text style={textStyle("bodyMd", colors.muted)}>
            {stats.totalSessions === 0
              ? "Your first sessions will show up here."
              : stats.summaryLabel}
          </Text>
        )}
      </View>
    </View>
  );
}
