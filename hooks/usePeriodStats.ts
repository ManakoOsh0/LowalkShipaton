import { useMemo } from "react";

import { computeConsistencyStats } from "@/lib/consistencyStats";
import {
  computePeriodStats,
  countTotalSessions,
  estimateFocusMinutes,
  formatFocusHours,
  mapContributionLevel,
} from "@/lib/periodStats";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { ContributionWeek, LifetimeStat, StatsPeriod } from "@/types/stats";

export function usePeriodStats(period: StatsPeriod) {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const coins = useUserStore((state) => state.coins);
  const dayStreak = useUserStore((state) => state.streak);

  const periodStats = useMemo(
    () => computePeriodStats(focusNodes, period),
    [focusNodes, period],
  );

  const totalSessionsAllTime = useMemo(
    () => countTotalSessions(focusNodes),
    [focusNodes],
  );

  const focusHoursLabel = useMemo(
    () => formatFocusHours(estimateFocusMinutes(focusNodes)),
    [focusNodes],
  );

  const lifetimeStats: LifetimeStat[] = useMemo(
    () => [
      {
        id: "sessions",
        icon: "🎯",
        value: String(totalSessionsAllTime),
        label: "Sessions",
        numericValue: totalSessionsAllTime,
      },
      {
        id: "focused",
        icon: "⏱",
        value: focusHoursLabel,
        label: "Focused",
      },
      {
        id: "coins",
        icon: "🪙",
        value: String(coins),
        label: "Focus Coins",
        numericValue: coins,
      },
      {
        id: "nodes",
        icon: "📍",
        value: String(focusNodes.length),
        label: "Focus Nodes",
        numericValue: focusNodes.length,
      },
    ],
    [coins, focusHoursLabel, focusNodes.length, totalSessionsAllTime],
  );

  const contributionWeeks: ContributionWeek[] = useMemo(() => {
    const consistency = computeConsistencyStats(focusNodes, dayStreak);
    return consistency.contributionWeeks.map((week) => ({
      weekStartIso: week.weekStartIso,
      days: week.days.map((day) => ({
        dateIso: day.dateIso,
        level: mapContributionLevel(day.level),
      })),
    }));
  }, [dayStreak, focusNodes]);

  return {
    periodStats,
    streak: dayStreak,
    coins,
    focusNodeCount: focusNodes.length,
    totalSessionsAllTime,
    focusHoursLabel,
    lifetimeStats,
    contributionWeeks,
  };
}
