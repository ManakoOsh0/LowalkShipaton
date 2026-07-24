import { useMemo, useState, useEffect } from "react";

import { useSessionPresence } from "@/contexts/SessionPresenceContext";
import { computeHeroFocusLedger } from "@/lib/heroFocusLedger";
import { buildHeroPreviewData } from "@/lib/heroCard";
import { selectAnchoringRequest } from "@/store/selectors";
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
};

/** Maps persisted stores and live presence into the Home dashboard view models. */
export function useHomeDashboard(): HomeDashboardData {
  const coins = useUserStore((state) => state.coins);
  const streak = useUserStore((state) => state.streak);
  const presence = useSessionPresence();
  const forcedHeroState = useHeroPreviewStore((state) => state.forcedState);

  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const getDailyGoal = useScheduleStore((state) => state.getDailyGoal);
  const getHeroCardData = useScheduleStore((state) => state.getHeroCardData);
  const getTodaySchedule = useScheduleStore((state) => state.getTodaySchedule);

  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimerTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const anchoringRequest = useMemo(() => {
    void timerTick;
    return selectAnchoringRequest(focusNodes, anchors);
  }, [anchors, focusNodes, timerTick]);

  const dailyGoal = getDailyGoal();
  const schedule = getTodaySchedule();

  const hero = useMemo(() => {
    void timerTick;
    if (forcedHeroState) {
      return buildHeroPreviewData(forcedHeroState);
    }
    const data = getHeroCardData(presence);

    if (data.state === "weekly_report" && !data.focusLedger) {
      return {
        ...data,
        focusLedger: computeHeroFocusLedger(focusNodes, streak, coins),
      };
    }

    return data;
  }, [coins, focusNodes, forcedHeroState, getHeroCardData, presence, streak, timerTick]);

  return {
    coins,
    streak,
    dailyGoal,
    hero,
    schedule,
    anchoringRequest,
    isHeroPreview: forcedHeroState != null,
  };
}
