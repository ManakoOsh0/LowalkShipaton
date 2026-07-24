import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WakeAlarmConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  repeatDays: number[];
  targetReps: number;
};

type WakeAlarmState = WakeAlarmConfig & {
  setEnabled: (enabled: boolean) => void;
  setTime: (hour: number, minute: number) => void;
  toggleRepeatDay: (weekday: number) => void;
  setTargetReps: (targetReps: number) => void;
};

const DEFAULT_CONFIG: WakeAlarmConfig = {
  enabled: false,
  hour: 6,
  minute: 30,
  repeatDays: [1, 2, 3, 4, 5],
  targetReps: 10,
};

/** Standalone wake alarm configuration — persisted locally. */
export const useWakeAlarmStore = create<WakeAlarmState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CONFIG,
      setEnabled: (enabled) => set({ enabled }),
      setTime: (hour, minute) => set({ hour, minute }),
      toggleRepeatDay: (weekday) => {
        const current = get().repeatDays;
        const next = current.includes(weekday)
          ? current.filter((day) => day !== weekday)
          : [...current, weekday].sort((a, b) => a - b);
        set({ repeatDays: next });
      },
      setTargetReps: (targetReps) =>
        set({ targetReps: Math.min(30, Math.max(5, targetReps)) }),
    }),
    {
      name: "lowalk-wake-alarm",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
