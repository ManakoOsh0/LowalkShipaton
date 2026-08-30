/**
 * HeroCounterProgress — dense vertical segment track for session countdowns.
 * Filled segments are solid ink; unfilled segments use a TRMNL halftone dither.
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import {
    HERO_COUNTER_SEGMENT_COUNT,
    HERO_COUNTER_SEGMENT_GAP,
    HERO_COUNTER_SEGMENT_HEIGHT,
} from "@/lib/heroEink";
import { HERO_MOTION } from "@/lib/heroMotion";

type HeroCounterProgressProps = {
  progressRatio: number;
};

function DitheredSegment() {
  const theme = useHeroTheme();
  const rows = 5;
  const cols = 2;

  return (
    <View
      style={{
        flex: 1,
        height: HERO_COUNTER_SEGMENT_HEIGHT,
        borderRadius: 999,
        overflow: "hidden",
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingHorizontal: 1,
      }}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: 1,
          }}
        >
          {Array.from({ length: cols }, (_, col) => (
            <View
              key={col}
              style={{
                width: 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: theme.textPrimary,
                opacity: (row + col) % 2 === 0 ? 0.5 : 0.22,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function AnimatedCounterSegment({
  index,
  animatedRatio,
}: {
  index: number;
  animatedRatio: SharedValue<number>;
}) {
  const theme = useHeroTheme();
  const fillStyle = useAnimatedStyle(() => {
    const filled =
      animatedRatio.value * HERO_COUNTER_SEGMENT_COUNT >= index + 1;

    return { opacity: filled ? 1 : 0 };
  });

  return (
    <View style={styles.segmentSlot}>
      <DitheredSegment />
      <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
        <View
          style={[
            styles.filledSegment,
            { backgroundColor: theme.accent },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export function HeroCounterProgress({ progressRatio }: HeroCounterProgressProps) {
  const reduceMotion = useReduceMotion();
  const clamped = Math.min(Math.max(progressRatio, 0), 1);
  const animatedRatio = useSharedValue(clamped);

  useEffect(() => {
    animatedRatio.value = reduceMotion
      ? clamped
      : withTiming(clamped, {
          duration: HERO_MOTION.progressMs,
          easing: HERO_MOTION.progressEasing,
        });
  }, [animatedRatio, clamped, reduceMotion]);

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: HERO_COUNTER_SEGMENT_GAP,
      }}
    >
      {Array.from({ length: HERO_COUNTER_SEGMENT_COUNT }, (_, index) => (
        <AnimatedCounterSegment
          key={index}
          index={index}
          animatedRatio={animatedRatio}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentSlot: {
    flex: 1,
    height: HERO_COUNTER_SEGMENT_HEIGHT,
  },
  filledSegment: {
    flex: 1,
    height: HERO_COUNTER_SEGMENT_HEIGHT,
    borderRadius: 999,
  },
});
