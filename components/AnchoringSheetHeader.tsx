/**
 * AnchoringSheetHeader — shared hero block for every anchoring sheet step.
 */
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

import { AnchoringMascotIcon } from "@/components/AnchoringMascotIcon";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { arrivalMascotEntering } from "@/lib/heroMotion";

type AnchoringSheetHeaderProps = {
  badge: string;
  anchorName: string;
  nodeTitle: string;
  hintLine?: string;
  /** Pulse the icon halo while GPS is acquiring. */
  pulsing?: boolean;
};

export function AnchoringSheetHeader({
  badge,
  anchorName,
  nodeTitle,
  hintLine,
  pulsing = false,
}: AnchoringSheetHeaderProps) {
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!pulsing || reduceMotion) {
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse, pulsing, reduceMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulsing ? 0.85 + (pulse.value - 1) * 2 : 1,
  }));

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.primary,
        }}
      >
        {badge}
      </Text>

      <View
        style={{
          width: 88,
          height: 88,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          entering={arrivalMascotEntering(reduceMotion)}
          style={haloStyle}
        >
          <AnchoringMascotIcon size={72} />
        </Animated.View>
      </View>

      <View style={{ alignItems: "center", gap: 4 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 22,
            lineHeight: 28,
            color: colors.foreground,
            textAlign: "center",
          }}
        >
          {anchorName}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 15,
            lineHeight: 22,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {nodeTitle}
        </Text>
      </View>

      {hintLine ? (
        <>
          <Text
            style={{
              fontFamily: "Poppins-Medium",
              fontSize: 14,
              lineHeight: 20,
              color: colors.foregroundSubtle,
              textAlign: "center",
            }}
          >
            {hintLine}
          </Text>

          <View
            style={{
              width: 40,
              height: 1,
              backgroundColor: colors.cardStroke,
              marginTop: 2,
            }}
          />
        </>
      ) : null}
    </View>
  );
}

type AnchoringStepDotsProps = {
  /** 0 = capture, 1 = confirm/adjust */
  activeIndex: number;
};

export function AnchoringStepDots({ activeIndex }: AnchoringStepDotsProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {[0, 1].map((index) => (
        <View
          key={index}
          style={{
            width: index === activeIndex ? 18 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              index === activeIndex ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}
