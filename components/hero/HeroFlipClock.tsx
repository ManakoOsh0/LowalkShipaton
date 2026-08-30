/**
 * HeroFlipClock — split-flap countdown for active sessions (MM:SS).
 * Top flap flips on each tick; tuned for the sage e-ink well.
 */
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import { HERO_FLIP_CLOCK, HERO_TIMER_PLAQUE_RADIUS } from "@/lib/heroEink";
import { HERO_MOTION } from "@/lib/heroMotion";

/** Parses MM:SS or M:SS countdown labels from the session engine. */
export function parseMmSsCountdown(
  label: string,
): { minutes: string; seconds: string } | null {
  const match = label.trim().match(/^(\d+):(\d{2})$/);
  if (!match) return null;

  return {
    minutes: match[1]!.padStart(2, "0"),
    seconds: match[2]!,
  };
}

type FlipFlapPanelProps = {
  value: string;
  cardColor: string;
  height: number;
  minWidth: number;
  digitSize: number;
  digitLineHeight: number;
  radius: number;
};

function FlipDigit({
  value,
  digitSize,
  digitLineHeight,
  panelHeight,
}: {
  value: string;
  digitSize: number;
  digitLineHeight: number;
  panelHeight: number;
}) {
  const theme = useHeroTheme();

  return (
    <View
      style={{
        height: panelHeight,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TrmnlText
        variant="countdown"
        numberOfLines={1}
        style={{
          fontSize: digitSize,
          lineHeight: digitLineHeight,
          color: theme.textPrimary,
        }}
      >
        {value}
      </TrmnlText>
    </View>
  );
}

function FlipFlapPanel({
  value,
  cardColor,
  height,
  minWidth,
  digitSize,
  digitLineHeight,
  radius,
}: FlipFlapPanelProps) {
  const theme = useHeroTheme();
  const reduceMotion = useReduceMotion();
  const flipProgress = useSharedValue(0);
  const prevValueRef = useRef(value);
  const [outgoingValue, setOutgoingValue] = useState(value);

  useEffect(() => {
    if (value === prevValueRef.current) return;

    if (reduceMotion) {
      prevValueRef.current = value;
      setOutgoingValue(value);
      return;
    }

    setOutgoingValue(prevValueRef.current);
    flipProgress.value = 0;
    flipProgress.value = withTiming(
      1,
      {
        duration: HERO_MOTION.flipMs,
        easing: HERO_MOTION.progressEasing,
      },
      (finished) => {
        if (!finished) return;
        prevValueRef.current = value;
        flipProgress.value = 0;
        runOnJS(setOutgoingValue)(value);
      },
    );
  }, [flipProgress, reduceMotion, value]);

  const topFlapStyle = useAnimatedStyle(() => {
    const phase = Math.min(flipProgress.value * 2, 1);
    const angle = phase * 90;
    return {
      opacity: flipProgress.value > 0.5 ? 0 : 1,
      transform: [
        { perspective: 900 },
        { translateY: height / 4 },
        { rotateX: `${-angle}deg` },
        { translateY: -height / 4 },
      ],
    };
  });

  const bottomFlapStyle = useAnimatedStyle(() => {
    const phase = Math.max((flipProgress.value - 0.5) * 2, 0);
    const angle = 90 - phase * 90;
    return {
      opacity: flipProgress.value <= 0.5 ? 0 : 1,
      transform: [
        { perspective: 900 },
        { translateY: -height / 4 },
        { rotateX: `${angle}deg` },
        { translateY: height / 4 },
      ],
    };
  });

  const hingeStyle = useAnimatedStyle(() => {
    const midFlip = flipProgress.value > 0 && flipProgress.value < 1;
    return {
      opacity: midFlip ? 0.55 : 0.25,
      transform: [{ scaleY: midFlip ? 1.6 : 1 }],
    };
  });

  return (
    <View
      style={{
        minWidth,
        height,
        borderRadius: radius,
        borderCurve: "continuous",
        backgroundColor: cardColor,
        overflow: "hidden",
      }}
    >
      <HeroInsetEdge edgeSize={7} opacity={0.16} />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          backgroundColor: "rgba(0, 0, 0, 0.06)",
        }}
      />

      <FlipDigit
        value={value}
        digitSize={digitSize}
        digitLineHeight={digitLineHeight}
        panelHeight={height}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            overflow: "hidden",
            backgroundColor: cardColor,
            backfaceVisibility: "hidden",
            zIndex: 1,
          },
          topFlapStyle,
        ]}
      >
        <FlipDigit
          value={outgoingValue}
          digitSize={digitSize}
          digitLineHeight={digitLineHeight}
          panelHeight={height}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            overflow: "hidden",
            backgroundColor: cardColor,
            backfaceVisibility: "hidden",
            zIndex: 1,
          },
          bottomFlapStyle,
        ]}
      >
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <FlipDigit
            value={outgoingValue}
            digitSize={digitSize}
            digitLineHeight={digitLineHeight}
            panelHeight={height}
          />
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          marginTop: -0.5,
          backgroundColor: theme.flipSeam,
          zIndex: 2,
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: "50%",
            left: 2,
            right: 2,
            height: 2,
            marginTop: -1,
            backgroundColor: "rgba(0, 0, 0, 0.18)",
            zIndex: 3,
          },
          hingeStyle,
        ]}
      />
    </View>
  );
}

