/**
 * MascotRadianceRings — expanding glow pulses behind sheet mascot badges.
 * Sized to the pin head so pulses read as radiance while the pin stays on top.
 */
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  MAP_PIN_HALO_CY,
  MAP_PIN_HALO_RADIUS,
  MAP_PIN_VIEW_SIZE,
} from "@/constants/sheetPinArt";
import { useReduceMotion } from "@/hooks/useHeroMotion";

export const MASCOT_HALO_CENTER_Y_RATIO = MAP_PIN_HALO_CY / MAP_PIN_VIEW_SIZE;
export const MASCOT_HALO_RADIUS_RATIO = MAP_PIN_HALO_RADIUS / MAP_PIN_VIEW_SIZE;

const RING_COUNT = 3;
const PULSE_MS = 2800;
const STAGGER_MS = 900;

type RadiateRingProps = {
  size: number;
  color: string;
  delayMs: number;
  animate: boolean;
  peakOpacity: number;
};

function RadiateRing({ size, color, delayMs, animate, peakOpacity }: RadiateRingProps) {
  const progress = useSharedValue(0);
  const ringSize = size * MASCOT_HALO_RADIUS_RATIO * 2;
  const top = size * MASCOT_HALO_CENTER_Y_RATIO - ringSize / 2;
  const left = size / 2 - ringSize / 2;

  useEffect(() => {
    if (!animate) {
      progress.value = 0;
      return;
    }

    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
  }, [animate, delayMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.93 + progress.value * 0.55 }],
    opacity: (1 - progress.value) * peakOpacity,
  }));

  if (!animate) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top,
          left,
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

type MascotRadianceRingsProps = {
  size: number;
  color: string;
  radiating?: boolean;
  /** Max opacity for each expanding pulse ring. */
  peakOpacity?: number;
  /** Always-on soft glow behind the mascot. */
  baseGlowOpacity?: number;
};

export function MascotRadianceRings({
  size,
  color,
  radiating = true,
  peakOpacity = 0.34,
  baseGlowOpacity = 0.13,
}: MascotRadianceRingsProps) {
  const reduceMotion = useReduceMotion();
  const animate = radiating && !reduceMotion;
  const ringSize = size * MASCOT_HALO_RADIUS_RATIO * 2;
  const haloTop = size * MASCOT_HALO_CENTER_Y_RATIO - ringSize / 2;
  const haloLeft = size / 2 - ringSize / 2;

  return (
    <>
      {baseGlowOpacity > 0 ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: haloTop - ringSize * 0.1,
              left: haloLeft - ringSize * 0.1,
              width: ringSize * 1.2,
              height: ringSize * 1.2,
              borderRadius: (ringSize * 1.2) / 2,
              backgroundColor: color,
              opacity: baseGlowOpacity * 0.4,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: haloTop,
              left: haloLeft,
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: color,
              opacity: baseGlowOpacity,
            }}
          />
        </>
      ) : null}

      {Array.from({ length: RING_COUNT }, (_, index) => (
        <RadiateRing
          key={index}
          size={size}
          color={color}
          delayMs={index * STAGGER_MS}
          animate={animate}
          peakOpacity={peakOpacity}
        />
      ))}

      {radiating && !animate ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: haloTop - ringSize * 0.08,
            left: haloLeft - ringSize * 0.08,
            width: ringSize * 1.16,
            height: ringSize * 1.16,
            borderRadius: (ringSize * 1.16) / 2,
            backgroundColor: color,
            opacity: baseGlowOpacity * 0.65,
          }}
        />
      ) : null}
    </>
  );
}
