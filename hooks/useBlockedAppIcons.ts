import { useEffect, useMemo, useState } from "react";

import { getAppIcons, isAppShieldSupported } from "lowalk-app-shield";
import type { BlockedApp } from "@/types/blockedApp";

/** Loads launcher icons for blocked Android packages (not persisted — fetched on demand). */
export function useBlockedAppIcons(apps: BlockedApp[]): Record<string, string> {
  const packageNames = useMemo(
    () =>
      apps
        .map((app) => app.packageName)
        .filter((name): name is string => Boolean(name)),
    [apps],
  );

  const packageKey = packageNames.join("|");
  const [iconsByPackage, setIconsByPackage] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAppShieldSupported() || packageNames.length === 0) {
      setIconsByPackage({});
      return;
    }

    let cancelled = false;

    void getAppIcons(packageNames).then((entries) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const entry of entries) {
        next[entry.packageName] = entry.iconUri;
      }
      setIconsByPackage(next);
    });

    return () => {
      cancelled = true;
    };
  }, [packageKey, packageNames]);

  return iconsByPackage;
}
