import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { buildPreBufferBody, buildPreBufferTitle } from "@/lib/preBufferCopy";
import { getScheduleWindow, parseTimeToMinutes, toIsoDateString } from "@/lib/time";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";

/** Legacy prefix — cleared on sync so old 15-minute reminders are removed. */
const SESSION_REMINDER_PREFIX = "lowalk-session-";
const PRE_BUFFER_REMINDER_PREFIX = "lowalk-prebuffer-";
const MISSED_REMINDER_PREFIX = "lowalk-missed-";

/** Schedule reminders this many calendar days ahead so they fire without reopening the app. */
export const SESSION_REMINDER_AHEAD_DAYS = 7;

const REMINDER_PREFIXES = [
  SESSION_REMINDER_PREFIX,
  PRE_BUFFER_REMINDER_PREFIX,
  MISSED_REMINDER_PREFIX,
];

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

export async function ensureNotificationHandler(): Promise<void> {
  if (handlerConfigured || !areSessionRemindersSupported()) return;

  const Notifications = await getNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });
  handlerConfigured = true;
}

function buildTriggerDate(
  startTime: string,
  leadMinutes: number,
  dayDate: Date,
  now = new Date(),
): Date | null {
  const startMinutes = parseTimeToMinutes(startTime);
  const trigger = new Date(dayDate);
  trigger.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  trigger.setTime(trigger.getTime() - leadMinutes * 60 * 1000);

  if (trigger.getTime() <= now.getTime()) {
    return null;
  }

  return trigger;
}

/** Fires at the scheduled window end when the user never completed or skipped. */
function buildWindowEndTriggerDate(
  node: FocusNode,
  dayDate: Date,
  now = new Date(),
): Date | null {
  const { endMinutes } = getScheduleWindow(node.schedule);
  const trigger = new Date(dayDate);
  trigger.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

  if (trigger.getTime() <= now.getTime()) {
    return null;
  }

  return trigger;
}

function buildMissedTitle(node: FocusNode): string {
  return `You missed ${node.title}`;
}

function buildMissedBody(): string {
  return "You didn't check in today.";
}

function missedReminderId(nodeId: string, dateIso: string): string {
  return `${MISSED_REMINDER_PREFIX}${nodeId}-${dateIso}`;
}

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

/** Reads OS notification permission without prompting. */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!areSessionRemindersSupported()) return "denied";

  await ensureNotificationHandler();
  const Notifications = await getNotificationsModule();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return "granted";
  if (settings.status === "denied") return "denied";
  return "undetermined";
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

/** Clears scheduled pre-buffer and missed-session reminders. */
export async function cancelAllSessionReminders(): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const Notifications = await getNotificationsModule();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const staleIds = scheduled
    .filter((item) =>
      REMINDER_PREFIXES.some((prefix) => item.identifier.startsWith(prefix)),
    )
    .map((item) => item.identifier);

  if (staleIds.length === 0) return;

  await Promise.all(
    staleIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

/** Cancel a scheduled missed-session alert after complete, skip, or check-in. */
export async function cancelMissedSessionReminder(
  nodeId: string,
  dateIso: string,
): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const Notifications = await getNotificationsModule();
  await Notifications.cancelScheduledNotificationAsync(missedReminderId(nodeId, dateIso));
}

async function scheduleDaySessionReminders(
  nodes: FocusNode[],
  anchors: Anchor[],
  classPreBufferMinutes: number,
  dayDate: Date,
  now: Date,
  Notifications: Awaited<ReturnType<typeof getNotificationsModule>>,
): Promise<void> {
  const todayWeekday = dayDate.getDay();
  const todayIso = toIsoDateString(dayDate);

  const dayNodes = nodes.filter((node) => node.schedule.weekday === todayWeekday);
  const upcomingNodes = dayNodes.filter(
    (node) =>
      !node.completedDates.includes(todayIso) &&
      !(node.skippedDates ?? []).includes(todayIso),
  );

  for (const node of upcomingNodes) {
    const preBufferDate = buildTriggerDate(
      node.schedule.startTime,
      classPreBufferMinutes,
      dayDate,
      now,
    );
    if (preBufferDate) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PRE_BUFFER_REMINDER_PREFIX}${node.id}-${todayIso}`,
        content: {
          title: buildPreBufferTitle(node, classPreBufferMinutes),
          body: buildPreBufferBody(node, anchors),
          sound: true,
          data: { nodeId: node.id, type: "pre-buffer" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: preBufferDate,
          channelId: Platform.OS === "android" ? "session-reminders" : undefined,
        },
      });
    }

    const missedDate = buildWindowEndTriggerDate(node, dayDate, now);
    if (missedDate) {
      await Notifications.scheduleNotificationAsync({
        identifier: missedReminderId(node.id, todayIso),
        content: {
          title: buildMissedTitle(node),
          body: buildMissedBody(),
          sound: true,
          data: { nodeId: node.id, type: "session-missed" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: missedDate,
          channelId: Platform.OS === "android" ? "session-reminders" : undefined,
        },
      });
    }
  }
}

/** Clears and reschedules local reminders for upcoming Focus Nodes across the week. */
export async function syncSessionReminders(
  nodes: FocusNode[],
  anchors: Anchor[],
  classPreBufferMinutes: number,
  referenceDate = new Date(),
  options: { enabled?: boolean } = {},
): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  if (options.enabled === false) {
    await cancelAllSessionReminders();
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const Notifications = await getNotificationsModule();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const staleIds = scheduled
    .filter((item) =>
      REMINDER_PREFIXES.some((prefix) => item.identifier.startsWith(prefix)),
    )
    .map((item) => item.identifier);

  if (staleIds.length > 0) {
    await Promise.all(
      staleIds.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier),
      ),
    );
  }

  const now = referenceDate.getTime();
  for (let dayOffset = 0; dayOffset < SESSION_REMINDER_AHEAD_DAYS; dayOffset++) {
    const dayDate = new Date(referenceDate);
    dayDate.setHours(12, 0, 0, 0);
    dayDate.setDate(dayDate.getDate() + dayOffset);

    // Skip days whose last reminder window has already passed.
    if (dayDate.getTime() + 24 * 60 * 60 * 1000 < now) continue;

    await scheduleDaySessionReminders(
      nodes,
      anchors,
      classPreBufferMinutes,
      dayDate,
      referenceDate,
      Notifications,
    );
  }
}

/** @deprecated Use syncSessionReminders */
export async function syncTodaySessionReminders(
  nodes: FocusNode[],
  anchors: Anchor[],
  classPreBufferMinutes: number,
  referenceDate = new Date(),
): Promise<void> {
  return syncSessionReminders(nodes, anchors, classPreBufferMinutes, referenceDate);
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
