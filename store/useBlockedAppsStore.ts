import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BlockedApp } from "@/types/blockedApp";

import { isBlockedAppsRemovalLocked } from "@/lib/blockedAppsGuard";

type BlockedAppInput = { name: string; packageName?: string | null };

type BlockedAppsState = {
  apps: BlockedApp[];
  addApp: (input: BlockedAppInput) => void;
  addApps: (inputs: BlockedAppInput[]) => void;
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

function isDuplicateBlockedApp(
  apps: BlockedApp[],
  trimmedName: string,
  packageName: string | null,
): boolean {
  return apps.some((app) => {
    if (packageName && app.packageName) {
      return app.packageName === packageName;
    }
    return app.name.toLowerCase() === trimmedName.toLowerCase();
  });
}

function appendBlockedApps(
  existing: BlockedApp[],
  inputs: BlockedAppInput[],
): BlockedApp[] {
  const next = [...existing];
  for (const input of inputs) {
    const trimmed = input.name.trim();
    if (!trimmed) continue;
    const packageName = input.packageName?.trim() || null;
    if (isDuplicateBlockedApp(next, trimmed, packageName)) continue;
    next.push(createBlockedApp({ name: trimmed, packageName }));
  }
  return next;
}

/** Distracting apps list — package names drive native shielding when available. */
export const useBlockedAppsStore = create<BlockedAppsState>()(
  persist(
    (set) => ({
      apps: [],
      addApp: (input) => {
        const trimmed = input.name.trim();
        if (!trimmed) return;

        set((state) => {
          const next = appendBlockedApps(state.apps, [input]);
          if (next.length === state.apps.length) return state;
          return { apps: next };
        });
      },
      addApps: (inputs) => {
        if (inputs.length === 0) return;

        set((state) => {
          const next = appendBlockedApps(state.apps, inputs);
          if (next.length === state.apps.length) return state;
          return { apps: next };
        });
      },
      removeApp: (id) => {
        if (isBlockedAppsRemovalLocked()) return;
        set((state) => ({
          apps: state.apps.filter((app) => app.id !== id),
        }));
      },
    }),
    {
      name: "lowalk-blocked-apps",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ apps: state.apps }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Pick<BlockedAppsState, "apps">),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Migrate legacy free-text entries that lacked packageName.
        state.apps = (state.apps ?? []).map((app) => ({
          ...app,
          packageName: app.packageName ?? null,
        }));
      },
    },
  ),
);
