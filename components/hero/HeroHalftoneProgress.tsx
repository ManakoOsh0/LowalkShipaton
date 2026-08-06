/**
 * HeroHalftoneProgress — travel progress as stippled e-ink pillars.
 * Filled route reads as solid ink; remaining path fades through halftone steps.
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
import {
  HERO_HALFTONE_PILLAR,
  HERO_HALFTONE_PROGRESS_SEGMENTS,
  TRMNL_THEME,
} from "@/lib/heroEink";
import { halftoneDotVisible } from "@/lib/heroHalftone";
import { HERO_MOTION } from "@/lib/heroMotion";

type HeroHalftoneProgressProps = {
  progressRatio: number;
};

function densityForSegment(index: number, filled: number): number {
  const segFill = Math.min(Math.max(filled - index, 0), 1);

  if (segFill >= 1) return 1;
  if (segFill > 0) return 0.42 + segFill * 0.58;

  const dist = index - filled;
  return Math.max(0.06, 0.52 - dist * 0.045);
}

function HalftonePillar({ density }: { density: number }) {
  const { rows, cols, dotSize, width, height, radius } = HERO_HALFTONE_PILLAR;

  if (density >= 0.98) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius: radius,
          borderCurve: "continuous",
          backgroundColor: TRMNL_THEME.textPrimary,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        borderCurve: "continuous",
        overflow: "hidden",
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingVertical: 2,
        paddingHorizontal: 1,
      }}
    >
      {Array.from({ length: rows }, (_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            width: "100%",
            gap: 1,
          }}
        >
          {Array.from({ length: cols }, (_, col) =>
            halftoneDotVisible(row, col, density) ? (
              <View
                key={col}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: TRMNL_THEME.textPrimary,
                }}
              />
            ) : (
              <View key={col} style={{ width: dotSize, height: dotSize }} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function AnimatedHalftonePillar({
  index,
  animatedRatio,
}: {
  index: number;
  animatedRatio: SharedValue<number>;
}) {
  const unfilledDensity = densityForSegment(index, 0);

  const fillStyle = useAnimatedStyle(() => {
    const filled = animatedRatio.value * HERO_HALFTONE_PROGRESS_SEGMENTS;
    const segFill = Math.min(Math.max(filled - index, 0), 1);
    return { opacity: segFill };
  });

  return (
    <View style={styles.pillarSlot}>
      <HalftonePillar density={unfilledDensity} />
      <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
        <HalftonePillar density={1} />
      </Animated.View>
    </View>
  );
}

export function HeroHalftoneProgress({ progressRatio }: HeroHalftoneProgressProps) {
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
    <View style={styles.track}>
      {Array.from({ length: HERO_HALFTONE_PROGRESS_SEGMENTS }, (_, index) => (
        <AnimatedHalftonePillar key={index} index={index} animatedRatio={animatedRatio} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: HERO_HALFTONE_PILLAR.gap,
  },
  pillarSlot: {
    width: HERO_HALFTONE_PILLAR.width,
    height: HERO_HALFTONE_PILLAR.height,
  },
});
