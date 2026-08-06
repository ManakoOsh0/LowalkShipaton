import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

/** Apps picked from the installed-app list — required for native shielding. */
export function getEnforceableBlockedAppsCount(): number {
  return useBlockedAppsStore
    .getState()
    .apps.filter((app) => Boolean(app.packageName?.trim())).length;
}

/** Imperative check — removals blocked while calendar shielding is active; adds stay allowed. */
export function isBlockedAppsRemovalLocked(): boolean {
  const { focusNodes, activeSession } = useScheduleStore.getState();
  const { classPreBufferMinutes, sessionGapMergeMinutes } = useUserStore.getState();
  return isShieldActiveForNodes(focusNodes, activeSession, {
    classPreBufferMinutes,
    sessionGapMergeMinutes,
  });
}

/** @deprecated Use isBlockedAppsRemovalLocked — adds are no longer gated by shield windows. */
export function isBlockedAppsEditingLocked(): boolean {
  return isBlockedAppsRemovalLocked();
}
