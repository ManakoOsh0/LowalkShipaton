import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { buildHeroPreviewData } from "@/lib/heroCard";
import { mergeBlockedAppsIntoHero, mergeFocusCoinsIntoHero } from "@/lib/heroIntel";
import { buildHeroWidgetAppearance } from "@/lib/heroWidgetAppearance";
import {
  buildWidgetScheduleBundle,
  serializeWidgetScheduleBundleForCompare,
} from "@/lib/widgetSchedule";
import { isAppShieldSupported, syncWidgetSchedule } from "lowalk-app-shield";
import type { PresenceContext } from "@/store/selectors";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useHeroAppearanceStore } from "@/store/useHeroAppearanceStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useUserStore } from "@/store/useUserStore";
import type { HeroCardData } from "@/types/dashboard";

/**
 * Pushes schedule + hero display bundle to the Android widget when data changes.
 * Native code owns countdown refresh while the app is backgrounded.
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
  const caseId = useHeroAppearanceStore((state) => state.caseId);
  const wellId = useHeroAppearanceStore((state) => state.wellId);
  const backgroundId = useHeroAppearanceStore((state) => state.backgroundId);
  const caseStyleId = useHeroAppearanceStore((state) => state.caseStyleId);

  const lastSerializedRef = useRef<string | null>(null);
  const enabled = Platform.OS === "android" && isAppShieldSupported();

  const pushBundle = useCallback(() => {
    // Pro gate in production; dev builds sync without RevenueCat for widget QA.
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
      appearance: buildHeroWidgetAppearance({
        caseId,
        wellId,
        backgroundId,
        caseStyleId,
      }),
    });

    const compareKey = serializeWidgetScheduleBundleForCompare(bundle);
    if (compareKey === lastSerializedRef.current) return;

    lastSerializedRef.current = compareKey;
    void syncWidgetSchedule(bundle as unknown as Record<string, unknown>);
  }, [
    activeSession,
    isPremium,
    blockedAppsCount,
    blockedPackageNamesKey,
    backgroundId,
    caseId,
    caseStyleId,
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
    wellId,
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
