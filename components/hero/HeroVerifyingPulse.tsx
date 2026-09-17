/**
 * HeroVerifyingPulse — blink opacity for verifying hero moments.
 */
import { useEffect, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import { useReduceMotion } from "@/hooks/useHeroMotion";
import { HERO_MOTION } from "@/lib/heroMotion";

type HeroVerifyingPulseProps = {
  active: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroVerifyingPulse({
  active,
  children,
  style,
}: HeroVerifyingPulseProps) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);
  const halfBlink = HERO_MOTION.verifyBlinkMs / 2;

  useEffect(() => {
    if (!active || reduceMotion) {
      opacity.value = 1;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.62, { duration: halfBlink, easing: HERO_MOTION.linearEasing }),
        withTiming(1, { duration: halfBlink, easing: HERO_MOTION.linearEasing }),
      ),
      -1,
      false,
    );
  }, [active, halfBlink, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
