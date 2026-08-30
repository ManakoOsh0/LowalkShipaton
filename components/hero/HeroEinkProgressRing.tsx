/**
 * HeroEinkProgressRing — TRMNL ink arc around the active-session countdown.
 */
import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import { HERO_MOTION } from "@/lib/heroMotion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type HeroEinkProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children: ReactNode;
};

export function HeroEinkProgressRing({
  progress,
  size = 68,
  strokeWidth = 2,
  children,
}: HeroEinkProgressRingProps) {
  const theme = useHeroTheme();
  const reduceMotion = useReduceMotion();
  const animatedProgress = useSharedValue(progress);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const clamped = Math.min(Math.max(progress, 0), 1);
    animatedProgress.value = reduceMotion
      ? clamped
      : withTiming(clamped, {
          duration: HERO_MOTION.progressMs,
          easing: HERO_MOTION.progressEasing,
        });
  }, [animatedProgress, progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    const clamped = Math.min(Math.max(animatedProgress.value, 0), 1);
    return {
      strokeDashoffset: circumference * (1 - clamped),
    };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.wellBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
