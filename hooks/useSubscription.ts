import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { CustomerInfo } from "react-native-purchases";

import { syncAndroidWidgetPremiumGate } from "@/lib/widgetPremiumSync";
import {
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  isPremiumFromCustomerInfo,
  presentPaywall as presentPaywallService,
  removeCustomerInfoUpdateListener,
  restorePurchases,
} from "@/services/revenueCat";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

/**
 * Configures RevenueCat, keeps subscription state fresh, and exposes paywall/restore actions.
 */
export function useSubscription() {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isLoaded = useSubscriptionStore((state) => state.isLoaded);
  const setFromCustomerInfo = useSubscriptionStore((state) => state.setFromCustomerInfo);
  const refreshSubscriptionStatus = useSubscriptionStore(
    (state) => state.refreshSubscriptionStatus,
  );

  useEffect(() => {
    configureRevenueCat();

    const onCustomerInfoUpdated = (customerInfo: CustomerInfo) => {
      setFromCustomerInfo(customerInfo);
      void syncAndroidWidgetPremiumGate(isPremiumFromCustomerInfo(customerInfo));
    };

    addCustomerInfoUpdateListener(onCustomerInfoUpdated);
    void refreshSubscriptionStatus();

    return () => {
      removeCustomerInfoUpdateListener(onCustomerInfoUpdated);
    };
  }, [refreshSubscriptionStatus, setFromCustomerInfo]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void refreshSubscriptionStatus();
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, [refreshSubscriptionStatus]);

  const presentPaywall = async () => {
    const result = await presentPaywallService();
    await refreshSubscriptionStatus({ fresh: true });
    return result;
  };

  const restore = async () => {
    const customerInfo = await restorePurchases();
    if (customerInfo) {
      setFromCustomerInfo(customerInfo);
    }
    return customerInfo;
  };

  return {
    isPremium,
    isLoaded,
    refresh: refreshSubscriptionStatus,
    restore,
    presentPaywall,
  };
}
