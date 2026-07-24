import { computeFocusNodeInsights } from "@/lib/focusNodeStats";
import { addDaysToIsoDate, toIsoDateString } from "@/lib/time";
import type { FocusNode, FocusNodeKind, Weekday } from "@/types/focusNode";

/** Heat intensity — 0 = quiet day, 4 = full daily target reached. */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type ContributionCell = {
  dateIso: string;
  level: ContributionLevel;
  completionCount: number;
};

/** One calendar week column (Monday → Sunday) for the contribution grid. */
export type ContributionWeek = {
  weekStartIso: string;
  days: ContributionCell[];
};

export type WeeklyRhythmStatus = "future" | "today" | "complete" | "partial" | "rest";

export type WeeklyRhythmDay = {
  label: string;
  status: WeeklyRhythmStatus;
  isToday: boolean;
};

export type FocusHabitDotOutcome = "completed" | "missed" | "skipped" | "upcoming" | "today";

export type FocusHabitSummary = {
  nodeId: string;
  title: string;
  kind: FocusNodeKind;
  weekStreak: number;
  totalSessions: number;
  recentDots: FocusHabitDotOutcome[];
};

export type ConsistencyStats = {
  headline: string;
  subline: string;
  dayStreak: number;
  activeDaysLast30: number;
  activeDaysPrior30: number;
  totalSessions: number;
  contributionWeeks: ContributionWeek[];
  weeklyRhythm: WeeklyRhythmDay[];
  focusHabits: FocusHabitSummary[];
};

