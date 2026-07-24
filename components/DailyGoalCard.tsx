/**
 * Daily Goal Card — today's session completion progress for the home dashboard.
 * Minimal pill with summary text and thin bar; Focus Coins never appear here.
 */
import { useEffect } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { NeuCard } from "@/components/NeuCard";
import type { DailyGoal } from "@/types/dashboard";
import { useThemeColors } from "@/hooks/useThemeColors";

const SCREEN_PADDING = 16;
const PILL_RADIUS = 28;
const BAR_HEIGHT = 5;
const MIN_FILL_WIDTH = 8;
const PROGRESS_ANIMATION_MS = 450;

type AnimatedProgressBarProps = {
  progress: number;
  trackColor: string;
  fillColor: string;
};

function AnimatedProgressBar({
  progress,
  trackColor,
  fillColor,
}: AnimatedProgressBarProps) {
  const trackWidth = useSharedValue(0);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: PROGRESS_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progress]);

  const fillStyle = useAnimatedStyle(() => {
    if (trackWidth.value <= 0 || animatedProgress.value <= 0) {
      return { width: 0 };
    }

    return {
      width: Math.max(trackWidth.value * animatedProgress.value, MIN_FILL_WIDTH),
    };
  });

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        trackWidth.value = event.nativeEvent.layout.width;
      }}
      style={{
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height: BAR_HEIGHT,
            borderRadius: BAR_HEIGHT / 2,
            backgroundColor: fillColor,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

type DailyGoalCardProps = DailyGoal;

export function DailyGoalCard({ completed, target }: DailyGoalCardProps) {
  const colors = useThemeColors();
  const safeTarget = Math.max(target, 0);
  const clampedCompleted = Math.min(Math.max(completed, 0), safeTarget || 0);
  const progressRatio = safeTarget === 0 ? 0 : clampedCompleted / safeTarget;
  const isComplete = safeTarget > 0 && clampedCompleted >= safeTarget;

  const label =
    safeTarget === 0
      ? "No sessions today"
      : isComplete
        ? "All sessions complete"
        : `${clampedCompleted} of ${safeTarget} sessions done`;

  return (
    <NeuCard
      borderRadius={PILL_RADIUS}
      style={{
        marginHorizontal: SCREEN_PADDING,
        marginTop: 4,
      }}
      contentStyle={{
        paddingHorizontal: 18,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text
          style={{
            flex: 1,
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: 20,
            color: colors.foreground,
          }}
        >
          {label}
        </Text>
        {isComplete ? (
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              lineHeight: 14,
              color: colors.success,
            }}
          >
            Done
          </Text>
        ) : null}
      </View>

      <AnimatedProgressBar
        progress={progressRatio}
        trackColor={colors.border}
        fillColor={isComplete ? colors.success : colors.primary}
      />
    </NeuCard>
  );
}
