import { Platform } from "react-native";

import { ANDROID_FOCUS_ALERTS_CHANNEL_ID } from "@/lib/androidNotificationCopy";
import { fitNotificationBody, fitNotificationTitle } from "@/lib/notificationCopy";
import {
  areUserAlertsEnabled,
  shouldDeliverUserAlert,
} from "@/lib/notificationPolicy";
import {
  areSessionRemindersSupported,
  ensureNotificationPermission,
} from "@/services/sessionReminders";

async function getNotificationsModule() {
  return import("expo-notifications");
}

/** Background-only alert when the user hits today's full session target. */
export async function notifyDailyGoalAchieved(
  streak: number,
  coinAwarded: boolean,
): Promise<void> {
  if (!areSessionRemindersSupported() || !shouldDeliverUserAlert() || !areUserAlertsEnabled()) {
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const { ensureAndroidNotificationChannels } = await import("@/services/androidSessionStatus");
  await ensureAndroidNotificationChannels();

  const Notifications = await getNotificationsModule();
  const body = coinAwarded
    ? `You earned a Focus Coin. ${streak}-day streak!`
    : `${streak}-day streak — all sessions done today.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: fitNotificationTitle("Daily goal complete"),
      body: fitNotificationBody(body),
      sound: true,
      data: { type: "daily-goal", streak },
      ...(Platform.OS === "android" ? { channelId: ANDROID_FOCUS_ALERTS_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
