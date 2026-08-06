import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { hasUsableCoordinates, resolveAnchorForNode } from "@/lib/geo";
import { parseTimeToMinutes, toIsoDateString } from "@/lib/time";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";

const SESSION_REMINDER_PREFIX = "lowalk-session-";
const PRE_BUFFER_REMINDER_PREFIX = "lowalk-prebuffer-";

/** How far ahead of nominal startTime the "starts soon" reminder fires. */
export const SESSION_START_LEAD_MINUTES = 15;

/** Schedule reminders this many calendar days ahead so they fire without reopening the app. */
export const SESSION_REMINDER_AHEAD_DAYS = 7;

const REMINDER_PREFIXES = [SESSION_REMINDER_PREFIX, PRE_BUFFER_REMINDER_PREFIX];

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

function buildPreBufferTitle(node: FocusNode, classPreBufferMinutes: number): string {
  return `${node.title} in ${classPreBufferMinutes} minutes`;
}

function buildPreBufferBody(node: FocusNode, anchors: Anchor[]): string {
  const anchor = resolveAnchorForNode(node.anchorId, anchors);
  if (!anchor) {
    return "Your apps are blocked — make your way to class.";
  }
  if (!hasUsableCoordinates(anchor)) {
    return `Your apps are blocked — arrive at ${anchor.name} to capture GPS before class.`;
  }
  return `Your apps are blocked — make your way to class at ${anchor.name}.`;
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
    if (node.schedule.type === "class") {
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
    }

    const triggerDate = buildTriggerDate(
      node.schedule.startTime,
      SESSION_START_LEAD_MINUTES,
      dayDate,
      now,
    );
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

/** Clears and reschedules local reminders for upcoming Focus Nodes across the week. */
export async function syncSessionReminders(
  nodes: FocusNode[],
  anchors: Anchor[],
  classPreBufferMinutes: number,
  referenceDate = new Date(),
): Promise<void> {
  if (!areSessionRemindersSupported()) return;

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
