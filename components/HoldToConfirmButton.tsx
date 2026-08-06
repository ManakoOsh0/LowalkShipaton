/**
 * HoldToConfirmButton — press-and-hold CTA with in-button progress fill and haptics.
 */
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DawnPathPillFrame, DAWN_PILL_GRADIENT } from "@/components/DawnPathPillFrame";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { HERO_MOTION } from "@/lib/heroMotion";

const DEFAULT_DURATION_MS = 2500;
const HOLD_TRACK_COLOR = "rgba(139, 52, 0, 0.55)";
const SHEET_BUTTON_RADIUS = CARD_RADIUS_SM;
const SHEET_BUTTON_LIP = 2;

type HoldToConfirmButtonProps = {
  label: string;
  holdingLabel?: string;
  durationMs?: number;
  onComplete: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function HoldToConfirmButton({
  label,
  holdingLabel = "Keep holding…",
  durationMs = DEFAULT_DURATION_MS,
  onComplete,
  disabled = false,
  loading = false,
}: HoldToConfirmButtonProps) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const holdingRef = useRef(false);
  const midpointHapticFiredRef = useRef(false);
  const midpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const clearTimers = useCallback(() => {
    if (midpointTimerRef.current) {
      clearTimeout(midpointTimerRef.current);
      midpointTimerRef.current = null;
    }
  }, []);

  const resetHold = useCallback(() => {
    holdingRef.current = false;
    setIsHolding(false);
    midpointHapticFiredRef.current = false;
    clearTimers();
    cancelAnimation(progress);
    progress.value = withTiming(0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [clearTimers, progress]);

  const fireComplete = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setIsHolding(false);
    clearTimers();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  }, [clearTimers, onComplete]);

  const handleMidpointHaptic = useCallback(() => {
    if (midpointHapticFiredRef.current) return;
    midpointHapticFiredRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      cancelAnimation(progress);
    };
  }, [clearTimers, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(Math.max(progress.value, 0), 1) }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;

    const effectiveDurationMs = reduceMotion
      ? HERO_MOTION.reduceMotionHoldMs
      : durationMs;

    holdingRef.current = true;
    setIsHolding(true);
    midpointHapticFiredRef.current = false;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: effectiveDurationMs, easing: HERO_MOTION.linearEasing },
      (finished) => {
        if (finished) {
          runOnJS(fireComplete)();
        }
      },
    );

    clearTimers();
    midpointTimerRef.current = setTimeout(() => {
      handleMidpointHaptic();
    }, effectiveDurationMs / 2);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (holdingRef.current && progress.value < 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    resetHold();
  };

  const displayLabel = loading ? "Getting location…" : isHolding ? holdingLabel : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold to confirm"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        opacity: disabled || loading ? 0.65 : 1,
        transform: [{ scale: pressed && !disabled && !loading ? 0.985 : 1 }],
      })}
    >
      <DawnPathPillFrame
        backgroundColor={isHolding ? HOLD_TRACK_COLOR : undefined}
        borderRadius={SHEET_BUTTON_RADIUS}
        lipDepth={SHEET_BUTTON_LIP}
        contentStyle={{
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isHolding ? (
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "100%",
                transformOrigin: "left center",
                overflow: "hidden",
              },
              fillStyle,
            ]}
          >
            <LinearGradient
              colors={[...DAWN_PILL_GRADIENT]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ flex: 1, width: "100%" }}
            />
          </Animated.View>
        ) : null}

        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 16,
              lineHeight: 22,
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            {displayLabel}
          </Text>
        )}
      </DawnPathPillFrame>
    </Pressable>
  );
}
