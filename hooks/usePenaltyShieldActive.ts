import { useEffect, useState } from "react";

import {
  getFocusNodeRemovalLockReason,
  isFocusNodeRemovalLocked,
  isPenaltyShieldActive,
  type FocusNodeRemovalLockReason,
} from "@/lib/sessionPenalty";
import { useScheduleStore } from "@/store/useScheduleStore";

/** Re-check once a second while a penalty lock is running so UI unlocks at expiry. */
function usePenaltyClock(active: boolean): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active]);

  return now;
}

/** Reactive — true while the live session has unexpired penalty lock time. */
export function usePenaltyShieldActive(): boolean {
  const activeSession = useScheduleStore((state) => state.activeSession);
  const now = usePenaltyClock(isPenaltyShieldActive(activeSession));
  return isPenaltyShieldActive(activeSession, now);
}

/** Reactive — true when this Focus Node cannot be deleted because it owns the live session. */
export function useFocusNodeRemovalLocked(nodeId: string | null | undefined): boolean {
  const reason = useFocusNodeRemovalLockReason(nodeId);
  return reason != null;
}

/** Reactive lock reason for delete affordances — penalty vs in-progress session. */
export function useFocusNodeRemovalLockReason(
  nodeId: string | null | undefined,
): FocusNodeRemovalLockReason | null {
  const activeSession = useScheduleStore((state) => state.activeSession);
  const now = usePenaltyClock(isPenaltyShieldActive(activeSession));
  if (!nodeId) return null;
  return getFocusNodeRemovalLockReason(nodeId, activeSession, now);
}
