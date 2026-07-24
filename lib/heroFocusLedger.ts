/**
 * Hero Focus Ledger — weekly report rollup for the TRMNL hero card.
 * Surfaces hours protected, streak, coins, and a compact GitHub-style heatmap.
 */
import { computeConsistencyStats } from "@/lib/consistencyStats";
import { addDaysToIsoDate, getScheduleWindow, toIsoDateString } from "@/lib/time";
import type { FocusNode, Weekday } from "@/types/focusNode";
import type { HeroFocusLedgerSnapshot } from "@/types/dashboard";

const LEDGER_HEATMAP_WEEKS = 16;

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

function countActiveDaysThisWeek(
  nodes: FocusNode[],
  mondayIso: string,
  todayIso: string,
): number {
  const activeDates = new Set<string>();
  for (const node of nodes) {
    for (const dateIso of node.completedDates) {
      if (dateIso >= mondayIso && dateIso <= todayIso) {
        activeDates.add(dateIso);
      }
    }
  }
  return activeDates.size;
}

/** Scannable hero value for protected focus time this week. */
export function formatWeeklyFocusTime(totalMinutes: number): {
  value: string;
  unit: string;
} {
  if (totalMinutes <= 0) return { value: "0", unit: "min" };
  if (totalMinutes < 60) {
    return { value: String(totalMinutes), unit: "min" };
  }
  const hours = totalMinutes / 60;
  if (hours >= 10) return { value: hours.toFixed(0), unit: "hrs" };
  return { value: hours.toFixed(1), unit: "hrs" };
}

function estimateWeeklyFocusMinutes(
  nodes: FocusNode[],
  mondayIso: string,
  todayIso: string,
): number {
  let total = 0;
  for (const node of nodes) {
    const window = getScheduleWindow(node.schedule);
    const sessionMinutes = window.endMinutes - window.startMinutes;
    for (const dateIso of node.completedDates) {
      if (dateIso >= mondayIso && dateIso <= todayIso) {
        total += sessionMinutes;
      }
    }
  }
  return total;
}

function computeWeeklySessionProgress(
  nodes: FocusNode[],
  mondayIso: string,
  todayIso: string,
): { completed: number; scheduled: number } {
  let scheduled = 0;
  let completed = 0;

  for (let index = 0; index < 7; index++) {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    if (dateIso > todayIso) continue;

    const weekday = parseIsoDate(dateIso).getDay() as Weekday;
    const dayNodes = nodes.filter((node) => node.schedule.weekday === weekday);
    for (const node of dayNodes) {
      scheduled += 1;
      if (node.completedDates.includes(dateIso)) {
        completed += 1;
      }
    }
  }

  return { completed, scheduled };
}

/** Live weekly ledger fed into the hero card after a strong week. */
export function computeHeroFocusLedger(
  nodes: FocusNode[],
  currentStreak: number,
  focusCoins: number,
  referenceDate = new Date(),
): HeroFocusLedgerSnapshot {
  const todayIso = toIsoDateString(referenceDate);
  const mondayIso = toIsoDateString(getMondayOfWeek(referenceDate));
  const focusMinutes = estimateWeeklyFocusMinutes(nodes, mondayIso, todayIso);
  const { value, unit } = formatWeeklyFocusTime(focusMinutes);
  const { completed, scheduled } = computeWeeklySessionProgress(
    nodes,
    mondayIso,
    todayIso,
  );

  const consistency = computeConsistencyStats(nodes, currentStreak, referenceDate);
  const heatmapWeeks = consistency.contributionWeeks
    .slice(-LEDGER_HEATMAP_WEEKS)
    .map((week) => ({
      weekStartIso: week.weekStartIso,
      isCurrentWeek: week.weekStartIso === mondayIso,
      days: week.days.map((day) => ({
        dateIso: day.dateIso,
        level: day.level,
        isToday: day.dateIso === todayIso,
      })),
    }));

  return {
    focusTime: value,
    focusTimeUnit: unit,
    currentStreak,
    focusCoins,
    sessionsCompleted: completed,
    sessionsScheduled: scheduled,
    activeDaysThisWeek: countActiveDaysThisWeek(nodes, mondayIso, todayIso),
    heatmapWeeks,
  };
}

/** Deterministic preview fixture for Settings hero cycling. */
export function buildPreviewFocusLedger(): HeroFocusLedgerSnapshot {
  const heatmapWeeks = Array.from({ length: LEDGER_HEATMAP_WEEKS }, (_, weekIndex) => {
    const weekStartIso = addDaysToIsoDate("2025-12-01", weekIndex * 7);
    const isCurrentWeek = weekIndex === LEDGER_HEATMAP_WEEKS - 1;
    return {
      weekStartIso,
      isCurrentWeek,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const dateIso = addDaysToIsoDate(weekStartIso, dayIndex);
        const seed = (weekIndex * 7 + dayIndex) % 11;
        const level = seed < 4 ? 0 : seed < 6 ? 1 : seed < 8 ? 2 : seed < 10 ? 3 : 4;
        return {
          dateIso,
          level: level as 0 | 1 | 2 | 3 | 4,
          isToday: isCurrentWeek && dayIndex === 5,
        };
      }),
    };
  });

  return {
    focusTime: "12.5",
    focusTimeUnit: "hrs",
    currentStreak: 12,
    focusCoins: 8,
    sessionsCompleted: 11,
    sessionsScheduled: 12,
    activeDaysThisWeek: 5,
    heatmapWeeks,
  };
}
