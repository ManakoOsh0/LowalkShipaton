import { cancelAllSessionReminders } from "@/services/sessionReminders";
import { cancelAllPendingPresenceNotifications } from "@/services/presenceReminders";

/** Clears all scheduled user alerts (reminders + presence grace timers). */
export async function cancelAllScheduledUserAlerts(): Promise<void> {
  await Promise.all([cancelAllSessionReminders(), cancelAllPendingPresenceNotifications()]);
}
