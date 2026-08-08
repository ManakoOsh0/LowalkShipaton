import type { CustomerInfo } from "react-native-purchases";
import { create } from "zustand";

import {
  fetchCustomerInfo,
  isPremiumFromCustomerInfo,
} from "@/services/revenueCat";

type SubscriptionState = {
  isPremium: boolean;
  isLoaded: boolean;
  setFromCustomerInfo: (customerInfo: CustomerInfo) => void;
  refreshSubscriptionStatus: () => Promise<void>;
};

/** Subscription status from RevenueCat — not persisted locally. */
export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isLoaded: false,
  setFromCustomerInfo: (customerInfo) => {
    set({
      isPremium: isPremiumFromCustomerInfo(customerInfo),
      isLoaded: true,
    });
  },
  refreshSubscriptionStatus: async () => {
    const customerInfo = await fetchCustomerInfo();
    if (customerInfo) {
      set({
        isPremium: isPremiumFromCustomerInfo(customerInfo),
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  },
}));
