import { create } from "zustand";

type BlockingOverlayState = {
  visible: boolean;
  show: () => void;
  hide: () => void;
};

/** Local UI gate for the distraction shield overlay — native shielding will call show(). */
export const useBlockingOverlayStore = create<BlockingOverlayState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
