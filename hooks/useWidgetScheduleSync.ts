import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { buildHeroPreviewData } from "@/lib/heroCard";
import { computeHeroFocusLedger } from "@/lib/heroFocusLedger";
import { mergeBlockedAppsIntoHero, mergeFocusCoinsIntoHero } from "@/lib/heroIntel";
import {
  buildWidgetScheduleBundle,
  serializeWidgetScheduleBundleForCompare,
} from "@/lib/widgetSchedule";
import { isAppShieldSupported, syncWidgetSchedule } from "lowalk-app-shield";
import type { PresenceContext } from "@/store/selectors";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { HeroCardData } from "@/types/dashboard";

/**
 * Pushes schedule + hero display bundle to the Android widget when data changes.
 * Native code owns countdown refresh while the app is backgrounded.
 */
export function useWidgetScheduleSync(presence: PresenceContext): void {
  const forcedHeroState = useHeroPreviewStore((state) => state.forcedState);
  const forcedHeroVariant = useHeroPreviewStore((state) => state.forcedVariant);
  const forcedHeroKind = useHeroPreviewStore((state) => state.forcedKind);
  const coins = useUserStore((state) => state.coins);
  const streak = useUserStore((state) => state.streak);
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
  const enabled = Platform.OS === "android" && isAppShieldSupported();

  const pushBundle = useCallback(() => {
    if (!enabled) return;

    const dailyGoal = getDailyGoal();
    const mergeHero = (data: HeroCardData) =>
      mergeFocusCoinsIntoHero(
        mergeBlockedAppsIntoHero(data, blockedAppsCount),
        coins,
        dailyGoal,
      );

    let hero: HeroCardData;
    if (forcedHeroState) {
      hero = mergeHero(buildHeroPreviewData(forcedHeroState, forcedHeroVariant, forcedHeroKind));
    } else {
      const data = getHeroCardData(presence);
      const withLedger =
        data.state === "weekly_report" && !data.focusLedger
          ? {
              ...data,
              focusLedger: computeHeroFocusLedger(focusNodes, streak, coins),
            }
          : data;
      hero = mergeHero(withLedger);
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
    });

    const compareKey = serializeWidgetScheduleBundleForCompare(bundle);
    if (compareKey === lastSerializedRef.current) return;

    lastSerializedRef.current = compareKey;
    void syncWidgetSchedule(bundle as unknown as Record<string, unknown>);
  }, [
    activeSession,
    blockedAppsCount,
    blockedPackageNamesKey,
    classPreBufferMinutes,
    coins,
    enabled,
    focusNodes,
    forcedHeroState,
    forcedHeroVariant,
    forcedHeroKind,
    getDailyGoal,
    getHeroCardData,
    presence,
    sessionGapMergeMinutes,
    streak,
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
