import { AppState, Platform } from "react-native";

import {
  formatDurationAwayNotificationBody,
  PRESENCE_PENALTY_GRACE_MS,
} from "@/lib/sessionPenalty";
import {
  areSessionRemindersSupported,
  ensureNotificationPermission,
} from "@/services/sessionReminders";
import type { SessionScheduleType } from "@/types/session";

const PRESENCE_PREFIX = "lowalk-presence-";

const GRACE_WARNING_MS = PRESENCE_PENALTY_GRACE_MS - 60_000;

function awayId(nodeId: string): string {
  return `${PRESENCE_PREFIX}away-${nodeId}`;
}

function graceId(nodeId: string): string {
  return `${PRESENCE_PREFIX}grace-${nodeId}`;
}

function penaltyId(nodeId: string): string {
  return `${PRESENCE_PREFIX}penalty-${nodeId}`;
}

async function getNotificationsModule() {
  return import("expo-notifications");
}

function isAppForeground(): boolean {
  return AppState.currentState === "active";
}

/** Android channel for away / grace / penalty alerts. */
export async function ensureAndroidPresenceChannel(): Promise<void> {
  if (!areSessionRemindersSupported() || Platform.OS !== "android") return;

  const Notifications = await getNotificationsModule();
  await Notifications.setNotificationChannelAsync("presence-alerts", {
    name: "Presence alerts",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 120, 250],
  });
}

async function cancelPresenceNotifications(nodeId: string): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const Notifications = await getNotificationsModule();
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(awayId(nodeId)),
    Notifications.cancelScheduledNotificationAsync(graceId(nodeId)),
    Notifications.cancelScheduledNotificationAsync(penaltyId(nodeId)),
  ]);
}

/** Immediate away alert. Classes also schedule a grace warning 1 min before penalty. */
export async function notifySessionAway(
  zoneLabel: string,
  nodeId: string,
  scheduleType: SessionScheduleType,
): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await ensureAndroidPresenceChannel();
  const Notifications = await getNotificationsModule();
  const zone = zoneLabel.trim() || "your venue";

  if (!isAppForeground()) {
    await Notifications.scheduleNotificationAsync({
      identifier: awayId(nodeId),
      content: {
        title: "You left your focus zone",
        body:
          scheduleType === "duration"
            ? formatDurationAwayNotificationBody(zone)
            : `Return to ${zone} within 5 minutes to avoid a penalty lock.`,
        sound: true,
        data: { nodeId, type: "session-away" },
        ...(Platform.OS === "android" ? { channelId: "presence-alerts" } : {}),
      },
      trigger: null,
    });
  }

  if (scheduleType !== "class") return;

  const graceTrigger = new Date(Date.now() + GRACE_WARNING_MS);
  await Notifications.scheduleNotificationAsync({
    identifier: graceId(nodeId),
    content: {
      title: "1 minute until penalty",
      body: `Return to ${zone} now to avoid an extra app lock.`,
      sound: true,
      data: { nodeId, type: "grace-warning" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: graceTrigger,
      channelId: Platform.OS === "android" ? "presence-alerts" : undefined,
    },
  });
}

/** Cancel scheduled grace warnings when the user returns on site. */
export async function clearSessionAwayNotifications(nodeId: string): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const Notifications = await getNotificationsModule();
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(graceId(nodeId)),
    Notifications.cancelScheduledNotificationAsync(penaltyId(nodeId)),
  ]);
}

/** Fired when the grace window expires — skips if app is foreground (Hero + haptics). */
export async function notifyPresencePenalty(
  zoneLabel: string,
  nodeId: string,
  penaltyMinutes: number,
): Promise<void> {
  await notifyPenaltyLock(zoneLabel, nodeId, penaltyMinutes, {
    title: "Apps locked",
    bodyPrefix: "Penalty lock for",
    dataType: "presence-penalty",
    suffix: "Return to",
  });
}

/** Fired when a class ends without completion — skips if app is foreground. */
export async function notifyMissedClassPenalty(
  zoneLabel: string,
  nodeId: string,
  penaltyMinutes: number,
): Promise<void> {
  await notifyPenaltyLock(zoneLabel, nodeId, penaltyMinutes, {
    title: "Class missed",
    bodyPrefix: "Miss penalty lock for",
    dataType: "class-miss-penalty",
    suffix: "Head to",
  });
}

async function notifyPenaltyLock(
  zoneLabel: string,
  nodeId: string,
  penaltyMinutes: number,
  copy: {
    title: string;
    bodyPrefix: string;
    dataType: string;
    suffix: string;
  },
): Promise<void> {
  if (!areSessionRemindersSupported()) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await ensureAndroidPresenceChannel();
  const Notifications = await getNotificationsModule();

  await Notifications.cancelScheduledNotificationAsync(graceId(nodeId));

  if (isAppForeground()) return;

  const zone = zoneLabel.trim() || "your venue";
  const durationLabel =
    penaltyMinutes === 60 ? "1 hour" : penaltyMinutes === 120 ? "2 hours" : `${penaltyMinutes} minutes`;

  await Notifications.scheduleNotificationAsync({
    identifier: penaltyId(nodeId),
    content: {
      title: copy.title,
      body: `${copy.bodyPrefix} ${durationLabel}. ${copy.suffix} ${zone} to finish your session.`,
      sound: true,
      data: { nodeId, type: copy.dataType },
      ...(Platform.OS === "android" ? { channelId: "presence-alerts" } : {}),
    },
    trigger: null,
  });
}

/** Clear all presence notifications when a session ends or is cleared. */
export async function cancelAllPresenceNotifications(nodeId: string): Promise<void> {
  await cancelPresenceNotifications(nodeId);
}
