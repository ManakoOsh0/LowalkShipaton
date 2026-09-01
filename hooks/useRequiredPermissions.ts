import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import {
  countApplicablePermissions,
  loadPermissionChecks,
  selectNextPermissionStep,
  type PermissionCheck,
} from "@/lib/requiredPermissions";

/** Live OS permission snapshot — refreshes when the app returns from Settings. */
export function useRequiredPermissions() {
  const [checks, setChecks] = useState<PermissionCheck[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const next = await loadPermissionChecks();
    setChecks(next);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const nextStep = useMemo(() => selectNextPermissionStep(checks), [checks]);
  const progress = useMemo(() => countApplicablePermissions(checks), [checks]);

  return { checks, ready, nextStep, progress, refresh };
}
