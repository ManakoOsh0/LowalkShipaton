import { addDaysToIsoDate, getScheduleWindow, toIsoDateString } from "@/lib/time";
import type { FocusNode, Weekday } from "@/types/focusNode";
import type {
  PeriodChartBar,
  PeriodDayStat,
  PeriodStats,
  PeriodTrend,
  StatsPeriod,
  WeeklyProgress,
} from "@/types/stats";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] as const;

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = parseIsoDate(startIso).getTime();
  const end = parseIsoDate(endIso).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function nodeSessionMinutes(node: FocusNode): number {
  const window = getScheduleWindow(node.schedule);
  return Math.max(0, window.endMinutes - window.startMinutes);
}

/** Every completion occurrence across all Focus Nodes (one node-day = one session). */
export function flattenCompletionDates(nodes: FocusNode[]): string[] {
  return nodes.flatMap((node) => node.completedDates);
}

export function countTotalSessions(nodes: FocusNode[]): number {
  return flattenCompletionDates(nodes).length;
}

/** Estimated focus minutes from scheduled session length × completions. */
export function estimateFocusMinutes(nodes: FocusNode[]): number {
  return nodes.reduce((total, node) => {
    return total + nodeSessionMinutes(node) * node.completedDates.length;
  }, 0);
}

/** Brick-style duration: `11h 59m`, `45m`, or `—` when empty. */
export function formatFocusDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** Legacy short label used by lifetime tiles / share copy. */
export function formatFocusHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} hrs`;
  if (hours > 0) return `${hours} hrs`;
  return `${minutes}m`;
}

function countSessionsOnDate(nodes: FocusNode[], dateIso: string): number {
  return nodes.reduce(
    (total, node) => total + (node.completedDates.includes(dateIso) ? 1 : 0),
    0,
  );
}

function focusMinutesOnDate(nodes: FocusNode[], dateIso: string): number {
  return nodes.reduce((total, node) => {
    if (!node.completedDates.includes(dateIso)) return total;
    return total + nodeSessionMinutes(node);
  }, 0);
}

function focusMinutesBetween(
  nodes: FocusNode[],
  startIso: string,
  endIso: string,
): number {
  return nodes.reduce((total, node) => {
    const minutes = nodeSessionMinutes(node);
    const hits = node.completedDates.filter(
      (iso) => iso >= startIso && iso <= endIso,
    ).length;
    return total + minutes * hits;
  }, 0);
}

function sessionsBetween(
  nodes: FocusNode[],
  startIso: string,
  endIso: string,
): number {
  return nodes.reduce((total, node) => {
    const hits = node.completedDates.filter(
      (iso) => iso >= startIso && iso <= endIso,
    ).length;
    return total + hits;
  }, 0);
}

function buildWeekBars(nodes: FocusNode[], referenceDate: Date): PeriodChartBar[] {
  const monday = getMondayOfWeek(referenceDate);
  const mondayIso = toIsoDateString(monday);

  return WEEKDAY_LABELS.map((label, index) => {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    return {
      label,
      value: countSessionsOnDate(nodes, dateIso),
      focusMinutes: focusMinutesOnDate(nodes, dateIso),
      dateIso,
    };
  });
}

function buildMonthBars(nodes: FocusNode[], referenceDate: Date): PeriodChartBar[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const lastIso = toIsoDateString(lastOfMonth);

  const bars: PeriodChartBar[] = [];
  let weekStart = getMondayOfWeek(firstOfMonth);
  let weekIndex = 1;

  while (toIsoDateString(weekStart) <= lastIso) {
    const weekStartIso = toIsoDateString(weekStart);
    const weekEndIso = addDaysToIsoDate(weekStartIso, 6);
    const monthPrefix = `${year}-${`${month + 1}`.padStart(2, "0")}`;

    let value = 0;
    let focusMinutes = 0;
    for (const node of nodes) {
      const minutes = nodeSessionMinutes(node);
      for (const iso of node.completedDates) {
        if (!iso.startsWith(monthPrefix)) continue;
        if (iso < weekStartIso || iso > weekEndIso) continue;
        value += 1;
        focusMinutes += minutes;
      }
    }

    bars.push({
      label: `W${weekIndex}`,
      value,
      focusMinutes,
      dateIso: weekStartIso,
    });

    weekIndex += 1;
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return bars;
}

function buildYearBars(nodes: FocusNode[], referenceDate: Date): PeriodChartBar[] {
  const year = referenceDate.getFullYear();

  return MONTH_LABELS.map((label, monthIndex) => {
    const monthPrefix = `${year}-${`${monthIndex + 1}`.padStart(2, "0")}`;
    let value = 0;
    let focusMinutes = 0;
    for (const node of nodes) {
      const minutes = nodeSessionMinutes(node);
      for (const iso of node.completedDates) {
        if (!iso.startsWith(monthPrefix)) continue;
        value += 1;
        focusMinutes += minutes;
      }
    }
    return {
      label,
      value,
      focusMinutes,
      dateIso: `${monthPrefix}-01`,
    };
  });
}

export function periodRange(
  period: StatsPeriod,
  referenceDate: Date,
): { startIso: string; endIso: string } {
  const todayIso = toIsoDateString(referenceDate);

  switch (period) {
    case "week": {
      const mondayIso = toIsoDateString(getMondayOfWeek(referenceDate));
      return { startIso: mondayIso, endIso: todayIso };
    }
    case "month": {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth() + 1;
      return {
        startIso: `${year}-${`${month}`.padStart(2, "0")}-01`,
        endIso: todayIso,
      };
    }
    case "year": {
      return {
        startIso: `${referenceDate.getFullYear()}-01-01`,
        endIso: todayIso,
      };
    }
  }
}

function previousPeriodRange(
  period: StatsPeriod,
  referenceDate: Date,
): { startIso: string; endIso: string } {
  switch (period) {
    case "week": {
      const thisMonday = getMondayOfWeek(referenceDate);
      const prevMonday = new Date(thisMonday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const prevSunday = new Date(thisMonday);
      prevSunday.setDate(prevSunday.getDate() - 1);
      return {
        startIso: toIsoDateString(prevMonday),
        endIso: toIsoDateString(prevSunday),
      };
    }
    case "month": {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      const prev = new Date(year, month - 1, 1);
      const prevLast = new Date(year, month, 0);
      return {
        startIso: toIsoDateString(prev),
        endIso: toIsoDateString(prevLast),
      };
    }
    case "year": {
      const year = referenceDate.getFullYear() - 1;
      return {
        startIso: `${year}-01-01`,
        endIso: `${year}-12-31`,
      };
    }
  }
}

function buildTrend(
  currentMinutes: number,
  previousMinutes: number,
  period: StatsPeriod,
): PeriodTrend {
  const comparisonLabel =
    period === "week"
      ? "from last week"
      : period === "month"
        ? "from last month"
        : "from last year";

  if (previousMinutes <= 0 && currentMinutes <= 0) {
    return { percentChange: null, direction: "flat", comparisonLabel };
  }
  if (previousMinutes <= 0) {
    return { percentChange: null, direction: "new", comparisonLabel };
  }

  const percentChange = Math.round(
    ((currentMinutes - previousMinutes) / previousMinutes) * 100,
  );
  if (percentChange > 0) {
    return { percentChange, direction: "up", comparisonLabel };
  }
  if (percentChange < 0) {
    return { percentChange: Math.abs(percentChange), direction: "down", comparisonLabel };
  }
  return { percentChange: 0, direction: "flat", comparisonLabel };
}

function weekdayShortLabel(dateIso: string): string {
  return WEEKDAY_SHORT[parseIsoDate(dateIso).getDay()];
}

function dayOfMonthLabel(dateIso: string): string {
  return String(parseIsoDate(dateIso).getDate());
}

function buildWeekDayBreakdown(
  nodes: FocusNode[],
  referenceDate: Date,
): PeriodDayStat[] {
  const mondayIso = toIsoDateString(getMondayOfWeek(referenceDate));
  const todayIso = toIsoDateString(referenceDate);
  const days: PeriodDayStat[] = [];

  for (let index = 0; index < 7; index += 1) {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    if (dateIso > todayIso) continue;

    const sessions = countSessionsOnDate(nodes, dateIso);
    const focusMinutes = focusMinutesOnDate(nodes, dateIso);
    const isToday = dateIso === todayIso;

    // Skip empty past days — keeps the list to today + days with real activity.
    if (!isToday && sessions === 0 && focusMinutes === 0) continue;

    days.push({
      dateIso,
      label: isToday
        ? "TODAY"
        : `${weekdayShortLabel(dateIso)} ${dayOfMonthLabel(dateIso)}`,
      focusMinutes,
      sessions,
      isToday,
    });
  }

  // Newest first — matches Brick's day cards under the chart.
  return days.reverse();
}

function buildMonthDayBreakdown(bars: PeriodChartBar[]): PeriodDayStat[] {
  return [...bars]
    .reverse()
    .filter((bar) => bar.value > 0 || bar.focusMinutes > 0)
    .map((bar) => ({
      dateIso: bar.dateIso ?? bar.label,
      label: bar.label,
      focusMinutes: bar.focusMinutes,
      sessions: bar.value,
    }));
}

function periodSummaryLabel(period: StatsPeriod, total: number): string {
  const noun = total === 1 ? "session" : "sessions";
  switch (period) {
    case "week":
      return `${total} ${noun} this week`;
    case "month":
      return `${total} ${noun} this month`;
    case "year":
      return `${total} ${noun} this year`;
  }
}

function periodSectionTitle(period: StatsPeriod): string {
  switch (period) {
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "year":
      return "This Year";
  }
}

function activityTitle(period: StatsPeriod): string {
  switch (period) {
    case "week":
      return "Weekly Activity";
    case "month":
      return "Monthly Activity";
    case "year":
      return "Yearly Activity";
  }
}

/** Buckets completed sessions into week / month / year bar series for the chart. */
export function computePeriodStats(
  nodes: FocusNode[],
  period: StatsPeriod,
  referenceDate = new Date(),
): PeriodStats {
  let bars: PeriodChartBar[];
  switch (period) {
    case "week":
      bars = buildWeekBars(nodes, referenceDate);
      break;
    case "month":
      bars = buildMonthBars(nodes, referenceDate);
      break;
    case "year":
      bars = buildYearBars(nodes, referenceDate);
      break;
  }

  const { startIso, endIso } = periodRange(period, referenceDate);
  const totalSessions = sessionsBetween(nodes, startIso, endIso);
  const totalFocusMinutes = focusMinutesBetween(nodes, startIso, endIso);
  const elapsedDays = daysBetweenInclusive(startIso, endIso);
  const avgFocusMinutes = Math.round(totalFocusMinutes / elapsedDays);

  const prev = previousPeriodRange(period, referenceDate);
  const previousMinutes = focusMinutesBetween(nodes, prev.startIso, prev.endIso);
  const trend = buildTrend(totalFocusMinutes, previousMinutes, period);

  const useAverage = period === "week";
  const heroMinutes = useAverage ? avgFocusMinutes : totalFocusMinutes;

  const dayBreakdown =
    period === "week"
      ? buildWeekDayBreakdown(nodes, referenceDate)
      : period === "month"
        ? buildMonthDayBreakdown(bars)
        : [];

  return {
    period,
    bars,
    totalSessions,
    totalFocusMinutes,
    avgFocusMinutes,
    heroLabel: useAverage ? "Avg Focus Time" : "Total Focus Time",
    heroValue: formatFocusDuration(heroMinutes),
    trend,
    dayBreakdown,
    summaryLabel: periodSummaryLabel(period, totalSessions),
    sectionTitle: periodSectionTitle(period),
    activityTitle: activityTitle(period),
  };
}

/** Maps consistency heatmap levels (0–4) to grid component levels (0–3). */
export function mapContributionLevel(level: number): 0 | 1 | 2 | 3 {
  if (level >= 4) return 3;
  if (level === 3) return 3;
  if (level === 2) return 2;
  if (level === 1) return 1;
  return 0;
}

function countScheduledOnDate(nodes: FocusNode[], dateIso: string): number {
  const weekday = parseIsoDate(dateIso).getDay() as Weekday;
  return nodes.filter((node) => node.schedule.weekday === weekday).length;
}

function countCompletionsOnDate(nodes: FocusNode[], dateIso: string): number {
  return nodes.filter((node) => node.completedDates.includes(dateIso)).length;
}

/** Current Mon–Sun completion rate for the stats hero card. */
export function computeWeeklyReview(
  nodes: FocusNode[],
  referenceDate = new Date(),
): { weeklyProgress: WeeklyProgress; missedDays: number } {
  const monday = getMondayOfWeek(referenceDate);
  const mondayIso = toIsoDateString(monday);
  const todayIso = toIsoDateString(referenceDate);

  let completed = 0;
  let target = 0;
  let missedDays = 0;

  for (let index = 0; index < 7; index += 1) {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    const scheduled = countScheduledOnDate(nodes, dateIso);
    const done = countCompletionsOnDate(nodes, dateIso);
    target += scheduled;
    completed += done;
    if (dateIso < todayIso && scheduled > 0 && done < scheduled) {
      missedDays += 1;
    }
  }

  const percent = target > 0 ? Math.round((completed / target) * 100) : 0;

  return {
    weeklyProgress: { completed, target, percent },
    missedDays,
  };
}
