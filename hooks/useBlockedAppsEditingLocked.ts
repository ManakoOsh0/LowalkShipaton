import { useBlockedAppsRemovalLocked } from "@/hooks/useBlockedAppsRemovalLocked";

/** @deprecated Use useBlockedAppsRemovalLocked — only removals are locked during focus. */
export function useBlockedAppsEditingLocked(): boolean {
  return useBlockedAppsRemovalLocked();
}
