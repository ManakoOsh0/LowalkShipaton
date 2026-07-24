import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Platform } from "react-native";

import { alarmSoundAsset } from "@/constants/sounds";
import type { WakeAlarmNotificationData } from "@/features/wake-challenge/types";
import {
  areSessionRemindersSupported,
  ensureNotificationPermission as ensureSharedNotificationPermission,
} from "@/services/sessionReminders";
import type { WakeAlarmConfig } from "@/store/useWakeAlarmStore";

export const WAKE_ALARM_PREFIX = "lowalk-wake-";
export const WAKE_ALARM_CHANNEL_ID = "wake-alarms";

let alarmSound: Audio.Sound | null = null;

/** Wake alarms require a dev build and are Android-first for MVP. */
export function isWakeAlarmSupported(): boolean {
  if (Platform.OS === "ios") {
    return false;
  }

  return areSessionRemindersSupported();
}

async function getNotificationsModule() {
  return import("expo-notifications");
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isWakeAlarmSupported()) return false;
  return ensureSharedNotificationPermission();
}

function buildNextTriggerDate(
  hour: number,
  minute: number,
  weekday: number,
  referenceDate = new Date(),
): Date {
  const trigger = new Date(referenceDate);
  trigger.setHours(hour, minute, 0, 0);

  const dayDelta = (weekday - trigger.getDay() + 7) % 7;
  trigger.setDate(trigger.getDate() + dayDelta);

  if (dayDelta === 0 && trigger.getTime() <= referenceDate.getTime()) {
    trigger.setDate(trigger.getDate() + 7);
  }

  return trigger;
}

export async function ensureAndroidWakeAlarmChannel(): Promise<void> {
  if (!isWakeAlarmSupported() || Platform.OS !== "android") return;

  const Notifications = await getNotificationsModule();
  await Notifications.setNotificationChannelAsync(WAKE_ALARM_CHANNEL_ID, {
    name: "Wake alarms",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function cancelWakeAlarms(): Promise<void> {
  if (!isWakeAlarmSupported()) return;

  const Notifications = await getNotificationsModule();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const staleIds = scheduled
    .filter((item) => item.identifier.startsWith(WAKE_ALARM_PREFIX))
    .map((item) => item.identifier);

  await Promise.all(
    staleIds.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier)),
  );
}

export async function scheduleWakeAlarms(
  config: WakeAlarmConfig,
  referenceDate = new Date(),
): Promise<void> {
  if (!isWakeAlarmSupported() || !config.enabled) {
    await cancelWakeAlarms();
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await ensureAndroidWakeAlarmChannel();
  await cancelWakeAlarms();

  const Notifications = await getNotificationsModule();
  const repeatDays = config.repeatDays.length > 0 ? config.repeatDays : [referenceDate.getDay()];

  for (const weekday of repeatDays) {
    const triggerDate = buildNextTriggerDate(
      config.hour,
      config.minute,
      weekday,
      referenceDate,
    );

    await Notifications.scheduleNotificationAsync({
      identifier: `${WAKE_ALARM_PREFIX}${weekday}`,
      content: {
        title: "Wake Challenge",
        body: `Complete ${config.targetReps} push-ups to stop your alarm.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        data: {
          type: "wake-alarm",
          alarmId: "primary",
        } satisfies WakeAlarmNotificationData,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === "android" ? WAKE_ALARM_CHANNEL_ID : undefined,
      },
    });
  }
}

export async function startAlarmSound(): Promise<void> {
  if (alarmSound) {
    const status = await alarmSound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      return;
    }
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });

  if (alarmSound) {
    await alarmSound.unloadAsync();
    alarmSound = null;
  }

  const { sound } = await Audio.Sound.createAsync(alarmSoundAsset, {
    isLooping: true,
    shouldPlay: true,
    volume: 1,
  });
  alarmSound = sound;
}

export async function stopAlarmSound(): Promise<void> {
  if (!alarmSound) return;

  try {
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
  } finally {
    alarmSound = null;
  }
}

export function isWakeAlarmNotificationData(
  data: Record<string, unknown> | undefined,
): data is WakeAlarmNotificationData {
  return data?.type === "wake-alarm" && data?.alarmId === "primary";
}
