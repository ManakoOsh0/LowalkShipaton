import { useEffect } from "react";

import {
  isWakeAlarmSupported,
  scheduleWakeAlarms,
} from "@/features/wake-challenge/services/alarmService";
import { useWakeAlarmStore } from "@/store/useWakeAlarmStore";

/** Keeps standalone wake alarm notifications aligned with persisted settings. */
export function useWakeAlarmScheduler(): void {
  const enabled = useWakeAlarmStore((state) => state.enabled);
  const hour = useWakeAlarmStore((state) => state.hour);
  const minute = useWakeAlarmStore((state) => state.minute);
  const repeatDays = useWakeAlarmStore((state) => state.repeatDays);
  const targetReps = useWakeAlarmStore((state) => state.targetReps);

  useEffect(() => {
    if (!isWakeAlarmSupported()) return;

    void scheduleWakeAlarms({
      enabled,
      hour,
      minute,
      repeatDays,
      targetReps,
    });
  }, [enabled, hour, minute, repeatDays, targetReps]);
}
