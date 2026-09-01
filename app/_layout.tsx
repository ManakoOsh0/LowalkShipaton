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
import { AnchoringSheetHost } from "@/components/AnchoringSheetHost";
import { BlockingOverlayHost } from "@/components/BlockingOverlay";
import { FirstRunPermissionsHost } from "@/components/FirstRunPermissionsHost";
import { LeaveSessionWarningHost } from "@/components/LeaveSessionWarningModal";
import { SessionCompleteHost } from "@/components/SessionCompleteScreen";
import { SessionPenaltyHost } from "@/components/SessionPenaltyModal";
import { StreakCelebrationHost } from "@/components/StreakCelebrationModal";
import { PaywallDeepLinkHost } from "@/components/PaywallDeepLinkHost";
import { SessionPresenceProvider } from "@/components/SessionPresenceProvider";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useNotificationResponses } from "@/hooks/useNotificationResponses";
import { useSessionReminders } from "@/hooks/useSessionReminders";
import { useSubscription } from "@/hooks/useSubscription";
import { colors } from "@/theme/tokens";

function AppLifecycleHooks() {
  useSessionReminders();
  useNotificationResponses();
  return null;
}

function SubscriptionLifecycle() {
  useSubscription();
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
          <SubscriptionLifecycle />
          <PaywallDeepLinkHost />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          <BlockingOverlayHost />
          <ArrivalCelebrationHost />
          <LeaveSessionWarningHost />
          <SessionPenaltyHost />
          <AnchoringSheetHost />
          <SessionCompleteHost />
          <StreakCelebrationHost />
          <FirstRunPermissionsHost />
        </SessionPresenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
