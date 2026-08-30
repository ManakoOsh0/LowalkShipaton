/**
 * Settings screen — app preferences and focus session configuration.
 */
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DevToolsEntryRow } from "@/components/dev/DevToolsEntryRow";
import { FocusRewardsCard } from "@/components/FocusRewardsCard";
import { HeroLookSettingsCard } from "@/components/HeroLookSettingsCard";
import { SettingsControlsCard } from "@/components/settings/SettingsControlsCard";
import { SettingsSupportCard } from "@/components/settings/SettingsSupportCard";
import { SettingsScreenSkeleton } from "@/components/skeleton/SettingsScreenSkeleton";
import { useCoreStoresHydrated } from "@/hooks/usePersistedStoreHydration";
import { useThemeColors } from "@/hooks/useThemeColors";
import { isDevToolsHubEnabled } from "@/lib/devToolsAccess";
import { isPremiumFromCustomerInfo, presentPaywall, restorePurchases } from "@/services/revenueCat";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

function LowalkProCard() {
  const colors = useThemeColors();
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const setFromCustomerInfo = useSubscriptionStore((state) => state.setFromCustomerInfo);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus,
  );
  const [busy, setBusy] = useState(false);

  const onUpgrade = async () => {
    try {
      setBusy(true);
      await presentPaywall();
      await refreshSubscriptionStatus();
    } catch {
      Alert.alert(
        "Could not open paywall",
        "Rebuild the dev client after installing RevenueCat, then try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    try {
      setBusy(true);
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        setFromCustomerInfo(customerInfo);
      }
      const active = customerInfo ? isPremiumFromCustomerInfo(customerInfo) : false;
      Alert.alert(
        "Restore complete",
        active
          ? "Your Pro access is active."
          : "No active subscription was found for this device.",
      );
    } catch {
      Alert.alert("Restore failed", "Could not restore purchases. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          marginBottom: 10,
          fontFamily: "Poppins-SemiBold",
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: colors.muted,
        }}
      >
        Lowalk Pro
      </Text>

      <View
        style={{
          borderRadius: 20,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 15,
              lineHeight: 20,
              color: colors.foreground,
            }}
          >
            {isPremium ? "Pro active" : "Home screen widget"}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            {isPremium
              ? Platform.OS === "android"
                ? "Long-press your home screen, open Widgets, and add Lowalk to mirror your Hero Card."
                : "Pro is active on this device."
              : "See your focus session on your home screen without opening the app."}
          </Text>
        </View>

        {!isPremium ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void onUpgrade()}
            style={{
              borderRadius: 14,
              backgroundColor: colors.skyDeep,
              paddingVertical: 12,
              alignItems: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: colors.background,
              }}
            >
              Upgrade to Pro
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void onRestore()}
          style={{ alignSelf: "flex-start" }}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              color: colors.skyDeep,
              opacity: busy ? 0.7 : 1,
            }}
          >
            Restore purchases
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const storesReady = useCoreStoresHydrated();
  const showDevTools = isDevToolsHubEnabled();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 24,
            lineHeight: 32,
            color: colors.foreground,
          }}
        >
          Settings
        </Text>
      </View>

      {!storesReady ? (
        <View style={{ paddingHorizontal: 16 }}>
          <SettingsScreenSkeleton />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <LowalkProCard />
          <FocusRewardsCard />
          <HeroLookSettingsCard />
          <SettingsControlsCard />
          <SettingsSupportCard />
          {showDevTools ? <DevToolsEntryRow /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
