import { create } from "zustand";

import type { SessionScheduleType } from "@/types/session";

export type LeaveSessionWarningPayload = {
  nodeTitle: string;
  anchorName: string;
  scheduleType?: SessionScheduleType | null;
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
  scheduleType: null,
  preview: false,
};

/** Dev preview for the leave-session warning bottom sheet. */
export const useLeaveSessionWarningStore = create<LeaveSessionWarningState>((set) => ({
  visible: false,
  ...EMPTY_PAYLOAD,
  show: (payload) => set({ visible: true, ...payload }),
  hide: () => set({ visible: false, ...EMPTY_PAYLOAD }),
}));
