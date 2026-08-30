import { useMemo, useState, useEffect } from "react";

import { useSessionPresence } from "@/contexts/SessionPresenceContext";
import { buildHeroPreviewData } from "@/lib/heroCard";
import { toIsoDateString } from "@/lib/time";
import {
  selectAnchoringRequest,
  selectDailyGoal,
  selectHeroCardData,
  selectTodaySchedule,
} from "@/store/selectors";
import {
  selectLiveHeroCelebration,
  useHeroCelebrationStore,
  type HeroCelebrationPayload,
} from "@/store/useHeroCelebrationStore";
import { useNotificationNavigationStore } from "@/store/useNotificationNavigationStore";
import { useHeroPreviewStore } from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { DailyGoal, HeroCardData, ScheduleItem } from "@/types/dashboard";
import type { AnchoringRequest } from "@/store/selectors";

type HomeDashboardData = {
  coins: number;
  streak: number;
  dailyGoal: DailyGoal;
  hero: HeroCardData;
  schedule: ScheduleItem[];
  anchoringRequest: AnchoringRequest | null;
  /** True when Settings forced a Hero preview state. */
  isHeroPreview: boolean;
  celebration: HeroCelebrationPayload | null;
  dismissCelebration: () => void;
};

/** Maps persisted stores and live presence into the Home dashboard view models. */
export function useHomeDashboard(): HomeDashboardData {
  const coins = useUserStore((state) => state.coins);
  const streak = useUserStore((state) => state.streak);
  const classPreBufferMinutes = useUserStore((state) => state.classPreBufferMinutes);
  const sessionGapMergeMinutes = useUserStore((state) => state.sessionGapMergeMinutes);
  const presence = useSessionPresence();
  const forcedHeroScenario = useHeroPreviewStore((state) => state.forcedScenario);
  const forcedHeroKind = useHeroPreviewStore((state) => state.forcedKind);
  const preBufferFocusNodeId = useNotificationNavigationStore(
    (state) => state.preBufferFocusNodeId,
  );
  const clearPreBufferFocus = useNotificationNavigationStore(
    (state) => state.clearPreBufferFocus,
  );
  const celebrationRaw = useHeroCelebrationStore((state) => state.celebration);
  const dismissCelebration = useHeroCelebrationStore((state) => state.dismiss);

  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const activeSession = useScheduleStore((state) => state.activeSession);

  const todayIso = toIsoDateString(new Date());
  const todayWeekday = new Date().getDay();
  const hasOpenSessionToday = focusNodes.some(
    (node) =>
      node.schedule.weekday === todayWeekday && !node.completedDates.includes(todayIso),
  );

  const needsLiveTick =
    activeSession != null ||
    forcedHeroScenario != null ||
    celebrationRaw != null ||
    hasOpenSessionToday;

  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    if (!needsLiveTick) return undefined;
    const interval = setInterval(() => setTimerTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [needsLiveTick]);

  useEffect(() => {
    if (!preBufferFocusNodeId) return undefined;
    return () => clearPreBufferFocus();
  }, [clearPreBufferFocus, preBufferFocusNodeId]);

  const shieldSettings = useMemo(
    () => ({ classPreBufferMinutes, sessionGapMergeMinutes }),
    [classPreBufferMinutes, sessionGapMergeMinutes],
  );

  const anchoringRequest = useMemo(() => {
    void timerTick;
    return selectAnchoringRequest(focusNodes, anchors);
  }, [anchors, focusNodes, timerTick]);

  const dailyGoal = useMemo(
    () => selectDailyGoal(focusNodes),
    [focusNodes],
  );

  const schedule = useMemo(
    () => selectTodaySchedule(focusNodes, anchors, activeSession?.nodeId ?? null),
    [activeSession?.nodeId, anchors, focusNodes],
  );

  const hero = useMemo(() => {
    void timerTick;

    if (forcedHeroScenario) {
      return buildHeroPreviewData(forcedHeroScenario, forcedHeroKind);
    }

    return selectHeroCardData(
      focusNodes,
      anchors,
      activeSession,
      presence,
      new Date(),
      shieldSettings,
      preBufferFocusNodeId,
    );
  }, [
    activeSession,
    anchors,
    focusNodes,
    forcedHeroScenario,
    forcedHeroKind,
    presence,
    preBufferFocusNodeId,
    shieldSettings,
    timerTick,
  ]);

  const celebration = useMemo(() => {
    void timerTick;
    return selectLiveHeroCelebration(celebrationRaw);
  }, [celebrationRaw, timerTick]);

  return {
    coins,
    streak,
    dailyGoal,
    hero,
    schedule,
    anchoringRequest,
    isHeroPreview: forcedHeroScenario != null,
    celebration,
    dismissCelebration,
  };
}
