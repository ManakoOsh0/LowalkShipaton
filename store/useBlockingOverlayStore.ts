import { create } from "zustand";

type BlockingOverlayState = {
  visible: boolean;
  blockedAppName: string | null;
  show: (blockedAppName?: string) => void;
  hide: () => void;
};

/** Local UI gate for the distraction shield overlay — native shielding will call show(). */
export const useBlockingOverlayStore = create<BlockingOverlayState>((set) => ({
  visible: false,
  blockedAppName: null,
  show: (blockedAppName) =>
    set({
      visible: true,
      blockedAppName: blockedAppName?.trim() || null,
    }),
  hide: () => set({ visible: false, blockedAppName: null }),
}));
