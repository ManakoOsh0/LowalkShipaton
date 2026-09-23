import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  ANDROID_FOCUS_ALERTS_CHANNEL_ID,
  ANDROID_FOCUS_ALERTS_CHANNEL_NAME,
  ANDROID_SESSION_STATUS_BODY,
  ANDROID_SESSION_STATUS_TITLE,
} from "@/lib/androidNotificationCopy";
import { LOWALK_SESSION_LOCATION_TASK } from "@/services/location";

/** Android notification group for foreground-service status (not user alerts). */
export const ANDROID_SESSION_STATUS_GROUP = "lowalk_session_status";

/** Native shield monitor + location FGS channel — must match AppShieldMonitorService.CHANNEL_ID. */
export const ANDROID_SHIELD_STATUS_CHANNEL_ID = "lowalk_session_status";

/** @deprecated Location FGS now uses {@link ANDROID_SHIELD_STATUS_CHANNEL_ID}. */
export function getExpoLocationTaskChannelId(): string {
  const appId = Constants.expoConfig?.android?.package ?? "com.karabocode.tryLowalk";
  return `${appId}:${LOWALK_SESSION_LOCATION_TASK}`;
}

export { ANDROID_SESSION_STATUS_TITLE, ANDROID_SESSION_STATUS_BODY };

/**
 * Registers Android notification channels before FGS or scheduled alerts run.
 * Aligns with Material channel guidance: one user-mutable alerts channel (HIGH) and one
 * silent session-status channel (MIN) for required foreground-service disclosure.
 */
export async function ensureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  const Notifications = await import("expo-notifications");

  await Notifications.setNotificationChannelAsync(ANDROID_SHIELD_STATUS_CHANNEL_ID, {
    name: "Session status",
    importance: Notifications.AndroidImportance.MIN,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    description:
      "Silent indicator while a focus session runs in the background. Does not play sounds.",
  });

  await Notifications.setNotificationChannelAsync(ANDROID_FOCUS_ALERTS_CHANNEL_ID, {
    name: ANDROID_FOCUS_ALERTS_CHANNEL_NAME,
    description:
      "Pre-buffer, missed session, leaving your venue, penalties, and daily goal celebrations.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 120, 250],
  });
}

/** @deprecated Use ensureAndroidNotificationChannels */
export async function ensureAndroidSessionStatusChannels(): Promise<void> {
  return ensureAndroidNotificationChannels();
}
