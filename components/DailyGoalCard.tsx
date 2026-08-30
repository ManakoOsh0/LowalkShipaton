/**
 * Daily Goal Card — today's session completion progress for the home dashboard.
 * Minimal pill with summary text and fill bar; Focus Coins never appear here.
 */
import { useEffect } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { NeuCard } from "@/components/NeuCard";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { HERO_MOTION } from "@/lib/heroMotion";
import type { DailyGoal } from "@/types/dashboard";

const SCREEN_PADDING = 16;
const PILL_RADIUS = 28;
const TRACK_HEIGHT = 16;
const BAR_INSET = 3;
const FILL_HEIGHT = TRACK_HEIGHT - BAR_INSET * 2;
const FILL_RADIUS = FILL_HEIGHT / 2;

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
  const reduceMotion = useReduceMotion();
  const trackWidth = useSharedValue(0);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = reduceMotion
      ? progress
      : withTiming(progress, {
          duration: HERO_MOTION.progressCardMs,
          easing: HERO_MOTION.progressEasing,
        });
  }, [animatedProgress, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => {
    if (trackWidth.value <= 0 || animatedProgress.value <= 0) {
      return { width: 0 };
    }

    const targetWidth = animatedProgress.value * trackWidth.value;
    // Keep at least one full capsule diameter so both ends stay rounded.
    const width = Math.max(targetWidth, FILL_HEIGHT);

    return { width };
  });

  return (
    <View
      style={{
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        backgroundColor: trackColor,
        padding: BAR_INSET,
        justifyContent: "center",
      }}
    >
      <View
        onLayout={(event: LayoutChangeEvent) => {
          trackWidth.value = event.nativeEvent.layout.width;
        }}
        style={{
          height: FILL_HEIGHT,
          width: "100%",
        }}
      >
        <Animated.View
          style={[
            {
              height: FILL_HEIGHT,
              borderTopLeftRadius: FILL_RADIUS,
              borderBottomLeftRadius: FILL_RADIUS,
              borderTopRightRadius: FILL_RADIUS,
              borderBottomRightRadius: FILL_RADIUS,
              backgroundColor: fillColor,
            },
            fillStyle,
          ]}
        />
      </View>
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
      }}
      contentStyle={{
        paddingHorizontal: 18,
        paddingVertical: 12,
        gap: 8,
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
        trackColor="rgba(236, 248, 241, 0.35)"
        fillColor={colors.success}
      />
    </NeuCard>
  );
}
