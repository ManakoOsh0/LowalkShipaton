import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

import {
  pushWidgetBundleFromStores,
  resetWidgetBundlePushCache,
} from "@/lib/pushWidgetBundleFromStores";
import { syncAndroidWidgetPremiumGate } from "@/lib/widgetPremiumSync";
import { readWidgetPremiumMirror } from "@/lib/widgetPremiumMirror";
import type { PresenceContext } from "@/store/selectors";
import { useBlockedAppsHydrated } from "@/hooks/usePersistedStoreHydration";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useUserStore } from "@/store/useUserStore";

/**
 * Pushes schedule + hero display to the Android home screen widget when data changes.
 * Native Kotlin redraws the XML layouts; alarms keep countdowns fresh while backgrounded.
 */
export function useWidgetScheduleSync(presence: PresenceContext): void {
  const forcedHeroScenario = useHeroPreviewStore((state) => state.forcedScenario);
  const forcedHeroKind = useHeroPreviewStore((state) => state.forcedKind);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const isSubscriptionLoaded = useSubscriptionStore((state) => state.isLoaded);
  const coins = useUserStore((state) => state.coins);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const sessionGapMergeMinutes = useUserStore((state) => state.sessionGapMergeMinutes);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const activeSession = useScheduleStore((state) => state.activeSession);
  const blockedAppsHydrated = useBlockedAppsHydrated();
  const blockedAppsCount = useBlockedAppsStore((state) =>
    state.apps.filter((app) => Boolean(app.packageName?.trim())).length,
  );
  const blockedPackageNamesKey = useBlockedAppsStore((state) =>
    state.apps
      .map((app) => app.packageName?.trim())
      .filter((name): name is string => Boolean(name))
      .sort()
      .join("|"),
  );

  const enabled = Platform.OS === "android";

  // Wait for RevenueCat before writing false — avoids wiping a prior unlock on cold start.
  useEffect(() => {
    if (!enabled || !isSubscriptionLoaded) return undefined;
    void (async () => {
      const mirrored = await readWidgetPremiumMirror();
      await syncAndroidWidgetPremiumGate(isPremium || mirrored);
    })();
    return undefined;
  }, [enabled, isPremium, isSubscriptionLoaded]);

  useEffect(() => {
    if (!isPremium) return undefined;
    resetWidgetBundlePushCache();
    return undefined;
  }, [isPremium]);

  const pushBundle = useCallback(() => {
    if (!enabled || !blockedAppsHydrated || (!isPremium && !__DEV__)) return;

    void pushWidgetBundleFromStores(presence).catch((error: unknown) => {
      if (__DEV__) {
        console.warn("[useWidgetScheduleSync] Android widget refresh failed:", error);
      }
    });
  }, [
    activeSession,
    blockedAppsCount,
    blockedAppsHydrated,
    blockedPackageNamesKey,
    classPreBufferMinutes,
    coins,
    enabled,
    focusNodes,
    forcedHeroScenario,
    forcedHeroKind,
    isPremium,
    presence,
    sessionGapMergeMinutes,
  ]);

  useEffect(() => {
    if (!enabled) return undefined;
    pushBundle();
    return undefined;
  }, [enabled, pushBundle]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onAppStateChange = (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        pushBundle();
      }
    };

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, [enabled, pushBundle]);
}
