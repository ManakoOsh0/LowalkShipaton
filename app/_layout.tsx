import "react-native-gesture-handler";
import "react-native-reanimated";

import "../constants/global.css";
import "@/tasks/sessionLocationTask";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Appearance } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ArrivalCelebrationHost } from "@/components/ArrivalConfirmationModal";
import { BlockingOverlayHost } from "@/components/BlockingOverlay";
import { FirstRunPermissionsHost } from "@/components/FirstRunPermissionsHost";
import { StreakCelebrationHost } from "@/components/StreakCelebrationModal";
import { SessionPresenceProvider } from "@/components/SessionPresenceProvider";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useSessionReminders } from "@/hooks/useSessionReminders";
import { useWakeAlarmScheduler } from "@/hooks/useWakeAlarmScheduler";
import { useWakeChallengeLifecycle } from "@/hooks/useWakeChallengeLifecycle";
import { colors } from "@/theme/tokens";

function AppLifecycleHooks() {
  useSessionReminders();
  useWakeAlarmScheduler();
  useWakeChallengeLifecycle();
  return null;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    Appearance.setColorScheme("dark");
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <SessionPresenceProvider>
          <AppLifecycleHooks />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          <BlockingOverlayHost />
          <ArrivalCelebrationHost />
          <StreakCelebrationHost />
          <FirstRunPermissionsHost />
        </SessionPresenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
