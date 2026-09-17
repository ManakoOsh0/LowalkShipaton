import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOffering,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

import {
  getRevenueCatApiKey,
  REVENUECAT_ENTITLEMENT_ID,
} from "@/lib/revenueCatConfig";
import {
  logPaywallOfferingDiagnostics,
  pickPaywallOffering,
} from "@/lib/revenueCatOffering";

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
  const active = customerInfo.entitlements.active;
  if (active[REVENUECAT_ENTITLEMENT_ID] != null) {
    return true;
  }

  const activeEntitlementIds = Object.keys(active);
  if (activeEntitlementIds.length > 0) {
    if (__DEV__) {
      console.log(
        "[RevenueCat] Unlocking Pro via active entitlements:",
        activeEntitlementIds.join(", "),
      );
    }
    return true;
  }

  if (customerInfo.activeSubscriptions.length > 0) {
    if (__DEV__) {
      console.log(
        "[RevenueCat] Unlocking Pro via active subscriptions:",
        customerInfo.activeSubscriptions.join(", "),
      );
    }
    return true;
  }

  return false;
}

/** Dev-only entitlement snapshot after purchase / refresh. */
export function logCustomerInfoSnapshot(customerInfo: CustomerInfo): void {
  if (!__DEV__) return;
  const activeEntitlementIds = Object.keys(customerInfo.entitlements.active);
  console.log(
    "[RevenueCat] CustomerInfo:",
    `entitlements=${activeEntitlementIds.join(", ") || "none"}`,
    `subscriptions=${customerInfo.activeSubscriptions.join(", ") || "none"}`,
    `premium=${isPremiumFromCustomerInfo(customerInfo)}`,
  );
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

/** Reads SDK cache without invalidating — use right after paywall purchase completes. */
export async function fetchCustomerInfoCached(): Promise<CustomerInfo | null> {
  return fetchCustomerInfo();
}

/** Bypasses SDK cache — use after paywall dismiss so entitlements reflect immediately. */
export async function fetchCustomerInfoFresh(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    await Purchases.invalidateCustomerInfoCache();
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn("[RevenueCat] fetchCustomerInfoFresh failed:", error);
    return null;
  }
}

export { PAYWALL_RESULT };

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

/** Resolves the offering that owns the hosted paywall (not always RevenueCat "current"). */
async function resolvePaywallOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.syncAttributesAndOfferingsIfNeeded();
    const offering = pickPaywallOffering(offerings);
    if (offering) {
      if (__DEV__) {
        console.log(
          "[RevenueCat] Presenting paywall for offering:",
          offering.identifier,
          `(current=${offerings.current?.identifier ?? "none"})`,
        );
        logPaywallOfferingDiagnostics(offering);
      }
    }
    return offering;
  } catch (error) {
    console.warn("[RevenueCat] syncAttributesAndOfferingsIfNeeded failed:", error);
    try {
      const offerings = await Purchases.getOfferings();
      return pickPaywallOffering(offerings);
    } catch (fallbackError) {
      console.warn("[RevenueCat] getOfferings failed:", fallbackError);
      return null;
    }
  }
}

/** Presents the RevenueCat-hosted paywall configured in the dashboard. */
export async function presentPaywall(): Promise<PAYWALL_RESULT | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const offering = await resolvePaywallOffering();
    if (!offering) {
      return await RevenueCatUI.presentPaywall();
    }
    return await RevenueCatUI.presentPaywall({ offering });
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
