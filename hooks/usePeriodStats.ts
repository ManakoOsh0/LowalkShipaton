import { useMemo } from "react";

import { computePeriodRecap, computeTodayRecap } from "@/lib/consistencyRecap";
import { computeConsistencyStats } from "@/lib/consistencyStats";
import {
  computePeriodStats,
  computeWeeklyReview,
  countTotalSessions,
  estimateFocusMinutes,
  formatFocusDuration,
  formatFocusHours,
  mapContributionLevel,
} from "@/lib/periodStats";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { ContributionWeek, StatsPeriod } from "@/types/stats";

export function usePeriodStats(period: StatsPeriod) {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const dayStreak = useUserStore((state) => state.streak);

  const todayRecap = useMemo(
    () => computeTodayRecap(focusNodes, anchors),
    [anchors, focusNodes],
  );

  const periodRecap = useMemo(
    () => computePeriodRecap(focusNodes, anchors, period),
    [anchors, focusNodes, period],
  );

  const periodStats = useMemo(
    () => computePeriodStats(focusNodes, period),
    [focusNodes, period],
  );

  const totalSessionsAllTime = useMemo(
    () => countTotalSessions(focusNodes),
    [focusNodes],
  );

  const totalFocusMinutes = useMemo(
    () => estimateFocusMinutes(focusNodes),
    [focusNodes],
  );

  const focusHoursLabel = useMemo(
    () => formatFocusHours(totalFocusMinutes),
    [totalFocusMinutes],
  );

  const focusDurationLabel = useMemo(
    () => formatFocusDuration(totalFocusMinutes),
    [totalFocusMinutes],
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

  const { weeklyProgress, missedDays } = useMemo(
    () => computeWeeklyReview(focusNodes),
    [focusNodes],
  );

  return {
    todayRecap,
    periodRecap,
    periodStats,
    streak: dayStreak,
    totalSessionsAllTime,
    focusHoursLabel,
    focusDurationLabel,
    contributionWeeks,
    weeklyProgress,
    missedDays,
  };
}
