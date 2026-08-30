import { AppState, Platform } from "react-native";

import {
  areSessionRemindersSupported,
  ensureNotificationPermission,
} from "@/services/sessionReminders";

async function getNotificationsModule() {
  return import("expo-notifications");
}

function isAppForeground(): boolean {
  return AppState.currentState === "active";
}

/** Background-only alert when the user hits today's full session target. */
export async function notifyDailyGoalAchieved(
  streak: number,
  coinAwarded: boolean,
  notificationsEnabled = true,
): Promise<void> {
  if (!areSessionRemindersSupported() || isAppForeground() || !notificationsEnabled) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const Notifications = await getNotificationsModule();
  const body = coinAwarded
    ? `You earned a Focus Coin. ${streak}-day streak!`
    : `${streak}-day streak — all sessions done today.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily goal complete",
      body,
      sound: true,
      data: { type: "daily-goal", streak },
      ...(Platform.OS === "android" ? { channelId: "session-reminders" } : {}),
    },
    trigger: null,
  });
}
