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
  /** Last session node celebrated while inside — cleared on geofence exit. */
  lastCelebratedSessionNodeId: string | null;
  show: (payload: ArrivalCelebrationPayload) => void;
  markCelebrated: (nodeId: string) => void;
  clearCelebrationMemory: () => void;
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
  lastCelebratedSessionNodeId: null,
  ...EMPTY_PAYLOAD,
  show: (payload) =>
    set({
      visible: true,
      lastCelebratedSessionNodeId: payload.nodeId,
      ...payload,
    }),
  markCelebrated: (nodeId) => set({ lastCelebratedSessionNodeId: nodeId }),
  clearCelebrationMemory: () => set({ lastCelebratedSessionNodeId: null }),
  hide: () => set({ visible: false, ...EMPTY_PAYLOAD }),
}));
