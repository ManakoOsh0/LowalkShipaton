import { create } from "zustand";

export type AnchoringSheetMode = "required" | "optional";

export type AnchoringSheetPayload = {
  nodeId: string;
  nodeTitle: string;
  anchorId: string;
  anchorName: string;
  mode: AnchoringSheetMode;
  /** Dev preview — skip auto-dismiss when anchoring request clears. */
  preview?: boolean;
};

type AnchoringSheetState = AnchoringSheetPayload & {
  visible: boolean;
  show: (payload: AnchoringSheetPayload) => void;
  hide: () => void;
};

const EMPTY_PAYLOAD: AnchoringSheetPayload = {
  nodeId: "",
  nodeTitle: "",
  anchorId: "",
  anchorName: "",
  mode: "required",
  preview: false,
};

/** Queues the anchoring bottom sheet for deferred venues or optional recalibration. */
export const useAnchoringSheetStore = create<AnchoringSheetState>((set) => ({
  visible: false,
  ...EMPTY_PAYLOAD,
  show: (payload) => set({ visible: true, ...payload }),
  hide: () => set({ visible: false, ...EMPTY_PAYLOAD }),
}));
