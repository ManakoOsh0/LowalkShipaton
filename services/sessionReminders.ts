import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { hasUsableCoordinates, resolveAnchorForNode } from "@/lib/geo";
import { parseTimeToMinutes, toIsoDateString } from "@/lib/time";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";

const SESSION_REMINDER_PREFIX = "lowalk-session-";

let handlerConfigured = false;

/**
 * Local scheduled notifications were removed from Expo Go on Android (SDK 53+).
 * They still work in dev builds and on iOS Expo Go.
 */
export function areSessionRemindersSupported(): boolean {
  return !(
    Platform.OS === "android" &&
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
}

async function getNotificationsModule() {
  return import("expo-notifications");
}

async function ensureNotificationHandler(): Promise<void> {
  if (handlerConfigured || !areSessionRemindersSupported()) return;

  const Notifications = await getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as { type?: string } | undefined;
      const isWakeAlarm = data?.type === "wake-alarm";

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: isWakeAlarm
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
      };
    },
  });
  handlerConfigured = true;
}

function buildTriggerDate(startTime: string, referenceDate = new Date()): Date | null {
  const startMinutes = parseTimeToMinutes(startTime);
  const trigger = new Date(referenceDate);
  trigger.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

  if (trigger.getTime() <= referenceDate.getTime()) {
    return null;
  }

  return trigger;
}

function buildReminderBody(node: FocusNode, anchors: Anchor[]): string {
  const anchor = resolveAnchorForNode(node.anchorId, anchors);
  if (!anchor) {
    return "Add a venue in your Focus Node before this window opens.";
  }
  if (!hasUsableCoordinates(anchor)) {
    return `Arrive at ${anchor.name} to capture GPS and start your session.`;
  }
  return `Head to ${anchor.name} — your focus window is starting.`;
}

/** Requests notification permission — required before scheduling session reminders. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!areSessionRemindersSupported()) return false;

  await ensureNotificationHandler();
  const Notifications = await getNotificationsModule();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Clears and reschedules local reminders for today's upcoming Focus Nodes. */
export async function syncTodaySessionReminders(
  nodes: FocusNode[],
  anchors: Anchor[],
  referenceDate = new Date(),
): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const Notifications = await getNotificationsModule();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const staleIds = scheduled
    .filter((item) => item.identifier.startsWith(SESSION_REMINDER_PREFIX))
    .map((item) => item.identifier);

  if (staleIds.length > 0) {
    await Promise.all(
      staleIds.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier),
      ),
    );
  }

  const todayWeekday = referenceDate.getDay();
  const todayIso = toIsoDateString(referenceDate);

  const todayNodes = nodes.filter((node) => node.schedule.weekday === todayWeekday);
  const upcomingNodes = todayNodes.filter(
    (node) =>
      !node.completedDates.includes(todayIso) &&
      !(node.skippedDates ?? []).includes(todayIso),
  );

  for (const node of upcomingNodes) {
    const triggerDate = buildTriggerDate(node.schedule.startTime, referenceDate);
    if (!triggerDate) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${SESSION_REMINDER_PREFIX}${node.id}-${todayIso}`,
      content: {
        title: `${node.title} starts soon`,
        body: buildReminderBody(node, anchors),
        sound: true,
        data: { nodeId: node.id, type: "session-start" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === "android" ? "session-reminders" : undefined,
      },
    });
  }
}

/** Android requires a channel before reminders can fire. */
export async function ensureAndroidReminderChannel(): Promise<void> {
  if (!areSessionRemindersSupported() || Platform.OS !== "android") return;

  const Notifications = await getNotificationsModule();
  await Notifications.setNotificationChannelAsync("session-reminders", {
    name: "Session reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 120, 250],
  });
}
