import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

import {
  getRevenueCatApiKey,
  REVENUECAT_ENTITLEMENT_ID,
} from "@/lib/revenueCatConfig";

let isConfigured = false;

/** Initializes RevenueCat when a public SDK key is available. Safe to call multiple times. */
export function configureRevenueCat(): boolean {
  if (isConfigured) {
    return true;
  }

  if (Platform.OS === "web") {
    return false;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    if (__DEV__) {
      console.warn(
        "[RevenueCat] No API key found. Set EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY in .env",
      );
    }
    return false;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    isConfigured = true;
    return true;
  } catch (error) {
    console.warn("[RevenueCat] configure failed:", error);
    return false;
  }
}

export function isPremiumFromCustomerInfo(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] != null;
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn("[RevenueCat] getCustomerInfo failed:", error);
    return null;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.warn("[RevenueCat] restorePurchases failed:", error);
    throw error;
  }
}

/** Presents the RevenueCat-hosted paywall configured in the dashboard. */
export async function presentPaywall(): Promise<PAYWALL_RESULT | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    return await RevenueCatUI.presentPaywall();
  } catch (error) {
    console.warn("[RevenueCat] presentPaywall failed:", error);
    throw error;
  }
}

export function addCustomerInfoUpdateListener(
  listener: CustomerInfoUpdateListener,
): void {
  if (!isConfigured) {
    return;
  }
  Purchases.addCustomerInfoUpdateListener(listener);
}

export function removeCustomerInfoUpdateListener(
  listener: CustomerInfoUpdateListener,
): void {
  Purchases.removeCustomerInfoUpdateListener(listener);
}
