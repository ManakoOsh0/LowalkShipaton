import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BlockedApp } from "@/types/blockedApp";

import { isBlockedAppsEditingLocked } from "@/lib/blockedAppsGuard";

type BlockedAppsState = {
  apps: BlockedApp[];
  addApp: (input: { name: string; packageName?: string | null }) => void;
  removeApp: (id: string) => void;
};

function createBlockedApp(input: {
  name: string;
  packageName?: string | null;
}): BlockedApp {
  return {
    id: `blocked-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    packageName: input.packageName?.trim() || null,
    createdAt: new Date().toISOString(),
  };
}

/** Distracting apps list — package names drive native shielding when available. */
export const useBlockedAppsStore = create<BlockedAppsState>()(
  persist(
    (set) => ({
      apps: [],
      addApp: (input) => {
        if (isBlockedAppsEditingLocked()) return;
        const trimmed = input.name.trim();
        if (!trimmed) return;
        const packageName = input.packageName?.trim() || null;

        set((state) => {
          const exists = state.apps.some((app) => {
            if (packageName && app.packageName) {
              return app.packageName === packageName;
            }
            return app.name.toLowerCase() === trimmed.toLowerCase();
          });
          if (exists) return state;

          return {
            apps: [...state.apps, createBlockedApp({ name: trimmed, packageName })],
          };
        });
      },
      removeApp: (id) => {
        if (isBlockedAppsEditingLocked()) return;
        set((state) => ({
          apps: state.apps.filter((app) => app.id !== id),
        }));
      },
    }),
    {
      name: "lowalk-blocked-apps",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Migrate legacy free-text entries that lacked packageName.
        state.apps = state.apps.map((app) => ({
          ...app,
          packageName: app.packageName ?? null,
        }));
      },
    },
  ),
);
