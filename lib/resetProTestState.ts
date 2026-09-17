import Purchases from "react-native-purchases";

import { readWidgetPremiumMirror } from "@/lib/widgetPremiumMirror";
import {
  clearNativeWidgetPremiumUnlock,
  syncAndroidWidgetPremiumGate,
} from "@/lib/widgetPremiumSync";
import {
  configureRevenueCat,
  fetchCustomerInfoFresh,
  isPremiumFromCustomerInfo,
  logCustomerInfoSnapshot,
} from "@/services/revenueCat";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";

export type ResetProTestStateResult = {
  appUserId: string | null;
  isPremium: boolean;
  widgetMirror: boolean;
};

/**
 * Dev-only: clears local widget unlock, rotates the RC App User ID, and refreshes entitlements.
 * Store-owned lifetime may still re-grant Pro until sandbox purchase history is cleared.
 */
export async function resetProTestState(): Promise<ResetProTestStateResult> {
  const fallbackPremium = useSubscriptionStore.getState().isPremium;

  if (!__DEV__) {
    const widgetMirror = await readWidgetPremiumMirror();
    return {
      appUserId: null,
      isPremium: fallbackPremium,
      widgetMirror,
    };
  }

  configureRevenueCat();
  await clearNativeWidgetPremiumUnlock();

  // logOut() throws for anonymous users (the default). Identified users go back to anonymous;
  // anonymous users get a fresh dev subscriber via logIn so dashboard deletes can be retested.
  try {
    const isAnonymous = await Purchases.isAnonymous();
    if (isAnonymous) {
      await Purchases.logIn(`lowalk_dev_reset_${Date.now()}`);
    } else {
      await Purchases.logOut();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[resetProTestState] RevenueCat identity reset skipped:", error);
    }
  }

  const customerInfo = await fetchCustomerInfoFresh();
  let isPremium = fallbackPremium;

  if (customerInfo) {
    logCustomerInfoSnapshot(customerInfo);
    useSubscriptionStore.getState().setFromCustomerInfo(customerInfo);
    isPremium = isPremiumFromCustomerInfo(customerInfo);
  } else {
    await useSubscriptionStore.getState().refreshSubscriptionStatus({ fresh: true });
    isPremium = useSubscriptionStore.getState().isPremium;
  }

  await syncAndroidWidgetPremiumGate(isPremium);

  let appUserId: string | null = null;
  try {
    appUserId = await Purchases.getAppUserID();
  } catch (error) {
    console.warn("[resetProTestState] getAppUserID failed:", error);
  }

  const widgetMirror = await readWidgetPremiumMirror();

  return { appUserId, isPremium, widgetMirror };
}
