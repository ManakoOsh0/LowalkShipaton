import AsyncStorage from "@react-native-async-storage/async-storage";

const WIDGET_PREMIUM_MIRROR_KEY = "lowalk_widget_premium_unlocked";

/** Local mirror for native widget gate — survives entitlement id mismatches / RC lag after purchase. */
export async function readWidgetPremiumMirror(): Promise<boolean> {
  return (await AsyncStorage.getItem(WIDGET_PREMIUM_MIRROR_KEY)) === "1";
}

export async function setWidgetPremiumMirror(unlocked: boolean): Promise<void> {
  if (unlocked) {
    await AsyncStorage.setItem(WIDGET_PREMIUM_MIRROR_KEY, "1");
  } else {
    await AsyncStorage.removeItem(WIDGET_PREMIUM_MIRROR_KEY);
  }
}
