/**
 * SessionsBarChart — period activity bars (sessions or estimated focus minutes).
 */
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { HERO_MOTION } from "@/lib/heroMotion";
import type { PeriodStats } from "@/types/stats";

const CHART_HEIGHT = 168;
const BAR_GAP = 10;
const BAR_RADIUS = 5;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type SessionsBarChartProps = {
  stats: PeriodStats;
  /** Hide title/summary when a parent hero already owns hierarchy. */
  bare?: boolean;
  /** Which bar value to plot. Defaults to sessions. */
  metric?: "sessions" | "focusMinutes";
};

export function SessionsBarChart({
  stats,
  bare = false,
  metric = "sessions",
}: SessionsBarChartProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const values = stats.bars.map((bar) =>
    metric === "focusMinutes" ? bar.focusMinutes : bar.value,
  );
  const maxValue = Math.max(...values, 1);
  const avgValue =
    values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  const chartWidth = useMemo(
    () => Math.max(stats.bars.length * 28, 280),
    [stats.bars.length],
  );
  const avgY =
    CHART_HEIGHT - 8 - Math.max((avgValue / maxValue) * (CHART_HEIGHT - 12), 0);

  const emptyCopy =
    stats.period === "week"
      ? "this week"
      : stats.period === "month"
        ? "this month"
        : "this year";

  const chart = (
    <View style={{ height: CHART_HEIGHT + 24 }}>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}>
        {[0.5, 1].map((fraction) => {
          const y = CHART_HEIGHT - 8 - fraction * (CHART_HEIGHT - 12);
          return (
            <Line
              key={fraction}
              x1={0}
              x2={chartWidth}
              y1={y}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          );
        })}
        {avgValue > 0 ? (
          <>
            <Line
              x1={0}
              x2={chartWidth - 36}
              y1={avgY}
              y2={avgY}
              stroke={colors.muted}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
            <SvgText
              x={chartWidth}
              y={avgY + 3}
              fill={colors.muted}
              fontSize="10"
              fontFamily="Poppins-SemiBold"
              textAnchor="end"
            >
              AVG
            </SvgText>
          </>
        ) : null}
        {stats.bars.map((bar, index) => (
          <BarColumn
            key={`${bar.label}-${bar.dateIso ?? index}`}
            index={index}
            barCount={stats.bars.length}
            value={metric === "focusMinutes" ? bar.focusMinutes : bar.value}
            maxValue={maxValue}
            chartWidth={chartWidth}
            fill={colors.foreground}
            trackFill={bare ? "transparent" : colors.border}
            reduceMotion={reduceMotion}
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
  );

  if (bare) {
    return (
      <View style={{ gap: 12 }}>
        {stats.totalSessions === 0 ? (
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.muted,
            }}
          >
            No sessions yet {emptyCopy}.
          </Text>
        ) : null}
        {chart}
      </View>
    );
  }

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
            No sessions yet {emptyCopy}.
          </Text>
        ) : null}

        {chart}
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
  reduceMotion,
}: {
  index: number;
  barCount: number;
  value: number;
  maxValue: number;
  chartWidth: number;
  fill: string;
  trackFill: string;
  reduceMotion: boolean;
}) {
  const slotWidth = chartWidth / barCount;
  const barWidth = Math.max(slotWidth - BAR_GAP, 6);
  const x = index * slotWidth + (slotWidth - barWidth) / 2;
  const targetHeight = maxValue > 0 ? (value / maxValue) * (CHART_HEIGHT - 12) : 0;
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(targetHeight, value > 0 ? 8 : 4);
    animatedHeight.value = reduceMotion
      ? target
      : withTiming(target, { duration: HERO_MOTION.statsBarMs });
  }, [animatedHeight, reduceMotion, targetHeight, value]);

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
