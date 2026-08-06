import { create } from "zustand";

export type SessionPenaltyPayload = {
  nodeTitle: string;
  anchorName: string;
  penaltyMinutes: number;
  /** Dev preview — does not require an active penalty session. */
  preview?: boolean;
};

type SessionPenaltyState = SessionPenaltyPayload & {
  visible: boolean;
  show: (payload: SessionPenaltyPayload) => void;
  hide: () => void;
};

const EMPTY_PAYLOAD: SessionPenaltyPayload = {
  nodeTitle: "",
  anchorName: "",
  penaltyMinutes: 30,
  preview: false,
};

/** Queues the presence-penalty bottom sheet after the away grace window expires. */
export const useSessionPenaltyStore = create<SessionPenaltyState>((set) => ({
  visible: false,
  ...EMPTY_PAYLOAD,
  show: (payload) => set({ visible: true, ...payload }),
  hide: () => set({ visible: false, ...EMPTY_PAYLOAD }),
}));
