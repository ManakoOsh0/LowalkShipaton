/**
 * StreakFlameEngulfBackground — animated flame wash that rises to fill the streak screen.
 * Layered gradients + flickering flame sprites; sits behind celebration content.
 */
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Dimensions, StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StreakFlame } from "@/components/StreakFlame";
import { useThemeColors } from "@/hooks/useThemeColors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FLAME_SPRITES = [
  { left: "4%", height: 110, delay: 0, drift: -8 },
  { left: "16%", height: 150, delay: 80, drift: 6 },
  { left: "28%", height: 130, delay: 40, drift: -4 },
  { left: "40%", height: 180, delay: 120, drift: 5 },
  { left: "52%", height: 160, delay: 60, drift: -6 },
  { left: "64%", height: 140, delay: 100, drift: 4 },
  { left: "76%", height: 120, delay: 20, drift: -5 },
  { left: "88%", height: 100, delay: 140, drift: 7 },
] as const;

type StreakFlameEngulfBackgroundProps = {
  active: boolean;
};

export function StreakFlameEngulfBackground({ active }: StreakFlameEngulfBackgroundProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const engulf = useSharedValue(0);
  const flicker = useSharedValue(0.65);
  const sway = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      engulf.value = 0;
      return;
    }

    engulf.value = withTiming(1, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });

    flicker.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 520, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.62, { duration: 680, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.88, { duration: 420, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    sway.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [active, engulf, flicker, sway]);

  const washStyle = useAnimatedStyle(() => ({
    opacity: engulf.value * 0.42,
  }));

  const riseStyle = useAnimatedStyle(() => ({
    height: engulf.value * (SCREEN_HEIGHT - insets.top),
    opacity: 0.35 + engulf.value * 0.45,
  }));

  const edgeLeftStyle = useAnimatedStyle(() => ({
    opacity: engulf.value * 0.55,
    transform: [{ translateX: sway.value * -10 }, { scaleY: 0.75 + engulf.value * 0.25 }],
  }));

  const edgeRightStyle = useAnimatedStyle(() => ({
    opacity: engulf.value * 0.55,
    transform: [{ translateX: sway.value * 10 }, { scaleY: 0.75 + engulf.value * 0.25 }],
  }));

  const spriteGroupStyle = useAnimatedStyle(() => ({
    opacity: flicker.value * engulf.value,
    transform: [{ translateY: (1 - engulf.value) * 120 }, { scale: 0.88 + flicker.value * 0.12 }],
  }));

  const topFadeStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + (1 - engulf.value) * 0.55,
  }));

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.streak }, washStyle]} />

      <Animated.View style={[styles.riseColumn, riseStyle]}>
        <LinearGradient
          colors={["rgba(255, 150, 0, 0)", "rgba(255, 120, 0, 0.35)", "rgba(255, 90, 0, 0.72)", colors.streak]}
          locations={[0, 0.35, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.edgeColumn, styles.edgeLeft, edgeLeftStyle]}>
        <LinearGradient
          colors={["rgba(255, 200, 0, 0.55)", "rgba(255, 140, 0, 0.08)", "rgba(255, 140, 0, 0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.edgeColumn, styles.edgeRight, edgeRightStyle]}>
        <LinearGradient
          colors={["rgba(255, 140, 0, 0)", "rgba(255, 140, 0, 0.08)", "rgba(255, 200, 0, 0.55)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.flameRow, spriteGroupStyle]}>
        {FLAME_SPRITES.map((sprite, index) => (
          <FlameSprite key={index} {...sprite} engulf={engulf} flicker={flicker} />
        ))}
      </Animated.View>

      <Animated.View style={[styles.topFade, topFadeStyle]}>
        <LinearGradient
          colors={[colors.background, "rgba(240, 237, 233, 0.65)", "rgba(240, 237, 233, 0)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function FlameSprite({
  left,
  height,
  delay,
  drift,
  engulf,
  flicker,
}: {
  left: DimensionValue;
  height: number;
  delay: number;
  drift: number;
  engulf: SharedValue<number>;
  flicker: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: (0.45 + flicker.value * 0.55) * engulf.value,
    transform: [
      { translateY: (1 - engulf.value) * (80 + delay * 0.4) },
      { translateX: drift * engulf.value },
      { scale: 0.85 + flicker.value * 0.2 },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", left, bottom: -8 }, style]}>
      <StreakFlame height={height} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  riseColumn: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  edgeColumn: {
    position: "absolute",
    bottom: 0,
    width: SCREEN_WIDTH * 0.34,
    height: SCREEN_HEIGHT * 0.72,
  },
  edgeLeft: {
    left: 0,
  },
  edgeRight: {
    right: 0,
  },
  flameRow: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.28,
  },
});
