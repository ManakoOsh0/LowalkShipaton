import { addDaysToIsoDate, getScheduleWindow, isScheduleWindowPassed, toIsoDateString } from "@/lib/time";
import type { FocusNode, FocusNodeSchedule, Weekday } from "@/types/focusNode";

export type RecentOccurrenceOutcome =
  | "completed"
  | "skipped"
  | "missed"
  | "overdue"
  | "upcoming"
  | "today";

export type RecentOccurrence = {
  dateIso: string;
  shortLabel: string;
  outcome: RecentOccurrenceOutcome;
};

export type FocusNodeInsights = {
  successRate: number;
  successRateLabel: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  totalSkips: number;
  focusHoursLabel: string;
  completionsThisMonth: number;
  recentHistory: RecentOccurrence[];
  insightMessage: string;
};

const WEEKS_OF_HISTORY = 8;
export const FOCUS_NODE_HEATMAP_WEEKS = 20;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type FocusNodeContributionDay = {
  dateIso: string;
  completed: boolean;
};

export type FocusNodeContributionWeek = {
  weekStartIso: string;
  days: FocusNodeContributionDay[];
};

export function formatScheduleFrequencyLabel(schedule: FocusNodeSchedule): string {
  return `Every ${WEEKDAY_NAMES[schedule.weekday]}`;
}

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Share of scheduled occurrences completed in the rolling last 30 days. */
export function computeCompletionRateLast30Days(
  node: FocusNode,
  referenceDate = new Date(),
): number {
  const todayIso = toIsoDateString(referenceDate);
  const startIso = addDaysToIsoDate(todayIso, -29);
  let scheduled = 0;
  let completed = 0;
  let cursor = startIso;

  while (cursor <= todayIso) {
    if (parseIsoDate(cursor).getDay() === node.schedule.weekday) {
      scheduled++;
      if (node.completedDates.includes(cursor)) completed++;
    }
    cursor = addDaysToIsoDate(cursor, 1);
  }

  return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
}

