/**
 * HeroKaomoji — monospace kaomoji status glyph for the e-ink hero display.
 * Frame-swap loops with optional bob and sway; respects Reduce Motion.
 */
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  getHeroKaomojiSequence,
  HERO_KAOMOJI_FONT,
  HERO_KAOMOJI_SESSION_FONT,
  HERO_KAOMOJI_SESSION_SLOT,
  HERO_KAOMOJI_SLOT,
  resolveKaomojiPlayback,
} from "@/constants/heroKaomoji";
import type { HeroDisplayPhase, HeroIdleMood, HeroWaitingMood } from "@/lib/heroDisplay";
import { TRMNL_THEME } from "@/lib/heroEink";
import { HERO_MOTION } from "@/lib/heroMotion";

type HeroKaomojiProps = {
  phase: HeroDisplayPhase;
  reduceMotion: boolean;
  /** Session header chip — CLASS, GYM, LIBRARY, FOCUS. */
  kindLabel?: string;
  /** Idle mood — day complete vs empty calendar vs break. */
  idleMood?: HeroIdleMood;
  /** Waiting mood — upcoming vs leave now. */
  waitingMood?: HeroWaitingMood;
  /** Syncs faster verify frames with HeroVerifyingPulse. */
  verifyPulse?: boolean;
  /** Resets the frame loop when the hero phase or node changes. */
  motionKey?: string;
};

export function HeroKaomoji({
  phase,
  reduceMotion,
  kindLabel,
  idleMood,
  waitingMood,
  verifyPulse = false,
  motionKey,
}: HeroKaomojiProps) {
  const isSession = phase === "session";
  const slot = isSession ? HERO_KAOMOJI_SESSION_SLOT : HERO_KAOMOJI_SLOT;
  const font = isSession ? HERO_KAOMOJI_SESSION_FONT : HERO_KAOMOJI_FONT;
  const sequence = getHeroKaomojiSequence(phase, kindLabel, idleMood, waitingMood);
  const playback = sequence ? resolveKaomojiPlayback(sequence, verifyPulse) : null;
  const [frameIndex, setFrameIndex] = useState(0);
  const bob = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [idleMood, kindLabel, motionKey, phase, verifyPulse, waitingMood]);

  useEffect(() => {
    if (!playback || !sequence) {
      return;
    }

    if (reduceMotion) {
      setFrameIndex(sequence.playOnce ? playback.frames.length - 1 : 0);
      return;
    }

    if (playback.frames.length < 2) {
      return;
    }

    setFrameIndex(0);
    let current = 0;

    const id = setInterval(() => {
      if (sequence.playOnce) {
        if (current >= playback.frames.length - 1) {
          clearInterval(id);
          return;
        }
        current += 1;
        setFrameIndex(current);
        return;
      }

      current = (current + 1) % playback.frames.length;
      setFrameIndex(current);
    }, playback.intervalMs);

    return () => clearInterval(id);
  }, [idleMood, kindLabel, motionKey, phase, playback, reduceMotion, sequence, verifyPulse]);

  useEffect(() => {
    if (!sequence || reduceMotion) {
      bob.value = 0;
      sway.value = 0;
      return;
    }

    const stepMs =
      verifyPulse && sequence.verifyIntervalMs != null
        ? sequence.verifyIntervalMs / 2
        : sequence.intervalMs / 2;

    if (sequence.bobPx > 0) {
      bob.value = withRepeat(
        withSequence(
          withTiming(-sequence.bobPx, {
            duration: stepMs,
            easing: HERO_MOTION.linearEasing,
          }),
          withTiming(0, {
            duration: stepMs,
            easing: HERO_MOTION.linearEasing,
          }),
        ),
        -1,
        false,
      );
    } else {
      bob.value = 0;
    }

    const swayPx = sequence.swayPx ?? 0;
    if (swayPx > 0) {
      sway.value = withRepeat(
        withSequence(
          withTiming(swayPx, {
            duration: stepMs,
            easing: HERO_MOTION.linearEasing,
          }),
          withTiming(-swayPx, {
            duration: stepMs,
            easing: HERO_MOTION.linearEasing,
          }),
        ),
        -1,
        false,
      );
    } else {
      sway.value = 0;
    }
  }, [bob, motionKey, phase, reduceMotion, sequence, sway, verifyPulse]);

  const motionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sway.value }, { translateY: bob.value }],
  }));

  if (!sequence || !playback) {
    return null;
  }

  const frame = playback.frames[frameIndex] ?? playback.frames[0]!;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={playback.accessibilityLabel}
      style={{
        width: slot.width,
        height: slot.height,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={motionStyle}>
        <Text
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          allowFontScaling={false}
          style={{
            fontFamily: font.family,
            fontSize: font.size,
            lineHeight: font.lineHeight,
            letterSpacing: font.letterSpacing,
            fontWeight: font.weight,
            color: TRMNL_THEME.textPrimary,
            textAlign: "center",
            width: slot.width,
            ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
          }}
        >
          {frame}
        </Text>
      </Animated.View>
    </View>
  );
}
