/**
 * Streak week rhythm — Monday-first glance for the celebration overlay.
 */
import { addDaysToIsoDate, toIsoDateString } from "@/lib/time";
import type { FocusNode, Weekday } from "@/types/focusNode";

export type StreakWeekDayStatus = "future" | "today" | "complete" | "missed" | "rest";

export type StreakWeekDay = {
  label: string;
  dateIso: string;
  status: StreakWeekDayStatus;
  isToday: boolean;
};

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

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

function countCompletionsOnDate(nodes: FocusNode[], dateIso: string): number {
  return nodes.filter((node) => node.completedDates.includes(dateIso)).length;
}

function countScheduledOnDate(nodes: FocusNode[], dateIso: string): number {
  const weekday = parseIsoDate(dateIso).getDay() as Weekday;
  return nodes.filter((node) => node.schedule.weekday === weekday).length;
}

/** Seven-day rhythm for the streak celebration card — uses real completion data. */
export function buildStreakWeekRhythm(
  nodes: FocusNode[],
  referenceDate = new Date(),
): StreakWeekDay[] {
  const todayIso = toIsoDateString(referenceDate);
  const mondayIso = toIsoDateString(getMondayOfWeek(referenceDate));

  return WEEKDAY_LABELS.map((label, index) => {
    const dateIso = addDaysToIsoDate(mondayIso, index);
    const completionCount = countCompletionsOnDate(nodes, dateIso);
    const scheduledCount = countScheduledOnDate(nodes, dateIso);
    const isToday = dateIso === todayIso;

    let status: StreakWeekDayStatus;
    if (dateIso > todayIso) {
      status = "future";
    } else if (isToday) {
      status = "today";
    } else if (scheduledCount > 0 && completionCount >= scheduledCount) {
      status = "complete";
    } else if (completionCount > 0) {
      status = "complete";
    } else if (scheduledCount > 0) {
      status = "missed";
    } else {
      status = "rest";
    }

    return { label, dateIso, status, isToday };
  });
}

/** Fill width for the singular week bar — extends through today's column. */
export function getStreakWeekFillPercent(days: StreakWeekDay[]): number {
  const todayIndex = days.findIndex((day) => day.isToday);
  if (todayIndex < 0) return 0;
  return ((todayIndex + 1) / days.length) * 100;
}

/** Whether a day column should read as filled on the rhythm bar. */
export function isStreakWeekDayFilled(day: StreakWeekDay): boolean {
  return day.status === "complete" || day.status === "today";
}
