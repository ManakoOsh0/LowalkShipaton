import { useMemo, useState } from "react";

import { computeConsistencyStats } from "@/lib/consistencyStats";
import { computePeriodStats } from "@/lib/periodStats";
import {
  computeStreakMonthCalendar,
  isFutureMonth,
  shiftMonth,
  type StreakMonthSummary,
} from "@/lib/streakCalendar";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useUserStore } from "@/store/useUserStore";
import type { ConsistencyStats } from "@/lib/consistencyStats";
import type { PeriodStats } from "@/types/stats";

type StreakDetailData = {
  streak: number;
  month: StreakMonthSummary;
  consistency: ConsistencyStats;
  weekStats: PeriodStats;
  canGoForward: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
};

/** Streak detail screen — month calendar, consistency rollup, and weekly chart. */
export function useStreakDetail(): StreakDetailData {
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const streak = useUserStore((state) => state.streak);

  const [viewDate, setViewDate] = useState(() => new Date());

  const month = useMemo(
    () => computeStreakMonthCalendar(focusNodes, viewDate),
    [focusNodes, viewDate],
  );

  const consistency = useMemo(
    () => computeConsistencyStats(focusNodes, streak),
    [focusNodes, streak],
  );

  const weekStats = useMemo(
    () => computePeriodStats(focusNodes, "week", new Date()),
    [focusNodes],
  );

  const canGoForward = !isFutureMonth(month.year, month.month);

  return {
    streak,
    month,
    consistency,
    weekStats,
    canGoForward,
    goToPreviousMonth: () => {
      setViewDate((current) =>
        shiftMonth(current.getFullYear(), current.getMonth(), -1),
      );
    },
    goToNextMonth: () => {
      if (!canGoForward) return;
      setViewDate((current) =>
        shiftMonth(current.getFullYear(), current.getMonth(), 1),
      );
    },
  };
}
