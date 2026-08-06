import { create } from "zustand";

import type { FocusNodeKind } from "@/types/focusNode";

export type PendingStreakCelebration = {
  streak: number;
  coinAwarded: boolean;
};

export type SessionCompletePayload = {
  nodeId: string;
  nodeTitle: string;
  kind: FocusNodeKind;
  streak: number;
  hitDailyGoal: boolean;
  coinAwarded: boolean;
  /** Shown after the user dismisses this screen. */
  pendingStreakCelebration: PendingStreakCelebration | null;
  completedAt: number;
  durationMs: number;
  onSitePercent: number | null;
  presenceVerified: boolean;
  scheduleType: "class" | "duration";
  venueName: string | null;
};

type SessionCompleteState = {
  visible: boolean;
  payload: SessionCompletePayload | null;
  show: (payload: Omit<SessionCompletePayload, "completedAt">) => void;
  hide: () => void;
};

/** Full-screen "Done" moment after a Focus Node session is marked complete. */
export const useSessionCompleteStore = create<SessionCompleteState>((set) => ({
  visible: false,
  payload: null,
  show: (payload) =>
    set({
      visible: true,
      payload: {
        ...payload,
        completedAt: Date.now(),
      },
    }),
  hide: () => set({ visible: false, payload: null }),
}));
