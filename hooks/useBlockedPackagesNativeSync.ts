import { useEffect } from "react";
import { Platform } from "react-native";

import { useBlockedAppsHydrated } from "@/hooks/usePersistedStoreHydration";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { isAppShieldSupported, syncBlockedPackageNames } from "lowalk-app-shield";

/**
 * Keeps native shield prefs aligned with the blocked-apps store.
 * Widget bundle sync is premium-gated; boot-time ShieldOrchestrator is not.
 */
export function useBlockedPackagesNativeSync(): void {
  const hydrated = useBlockedAppsHydrated();
  const packageNamesKey = useBlockedAppsStore((state) =>
    state.apps
      .map((app) => app.packageName?.trim())
      .filter((name): name is string => Boolean(name))
      .sort()
      .join("|"),
  );

  useEffect(() => {
    if (!hydrated || Platform.OS !== "android" || !isAppShieldSupported()) return;

    const packageNames = packageNamesKey.length > 0 ? packageNamesKey.split("|") : [];

    void syncBlockedPackageNames(packageNames).catch((error: unknown) => {
      if (__DEV__) {
        console.warn("[useBlockedPackagesNativeSync] Native sync failed:", error);
      }
    });
  }, [hydrated, packageNamesKey]);
}
