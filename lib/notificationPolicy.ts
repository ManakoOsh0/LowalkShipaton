import { AppState } from "react-native";

import { useUserStore } from "@/store/useUserStore";

export function isAppActive(): boolean {
  return AppState.currentState === "active";
}

/** In-app toggle for Focus alerts (not session-status FGS). */
export function areUserAlertsEnabled(): boolean {
  return useUserStore.getState().notificationsEnabled;
}

/** Post immediate user alerts only when opted in and app is not in the foreground. */
export function shouldDeliverUserAlert(): boolean {
  return areUserAlertsEnabled() && !isAppActive();
}