const HEATMAP_WEEKS = 20;
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMondayOfWeek(referenceDate: Date): Date {
  const monday = new Date(referenceDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Monday-first weekday index: Mon=0 … Sun=6. */
function getMondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function countScheduledOnDate(nodes: FocusNode[], dateIso: string): number {
  const weekday = parseIsoDate(dateIso).getDay() as Weekday;
  return nodes.filter((node) => node.schedule.weekday === weekday).length;
}

function countCompletionsOnDate(nodes: FocusNode[], dateIso: string): number {
  return nodes.filter((node) => node.completedDates.includes(dateIso)).length;
}

function resolveContributionLevel(
  completionCount: number,
  scheduledCount: number,
): ContributionLevel {
  if (scheduledCount > 0 && completionCount >= scheduledCount) return 4;
  if (completionCount >= 3) return 3;
  if (completionCount === 2) return 2;
  if (completionCount === 1) return 1;
  return 0;
}

function resolveRhythmStatus(
  dateIso: string,
  todayIso: string,
  completionCount: number,
  scheduledCount: number,
): WeeklyRhythmStatus {
  if (dateIso > todayIso) return "future";
  if (dateIso === todayIso) return "today";
  if (scheduledCount > 0 && completionCount >= scheduledCount) return "complete";
  if (completionCount > 0) return "partial";
  return "rest";
}

function countActiveDaysInRange(
  nodes: FocusNode[],
  startIso: string,
  endIso: string,
): number {
  let active = 0;
  let cursor = startIso;
  while (cursor <= endIso) {
    if (countCompletionsOnDate(nodes, cursor) > 0) active++;
    cursor = addDaysToIsoDate(cursor, 1);
  }
  return active;
}

function resolveHeadline(
  dayStreak: number,
  activeLast30: number,
  activePrior30: number,
  totalSessions: number,
): { headline: string; subline: string } {
  if (totalSessions === 0) {
    return {
      headline: "Your consistency story starts here",
      subline: "Complete a session and this screen becomes a record of your progress.",
    };
  }

  if (dayStreak >= 7) {
    return {
      headline: `${dayStreak} days in a row`,
      subline: "Yes — consistency is becoming part of your routine.",
    };
  }

  if (activeLast30 > activePrior30 && activePrior30 > 0) {
    return {
      headline: "You're showing up more",
      subline: "Yes — you've been active on more days than the month before.",
    };
  }

  if (dayStreak >= 3) {
    return {
      headline: `${dayStreak}-day streak`,
      subline: "Small daily wins are stacking into a real habit.",
    };
  }

  if (activeLast30 > 0 && activeLast30 === activePrior30) {
    return {
      headline: "Steady rhythm",
      subline: "You're holding a consistent pace — that's how focus habits grow.",
    };
  }

  if (activeLast30 < activePrior30 && activePrior30 > 0) {
    return {
      headline: "Ready for a fresh push",
      subline: "A quieter stretch happens. One session restarts the momentum.",
    };
  }

  return {
    headline: "Building your rhythm",
    subline: "Every completed session is proof you're learning to protect your focus.",
  };
}

function mapDotOutcome(
  outcome: string,
): FocusHabitDotOutcome {
  if (outcome === "completed") return "completed";
  if (outcome === "skipped") return "skipped";
  if (outcome === "today") return "today";
  if (outcome === "upcoming") return "upcoming";
  return "missed";
}

/** Motivation-first rollup — contribution grid, weekly rhythm, and habit summaries. */
export function computeConsistencyStats(
  nodes: FocusNode[],
  dayStreak: number,
  referenceDate = new Date(),
): ConsistencyStats {
  const todayIso = toIsoDateString(referenceDate);
  const mondayThisWeek = getMondayOfWeek(referenceDate);
  const mondayIso = toIsoDateString(mondayThisWeek);

  const heatmapStart = addDaysToIsoDate(mondayIso, -(HEATMAP_WEEKS - 1) * 7);

  const contributionWeeks: ContributionWeek[] = [];
  for (let week = 0; week < HEATMAP_WEEKS; week++) {
    const weekStartIso = addDaysToIsoDate(heatmapStart, week * 7);
    const days: ContributionCell[] = [];

    for (let day = 0; day < 7; day++) {
      const dateIso = addDaysToIsoDate(weekStartIso, day);
      const completionCount = countCompletionsOnDate(nodes, dateIso);
      const scheduledCount = countScheduledOnDate(nodes, dateIso);
      days.push({
        dateIso,
        level: resolveContributionLevel(completionCount, scheduledCount),
        completionCount,
      });
    }

    contributionWeeks.push({ weekStartIso, days });
  }

  const weeklyRhythm: WeeklyRhythmDay[] = WEEKDAY_LABELS.map((label, index) => {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    const completionCount = countCompletionsOnDate(nodes, dateIso);
    const scheduledCount = countScheduledOnDate(nodes, dateIso);
    return {
      label,
      status: resolveRhythmStatus(dateIso, todayIso, completionCount, scheduledCount),
      isToday: dateIso === todayIso,
    };
  });

  const last30Start = addDaysToIsoDate(todayIso, -29);
  const prior30Start = addDaysToIsoDate(todayIso, -59);
  const prior30End = addDaysToIsoDate(todayIso, -30);

  const activeDaysLast30 = countActiveDaysInRange(nodes, last30Start, todayIso);
  const activeDaysPrior30 = countActiveDaysInRange(nodes, prior30Start, prior30End);

  const totalSessions = nodes.reduce((sum, node) => sum + node.completedDates.length, 0);
  const { headline, subline } = resolveHeadline(
    dayStreak,
    activeDaysLast30,
    activeDaysPrior30,
    totalSessions,
  );

  const focusHabits: FocusHabitSummary[] = nodes
    .map((node) => {
      const insights = computeFocusNodeInsights(node, referenceDate);
      return {
        nodeId: node.id,
        title: node.title,
        kind: node.kind,
        weekStreak: insights.currentStreak,
        totalSessions: insights.totalCompletions,
        recentDots: insights.recentHistory.map((entry) => mapDotOutcome(entry.outcome)),
      };
    })
    .filter((habit) => habit.totalSessions > 0 || nodes.length <= 4)
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 5);

  return {
    headline,
    subline,
    dayStreak,
    activeDaysLast30,
    activeDaysPrior30,
    totalSessions,
    contributionWeeks,
    weeklyRhythm,
    focusHabits,
  };
}

export function getContributionLevelColor(
  level: ContributionLevel,
  colors: { border: string; skyDeep: string },
): string {
  switch (level) {
    case 4:
      return colors.skyDeep;
    case 3:
      return "rgba(107, 143, 184, 0.72)";
    case 2:
      return "rgba(107, 143, 184, 0.48)";
    case 1:
      return "rgba(107, 143, 184, 0.28)";
    default:
      return colors.border;
  }
}

export function getMondayFirstRowIndex(dateIso: string): number {
  return getMondayFirstIndex(parseIsoDate(dateIso));
}
