import { Platform } from "react-native";

/** RevenueCat entitlement that unlocks Lowalk Pro (home screen widget). */
export const REVENUECAT_ENTITLEMENT_ID = "premium";

/**
 * Dashboard setup (Test Store for Shipaton / dev):
 * - Products: lowalk_monthly, lowalk_yearly, lowalk_lifetime
 * - Entitlement: premium (attach all three products)
 * - Offering: default with monthly, yearly, lifetime packages
 * - Paywall: hosted V2 paywall bound to that offering
 */
export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === "web") {
    return null;
  }

  const testStoreKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY?.trim();
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();

  if (__DEV__ && testStoreKey) {
    return testStoreKey;
  }

  return Platform.select({
    ios: iosKey ?? null,
    android: androidKey ?? null,
    default: null,
  });
}
