/**
 * Pushes the widget schedule bundle from Zustand without React.
 * Used by the background location task so both home-screen widgets stay fresh.
 */
import { Platform } from "react-native";

import { buildHeroPreviewData } from "@/lib/heroCard";
import { hasUsableCoordinates, isInsideGeofence, type Coordinates } from "@/lib/geo";
import { mergeBlockedAppsIntoHero, mergeFocusCoinsIntoHero } from "@/lib/heroIntel";
import { buildWidgetTileAppearance } from "@/lib/heroWidgetAppearance";
import {
  getDisplayInsideGeofence,
  getPresenceTrackingContext,
  getVerificationSecondsRemaining,
} from "@/lib/presenceEngine";
import { readWidgetPremiumMirror } from "@/lib/widgetPremiumMirror";
import {
  buildWidgetScheduleBundle,
  serializeWidgetScheduleBundleForCompare,
} from "@/lib/widgetSchedule";
import { persistAndRefreshAndroidWidgets } from "@/widget/syncAndroidWidgets";
import type { PresenceContext } from "@/store/selectors";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { useUserStore } from "@/store/useUserStore";
import type { HeroCardData } from "@/types/dashboard";

let lastSerializedBundle: string | null = null;

function buildPresenceContext(position: Coordinates | null): PresenceContext {
  const { presenceAnchor } = getPresenceTrackingContext();
  const insideGeofence =
    position != null &&
    presenceAnchor != null &&
    hasUsableCoordinates(presenceAnchor) &&
    isInsideGeofence(position, presenceAnchor);

  return {
    userPosition: position,
    isInsideGeofence: insideGeofence,
    isInsideGeofenceForDisplay: getDisplayInsideGeofence() || insideGeofence,
    verificationSecondsRemaining: getVerificationSecondsRemaining(Date.now()),
    locationUnavailable: false,
    backgroundLocationDenied: false,
  };
}

function buildWidgetBundle(presence: PresenceContext) {
  const scheduleState = useScheduleStore.getState();
  const userState = useUserStore.getState();
  const blockedState = useBlockedAppsStore.getState();
  const previewState = useHeroPreviewStore.getState();

  const dailyGoal = scheduleState.getDailyGoal();
  const mergeHero = (data: HeroCardData) =>
    mergeFocusCoinsIntoHero(
      mergeBlockedAppsIntoHero(
        data,
        blockedState.apps.filter((app) => Boolean(app.packageName?.trim())).length,
      ),
      userState.coins,
      dailyGoal,
    );

  let hero: HeroCardData;
  if (previewState.forcedScenario) {
    hero = mergeHero(
      buildHeroPreviewData(previewState.forcedScenario, previewState.forcedKind),
    );
  } else {
    hero = mergeHero(scheduleState.getHeroCardData(presence));
  }

  const blockedPackageNames = blockedState.apps
    .map((app) => app.packageName?.trim())
    .filter((name): name is string => Boolean(name))
    .sort();

  return buildWidgetScheduleBundle({
    focusNodes: scheduleState.focusNodes,
    activeSession: scheduleState.activeSession,
    hero,
    dailyGoalCompleted: dailyGoal.completed,
    dailyGoalTarget: dailyGoal.target,
    blockedAppsCount: blockedPackageNames.length,
    blockedPackageNames,
    classPreBufferMinutes: userState.classPreBufferMinutes,
    sessionGapMergeMinutes: userState.sessionGapMergeMinutes,
    appearance: buildWidgetTileAppearance(),
  });
}

/** Clears the debounce cache — call when premium unlock flips so the next push always writes. */
export function resetWidgetBundlePushCache(): void {
  lastSerializedBundle = null;
}

/**
 * Writes the latest schedule bundle to native prefs and redraws every placed widget.
 * No-op on iOS, without premium (except dev), or when the payload is unchanged.
 */
export async function pushWidgetBundleFromStores(
  presenceOrPosition: PresenceContext | Coordinates | null = null,
): Promise<void> {
  if (Platform.OS !== "android") return;

  const subscriptionState = useSubscriptionStore.getState();
  const mirrored = await readWidgetPremiumMirror();
  const unlocked = subscriptionState.isPremium || mirrored;
  if (!unlocked && !__DEV__) return;

  const presence =
    presenceOrPosition != null && "isInsideGeofence" in presenceOrPosition
      ? presenceOrPosition
      : buildPresenceContext(presenceOrPosition);

  const bundle = buildWidgetBundle(presence);
  const compareKey = serializeWidgetScheduleBundleForCompare(bundle);
  if (compareKey === lastSerializedBundle) return;

  lastSerializedBundle = compareKey;
  await persistAndRefreshAndroidWidgets(bundle);
}
