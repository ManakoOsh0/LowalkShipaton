/**
 * Session insights panel — visual recurring-session stats on the detail screen.
 * Success rate, streak, focus time, and recent-week attendance dots.
 */
import Svg, { Circle } from "react-native-svg";
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FocusNodeInsights, RecentOccurrenceOutcome } from "@/lib/focusNodeStats";

const RING_SIZE = 96;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const OUTCOME_COLORS: Record<RecentOccurrenceOutcome, string> = {
  completed: "#21C16B",
  skipped: "#6B7280",
  missed: "#FF8A00",
  overdue: "#FF8A00",
  upcoming: "#E5E7EB",
  today: "#6B8FB8",
};

type SessionInsightsPanelProps = {
  insights: FocusNodeInsights;
};

export function SessionInsightsPanel({ insights }: SessionInsightsPanelProps) {
  const colors = useThemeColors();
  const ringOffset = RING_CIRCUMFERENCE * (1 - insights.successRate / 100);
  const ringColor =
    insights.successRate >= 80
      ? colors.success
      : insights.successRate >= 50
        ? colors.skyDeep
        : colors.streak;

  return (
    <View style={{ gap: 16 }}>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 16,
          lineHeight: 22,
          color: colors.foreground,
        }}
      >
        Your stats for this session
      </Text>

      <NeuCard contentStyle={{ padding: 16, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: RING_SIZE,
              height: RING_SIZE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.border}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={ringColor}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <View style={{ position: "absolute", alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 22,
                  lineHeight: 28,
                  color: colors.foreground,
                }}
              >
                {insights.successRate}%
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 10,
                  lineHeight: 14,
                  color: colors.muted,
                }}
              >
                success
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 16,
                lineHeight: 22,
                color: colors.foreground,
              }}
            >
              {insights.successRateLabel}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              Based on your last {insights.recentHistory.length} weeks
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <MiniStat
            label="Streak"
            value={`${insights.currentStreak} wk`}
            sub={insights.bestStreak > 0 ? `Best ${insights.bestStreak}` : undefined}
            accent={colors.streak}
            colors={colors}
          />
          <MiniStat
            label="Completed"
            value={String(insights.totalCompletions)}
            sub={`${insights.completionsThisMonth} this month`}
            accent={colors.success}
            colors={colors}
          />
          <MiniStat
            label="Focus time"
            value={insights.focusHoursLabel}
            sub="All time"
            accent={colors.skyDeep}
            colors={colors}
          />
          <MiniStat
            label="Completions"
            value={String(insights.totalCompletions)}
            sub={`${insights.totalSkips} skipped`}
            accent={colors.warning}
            colors={colors}
          />
        </View>

        <View>
          <Text
            style={{
              marginBottom: 10,
              fontFamily: "Poppins-SemiBold",
              fontSize: 12,
              lineHeight: 16,
              color: colors.muted,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Recent weeks
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
            {insights.recentHistory.map((entry) => (
              <View key={entry.dateIso} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: "100%",
                    maxWidth: 28,
                    height: 28,
                    borderRadius: CARD_RADIUS_SM,
                    backgroundColor: OUTCOME_COLORS[entry.outcome],
                    borderWidth: entry.outcome === "today" ? 2 : 0,
                    borderColor: colors.skyDeep,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 9,
                    lineHeight: 12,
                    color: colors.muted,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {entry.shortLabel}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            borderRadius: CARD_RADIUS_SM,
            backgroundColor: colors.surface,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              lineHeight: 20,
              color: colors.foreground,
            }}
          >
            {insights.insightMessage}
          </Text>
        </View>
      </NeuCard>
    </View>
  );
}

function MiniStat({
  label,
  value,
  sub,
  accent,
  colors,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={{
        width: "47%",
        borderRadius: CARD_RADIUS_SM,
        backgroundColor: colors.surface,
        padding: 12,
        gap: 2,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 11,
          lineHeight: 14,
          color: colors.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 18,
          lineHeight: 24,
          color: accent,
        }}
      >
        {value}
      </Text>
      {sub ? (
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 11,
            lineHeight: 14,
            color: colors.muted,
          }}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
