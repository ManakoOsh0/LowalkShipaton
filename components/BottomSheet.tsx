/**
 * BottomSheet — slides up from the bottom with backdrop dismiss and drag-to-close.
 */
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";

const DISMISS_DRAG_PX = 110;
const DISMISS_VELOCITY = 900;
const SHEET_ENTER_MS = 320;
const SHEET_EXIT_MS = 260;
/** Warm-black dim so home/settings recede; 0.45 navy left dashboard type fully readable. */
const SHEET_SCRIM = "rgba(8, 6, 5, 0.78)";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdrop?: boolean;
  /** When false, backdrop tap and drag-to-dismiss are disabled. */
  dismissible?: boolean;
  /** Wrap children in ScrollView for tall content (e.g. map + form). */
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  dismissOnBackdrop = true,
  dismissible = true,
  scrollable = false,
  contentStyle,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const reduceMotion = useReduceMotion();
  const { height: windowHeight } = useWindowDimensions();
  const [rendered, setRendered] = useState(false);

  const sheetY = useSharedValue(windowHeight);
  const dragY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      dragY.value = 0;
      sheetY.value = windowHeight;
      backdropOpacity.value = 0;

      if (reduceMotion) {
        sheetY.value = 0;
        backdropOpacity.value = 1;
        return;
      }

      sheetY.value = withTiming(0, {
        duration: SHEET_ENTER_MS,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, {
        duration: SHEET_ENTER_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    if (!rendered) return;

    dragY.value = 0;

    if (reduceMotion) {
      sheetY.value = windowHeight;
      backdropOpacity.value = 0;
      setRendered(false);
      return;
    }

    sheetY.value = withTiming(
      windowHeight,
      {
        duration: SHEET_EXIT_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setRendered)(false);
        }
      },
    );
    backdropOpacity.value = withTiming(0, {
      duration: SHEET_EXIT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [backdropOpacity, dragY, reduceMotion, rendered, sheetY, visible, windowHeight]);

  const pan = Gesture.Pan()
    .enabled(dismissible)
    .activeOffsetY(12)
    .onUpdate((event) => {
      dragY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (!dismissible) {
        dragY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
        return;
      }

      if (event.translationY > DISMISS_DRAG_PX || event.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)();
        return;
      }

      dragY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    });

  const canDismissOnBackdrop = dismissible && dismissOnBackdrop;

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value + dragY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!rendered) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: SHEET_SCRIM },
            backdropStyle,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss sheet"
            onPress={canDismissOnBackdrop ? onClose : undefined}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              {
                borderTopLeftRadius: CARD_RADIUS_XL,
                borderTopRightRadius: CARD_RADIUS_XL,
                borderCurve: "continuous",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: colors.cardStroke,
                boxShadow: "0px -12px 36px rgba(0, 0, 0, 0.45)",
                paddingTop: 10,
                paddingHorizontal: 16,
                paddingBottom: Math.max(insets.bottom, 16),
                maxHeight: "88%",
              },
              sheetStyle,
              contentStyle,
            ]}
          >
            {dismissible ? (
              <View
                style={{
                  alignSelf: "center",
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  marginBottom: 12,
                }}
              />
            ) : null}
            {scrollable ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
