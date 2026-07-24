import { useEffect, useState } from "react";

import { isBlockedAppsEditingLocked } from "@/lib/blockedAppsGuard";

/** Reactive hook — re-evaluates every second while shield windows can change. */
export function useBlockedAppsEditingLocked(): boolean {
  const [locked, setLocked] = useState(isBlockedAppsEditingLocked);

  useEffect(() => {
    setLocked(isBlockedAppsEditingLocked());
    const interval = setInterval(() => {
      setLocked(isBlockedAppsEditingLocked());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return locked;
}
