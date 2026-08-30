import { isPresenceDebugEnabled } from "@/lib/presenceDebug";

/** Settings row + /dev hub — Metro dev or field-test preview builds. */
export function isDevToolsHubEnabled(): boolean {
  return isPresenceDebugEnabled();
}

/** Destructive or Metro-only tooling (test data, UI previews). */
export function isDevOnlyToolsEnabled(): boolean {
  return __DEV__;
}
