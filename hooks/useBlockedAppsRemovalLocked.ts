import { useEffect, useState } from "react";

import { isBlockedAppsRemovalLocked } from "@/lib/blockedAppsGuard";

/** Reactive hook — true while focus shielding is active and removals should stay disabled. */
export function useBlockedAppsRemovalLocked(): boolean {
  const [locked, setLocked] = useState(isBlockedAppsRemovalLocked);

  useEffect(() => {
    setLocked(isBlockedAppsRemovalLocked());
    const interval = setInterval(() => {
      setLocked(isBlockedAppsRemovalLocked());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return locked;
}
