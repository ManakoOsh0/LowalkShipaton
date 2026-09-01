import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { buildHeroPreviewData } from "@/lib/heroCard";
import { mergeBlockedAppsIntoHero, mergeFocusCoinsIntoHero } from "@/lib/heroIntel";
import { buildWidgetTileAppearance } from "@/lib/heroWidgetAppearance";
import {
  buildWidgetScheduleBundle,
  serializeWidgetScheduleBundleForCompare,
} from "@/lib/widgetSchedule";
import { persistAndRefreshAndroidWidgets } from "@/widget/syncAndroidWidgets";
import { setWidgetPremiumAccess } from "lowalk-app-shield";
import type { PresenceContext } from "@/store/selectors";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useUserStore } from "@/store/useUserStore";
import type { HeroCardData } from "@/types/dashboard";

/**
 * Pushes schedule + hero display to the Android home screen widget when data changes.
 * Native Kotlin redraws the XML layouts; alarms keep countdowns fresh while backgrounded.
 */
export function useWidgetScheduleSync(presence: PresenceContext): void {
  const forcedHeroScenario = useHeroPreviewStore((state) => state.forcedScenario);
  const forcedHeroKind = useHeroPreviewStore((state) => state.forcedKind);
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const coins = useUserStore((state) => state.coins);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const sessionGapMergeMinutes = useUserStore((state) => state.sessionGapMergeMinutes);
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const activeSession = useScheduleStore((state) => state.activeSession);
  const getDailyGoal = useScheduleStore((state) => state.getDailyGoal);
  const getHeroCardData = useScheduleStore((state) => state.getHeroCardData);
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

  const lastSerializedRef = useRef<string | null>(null);
  const enabled = Platform.OS === "android";

  useEffect(() => {
    if (!enabled) return undefined;
    void setWidgetPremiumAccess(isPremium).catch((error: unknown) => {
      if (__DEV__) {
        console.warn("[useWidgetScheduleSync] setWidgetPremiumAccess failed:", error);
      }
    });
    return undefined;
  }, [enabled, isPremium]);

  const pushBundle = useCallback(() => {
    if (!enabled || (!isPremium && !__DEV__)) return;

    const dailyGoal = getDailyGoal();
    const mergeHero = (data: HeroCardData) =>
      mergeFocusCoinsIntoHero(
        mergeBlockedAppsIntoHero(data, blockedAppsCount),
        coins,
        dailyGoal,
      );

    let hero: HeroCardData;
    if (forcedHeroScenario) {
      hero = mergeHero(buildHeroPreviewData(forcedHeroScenario, forcedHeroKind));
    } else {
      hero = mergeHero(getHeroCardData(presence));
    }

    const blockedPackageNames = blockedPackageNamesKey
      ? blockedPackageNamesKey.split("|")
      : [];

    const bundle = buildWidgetScheduleBundle({
      focusNodes,
      activeSession,
      hero,
      dailyGoalCompleted: dailyGoal.completed,
      dailyGoalTarget: dailyGoal.target,
      blockedAppsCount,
      blockedPackageNames,
      classPreBufferMinutes,
      sessionGapMergeMinutes,
      appearance: buildWidgetTileAppearance(),
    });

    const compareKey = serializeWidgetScheduleBundleForCompare(bundle);
    if (compareKey === lastSerializedRef.current) return;

    lastSerializedRef.current = compareKey;

    void persistAndRefreshAndroidWidgets(bundle).catch((error: unknown) => {
      if (__DEV__) {
        console.warn("[useWidgetScheduleSync] Android widget refresh failed:", error);
      }
    });
  }, [
    activeSession,
    isPremium,
    blockedAppsCount,
    blockedPackageNamesKey,
    classPreBufferMinutes,
    coins,
    enabled,
    focusNodes,
    forcedHeroScenario,
    forcedHeroKind,
    getDailyGoal,
    getHeroCardData,
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
