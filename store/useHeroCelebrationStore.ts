/**
 * Short-lived Hero moments after a session finishes — not persisted.
 * Lets the card show "Focus secured!" before rolling into the next stop.
 */
import { create } from "zustand";

export type HeroCelebrationPayload = {
  nodeId: string;
  nodeTitle: string;
  /** True when completing this session also hit the daily goal. */
  hitDailyGoal: boolean;
  /** Shown until dismissed or superseded. */
  createdAt: number;
};

type HeroCelebrationState = {
  celebration: HeroCelebrationPayload | null;
  show: (payload: Omit<HeroCelebrationPayload, "createdAt">) => void;
  dismiss: () => void;
};

const SESSION_COMPLETE_TTL_MS = 90_000;

export const useHeroCelebrationStore = create<HeroCelebrationState>((set) => ({
  celebration: null,
  show: (payload) =>
    set({
      celebration: {
        ...payload,
        createdAt: Date.now(),
      },
    }),
  dismiss: () => set({ celebration: null }),
}));

/** Returns a live celebration only while inside the TTL window. */
export function selectLiveHeroCelebration(
  celebration: HeroCelebrationPayload | null,
  now = Date.now(),
): HeroCelebrationPayload | null {
  if (!celebration) return null;
  if (now - celebration.createdAt > SESSION_COMPLETE_TTL_MS) return null;
  return celebration;
}