type HeroFlipClockProps = {
  countdownLabel: string;
  compact?: boolean;
};

/** Split-flap MM:SS read only — title, mascot, and footnote live in HeroDisplay zones. */
export function HeroFlipClock({
  countdownLabel,
  compact = false,
}: HeroFlipClockProps) {
  const theme = useHeroTheme();
  const parsed = parseMmSsCountdown(countdownLabel);
  const scale = compact ? 0.86 : 1;

  const cardHeight = HERO_FLIP_CLOCK.cardHeight * scale;
  const cardMinWidth = HERO_FLIP_CLOCK.cardMinWidth * scale;
  const digitSize = HERO_FLIP_CLOCK.digitSize * scale;
  const digitLineHeight = HERO_FLIP_CLOCK.digitLineHeight * scale;
  const cardRadius = HERO_FLIP_CLOCK.cardRadius * scale;
  const cardGap = HERO_FLIP_CLOCK.cardGap * scale;
  const wellPadding = HERO_FLIP_CLOCK.wellPadding * scale;

  const clockFace = parsed ? (
    <View
      style={{
        flexDirection: "row",
        gap: cardGap,
        alignSelf: "center",
        borderRadius: HERO_TIMER_PLAQUE_RADIUS * scale,
        borderCurve: "continuous",
        backgroundColor: theme.plaque,
        padding: wellPadding,
        overflow: "hidden",
      }}
    >
      <HeroInsetEdge edgeSize={10} opacity={0.14} />
      <View
        style={{
          flexDirection: "row",
          gap: cardGap,
          zIndex: 1,
        }}
      >
        <FlipFlapPanel
          value={parsed.minutes}
          cardColor={theme.flipMinutes}
          height={cardHeight}
          minWidth={cardMinWidth}
          digitSize={digitSize}
          digitLineHeight={digitLineHeight}
          radius={cardRadius}
        />
        <FlipFlapPanel
          value={parsed.seconds}
          cardColor={theme.flipSeconds}
          height={cardHeight}
          minWidth={cardMinWidth}
          digitSize={digitSize}
          digitLineHeight={digitLineHeight}
          radius={cardRadius}
        />
      </View>
    </View>
  ) : (
    <TrmnlText variant="countdown" numberOfLines={1} style={{ textAlign: "center" }}>
      {countdownLabel}
    </TrmnlText>
  );

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      {clockFace}
    </View>
  );
}
