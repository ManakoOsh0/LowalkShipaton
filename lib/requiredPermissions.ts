/**
 * Catalog of OS permissions Lowalk needs to verify presence and run the
 * Android app shield. First-run and Settings both read this snapshot so a
 * skipped or revoked grant can be requested again.
 */
import { Platform } from "react-native";

import {
  canScheduleExactAlarms,
  hasOverlayPermission,
  hasUsageStatsPermission,
  isAppShieldSupported,
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
  openOverlaySettings,
  openUsageAccessSettings,
} from "lowalk-app-shield";
import { openAppSettings } from "@/lib/openExternal";
import {
  PERMISSION_STEP_ORDER,
  withPermissionCopy,
  type PermissionCheck,
  type PermissionStepId,
} from "@/lib/requiredPermissionSteps";
import {
  getBackgroundPermissionStatus,
  getForegroundPermissionStatus,
  requestBackgroundLocationPermission,
  requestForegroundLocationPermission,
} from "@/services/location";
import {
  areSessionRemindersSupported,
  ensureNotificationPermission,
  getNotificationPermissionStatus,
} from "@/services/sessionReminders";

export type { PermissionCheck, PermissionStepId } from "@/lib/requiredPermissionSteps";
export {
  countApplicablePermissions,
  selectNextPermissionStep,
} from "@/lib/requiredPermissionSteps";

/** Builds the live permission snapshot used by first-run and Settings. */
export async function loadPermissionChecks(): Promise<PermissionCheck[]> {
  if (Platform.OS === "web") return [];

  const shieldNative = isAppShieldSupported();

  const [foreground, background, notifications] = await Promise.all([
    getForegroundPermissionStatus(),
    getBackgroundPermissionStatus(),
    getNotificationPermissionStatus(),
  ]);

  const usageGranted = shieldNative ? await hasUsageStatsPermission() : false;
  const overlayGranted = shieldNative ? await hasOverlayPermission() : false;
  const exactAlarmsGranted = shieldNative ? await canScheduleExactAlarms() : true;
  const batteryGranted = shieldNative ? await isIgnoringBatteryOptimizations() : true;

  return PERMISSION_STEP_ORDER.map((id) => {
    switch (id) {
      case "locationForeground":
        return withPermissionCopy(id, foreground === "granted", true);
      case "locationBackground":
        return withPermissionCopy(id, background === "granted", true);
      case "notifications":
        return withPermissionCopy(
          id,
          notifications === "granted",
          areSessionRemindersSupported(),
        );
      case "usageAccess":
        return withPermissionCopy(id, usageGranted, shieldNative);
      case "overlay":
        return withPermissionCopy(id, overlayGranted, shieldNative);
      case "exactAlarms":
        return withPermissionCopy(id, exactAlarmsGranted, shieldNative);
      case "batteryUnrestricted":
        return withPermissionCopy(id, batteryGranted, shieldNative);
    }
  });
}

/**
 * Requests a runtime permission or opens the matching Settings screen.
 * Returns true only when the grant is confirmed in this call — Settings-based
 * permissions usually become true after the user returns to the app.
 */
export async function requestOrOpenPermission(id: PermissionStepId): Promise<boolean> {
  switch (id) {
    case "locationForeground": {
      const current = await getForegroundPermissionStatus();
      if (current === "granted") return true;
      if (current === "denied") {
        await openAppSettings();
        return false;
      }
      const status = await requestForegroundLocationPermission();
      return status === "granted";
    }
    case "locationBackground": {
      const current = await getBackgroundPermissionStatus();
      if (current === "granted") return true;
      if (current === "denied") {
        await openAppSettings();
        return false;
      }
      const status = await requestBackgroundLocationPermission();
      return status === "granted";
    }
    case "notifications": {
      const current = await getNotificationPermissionStatus();
      if (current === "granted") return true;
      if (current === "denied") {
        await openAppSettings();
        return false;
      }
      return ensureNotificationPermission();
    }
    case "usageAccess": {
      const granted = await hasUsageStatsPermission();
      if (granted) return true;
      await openUsageAccessSettings();
      return false;
    }
    case "overlay": {
      const granted = await hasOverlayPermission();
      if (granted) return true;
      await openOverlaySettings();
      return false;
    }
    case "exactAlarms": {
      const granted = await canScheduleExactAlarms();
      if (granted) return true;
      await openExactAlarmSettings();
      return false;
    }
    case "batteryUnrestricted": {
      const granted = await isIgnoringBatteryOptimizations();
      if (granted) return true;
      await openBatteryOptimizationSettings();
      return false;
    }
  }
}
