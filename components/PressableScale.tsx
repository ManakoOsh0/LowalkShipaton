/**
 * PressableScale — shared press feedback (scale 0.97, 160ms ease-out) for list rows and CTAs.
 */
import * as Haptics from "expo-haptics";
import { type ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_SCALE = 0.97;
const PRESS_MS = 160;
const PRESS_EASING = Easing.out(Easing.cubic);

type PressableScaleProps = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Light impact haptic on confirmed tap (onPress), not on press-in — safe inside scroll views. */
  haptic?: boolean;
};

export function PressableScale({
  children,
  style,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[animatedStyle, style]}
      onPress={(event) => {
        if (haptic && !disabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(event);
      }}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withTiming(PRESS_SCALE, {
            duration: PRESS_MS,
            easing: PRESS_EASING,
          });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, {
          duration: PRESS_MS,
          easing: PRESS_EASING,
        });
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
