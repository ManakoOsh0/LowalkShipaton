import Constants from "expo-constants";
import { Platform } from "react-native";

import { LOWALK_SESSION_LOCATION_TASK } from "@/services/location";

/** Android notification group for foreground-service status (not user alerts). */
export const ANDROID_SESSION_STATUS_GROUP = "lowalk_session_status";

/** Native shield monitor channel — must match AppShieldMonitorService.CHANNEL_ID. */
export const ANDROID_SHIELD_STATUS_CHANNEL_ID = "lowalk_session_status";

/** Expo LocationTaskService channel id (`appId:taskName`). */
export function getExpoLocationTaskChannelId(): string {
  const appId = Constants.expoConfig?.android?.package ?? "com.karabocode.tryLowalk";
  return `${appId}:${LOWALK_SESSION_LOCATION_TASK}`;
}

/**
 * Registers minimal-importance channels for session enforcement before FGS starts.
 * Pre-buffer and away alerts stay on session-reminders / presence-alerts (high).
 */
export async function ensureAndroidSessionStatusChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  const Notifications = await import("expo-notifications");

  await Notifications.setNotificationChannelAsync(ANDROID_SHIELD_STATUS_CHANNEL_ID, {
    name: "Session status",
    importance: Notifications.AndroidImportance.MIN,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    description:
      "Keeps app blocking active in the background. Pre-buffer and session reminders use a separate channel.",
  });

  await Notifications.setNotificationChannelAsync(getExpoLocationTaskChannelId(), {
    name: "Session location",
    importance: Notifications.AndroidImportance.MIN,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    description: "Background location while a focus session is active.",
  });
}
