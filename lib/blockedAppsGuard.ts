import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

/** Imperative check — blocked apps must not change while calendar shielding is active. */
export function isBlockedAppsEditingLocked(): boolean {
  const { focusNodes, activeSession } = useScheduleStore.getState();
  const { classPreBufferMinutes, sessionGapMergeMinutes } = useUserStore.getState();
  return isShieldActiveForNodes(focusNodes, activeSession, {
    classPreBufferMinutes,
    sessionGapMergeMinutes,
  });
}
