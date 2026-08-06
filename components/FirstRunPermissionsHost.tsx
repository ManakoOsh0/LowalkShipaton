/**
 * First-run permissions sheet — location, notifications, Usage Access, and overlay for shielding.
 */
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  hasOverlayPermission,
  hasUsageStatsPermission,
  isAppShieldSupported,
  openOverlaySettings,
  openUsageAccessSettings,
} from "lowalk-app-shield";
import { useModalAnimationType, useReduceMotion } from "@/hooks/useHeroMotion";
import { HERO_MOTION } from "@/lib/heroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
} from "@/services/location";
import { ensureNotificationPermission } from "@/services/sessionReminders";
import { useUserStore } from "@/store/useUserStore";

type OnboardingStep = "location" | "notifications" | "usage" | "overlay" | "done";

export function FirstRunPermissionsHost() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated());
  const [step, setStep] = useState<OnboardingStep>("location");
  const [busy, setBusy] = useState(false);
  const reduceMotion = useReduceMotion();
  const modalAnimationType = useModalAnimationType("fade");
  const cardY = useSharedValue(reduceMotion ? 0 : 48);
  const cardOpacity = useSharedValue(reduceMotion ? 1 : 0);

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
    if (!hydrated || hasCompletedOnboarding) return;
    setStep("location");
  }, [hydrated, hasCompletedOnboarding]);

  if (!hydrated || hasCompletedOnboarding || step === "done") {
    return null;
  }

  const finish = () => {
    completeOnboarding();
    setStep("done");
  };

  const advanceAfterUsage = async () => {
    if (!isAppShieldSupported()) {
      finish();
      return;
    }

    const overlayOk = await hasOverlayPermission();
    if (!overlayOk) {
      setStep("overlay");
      return;
    }

    finish();
  };

  const advanceAndroidShieldSteps = async () => {
    if (!isAppShieldSupported()) {
      finish();
      return;
    }

    const usageOk = await hasUsageStatsPermission();
    if (!usageOk) {
      setStep("usage");
      return;
    }

    await advanceAfterUsage();
  };

  const handleLocationContinue = async () => {
    setBusy(true);
    try {
      await requestForegroundLocationPermission();
      await requestBackgroundLocationPermission();
    } finally {
      setBusy(false);
    }
    setStep("notifications");
  };

  const handleNotificationsContinue = async () => {
    setBusy(true);
    try {
      await ensureNotificationPermission();
    } finally {
      setBusy(false);
    }
    await advanceAndroidShieldSteps();
  };

  const handleUsageContinue = async () => {
    setBusy(true);
    try {
      const granted = await hasUsageStatsPermission();
      if (!granted) {
        await openUsageAccessSettings();
      }
    } finally {
      setBusy(false);
    }

    await advanceAfterUsage();
  };

  const handleOverlayContinue = async () => {
    setBusy(true);
    try {
      const granted = await hasOverlayPermission();
      if (!granted) {
        await openOverlaySettings();
      }
    } finally {
      setBusy(false);
    }

    finish();
  };

  const title =
    step === "location"
      ? "Stay verified at your venue"
      : step === "notifications"
        ? "Session reminders"
        : step === "usage"
          ? "Detect blocked apps"
          : "Cover blocked apps";

  const body =
    step === "location"
      ? "Lowalk needs location — including Always / background — so your focus session can pause or resume when you leave or return, even if the phone is locked."
      : step === "notifications"
        ? "Allow notifications so Lowalk can remind you before sessions start, alert you when you leave your venue, and celebrate when you hit your daily goal."
        : step === "usage"
          ? "Allow Usage Access so Lowalk can detect when you open a blocked app during a focus session."
          : Platform.OS === "android"
            ? "Allow Display over other apps so Lowalk can show the full-screen focus shield on top of distracting apps."
            : "Distraction shielding will be available when native enforcement ships on this platform.";

  const cta =
    step === "location"
      ? "Allow location"
      : step === "notifications"
        ? "Allow notifications"
        : step === "usage"
          ? "Open Usage Access settings"
          : "Open Display over other apps";

  const onContinue =
    step === "location"
      ? handleLocationContinue
      : step === "notifications"
        ? handleNotificationsContinue
        : step === "usage"
          ? handleUsageContinue
          : handleOverlayContinue;

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
            key={step}
            entering={reduceMotion ? undefined : FadeIn.duration(200)}
            exiting={reduceMotion ? undefined : FadeOut.duration(120)}
            style={{ gap: 14 }}
          >
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 22,
                lineHeight: 28,
                color: colors.foreground,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 14,
                lineHeight: 20,
                color: colors.muted,
              }}
            >
              {body}
            </Text>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              void onContinue();
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
              {cta}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={finish}
            style={{ paddingVertical: 8, alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: colors.muted,
              }}
            >
              Not now
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
