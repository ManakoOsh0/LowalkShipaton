import type { CustomerInfo } from "react-native-purchases";
import { create } from "zustand";

import {
  fetchCustomerInfo,
  fetchCustomerInfoFresh,
  isPremiumFromCustomerInfo,
  logCustomerInfoSnapshot,
} from "@/services/revenueCat";
import { setWidgetPremiumMirror } from "@/lib/widgetPremiumMirror";

type SubscriptionState = {
  isPremium: boolean;
  isLoaded: boolean;
  setFromCustomerInfo: (customerInfo: CustomerInfo) => void;
  refreshSubscriptionStatus: (options?: { fresh?: boolean }) => Promise<void>;
};

/** Subscription status from RevenueCat — not persisted locally. */
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoaded: false,
  setFromCustomerInfo: (customerInfo) => {
    logCustomerInfoSnapshot(customerInfo);
    const isPremium = isPremiumFromCustomerInfo(customerInfo);
    if (isPremium) {
      void setWidgetPremiumMirror(true);
    } else {
      const hasRcAccess =
        Object.keys(customerInfo.entitlements.active).length > 0 ||
        customerInfo.activeSubscriptions.length > 0;
      if (!hasRcAccess) {
        void setWidgetPremiumMirror(false);
      }
    }
    set({
      isPremium,
      isLoaded: true,
    });
  },
  refreshSubscriptionStatus: async (options) => {
    const customerInfo = options?.fresh
      ? await fetchCustomerInfoFresh()
      : await fetchCustomerInfo();
    if (customerInfo) {
      logCustomerInfoSnapshot(customerInfo);
      const isPremium = isPremiumFromCustomerInfo(customerInfo);
      if (isPremium) {
        void setWidgetPremiumMirror(true);
      } else {
        const hasRcAccess =
          Object.keys(customerInfo.entitlements.active).length > 0 ||
          customerInfo.activeSubscriptions.length > 0;
        if (!hasRcAccess) {
          void setWidgetPremiumMirror(false);
        }
      }
      set({
        isPremium,
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  },
}));
