import { create } from "zustand";

import type { ScheduleItemKind } from "@/types/dashboard";

export type ArrivalCelebrationPayload = {
  nodeId: string;
  nodeTitle: string;
  anchorName: string;
  kind: ScheduleItemKind;
  /** Dev preview — skip geofence-based auto-dismiss. */
  preview?: boolean;
};

type ArrivalCelebrationState = ArrivalCelebrationPayload & {
  visible: boolean;
  show: (payload: ArrivalCelebrationPayload) => void;
  hide: () => void;
};

const EMPTY_PAYLOAD: ArrivalCelebrationPayload = {
  nodeId: "",
  nodeTitle: "",
  anchorName: "",
  kind: "custom",
  preview: false,
};

/** Queues the arrival bottom sheet when geofence verification begins. */
export const useArrivalCelebrationStore = create<ArrivalCelebrationState>((set) => ({
  visible: false,
  ...EMPTY_PAYLOAD,
  show: (payload) => set({ visible: true, ...payload }),
  hide: () => set({ visible: false, ...EMPTY_PAYLOAD }),
}));
