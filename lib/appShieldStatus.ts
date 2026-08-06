import Constants from "expo-constants";

import {
  hasOverlayPermission,
  hasUsageStatsPermission,
  isAppShieldMonitoringActive,
  isAppShieldSupported,
} from "lowalk-app-shield";
import { isShieldActiveForNodes } from "@/lib/sessionPenalty";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";

export type AppShieldBlocker =
  | "expo_go"
  | "native_unavailable"
  | "usage_access"
  | "overlay_access"
  | "no_blocked_apps"
  | "no_package_names"
  | "shield_inactive"
  | "service_inactive";

export type AppShieldStatus = {
  supported: boolean;
  shouldShield: boolean;
  monitoringReady: boolean;
  blockers: AppShieldBlocker[];
  blockedAppCount: number;
  packageCount: number;
};

export function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

/** Imperative snapshot — why native shielding may not be running right now. */
export function getAppShieldStatus(now = Date.now()): AppShieldStatus {
  const { focusNodes, activeSession } = useScheduleStore.getState();
  const { classPreBufferMinutes, sessionGapMergeMinutes } = useUserStore.getState();
  const apps = useBlockedAppsStore.getState().apps;
  const packageCount = apps.filter((app) => Boolean(app.packageName?.trim())).length;

  const settings = { classPreBufferMinutes, sessionGapMergeMinutes };
  const shouldShield = isShieldActiveForNodes(focusNodes, activeSession, settings, now);

  const blockers: AppShieldBlocker[] = [];

  if (isRunningInExpoGo()) {
    blockers.push("expo_go");
  } else if (!isAppShieldSupported()) {
    blockers.push("native_unavailable");
  }

  if (apps.length === 0) {
    blockers.push("no_blocked_apps");
  } else if (packageCount === 0) {
    blockers.push("no_package_names");
  }

  if (!shouldShield) {
    blockers.push("shield_inactive");
  }

  const supported = isAppShieldSupported() && !isRunningInExpoGo();
  const monitoringReady =
    supported &&
    shouldShield &&
    packageCount > 0 &&
    !blockers.includes("expo_go") &&
    !blockers.includes("native_unavailable") &&
    !blockers.includes("no_blocked_apps") &&
    !blockers.includes("no_package_names") &&
    !blockers.includes("shield_inactive");

  return {
    supported,
    shouldShield,
    monitoringReady,
    blockers,
    blockedAppCount: apps.length,
    packageCount,
  };
}

export async function getAppShieldBlockersAsync(
  now = Date.now(),
): Promise<AppShieldBlocker[]> {
  const status = getAppShieldStatus(now);
  const blockers = [...status.blockers];

  if (
    blockers.includes("expo_go") ||
    blockers.includes("native_unavailable") ||
    !status.shouldShield ||
    status.packageCount === 0
  ) {
    return blockers;
  }

  const usageOk = await hasUsageStatsPermission();
  if (!usageOk) {
    blockers.push("usage_access");
  }

  const overlayOk = await hasOverlayPermission();
  if (!overlayOk) {
    blockers.push("overlay_access");
  }

  if (usageOk && overlayOk) {
    const monitoringActive = await isAppShieldMonitoringActive();
    if (!monitoringActive) {
      blockers.push("service_inactive");
    }
  }

  return blockers;
}

export function describeAppShieldBlocker(blocker: AppShieldBlocker): string {
  switch (blocker) {
    case "expo_go":
      return "App blocking requires a development or preview build. Expo Go cannot load Lowalk's native shield module.";
    case "native_unavailable":
      return "Native app shielding is not available in this build.";
    case "usage_access":
      return "Grant Usage Access so Lowalk can detect when a blocked app opens.";
    case "overlay_access":
      return "Allow Display over other apps so Lowalk can cover blocked apps with the focus shield.";
    case "no_blocked_apps":
      return "Add at least one app to your blocked list.";
    case "no_package_names":
      return "Re-pick your blocked apps from the installed-app list so each entry has a package ID.";
    case "shield_inactive":
      return "No focus shield window is active right now.";
    case "service_inactive":
      return "Focus shield monitor is not running. Return to Lowalk briefly, then open a blocked app again.";
    default:
      return "App blocking is unavailable.";
  }
}
