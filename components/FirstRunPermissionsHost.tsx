/**
 * First-run permissions sheet — walks through each OS grant Lowalk needs.
 * Stays on a step until that grant is confirmed, including Settings-based
 * permissions that only update after the user returns to the app.
 */
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useModalAnimationType, useReduceMotion } from "@/hooks/useHeroMotion";
import { useRequiredPermissions } from "@/hooks/useRequiredPermissions";
import { useThemeColors } from "@/hooks/useThemeColors";
import { HERO_MOTION } from "@/lib/heroMotion";
import { requestOrOpenPermission } from "@/lib/requiredPermissions";
import { useUserStore } from "@/store/useUserStore";

export function FirstRunPermissionsHost() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated());
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const { ready, nextStep, progress, refresh } = useRequiredPermissions();
  const reduceMotion = useReduceMotion();
  const modalAnimationType = useModalAnimationType("fade");
  const cardY = useSharedValue(reduceMotion ? 0 : 48);
  const cardOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      cardY.value = 0;
      cardOpacity.value = 1;
      return;
    }

    cardY.value = withTiming(0, {
      duration: HERO_MOTION.sheetEnterMs,
      easing: Easing.out(Easing.cubic),
    });
    cardOpacity.value = withTiming(1, {
      duration: HERO_MOTION.sheetEnterMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [cardOpacity, cardY, reduceMotion]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useUserStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || !ready || nextStep || completedRef.current) return;
    if (progress.total === 0) return;
    completedRef.current = true;
    completeOnboarding();
  }, [completeOnboarding, hydrated, nextStep, progress.total, ready]);

  if (!hydrated || !ready || sessionDismissed || !nextStep) {
    return null;
  }

  const handleContinue = async () => {
    setBusy(true);
    try {
      await requestOrOpenPermission(nextStep.id);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType={modalAnimationType} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(13, 19, 43, 0.55)",
          justifyContent: "flex-end",
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
        }}
      >
        <Animated.View
          style={[
            {
              borderRadius: 24,
              backgroundColor: colors.background,
              paddingHorizontal: 20,
              paddingTop: 22,
              paddingBottom: 18,
              gap: 14,
            },
            cardStyle,
          ]}
        >
          <Animated.View
            key={nextStep.id}
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
            exiting={reduceMotion ? undefined : FadeOut.duration(120)}
            style={{ gap: 14 }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 12,
                lineHeight: 16,
                letterSpacing: 0.4,
                color: colors.muted,
              }}
            >
              Permission {progress.granted + 1} of {progress.total}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 22,
                lineHeight: 28,
                color: colors.foreground,
              }}
            >
              {nextStep.title}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                lineHeight: 20,
                color: colors.muted,
              }}
            >
              {nextStep.body}
            </Text>
            {nextStep.settingsHint ? (
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.foregroundSubtle,
                }}
              >
                {nextStep.settingsHint}
              </Text>
            ) : null}
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              void handleContinue();
            }}
            style={({ pressed }) => ({
              marginTop: 4,
              borderRadius: 14,
              backgroundColor: colors.primary,
              paddingVertical: 14,
              alignItems: "center",
              opacity: busy ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 15,
                color: "#F0EDE9",
              }}
            >
              {nextStep.cta}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setSessionDismissed(true)}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: colors.muted,
              }}
            >
              Later
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
