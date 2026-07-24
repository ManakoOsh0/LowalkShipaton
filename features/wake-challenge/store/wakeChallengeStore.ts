import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PoseStatus, PushupPhase, WakeChallengeStatus } from "@/features/wake-challenge/types";

type WakeChallengeState = {
  status: WakeChallengeStatus;
  count: number;
  targetReps: number;
  phase: PushupPhase;
  poseStatus: PoseStatus;
  startedAt: string | null;
  emergencyDismissedAt: string | null;
  startChallenge: (targetReps: number) => void;
  setCount: (count: number) => void;
  setPhase: (phase: PushupPhase) => void;
  setPoseStatus: (poseStatus: PoseStatus) => void;
  completeChallenge: () => void;
  emergencyDismiss: () => void;
  resetChallenge: () => void;
};

const initialState = {
  status: "idle" as WakeChallengeStatus,
  count: 0,
  targetReps: 10,
  phase: "not-ready" as PushupPhase,
  poseStatus: "no-person" as PoseStatus,
  startedAt: null as string | null,
  emergencyDismissedAt: null as string | null,
};

/** Active wake challenge session — persisted so reopening the app resumes the alarm. */
export const useWakeChallengeStore = create<WakeChallengeState>()(
  persist(
    (set) => ({
      ...initialState,
      startChallenge: (targetReps) =>
        set({
          status: "active",
          count: 0,
          targetReps,
          phase: "not-ready",
          poseStatus: "no-person",
          startedAt: new Date().toISOString(),
          emergencyDismissedAt: null,
        }),
      setCount: (count) => set({ count }),
      setPhase: (phase) => set({ phase }),
      setPoseStatus: (poseStatus) => set({ poseStatus }),
      completeChallenge: () =>
        set({
          status: "complete",
          poseStatus: "complete",
        }),
      emergencyDismiss: () =>
        set({
          status: "emergency-dismissed",
          emergencyDismissedAt: new Date().toISOString(),
        }),
      resetChallenge: () => set({ ...initialState }),
    }),
    {
      name: "lowalk-wake-challenge",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
