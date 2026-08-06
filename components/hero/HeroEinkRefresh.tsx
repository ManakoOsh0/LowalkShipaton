/**
 * HeroEinkRefresh — hardware redraw: invert pulse + scanline wipe on phase change.
 */
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { HERO_MOTION } from "@/lib/heroMotion";
import { TRMNL_THEME } from "@/lib/heroEink";

type HeroEinkRefreshProps = {
  active: boolean;
};

export function HeroEinkRefresh({ active }: HeroEinkRefreshProps) {
  const flashOpacity = useSharedValue(0);
  // Rest at 1 so the wipe overlay is fully transparent before/after a refresh pulse.
  const wipeProgress = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      flashOpacity.value = 0;
      wipeProgress.value = 1;
      return;
    }

    const riseMs = HERO_MOTION.refreshMs * 0.35;
    const fallMs = HERO_MOTION.refreshMs * 0.65;
    flashOpacity.value = withSequence(
      withTiming(0.88, { duration: riseMs }),
      withTiming(0, { duration: fallMs }),
    );
    wipeProgress.value = 0;
    wipeProgress.value = withTiming(1, { duration: HERO_MOTION.refreshMs * 1.1 });
  }, [active, flashOpacity, wipeProgress]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const wipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wipeProgress.value * 120 - 10 }],
    opacity: (1 - wipeProgress.value) * 0.55,
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          wipeStyle,
          { backgroundColor: TRMNL_THEME.textPrimary },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          flashStyle,
          { backgroundColor: TRMNL_THEME.textPrimary },
        ]}
      />
    </>
  );
}