/** GitHub-style grid for one recurring Focus Node — filled on completed session days. */
export function computeFocusNodeContributionWeeks(
  node: FocusNode,
  referenceDate = new Date(),
  weeksBack = FOCUS_NODE_HEATMAP_WEEKS,
): FocusNodeContributionWeek[] {
  const todayIso = toIsoDateString(referenceDate);
  const mondayIso = toIsoDateString(getMondayOfWeek(referenceDate));
  const heatmapStart = addDaysToIsoDate(mondayIso, -(weeksBack - 1) * 7);
  const targetWeekday = node.schedule.weekday;
  const weeks: FocusNodeContributionWeek[] = [];

  for (let week = 0; week < weeksBack; week++) {
    const weekStartIso = addDaysToIsoDate(heatmapStart, week * 7);
    const days: FocusNodeContributionDay[] = [];

    for (let day = 0; day < 7; day++) {
      const dateIso = addDaysToIsoDate(weekStartIso, day);
      const isSessionDay = parseIsoDate(dateIso).getDay() === targetWeekday;
      const completed =
        isSessionDay && dateIso <= todayIso && node.completedDates.includes(dateIso);
      days.push({ dateIso, completed });
    }

    weeks.push({ weekStartIso, days });
  }

  return weeks;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Walks back to the most recent calendar date for this weekday on or before referenceDate. */
function getOccurrenceOnOrBefore(weekday: Weekday, referenceDate: Date): Date {
  const cursor = new Date(referenceDate);
  cursor.setHours(0, 0, 0, 0);
  const offset = (cursor.getDay() - weekday + 7) % 7;
  cursor.setDate(cursor.getDate() - offset);
  return cursor;
}

function getRecentOccurrenceDates(
  weekday: Weekday,
  weeksBack: number,
  referenceDate: Date,
): string[] {
  const cursor = getOccurrenceOnOrBefore(weekday, referenceDate);
  const dates: string[] = [];

  for (let week = 0; week < weeksBack; week++) {
    dates.unshift(toIsoDateString(cursor));
    cursor.setDate(cursor.getDate() - 7);
  }

  return dates;
}

function formatShortDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFocusHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function resolveOutcome(
  node: FocusNode,
  dateIso: string,
  todayIso: string,
  referenceDate: Date,
): RecentOccurrenceOutcome {
  if (dateIso === todayIso) {
    if (node.completedDates.includes(dateIso)) return "completed";
    if ((node.skippedDates ?? []).includes(dateIso)) return "skipped";
    if (isScheduleWindowPassed(node.schedule, referenceDate)) {
      if (node.schedule.type !== "class") return "overdue";
      return "missed";
    }
    return "today";
  }
  if (dateIso > todayIso) return "upcoming";
  if (node.completedDates.includes(dateIso)) return "completed";
  if ((node.skippedDates ?? []).includes(dateIso)) return "skipped";
  return "missed";
}

function computeCurrentStreak(node: FocusNode, referenceDate: Date): number {
  const todayIso = toIsoDateString(referenceDate);
  let cursor = getOccurrenceOnOrBefore(node.schedule.weekday, referenceDate);
  const thisOccIso = toIsoDateString(cursor);

  // Duration nodes stay open until local midnight — nominal window passing is overdue, not missed.
  if (
    thisOccIso === todayIso &&
    !node.completedDates.includes(todayIso) &&
    !(node.skippedDates ?? []).includes(todayIso) &&
    (node.schedule.type !== "class" || !isScheduleWindowPassed(node.schedule, referenceDate))
  ) {
    cursor.setDate(cursor.getDate() - 7);
  }

  let streak = 0;
  while (node.completedDates.includes(toIsoDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

function computeBestStreak(node: FocusNode, referenceDate: Date): number {
  const dates = getRecentOccurrenceDates(node.schedule.weekday, 52, referenceDate);
  let best = 0;
  let run = 0;

  for (const dateIso of dates) {
    if (node.completedDates.includes(dateIso)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  return best;
}

function resolveSuccessRateLabel(rate: number): string {
  if (rate >= 85) return "Strong habit";
  if (rate >= 65) return "Building consistency";
  if (rate >= 40) return "Room to grow";
  if (rate > 0) return "Early days";
  return "Just getting started";
}

function resolveInsightMessage(
  node: FocusNode,
  insights: Pick<
    FocusNodeInsights,
    "successRate" | "currentStreak" | "totalCompletions" | "completionsThisMonth"
  >,
): string {
  if (insights.currentStreak >= 4) {
    return `${insights.currentStreak} weeks in a row — you're building real momentum here.`;
  }
  if (insights.successRate >= 80 && insights.totalCompletions >= 3) {
    return "You show up reliably for this session. Keep protecting that rhythm.";
  }
  if (insights.completionsThisMonth >= 3) {
    return "Solid month so far. Consistency beats intensity.";
  }
  if (insights.totalCompletions === 0) {
    return "Complete your first session to start tracking your success rate.";
  }
  if (insights.successRate < 50 && insights.totalCompletions > 0) {
    return "A few more check-ins will lift your success rate fast.";
  }
  return "Small wins stack up — one session at a time.";
}

/** Computes recurring-session insights from completion and skip history. */
export function computeFocusNodeInsights(
  node: FocusNode,
  referenceDate = new Date(),
): FocusNodeInsights {
  const todayIso = toIsoDateString(referenceDate);
  const recentDates = getRecentOccurrenceDates(node.schedule.weekday, WEEKS_OF_HISTORY, referenceDate);
  const skippedDates = node.skippedDates ?? [];

  let completedInWindow = 0;
  let skippedInWindow = 0;
  let missedInWindow = 0;

  const recentHistory: RecentOccurrence[] = recentDates.map((dateIso) => {
    const outcome = resolveOutcome(node, dateIso, todayIso, referenceDate);
    if (dateIso <= todayIso && outcome !== "today") {
      if (outcome === "completed") completedInWindow++;
      else if (outcome === "skipped") skippedInWindow++;
      else if (outcome === "missed") missedInWindow++;
    }

    return {
      dateIso,
      shortLabel: formatShortDate(dateIso),
      outcome,
    };
  });

  const decided = completedInWindow + skippedInWindow + missedInWindow;
  const successRate =
    decided > 0 ? Math.round((completedInWindow / decided) * 100) : 0;

  const sessionMinutes =
    getScheduleWindow(node.schedule).endMinutes -
    getScheduleWindow(node.schedule).startMinutes;
  const totalFocusMinutes = sessionMinutes * node.completedDates.length;

  const refMonth = referenceDate.getMonth();
  const refYear = referenceDate.getFullYear();
  const completionsThisMonth = node.completedDates.filter((iso) => {
    const date = parseIsoDate(iso);
    return date.getMonth() === refMonth && date.getFullYear() === refYear;
  }).length;

  const currentStreak = computeCurrentStreak(node, referenceDate);
  const bestStreak = computeBestStreak(node, referenceDate);

  const insights: FocusNodeInsights = {
    successRate,
    successRateLabel: resolveSuccessRateLabel(successRate),
    currentStreak,
    bestStreak,
    totalCompletions: node.completedDates.length,
    totalSkips: skippedDates.length,
    focusHoursLabel: formatFocusHours(totalFocusMinutes),
    completionsThisMonth,
    recentHistory,
    insightMessage: "",
  };

  insights.insightMessage = resolveInsightMessage(node, insights);
  return insights;
}
