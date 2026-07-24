/**
 * SessionsBarChart — simple motivating bar chart for sessions completed per period.
 */
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { PeriodStats } from "@/types/stats";

const CHART_HEIGHT = 140;
const BAR_GAP = 8;
const BAR_RADIUS = 6;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type SessionsBarChartProps = {
  stats: PeriodStats;
};

export function SessionsBarChart({ stats }: SessionsBarChartProps) {
  const colors = useThemeColors();
  const maxValue = Math.max(...stats.bars.map((bar) => bar.value), 1);
  const chartWidth = useMemo(() => Math.max(stats.bars.length * 28, 280), [stats.bars.length]);

  return (
    <StatsCardShell>
      <View style={{ paddingHorizontal: 20, paddingVertical: 22, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 16,
              lineHeight: 22,
              color: colors.foreground,
            }}
          >
            {stats.sectionTitle}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 15,
              lineHeight: 21,
              color: colors.skyDeep,
            }}
          >
            {stats.summaryLabel}
          </Text>
        </View>

        {stats.totalSessions === 0 ? (
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            No sessions yet {stats.period === "week" ? "this week" : stats.period === "month" ? "this month" : "this year"}.
          </Text>
        ) : null}

        <View style={{ height: CHART_HEIGHT + 24 }}>
          <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}>
            {stats.bars.map((bar, index) => (
              <BarColumn
                key={`${bar.label}-${bar.dateIso ?? index}`}
                index={index}
                barCount={stats.bars.length}
                value={bar.value}
                maxValue={maxValue}
                chartWidth={chartWidth}
                fill={colors.skyDeep}
                trackFill={colors.border}
              />
            ))}
          </Svg>

          <View
            style={{
              flexDirection: "row",
              marginTop: 8,
              paddingHorizontal: 2,
            }}
          >
            {stats.bars.map((bar, index) => (
              <View
                key={`label-${bar.label}-${index}`}
                style={{ flex: 1, alignItems: "center" }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: stats.period === "year" ? 9 : 11,
                    lineHeight: 14,
                    color: colors.muted,
                  }}
                  numberOfLines={1}
                >
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </StatsCardShell>
  );
}

function BarColumn({
  index,
  barCount,
  value,
  maxValue,
  chartWidth,
  fill,
  trackFill,
}: {
  index: number;
  barCount: number;
  value: number;
  maxValue: number;
  chartWidth: number;
  fill: string;
  trackFill: string;
}) {
  const slotWidth = chartWidth / barCount;
  const barWidth = Math.max(slotWidth - BAR_GAP, 6);
  const x = index * slotWidth + (slotWidth - barWidth) / 2;
  const targetHeight = maxValue > 0 ? (value / maxValue) * (CHART_HEIGHT - 12) : 0;
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withTiming(Math.max(targetHeight, value > 0 ? 8 : 4), {
      duration: 700,
    });
  }, [animatedHeight, targetHeight, value]);

  const trackProps = {
    x,
    y: 4,
    width: barWidth,
    height: CHART_HEIGHT - 12,
    rx: BAR_RADIUS,
    ry: BAR_RADIUS,
    fill: trackFill,
  };

  const animatedBarProps = useAnimatedProps(() => ({
    x,
    y: CHART_HEIGHT - 8 - animatedHeight.value,
    width: barWidth,
    height: animatedHeight.value,
    rx: BAR_RADIUS,
    ry: BAR_RADIUS,
    fill,
  }));

  return (
    <>
      <Rect {...trackProps} />
      <AnimatedRect animatedProps={animatedBarProps} />
    </>
  );
}
