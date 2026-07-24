import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  hasUsageStatsPermission,
  isAppShieldSupported,
  startAppShieldMonitoring,
  stopAppShieldMonitoring,
} from "lowalk-app-shield";
import { getShieldOverlayCopy } from "@/lib/shieldOverlayCopy";
import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
import { computeShieldEndsAtMs } from "@/lib/shieldSchedule";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

/**
 * Starts the Android foreground shield monitor during calendar-driven lock windows.
 * Native service survives swipe-kill via persisted shield end time.
 */
export function useAppShielding(): void {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const activeSession = useScheduleStore((state) => state.activeSession);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const sessionGapMergeMinutes = useUserStore((state) => state.sessionGapMergeMinutes);
  const apps = useBlockedAppsStore((state) => state.apps);
  const monitoringRef = useRef(false);
  const [permissionTick, setPermissionTick] = useState(0);
  const [shieldTick, setShieldTick] = useState(0);

  const packageNames = apps
    .map((app) => app.packageName)
    .filter((name): name is string => Boolean(name));

  const settings = { classPreBufferMinutes, sessionGapMergeMinutes };
  const shouldMonitor =
    isAppShieldSupported() &&
    isShieldActiveForNodes(focusNodes, activeSession, settings) &&
    packageNames.length > 0;

  const shieldEndsAtMs = computeShieldEndsAtMs(
    focusNodes,
    activeSession,
    settings,
  );

  useEffect(() => {
    const interval = setInterval(() => setShieldTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [
    activeSession?.nodeId,
    activeSession?.endsAt,
    activeSession?.penaltyShieldEndsAt,
    activeSession?.onSiteAccumulatedMs,
  ]);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!shouldMonitor) {
        if (monitoringRef.current) {
          await stopAppShieldMonitoring();
          monitoringRef.current = false;
        }
        return;
      }

      const usageOk = await hasUsageStatsPermission();
      if (cancelled) return;

      if (!usageOk) {
        if (monitoringRef.current) {
          await stopAppShieldMonitoring();
          monitoringRef.current = false;
        }
        return;
      }

      try {
        const focusNode = activeSession
          ? focusNodes.find((node) => node.id === activeSession.nodeId)
          : undefined;
        const overlayContext =
          activeSession && focusNode
            ? getShieldOverlayCopy(activeSession, focusNode.kind)
            : undefined;

        await startAppShieldMonitoring(packageNames, shieldEndsAtMs, overlayContext);
        if (cancelled) return;
        monitoringRef.current = true;
      } catch {
        monitoringRef.current = false;
      }
    };

    void sync();

    return () => {
      cancelled = true;
    };
  }, [
    shouldMonitor,
    packageNames.join("|"),
    permissionTick,
    shieldTick,
    shieldEndsAtMs,
    activeSession?.nodeId,
    activeSession?.nodeTitle,
    activeSession?.onSiteAccumulatedMs,
    focusNodes,
  ]);

  useEffect(() => {
    if (!isAppShieldSupported()) return;

    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        setPermissionTick((tick) => tick + 1);
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);
}
