import { Platform } from "react-native";

/** RevenueCat entitlement that unlocks Lowalk Pro (home screen widget). */
export const REVENUECAT_ENTITLEMENT_ID = "Lowalk Pro";

/**
 * Offering that carries the live hosted paywall (Dashboard: "Default 2").
 * Override with EXPO_PUBLIC_REVENUECAT_PAYWALL_OFFERING_ID if the identifier differs.
 */
export const REVENUECAT_PAYWALL_OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_PAYWALL_OFFERING_ID?.trim() || "default 2";

/**
 * Dashboard setup (Test Store for Shipaton / dev):
 * - Products: monthly, yearly, lifetime (Test Store) / lowalk_* on store apps
 * - Entitlement: Lowalk Pro
 * - Offering: default 2 with paywall attached (legacy default offering unused in-app)
 */
export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === "web") {
    return null;
  }

  const testStoreKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY?.trim();
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();

  const platformKey = Platform.select({
    ios: iosKey ?? null,
    android: androidKey ?? null,
    default: null,
  });

  // Dev prefers Test Store; preview/internal builds fall back when platform keys are absent.
  if (__DEV__ && testStoreKey) {
    return testStoreKey;
  }

  if (platformKey) {
    return platformKey;
  }

  return testStoreKey ?? null;
}
