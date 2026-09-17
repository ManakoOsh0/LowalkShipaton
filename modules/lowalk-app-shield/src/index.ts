import { requireOptionalNativeModule, NativeModule } from "expo";
import { Platform } from "react-native";

export type InstalledAppInfo = {
  packageName: string;
  name: string;
  isSystem: boolean;
  /** data:image/png;base64,... when native icon load succeeds */
  iconUri?: string;
};

export type AppIconEntry = {
  packageName: string;
  iconUri: string;
};

export type BlockedAppDetectedEvent = {
  packageName: string;
  detectedAt: number;
};

export type ShieldOverlayContext = {
  nodeKind: string;
  headline: string;
  subtitle: string;
  detail?: string;
  ctaLabel: string;
};

type NativeInstalledApp = {
  packageName: string;
  name: string;
  isSystem?: string;
  iconBase64?: string;
};

type NativeAppIcon = {
  packageName: string;
  iconBase64: string;
};

type LowalkAppShieldEvents = {
  onBlockedAppDetected(event: BlockedAppDetectedEvent): void;
};

declare class LowalkAppShieldNativeModule extends NativeModule<LowalkAppShieldEvents> {
  isSupported(): Promise<boolean>;
  hasUsageStatsPermission(): Promise<boolean>;
  hasOverlayPermission(): Promise<boolean>;
  canScheduleExactAlarms?(): Promise<boolean>;
  isIgnoringBatteryOptimizations?(): Promise<boolean>;
  isMonitoringActive(): Promise<boolean>;
  openUsageAccessSettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openExactAlarmSettings?(): Promise<void>;
  openBatteryOptimizationSettings?(): Promise<void>;
  getInstalledApps(): Promise<NativeInstalledApp[]>;
  getAppIcons(packages: string[]): Promise<NativeAppIcon[]>;
  startMonitoring(
    packages: string[],
    shieldEndsAtMs: number,
    overlayContext?: ShieldOverlayContext,
  ): Promise<void>;
  stopMonitoring(): Promise<void>;
  syncWidgetSchedule(bundleJson: string): Promise<void>;
  syncBlockedPackageNames?(packages: string[]): Promise<void>;
  setWidgetPremiumAccess(unlocked: boolean): Promise<void>;
  refreshWidgets(): Promise<void>;
  updateHeroWidgetSnapshot(snapshot: Record<string, unknown>): Promise<void>;
}

const nativeModule =
  Platform.OS === "android"
    ? requireOptionalNativeModule<LowalkAppShieldNativeModule>("LowalkAppShield")
    : null;

export function isAppShieldSupported(): boolean {
  return Platform.OS === "android" && nativeModule != null;
}

export async function hasUsageStatsPermission(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.hasUsageStatsPermission();
}

export async function hasOverlayPermission(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.hasOverlayPermission();
}

export async function isAppShieldMonitoringActive(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.isMonitoringActive();
}

export async function openUsageAccessSettings(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.openUsageAccessSettings();
}

export async function openOverlaySettings(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.openOverlaySettings();
}

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (!nativeModule?.canScheduleExactAlarms) return true;
  return nativeModule.canScheduleExactAlarms();
}

export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  if (!nativeModule?.isIgnoringBatteryOptimizations) return true;
  return nativeModule.isIgnoringBatteryOptimizations();
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!nativeModule?.openExactAlarmSettings) return;
  await nativeModule.openExactAlarmSettings();
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  if (!nativeModule?.openBatteryOptimizationSettings) return;
  await nativeModule.openBatteryOptimizationSettings();
}

function toIconUri(base64?: string): string | undefined {
  if (!base64) return undefined;
  return `data:image/png;base64,${base64}`;
}

export async function getInstalledApps(): Promise<InstalledAppInfo[]> {
  if (!nativeModule) return [];
  const apps = await nativeModule.getInstalledApps();
  return apps.map((app) => ({
    packageName: app.packageName,
    name: app.name,
    isSystem: app.isSystem === "1" || app.isSystem === "true",
    iconUri: toIconUri(app.iconBase64),
  }));
}

export async function getAppIcons(packageNames: string[]): Promise<AppIconEntry[]> {
  if (!nativeModule || packageNames.length === 0) return [];
  const icons = await nativeModule.getAppIcons(packageNames);
  return icons
    .map((entry) => ({
      packageName: entry.packageName,
      iconUri: toIconUri(entry.iconBase64) ?? "",
    }))
    .filter((entry) => entry.iconUri.length > 0);
}

export async function startAppShieldMonitoring(
  packages: string[],
  shieldEndsAtMs: number,
  overlayContext?: ShieldOverlayContext,
): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.startMonitoring(packages, shieldEndsAtMs, overlayContext);
}

export async function stopAppShieldMonitoring(): Promise<void> {
  if (!nativeModule) return;
  await nativeModule.stopMonitoring();
}

export async function syncWidgetSchedule(
  bundle: Record<string, unknown>,
): Promise<void> {
  if (!nativeModule) return;
  // Nested bundle fields must be JSON-stringified — Expo cannot marshal deep objects to Kotlin.
  await nativeModule.syncWidgetSchedule(JSON.stringify(bundle));
}

/** Mirrors the blocked-apps store to native prefs so boot-time shield sync stays accurate. */
export async function syncBlockedPackageNames(packageNames: string[]): Promise<void> {
  if (!nativeModule?.syncBlockedPackageNames) return;
  await nativeModule.syncBlockedPackageNames(packageNames);
}

export async function setWidgetPremiumAccess(unlocked: boolean): Promise<void> {
  if (!nativeModule?.setWidgetPremiumAccess) return;
  await nativeModule.setWidgetPremiumAccess(unlocked);
}

export async function refreshWidgets(): Promise<void> {
  if (!nativeModule?.refreshWidgets) return;
  await nativeModule.refreshWidgets();
}

/** @deprecated Use syncWidgetSchedule */
export async function updateHeroWidgetSnapshot(
  snapshot: Record<string, unknown>,
): Promise<void> {
  if (!nativeModule) return;
  if (nativeModule.syncWidgetSchedule) {
    await nativeModule.syncWidgetSchedule(JSON.stringify(snapshot));
    return;
  }
  await nativeModule.updateHeroWidgetSnapshot(snapshot);
}

export function addBlockedAppDetectedListener(
  listener: (event: BlockedAppDetectedEvent) => void,
) {
  if (!nativeModule) return { remove: () => undefined };
  return nativeModule.addListener("onBlockedAppDetected", listener);
}
