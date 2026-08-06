/**
 * StatsLifetimeSection — compact lifetime rollup + consistency heatmap.
 * Streak is already in the Activity hero; this is totals + pattern only.
 */
import { Text, View } from "react-native";

import { ContributionGrid } from "@/components/stats/ContributionGrid";
import { useThemeColors } from "@/hooks/useThemeColors";
import { textStyle } from "@/lib/typography";
import { FONT_FAMILY } from "@/theme/fonts";
import type { ContributionWeek } from "@/types/stats";

type StatsLifetimeSectionProps = {
  totalSessions: number;
  focusHoursLabel: string;
  contributionWeeks: ContributionWeek[];
};

export function StatsLifetimeSection({
  totalSessions,
  focusHoursLabel,
  contributionWeeks,
}: StatsLifetimeSectionProps) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
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
          Lifetime
        </Text>
        <Text
          style={{
            fontFamily: FONT_FAMILY.bold,
            fontSize: 20,
            lineHeight: 26,
            color: colors.foreground,
            fontVariant: ["tabular-nums"],
          }}
        >
          {totalSessions} sessions · {focusHoursLabel}
        </Text>
        <Text style={textStyle("bodySm", colors.muted)}>
          All completed focus time on Lowalk.
        </Text>
      </View>

      <ContributionGrid weeks={contributionWeeks} />
    </View>
  );
}
