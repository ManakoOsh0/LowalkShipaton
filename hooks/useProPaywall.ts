import { useCallback } from "react";
import { Alert } from "react-native";
import { PAYWALL_RESULT, configureRevenueCat, presentPaywall, restorePurchases } from "@/services/revenueCat";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

type ProPaywallResult = {
  isPremium: boolean;
  result: PAYWALL_RESULT | null;
};

/**
 * Shared Lowalk Pro paywall entry — invalidates RevenueCat cache after dismiss
 * and surfaces a success alert when entitlement flips to premium.
 */
export function useProPaywall() {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const setFromCustomerInfo = useSubscriptionStore((state) => state.setFromCustomerInfo);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus,
  );

  const openProPaywall = useCallback(async (): Promise<ProPaywallResult> => {
    const wasPremium = useSubscriptionStore.getState().isPremium;

    try {
      configureRevenueCat();
      const result = await presentPaywall();
      await refreshSubscriptionStatus({ fresh: true });

      const nowPremium = useSubscriptionStore.getState().isPremium;
      const purchased =
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        (!wasPremium && nowPremium);

      if (purchased && nowPremium) {
        Alert.alert("Lowalk Pro is active", "Home screen widgets are unlocked.");
      }

      return { isPremium: nowPremium, result };
    } catch {
      Alert.alert(
        "Could not open paywall",
        "Rebuild the dev client after installing RevenueCat, then try again.",
      );
      return { isPremium: useSubscriptionStore.getState().isPremium, result: null };
    }
  }, [refreshSubscriptionStatus]);

  const restoreProPurchases = useCallback(async (): Promise<ProPaywallResult> => {
    try {
      configureRevenueCat();
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        setFromCustomerInfo(customerInfo);
      } else {
        await refreshSubscriptionStatus({ fresh: true });
      }

      const nowPremium = useSubscriptionStore.getState().isPremium;
      Alert.alert(
        "Restore complete",
        nowPremium
          ? "Your Pro access is active."
          : "No active subscription was found for this device.",
      );

      return { isPremium: nowPremium, result: null };
    } catch {
      Alert.alert("Restore failed", "Could not restore purchases. Try again later.");
      return { isPremium: useSubscriptionStore.getState().isPremium, result: null };
    }
  }, [refreshSubscriptionStatus, setFromCustomerInfo]);

  return {
    isPremium,
    openProPaywall,
    restoreProPurchases,
  };
}
