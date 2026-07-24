import { addDaysToIsoDate, getScheduleWindow, toIsoDateString } from "@/lib/time";
import type { FocusNode } from "@/types/focusNode";
import type { PeriodChartBar, PeriodStats, StatsPeriod } from "@/types/stats";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] as const;

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
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
    const window = getScheduleWindow(node.schedule);
    const minutes = window.endMinutes - window.startMinutes;
    return total + minutes * node.completedDates.length;
  }, 0);
}

export function formatFocusHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} hrs`;
  if (hours > 0) return `${hours} hrs`;
  return `${minutes}m`;
}

function countSessionsBetween(
  completionDates: string[],
  startIso: string,
  endIso: string,
): number {
  return completionDates.filter((iso) => iso >= startIso && iso <= endIso).length;
}

function buildWeekBars(
  completionDates: string[],
  referenceDate: Date,
): PeriodChartBar[] {
  const monday = getMondayOfWeek(referenceDate);
  const mondayIso = toIsoDateString(monday);

  return WEEKDAY_LABELS.map((label, index) => {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    return {
      label,
      value: countSessionsBetween(completionDates, dateIso, dateIso),
      dateIso,
    };
  });
}

function buildMonthBars(
  completionDates: string[],
  referenceDate: Date,
): PeriodChartBar[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const lastIso = toIsoDateString(lastOfMonth);

  const bars: PeriodChartBar[] = [];
  let weekStart = getMondayOfWeek(firstOfMonth);
  let weekIndex = 1;

  while (toIsoDateString(weekStart) <= lastIso) {
    const weekEndIso = addDaysToIsoDate(toIsoDateString(weekStart), 6);
    const monthPrefix = `${year}-${`${month + 1}`.padStart(2, "0")}`;

    const value = completionDates.filter((iso) => {
      if (!iso.startsWith(monthPrefix)) return false;
      return iso >= toIsoDateString(weekStart) && iso <= weekEndIso;
    }).length;

    bars.push({
      label: `W${weekIndex}`,
      value,
      dateIso: toIsoDateString(weekStart),
    });

    weekIndex++;
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return bars;
}

function buildYearBars(
  completionDates: string[],
  referenceDate: Date,
): PeriodChartBar[] {
  const year = referenceDate.getFullYear();

  return MONTH_LABELS.map((label, monthIndex) => {
    const monthPrefix = `${year}-${`${monthIndex + 1}`.padStart(2, "0")}`;
    const value = completionDates.filter((iso) => iso.startsWith(monthPrefix)).length;
    return {
      label,
      value,
      dateIso: `${monthPrefix}-01`,
    };
  });
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

/** Buckets completed sessions into week / month / year bar series for the chart. */
export function computePeriodStats(
  nodes: FocusNode[],
  period: StatsPeriod,
  referenceDate = new Date(),
): PeriodStats {
  const completionDates = flattenCompletionDates(nodes);

  let bars: PeriodChartBar[];
  switch (period) {
    case "week":
      bars = buildWeekBars(completionDates, referenceDate);
      break;
    case "month":
      bars = buildMonthBars(completionDates, referenceDate);
      break;
    case "year":
      bars = buildYearBars(completionDates, referenceDate);
      break;
  }

  const totalSessions = bars.reduce((sum, bar) => sum + bar.value, 0);

  return {
    period,
    bars,
    totalSessions,
    summaryLabel: periodSummaryLabel(period, totalSessions),
    sectionTitle: periodSectionTitle(period),
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
