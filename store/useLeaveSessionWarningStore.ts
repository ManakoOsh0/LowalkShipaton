import { create } from "zustand";

export type LeaveSessionWarningPayload = {
  nodeTitle: string;
  anchorName: string;
  /** Dev preview — does not require an active away session. */
  preview?: boolean;
};

type LeaveSessionWarningState = LeaveSessionWarningPayload & {
  visible: boolean;
  show: (payload: LeaveSessionWarningPayload) => void;
  hide: () => void;
};

const EMPTY_PAYLOAD: LeaveSessionWarningPayload = {
  nodeTitle: "",
  anchorName: "",
  preview: false,
};

/** Dev preview for the leave-session warning bottom sheet. */
export const useLeaveSessionWarningStore = create<LeaveSessionWarningState>((set) => ({
  visible: false,
  ...EMPTY_PAYLOAD,
  show: (payload) => set({ visible: true, ...payload }),
  hide: () => set({ visible: false, ...EMPTY_PAYLOAD }),
}));
