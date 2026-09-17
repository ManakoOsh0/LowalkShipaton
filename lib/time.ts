import type { FocusNode, FocusNodeSchedule } from "@/types/focusNode";

/** Minutes since midnight for overlap math — keeps geofence-adjacent scheduling predictable. */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToLabel(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Session start as HH:mm from a 12h label or range
 * ("2:00 PM – 4:00 PM" → "14:00").
 */
export function formatStartClock24(timeLabel: string): string {
  const start = timeLabel.split("–")[0]?.trim() ?? timeLabel;
  const match12 = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = Number.parseInt(match12[1]!, 10);
    const minutes = match12[2]!;
    const period = match12[3]!.toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  const match24 = start.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return `${match24[1]!.padStart(2, "0")}:${match24[2]}`;
  }
  return start;
}

export function formatTimeLabel(time: string): string {
  return formatMinutesToLabel(parseTimeToMinutes(time));
}

export function getScheduleWindow(schedule: FocusNodeSchedule): {
  startMinutes: number;
  endMinutes: number;
} {
  const startMinutes = parseTimeToMinutes(schedule.startTime);

  if (schedule.type === "class") {
    return {
      startMinutes,
      endMinutes: parseTimeToMinutes(schedule.endTime),
    };
  }

  return {
    startMinutes,
    endMinutes: startMinutes + Math.round(schedule.durationHours * 60),
  };
}

/** Standard interval intersection: (StartA < EndB) && (EndA > StartB). */
export function schedulesOverlap(
  scheduleA: FocusNodeSchedule,
  scheduleB: FocusNodeSchedule,
): boolean {
  if (scheduleA.weekday !== scheduleB.weekday) return false;

  // Gym/library/custom windows are planning hints — enforcement runs until midnight and
  // can yield to later sessions, so only fixed class ↔ class slots are hard-clashed.
  if (scheduleA.type === "duration" || scheduleB.type === "duration") {
    return false;
  }

  const windowA = getScheduleWindow(scheduleA);
  const windowB = getScheduleWindow(scheduleB);

  return windowA.startMinutes < windowB.endMinutes && windowA.endMinutes > windowB.startMinutes;
}

/** First existing node whose weekly window intersects the candidate schedule. */
export function findOverlappingNode(
  candidate: FocusNodeSchedule,
  existingNodes: FocusNode[],
  excludeNodeId?: string,
): FocusNode | null {
  return (
    existingNodes.find(
      (node) => node.id !== excludeNodeId && schedulesOverlap(candidate, node.schedule),
    ) ?? null
  );
}

export function nodeOverlapsExisting(
  candidate: FocusNodeSchedule,
  existingNodes: FocusNode[],
  excludeNodeId?: string,
): boolean {
  return findOverlappingNode(candidate, existingNodes, excludeNodeId) != null;
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDateString(date);
}

export function getYesterdayIso(referenceDate = new Date()): string {
  return addDaysToIsoDate(toIsoDateString(referenceDate), -1);
}

export function formatRemainingTime(endsAtIso: string, now = new Date()): string {
  const remainingMs = Math.max(new Date(endsAtIso).getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Ends in ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getScheduleTimeLabel(schedule: FocusNodeSchedule): string {
  if (schedule.type === "class") {
    return `${formatTimeLabel(schedule.startTime)} – ${formatTimeLabel(schedule.endTime)}`;
  }

  return formatTimeLabel(schedule.startTime);
}

/** Builds a Date for today's clock minutes (handles windows that spill past midnight). */
export function minutesToTodayDate(totalMinutes: number, referenceDate = new Date()): Date {
  const dayStart = new Date(referenceDate);
  dayStart.setHours(0, 0, 0, 0);
  return new Date(dayStart.getTime() + totalMinutes * 60 * 1000);
}

/**
 * Session end timestamp when the user starts focusing.
 * Prefer the scheduled end for today; if that window already passed, run a full
 * duration-length session from now so late starts still complete.
 */
export function computeSessionEndsAt(
  schedule: FocusNodeSchedule,
  now = new Date(),
): string {
  const { startMinutes, endMinutes } = getScheduleWindow(schedule);
  const scheduledEnd = minutesToTodayDate(endMinutes, now);

  if (scheduledEnd.getTime() > now.getTime()) {
    return scheduledEnd.toISOString();
  }

  const durationMs = Math.max(endMinutes - startMinutes, 15) * 60 * 1000;
  return new Date(now.getTime() + durationMs).toISOString();
}

export function getScheduleDurationLabel(schedule: FocusNodeSchedule): string {
  const { startMinutes, endMinutes } = getScheduleWindow(schedule);
  const totalMinutes = endMinutes - startMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function isWithinScheduleWindow(
  schedule: FocusNodeSchedule,
  now = new Date(),
): boolean {
  if (now.getDay() !== schedule.weekday) return false;

  const { startMinutes, endMinutes } = getScheduleWindow(schedule);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

/** True when today's scheduled end has already passed (wrong weekday → false). */
export function isScheduleWindowPassed(
  schedule: FocusNodeSchedule,
  now = new Date(),
): boolean {
  if (now.getDay() !== schedule.weekday) return false;

  const { endMinutes } = getScheduleWindow(schedule);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= endMinutes;
}

export function isSessionExpired(endsAtIso: string, now = new Date()): boolean {
  return new Date(endsAtIso).getTime() <= now.getTime();
}

/** Local midnight at the end of referenceDate's calendar day (exclusive upper bound). */
export function getEndOfDayMs(referenceDate = new Date()): number {
  const dayStart = new Date(referenceDate);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart.getTime() + 24 * 60 * 60 * 1000;
}

/** True once local midnight has passed for referenceDate's calendar day. */
export function isPastEndOfDay(now = new Date(), referenceDate = now): boolean {
  return now.getTime() >= getEndOfDayMs(referenceDate);
}

/**
 * Duration sessions expire at local midnight on the day shielding began —
 * incomplete on-site hours after that count as missed.
 */
export function isDurationSessionExpired(
  shieldStartsAtIso: string,
  now = new Date(),
): boolean {
  const sessionDayIso = toIsoDateString(new Date(shieldStartsAtIso));
  const nowDayIso = toIsoDateString(now);
  return nowDayIso > sessionDayIso;
}
