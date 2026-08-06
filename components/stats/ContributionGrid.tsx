/**
 * ContributionGrid — GitHub-style daily activity heatmap for consistency.
 */
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { HERO_MOTION } from "@/lib/heroMotion";
import type { ContributionLevel, ContributionWeek } from "@/types/stats";
import { useThemeColors } from "@/hooks/useThemeColors";

const CELL_GAP = 3;
const ROW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type ContributionGridProps = {
  weeks: ContributionWeek[];
};

function levelColor(
  level: ContributionLevel,
  colors: { border: string; skyDeep: string },
): string {
  switch (level) {
    case 3:
      return colors.skyDeep;
    case 2:
      return "rgba(107, 143, 184, 0.55)";
    case 1:
      return "rgba(107, 143, 184, 0.28)";
    default:
      return colors.border;
  }
}

export function ContributionGrid({ weeks }: ContributionGridProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    opacity.value = reduceMotion
      ? 1
      : withTiming(1, { duration: HERO_MOTION.statsFadeMs });
  }, [opacity, reduceMotion]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <StatsCardShell>
      <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 16,
            lineHeight: 22,
            color: colors.foreground,
            marginBottom: 14,
          }}
        >
          Consistency
        </Text>

        <Animated.View style={[{ flexDirection: "row", gap: 8 }, fadeStyle]}>
          <View style={{ paddingTop: 1, gap: CELL_GAP }}>
            {ROW_LABELS.map((label, index) => (
              <View key={`${label}-${index}`} style={{ height: 11, justifyContent: "center" }}>
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 9,
                    lineHeight: 12,
                    color: colors.muted,
                    width: 10,
                  }}
                >
                  {index % 2 === 0 ? label : ""}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1, flexDirection: "row", gap: CELL_GAP }}>
            {weeks.map((week) => (
              <View key={week.weekStartIso} style={{ flex: 1, gap: CELL_GAP }}>
                {week.days.map((day) => (
                  <View
                    key={day.dateIso}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      maxHeight: 11,
                      minHeight: 11,
                      borderRadius: 3,
                      backgroundColor: levelColor(day.level, colors),
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </Animated.View>

        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <Text style={{ fontFamily: "Poppins-Regular", fontSize: 11, color: colors.muted }}>
            Less
          </Text>
          {([0, 1, 2, 3] as const).map((level) => (
            <View
              key={level}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: levelColor(level, colors),
              }}
            />
          ))}
          <Text style={{ fontFamily: "Poppins-Regular", fontSize: 11, color: colors.muted }}>
            More
          </Text>
        </View>
      </View>
    </StatsCardShell>
  );
}
