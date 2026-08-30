/**
 * Shared skeleton pulse — iOS-redacted style placeholders that match final layout.
 * One scope drives every bone so the shimmer stays in sync and Reduce Motion stays static.
 */
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { useReduceMotion } from "@/hooks/useHeroMotion";

const PULSE_MS = 1100;
const PULSE_MIN = 0.42;
const PULSE_MAX = 0.88;
const STATIC_OPACITY = 0.58;

const BONE_FILL: Record<"onDark" | "onLight", string> = {
  onDark: "rgba(255, 255, 255, 0.1)",
  onLight: "rgba(0, 0, 0, 0.12)",
};

type SkeletonMotionValue = {
  opacity: SharedValue<number>;
};

const SkeletonMotionContext = createContext<SkeletonMotionValue | null>(null);

type SkeletonScopeProps = {
  children: ReactNode;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** Wraps a loading layout so bones share one pulse and announce a busy region. */
export function SkeletonScope({
  children,
  label = "Loading",
  style,
}: SkeletonScopeProps) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(reduceMotion ? STATIC_OPACITY : PULSE_MIN);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = STATIC_OPACITY;
      return;
    }

    opacity.value = PULSE_MIN;
    opacity.value = withRepeat(
      withTiming(PULSE_MAX, {
        duration: PULSE_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [opacity, reduceMotion]);

  return (
    <SkeletonMotionContext.Provider value={{ opacity }}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}
        pointerEvents="none"
        style={style}
      >
        {children}
      </View>
    </SkeletonMotionContext.Provider>
  );
}

type SkeletonBoneProps = {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  tone?: "onDark" | "onLight";
  style?: StyleProp<ViewStyle>;
};

/** Rounded placeholder bar/tile. Pulse lives on opacity only. */
export function SkeletonBone({
  width,
  height,
  borderRadius = 8,
  tone = "onDark",
  style,
}: SkeletonBoneProps) {
  const motion = useContext(SkeletonMotionContext);
  const fallbackOpacity = useSharedValue(STATIC_OPACITY);
  const opacity = motion?.opacity ?? fallbackOpacity;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no"
      style={[
        {
          width,
          height,
          borderRadius,
          borderCurve: "continuous",
          backgroundColor: BONE_FILL[tone],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
