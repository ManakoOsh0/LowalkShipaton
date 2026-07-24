/**
 * WeeklyProgressCard — simple bar progress for this week's sessions.
 */
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { StatsCardShell } from "@/components/stats/StatsCardShell";
import type { WeeklyProgress } from "@/types/stats";
import { useThemeColors } from "@/hooks/useThemeColors";

type WeeklyProgressCardProps = {
  progress: WeeklyProgress;
};

export function WeeklyProgressCard({ progress }: WeeklyProgressCardProps) {
  const colors = useThemeColors();
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(progress.percent, { duration: 900 });
  }, [fill, progress.percent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${fill.value}%`,
  }));

  return (
    <StatsCardShell>
      <View style={{ paddingHorizontal: 20, paddingVertical: 22, gap: 14 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 16,
            lineHeight: 22,
            color: colors.foreground,
          }}
        >
          This Week
        </Text>

        <View
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: "100%",
                borderRadius: 999,
                backgroundColor: colors.skyDeep,
              },
              barStyle,
            ]}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 15,
              lineHeight: 21,
              color: colors.foreground,
            }}
          >
            {progress.completed} / {progress.target} Sessions Completed
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 15,
              lineHeight: 21,
              color: colors.skyDeep,
            }}
          >
            {progress.percent}%
          </Text>
        </View>
      </View>
    </StatsCardShell>
  );
}
