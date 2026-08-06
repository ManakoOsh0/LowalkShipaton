import { useEffect, useRef, useState } from "react";

import { AppState, type AppStateStatus } from "react-native";



import {

  hasUsageStatsPermission,

  isAppShieldMonitoringActive,

  isAppShieldSupported,

  startAppShieldMonitoring,

  stopAppShieldMonitoring,

  type ShieldOverlayContext,

} from "lowalk-app-shield";

import { getAppShieldBlockersAsync } from "@/lib/appShieldStatus";

import {

  getShieldOverlayCopy,

  SHIELD_CLOSE_LABEL,

  SHIELD_OVERLAY_SUBTITLE,

} from "@/lib/shieldOverlayCopy";

import { isShieldActiveForNodes } from "@/lib/sessionPenalty";

import { computeShieldEndsAtMs } from "@/lib/shieldSchedule";

import type { PresenceContext } from "@/store/selectors";

import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";

import { useScheduleStore } from "@/store/useScheduleStore";

import { useUserStore } from "@/store/useUserStore";



function buildOverlayContext(nodeKind: string): ShieldOverlayContext {

  return {

    nodeKind,

    headline: "",

    subtitle: SHIELD_OVERLAY_SUBTITLE,

    ctaLabel: SHIELD_CLOSE_LABEL,

  };

}



/**

 * Starts the Android foreground shield monitor during calendar-driven lock windows.

 * Native service survives swipe-kill via persisted shield end time.

 */

export function useAppShielding(presence: PresenceContext): void {

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

    .filter((name): name is string => Boolean(name?.trim()));



  const settings = { classPreBufferMinutes, sessionGapMergeMinutes };

  const shieldActive = isShieldActiveForNodes(focusNodes, activeSession, settings);

  const shouldMonitor =

    isAppShieldSupported() && shieldActive && packageNames.length > 0;



  const shieldEndsAtMs = computeShieldEndsAtMs(

    focusNodes,

    activeSession,

    settings,

  );



  const focusNodeKind =

    activeSession

      ? focusNodes.find((node) => node.id === activeSession.nodeId)?.kind ?? "custom"

      : focusNodes[0]?.kind ?? "custom";



  useEffect(() => {

    if (!shouldMonitor) return undefined;

    const interval = setInterval(() => setShieldTick((tick) => tick + 1), 1000);

    return () => clearInterval(interval);

  }, [

    shouldMonitor,

    activeSession?.nodeId,

    activeSession?.endsAt,

    activeSession?.penaltyShieldEndsAt,

    activeSession?.presenceVerified,

    activeSession?.awaySince,

  ]);



  useEffect(() => {

    let cancelled = false;



    const sync = async () => {

      const nativeMonitoringActive = await isAppShieldMonitoringActive();

      if (cancelled) return;



      if (!shouldMonitor) {

        if (monitoringRef.current || nativeMonitoringActive) {

          await stopAppShieldMonitoring();

          monitoringRef.current = false;

        }

        return;

      }



      const usageOk = await hasUsageStatsPermission();

      if (cancelled) return;



      if (!usageOk) {

        if (monitoringRef.current || nativeMonitoringActive) {

          await stopAppShieldMonitoring();

          monitoringRef.current = false;

        }

        if (__DEV__ && shouldMonitor) {

          const blockers = await getAppShieldBlockersAsync();

          console.warn("[Lowalk shield] Monitoring paused:", blockers.join(", "));

        }

        return;

      }



      try {

        const overlayContext = buildOverlayContext(focusNodeKind);



        await startAppShieldMonitoring(packageNames, shieldEndsAtMs, overlayContext);

        if (cancelled) return;

        monitoringRef.current = true;

      } catch (error) {

        monitoringRef.current = false;

        if (__DEV__) {

          console.warn("[Lowalk shield] Failed to start monitoring:", error);

        }

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

    focusNodeKind,

    activeSession?.nodeId,

    activeSession?.nodeTitle,

    activeSession?.onSiteAccumulatedMs,

    activeSession?.presenceVerified,

    activeSession?.awaySince,

    presence.isInsideGeofence,

    presence.verificationSecondsRemaining,

    focusNodes,

    classPreBufferMinutes,

    sessionGapMergeMinutes,

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


