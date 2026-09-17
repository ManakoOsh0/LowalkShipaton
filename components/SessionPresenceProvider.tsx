import type { ReactNode } from "react";

import { SessionPresenceContext } from "@/contexts/SessionPresenceContext";
import { useAppShielding } from "@/hooks/useAppShielding";
import { useBlockedPackagesNativeSync } from "@/hooks/useBlockedPackagesNativeSync";
import { useWidgetScheduleSync } from "@/hooks/useWidgetScheduleSync";
import { useBackgroundPresence } from "@/hooks/useBackgroundPresence";
import { useSessionPresenceEngine } from "@/hooks/useSessionPresenceEngine";

/** Mounts presence + shielding engines so sessions survive navigation and app switches. */
export function SessionPresenceProvider({ children }: { children: ReactNode }) {
  const presence = useSessionPresenceEngine();
  useBackgroundPresence();
  useAppShielding(presence);
  useBlockedPackagesNativeSync();
  useWidgetScheduleSync(presence);

  return (
    <SessionPresenceContext.Provider value={presence}>
      {children}
    </SessionPresenceContext.Provider>
  );
}
