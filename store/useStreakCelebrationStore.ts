import { create } from "zustand";

type StreakCelebrationPayload = {
  streak: number;
  coinAwarded: boolean;
};

type StreakCelebrationState = StreakCelebrationPayload & {
  visible: boolean;
  show: (payload: StreakCelebrationPayload) => void;
  hide: () => void;
};

/** Queues the Duolingo-style daily-goal celebration modal after streak/coin updates. */
export const useStreakCelebrationStore = create<StreakCelebrationState>((set) => ({
  visible: false,
  streak: 0,
  coinAwarded: false,
  show: (payload) => set({ visible: true, ...payload }),
  hide: () => set({ visible: false }),
}));
