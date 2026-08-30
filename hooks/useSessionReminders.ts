import { useEffect } from "react";

import {
  areSessionRemindersSupported,
  ensureAndroidReminderChannel,
  syncSessionReminders,
} from "@/services/sessionReminders";
import { ensureAndroidPresenceChannel } from "@/services/presenceReminders";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

/**
 * Keeps local session reminders aligned with the weekly schedule.
 * Mounted once at the app root alongside the presence engine.
 */
export function useSessionReminders(): void {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const notificationsEnabled = useUserStore((state) => state.notificationsEnabled);

  useEffect(() => {
    if (!areSessionRemindersSupported()) return;

    void (async () => {
      await ensureAndroidReminderChannel();
      await ensureAndroidPresenceChannel();
      await syncSessionReminders(focusNodes, anchors, classPreBufferMinutes, new Date(), {
        enabled: notificationsEnabled,
      });
    })();
  }, [anchors, classPreBufferMinutes, focusNodes, notificationsEnabled]);
}
