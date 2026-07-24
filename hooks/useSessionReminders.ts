import { useEffect } from "react";

import {
  areSessionRemindersSupported,
  ensureAndroidReminderChannel,
  syncTodaySessionReminders,
} from "@/services/sessionReminders";
import { useScheduleStore } from "@/store/useScheduleStore";

/**
 * Keeps local session-start reminders aligned with today's schedule.
 * Mounted once at the app root alongside the presence engine.
 */
export function useSessionReminders(): void {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);

  useEffect(() => {
    if (!areSessionRemindersSupported()) return;

    void (async () => {
      await ensureAndroidReminderChannel();
      await syncTodaySessionReminders(focusNodes, anchors);
    })();
  }, [anchors, focusNodes]);
}
