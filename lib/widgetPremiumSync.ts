import { Platform } from "react-native";

import { refreshWidgets, setWidgetPremiumAccess } from "lowalk-app-shield";

import {
  readWidgetPremiumMirror,
  setWidgetPremiumMirror,
} from "@/lib/widgetPremiumMirror";

/** Writes native widget prefs and redraws tiles. */
async function applyNativeWidgetUnlock(unlocked: boolean): Promise<void> {
  await setWidgetPremiumAccess(unlocked);
  await refreshWidgets();
}

/** Dev / testing — clears the AsyncStorage mirror and locks native widgets. */
export async function clearNativeWidgetPremiumUnlock(): Promise<void> {
  try {
    await setWidgetPremiumMirror(false);
    if (Platform.OS === "android") {
      await applyNativeWidgetUnlock(false);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[widgetPremiumSync] clear unlock failed:", error);
    }
  }
}

/** Unlocks widgets immediately after paywall purchase — before RC entitlement mapping settles. */
export async function markNativeWidgetPremiumUnlocked(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await setWidgetPremiumMirror(true);
    await applyNativeWidgetUnlock(true);
  } catch (error) {
    if (__DEV__) {
      console.warn("[widgetPremiumSync] mark unlock failed:", error);
    }
  }
}

/** Mirrors JS subscription state into native widget prefs and redraws home-screen tiles. */
export async function syncAndroidWidgetPremiumGate(isPremium: boolean): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    if (isPremium) {
      await setWidgetPremiumMirror(true);
      await applyNativeWidgetUnlock(true);
      return;
    }

    const mirrored = await readWidgetPremiumMirror();
    if (mirrored) {
      // RC says not premium but user purchased — keep widgets unlocked until RC confirms.
      await applyNativeWidgetUnlock(true);
      return;
    }

    await setWidgetPremiumMirror(false);
    await applyNativeWidgetUnlock(false);
  } catch (error) {
    if (__DEV__) {
      console.warn("[widgetPremiumSync] sync failed:", error);
    }
  }
}
