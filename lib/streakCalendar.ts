import { addDaysToIsoDate, toIsoDateString } from "@/lib/time";
import {
  countCompletedSessionsToday,
  countScheduledSessionsToday,
} from "@/store/selectors";
import type { FocusNode } from "@/types/focusNode";

export type StreakDayStatus = "future" | "rest" | "hit" | "partial" | "missed" | "today";

export type StreakCalendarCell = {
  day: number | null;
  dateIso: string | null;
  status: StreakDayStatus;
  goalHit: boolean;
  connectLeft: boolean;
  connectRight: boolean;
};

export type StreakMonthSummary = {
  monthLabel: string;
  year: number;
  month: number;
  activePercent: number;
  daysCompleted: number;
  daysIncomplete: number;
  cells: StreakCalendarCell[];
};

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function resolveDayStatus(
  nodes: FocusNode[],
  dateIso: string,
  todayIso: string,
): { status: StreakDayStatus; goalHit: boolean } {
  const date = parseIsoDate(dateIso);
  const scheduled = countScheduledSessionsToday(nodes, date);
  const completed = countCompletedSessionsToday(nodes, date);

  if (dateIso > todayIso) {
    return { status: "future", goalHit: false };
  }

  if (scheduled === 0) {
    return { status: "rest", goalHit: false };
  }

  const isToday = dateIso === todayIso;
  if (completed >= scheduled) {
    return { status: isToday ? "today" : "hit", goalHit: true };
  }
  if (completed > 0) {
    return { status: isToday ? "today" : "partial", goalHit: false };
  }
  return { status: isToday ? "today" : "missed", goalHit: false };
}

/** Month grid for the streak detail screen — daily-goal hits drive connectors. */
export function computeStreakMonthCalendar(
  nodes: FocusNode[],
  referenceDate = new Date(),
): StreakMonthSummary {
  const todayIso = toIsoDateString(new Date());
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (firstOfMonth.getDay() + 6) % 7;

  const monthLabel = referenceDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const cells: StreakCalendarCell[] = [];
  const goalHitByDate = new Map<string, boolean>();
  let daysCompleted = 0;
  let daysIncomplete = 0;

  for (let index = 0; index < firstDayIndex; index++) {
    cells.push({
      day: null,
      dateIso: null,
      status: "rest",
      goalHit: false,
      connectLeft: false,
      connectRight: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateIso = toIsoDateString(new Date(year, month, day));
    const { status, goalHit } = resolveDayStatus(nodes, dateIso, todayIso);
    goalHitByDate.set(dateIso, goalHit);

    if (dateIso <= todayIso && status !== "rest" && status !== "future") {
      if (goalHit) daysCompleted++;
      else daysIncomplete++;
    }

    cells.push({
      day,
      dateIso,
      status,
      goalHit,
      connectLeft: false,
      connectRight: false,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      day: null,
      dateIso: null,
      status: "rest",
      goalHit: false,
      connectLeft: false,
      connectRight: false,
    });
  }

  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    if (!cell.dateIso || !goalHitByDate.get(cell.dateIso)) continue;

    const column = index % 7;
    if (column > 0) {
      const previous = cells[index - 1];
      if (previous.dateIso && goalHitByDate.get(previous.dateIso)) {
        cell.connectLeft = true;
        previous.connectRight = true;
      }
    }
  }

  const decidedDays = daysCompleted + daysIncomplete;
  const activePercent =
    decidedDays > 0 ? Math.round((daysCompleted / decidedDays) * 100) : 0;

  return {
    monthLabel,
    year,
    month,
    activePercent,
    daysCompleted,
    daysIncomplete,
    cells,
  };
}

export function shiftMonth(year: number, month: number, delta: number): Date {
  const next = new Date(year, month + delta, 1);
  return next;
}

export function isFutureMonth(year: number, month: number): boolean {
  const today = new Date();
  return (
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth())
  );
}
