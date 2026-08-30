import { useEffect, useState } from "react";

import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

type PersistApi = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};

/** True once a Zustand persist store has finished reading AsyncStorage. */
export function useHasHydrated(store: PersistApi): boolean {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());

  useEffect(() => {
    if (store.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }

    return store.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, [store]);

  return hydrated;
}

/** Schedule + user stores — home, stats, schedule, and session screens. */
export function useCoreStoresHydrated(): boolean {
  const scheduleReady = useHasHydrated(useScheduleStore);
  const userReady = useHasHydrated(useUserStore);
  return scheduleReady && userReady;
}

/** Blocked-apps list — empty-state flash before persist rehydrate. */
export function useBlockedAppsHydrated(): boolean {
  return useHasHydrated(useBlockedAppsStore);
}
