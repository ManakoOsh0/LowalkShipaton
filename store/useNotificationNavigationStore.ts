import { create } from "zustand";

type NotificationNavigationState = {
  /** Focus Node to highlight when the user opens a pre-buffer notification. */
  preBufferFocusNodeId: string | null;
  setPreBufferFocus: (nodeId: string) => void;
  clearPreBufferFocus: () => void;
};

/** One-shot navigation intent from notification taps — consumed by the Home hero. */
export const useNotificationNavigationStore = create<NotificationNavigationState>((set) => ({
  preBufferFocusNodeId: null,
  setPreBufferFocus: (nodeId) => set({ preBufferFocusNodeId: nodeId }),
  clearPreBufferFocus: () => set({ preBufferFocusNodeId: null }),
}));
