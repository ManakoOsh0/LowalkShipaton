/**
 * First-run permissions sheet — Always location and Usage Access for app shielding.
 * Mission-tied copy so users understand why these system grants matter.
 */
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  hasUsageStatsPermission,
  isAppShieldSupported,
  openUsageAccessSettings,
} from "lowalk-app-shield";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
} from "@/services/location";
import { useUserStore } from "@/store/useUserStore";

type OnboardingStep = "location" | "usage" | "done";

export function FirstRunPermissionsHost() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated());
  const [step, setStep] = useState<OnboardingStep>("location");
  const [busy, setBusy] = useState(false);

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

    finish();
  };

  const handleLocationContinue = async () => {
    setBusy(true);
    try {
      await requestForegroundLocationPermission();
      await requestBackgroundLocationPermission();
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

    finish();
  };

  const title =
    step === "location"
      ? "Stay verified at your venue"
      : "Detect blocked apps";

  const body =
    step === "location"
      ? "Lowalk needs location — including Always / background — so your focus session can pause or resume when you leave or return, even if the phone is locked."
      : Platform.OS === "android"
        ? "Allow Usage Access so Lowalk can detect when you open a blocked app and show the focus shield screen."
        : "Distraction shielding will be available when native enforcement ships on this platform.";

  const cta =
    step === "location" ? "Allow location" : "Open Usage Access settings";

  const onContinue =
    step === "location" ? handleLocationContinue : handleUsageContinue;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(13, 19, 43, 0.55)",
          justifyContent: "flex-end",
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            borderRadius: 24,
            backgroundColor: colors.background,
            paddingHorizontal: 20,
            paddingTop: 22,
            paddingBottom: 18,
            gap: 14,
          }}
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
        </View>
      </View>
    </Modal>
  );
}
