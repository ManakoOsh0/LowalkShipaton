import { Platform } from "react-native";

import { ANDROID_FOCUS_ALERTS_CHANNEL_ID } from "@/lib/androidNotificationCopy";
import { fitNotificationBody, fitNotificationTitle } from "@/lib/notificationCopy";
import { buildPreBufferBody, buildPreBufferTitle } from "@/lib/preBufferCopy";
import { ensureAndroidNotificationChannels } from "@/services/androidSessionStatus";
import {
  areSessionRemindersSupported,
  ensureNotificationHandler,
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  syncSessionReminders,
} from "@/services/sessionReminders";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";

const DEV_NOTIFICATION_PREFIX = "lowalk-dev-";

async function getNotificationsModule() {
  return import("expo-notifications");
}

export type DevScheduledNotificationRow = {
  identifier: string;
  title: string;
  body: string;
  fireAt: Date | null;
  kind: "pre-buffer" | "session-missed" | "legacy-session" | "dev" | "other";
};

function classifyReminderId(identifier: string): DevScheduledNotificationRow["kind"] {
  if (identifier.startsWith("lowalk-prebuffer-")) return "pre-buffer";
  if (identifier.startsWith("lowalk-missed-")) return "session-missed";
  if (identifier.startsWith("lowalk-session-")) return "legacy-session";
  if (identifier.startsWith(DEV_NOTIFICATION_PREFIX)) return "dev";
  return "other";
}

function resolveTriggerDate(
  trigger: unknown,
  Notifications: Awaited<ReturnType<typeof getNotificationsModule>>,
): Date | null {
  if (!trigger || typeof trigger !== "object") return null;
  const record = trigger as Record<string, unknown>;
  if (record.type === Notifications.SchedulableTriggerInputTypes.DATE && record.date) {
    const parsed = new Date(record.date as string | number);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    record.type === Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL &&
    typeof record.seconds === "number"
  ) {
    return new Date(Date.now() + record.seconds * 1000);
  }
  return null;
}

function buildMissedTitle(node: FocusNode): string {
  return `You missed ${node.title}`;
}

function buildMissedBody(): string {
  return "You didn't check in today.";
}

async function prepareDevNotification(): Promise<boolean> {
  if (!areSessionRemindersSupported()) return false;
  await ensureNotificationHandler();
  await ensureAndroidNotificationChannels();
  return ensureNotificationPermission();
}

function androidFocusAlertContent(
  base: Record<string, unknown>,
): Record<string, unknown> {
  if (Platform.OS !== "android") return base;
  return { ...base, channelId: ANDROID_FOCUS_ALERTS_CHANNEL_ID };
}

type DevNotificationPayload = {
  nodeId: string;
  type: "pre-buffer" | "session-missed";
};

function buildDevNotificationContent(
  title: string,
  body: string,
  payload: DevNotificationPayload,
): { title: string; body: string; sound: true; data: Record<string, unknown> } {
  return androidFocusAlertContent({
    title: fitNotificationTitle(title),
    body: fitNotificationBody(body),
    sound: true,
    data: { ...payload, devNotification: true },
  }) as {
    title: string;
    body: string;
    sound: true;
    data: Record<string, unknown>;
  };
}

/** Permission, support, and upcoming Lowalk local reminders for /dev. */
export async function getDevNotificationDiagnostics(): Promise<{
  supported: boolean;
  permission: Awaited<ReturnType<typeof getNotificationPermissionStatus>>;
  scheduled: DevScheduledNotificationRow[];
}> {
  const supported = areSessionRemindersSupported();
  const permission = await getNotificationPermissionStatus();

  if (!supported) {
    return { supported, permission, scheduled: [] };
  }

  const Notifications = await getNotificationsModule();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const rows: DevScheduledNotificationRow[] = scheduled
    .filter((item) => item.identifier.startsWith("lowalk-"))
    .map((item) => ({
      identifier: item.identifier,
      title: item.content.title ?? "",
      body: item.content.body ?? "",
      fireAt: resolveTriggerDate(item.trigger, Notifications),
      kind: classifyReminderId(item.identifier),
    }))
    .sort((a, b) => {
      const aTime = a.fireAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = b.fireAt?.getTime() ?? Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

  return { supported, permission, scheduled: rows };
}

/** Delivers a production-shaped pre-buffer alert immediately (visible in dev while app is open). */
export async function presentDevPreBufferNotification(
  node: FocusNode,
  anchors: Anchor[],
  classPreBufferMinutes: number,
): Promise<void> {
  const granted = await prepareDevNotification();
  if (!granted) {
    throw new Error("Notification permission not granted");
  }

  const Notifications = await getNotificationsModule();
  await Notifications.scheduleNotificationAsync({
    identifier: `${DEV_NOTIFICATION_PREFIX}prebuffer-now-${Date.now()}`,
    content: buildDevNotificationContent(
      buildPreBufferTitle(node, classPreBufferMinutes),
      buildPreBufferBody(node, anchors),
      { nodeId: node.id, type: "pre-buffer" },
    ),
    trigger: null,
  });
}

/** Schedules a production-shaped pre-buffer alert after a short delay. */
export async function scheduleDevPreBufferNotification(
  node: FocusNode,
  anchors: Anchor[],
  classPreBufferMinutes: number,
  delaySeconds = 5,
): Promise<void> {
  const granted = await prepareDevNotification();
  if (!granted) {
    throw new Error("Notification permission not granted");
  }

  const Notifications = await getNotificationsModule();
  const trigger =
    delaySeconds <= 0
      ? null
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, delaySeconds),
          ...(Platform.OS === "android"
            ? { channelId: ANDROID_FOCUS_ALERTS_CHANNEL_ID }
            : {}),
        };

  await Notifications.scheduleNotificationAsync({
    identifier: `${DEV_NOTIFICATION_PREFIX}prebuffer-${node.id}-${Date.now()}`,
    content: buildDevNotificationContent(
      buildPreBufferTitle(node, classPreBufferMinutes),
      buildPreBufferBody(node, anchors),
      { nodeId: node.id, type: "pre-buffer" },
    ),
    trigger,
  });
}

/** Schedules a production-shaped missed-session alert after a short delay. */
export async function scheduleDevMissedSessionNotification(
  node: FocusNode,
  delaySeconds = 5,
): Promise<void> {
  const granted = await prepareDevNotification();
  if (!granted) {
    throw new Error("Notification permission not granted");
  }

  const Notifications = await getNotificationsModule();
  const trigger =
    delaySeconds <= 0
      ? null
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, delaySeconds),
          ...(Platform.OS === "android"
            ? { channelId: ANDROID_FOCUS_ALERTS_CHANNEL_ID }
            : {}),
        };

  await Notifications.scheduleNotificationAsync({
    identifier: `${DEV_NOTIFICATION_PREFIX}missed-${node.id}-${Date.now()}`,
    content: buildDevNotificationContent(buildMissedTitle(node), buildMissedBody(), {
      nodeId: node.id,
      type: "session-missed",
    }),
    trigger,
  });
}

/** Re-runs session reminder sync with live schedule data (same as production hook). */
export async function resyncDevSessionReminders(
  nodes: FocusNode[],
  anchors: Anchor[],
  classPreBufferMinutes: number,
  notificationsEnabled: boolean,
): Promise<void> {
  await syncSessionReminders(nodes, anchors, classPreBufferMinutes, new Date(), {
    enabled: notificationsEnabled,
  });
}
