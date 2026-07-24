import type { ActiveSessionSnapshot, SessionScheduleType } from "@/types/session";
import type { FocusNode } from "@/types/focusNode";
import {
  getEndOfDayMs,
  getScheduleWindow,
  isDurationSessionExpired,
  minutesToTodayDate,
  toIsoDateString,
} from "@/lib/time";

export const DEFAULT_CLASS_PRE_BUFFER_MINUTES = 30;
export const DEFAULT_SESSION_GAP_MERGE_MINUTES = 30;

export const CLASS_PRE_BUFFER_OPTIONS = [
  { minutes: 15 as const, label: "15 min" },
  { minutes: 30 as const, label: "30 min" },
  { minutes: 45 as const, label: "45 min" },
] as const;

export type ClassPreBufferMinutes = (typeof CLASS_PRE_BUFFER_OPTIONS)[number]["minutes"];

export type ShieldScheduleSettings = {
  classPreBufferMinutes: number;
  sessionGapMergeMinutes: number;
};

export type NodeShieldInterval = {
  nodeId: string;
  scheduleType: SessionScheduleType;
  startsAtMs: number;
  nominalEndsAtMs: number;
};

type MergedShieldWindow = {
  startMs: number;
  endMs: number;
  nodeIds: string[];
};

export function getShieldScheduleSettings(): ShieldScheduleSettings {
  // Lazy import avoided — callers pass settings from useUserStore.getState().
  return {
    classPreBufferMinutes: DEFAULT_CLASS_PRE_BUFFER_MINUTES,
    sessionGapMergeMinutes: DEFAULT_SESSION_GAP_MERGE_MINUTES,
  };
}

function isOccurrenceOpenToday(node: FocusNode, referenceDate: Date): boolean {
  if (node.schedule.weekday !== referenceDate.getDay()) return false;
  const todayIso = toIsoDateString(referenceDate);
  if (node.completedDates.includes(todayIso)) return false;
  if (node.skippedDates?.includes(todayIso)) return false;
  return true;
}

/** Raw per-node shield interval before gap merging (classes include pre-buffer). */
export function getNodeShieldInterval(
  node: FocusNode,
  settings: ShieldScheduleSettings,
  referenceDate = new Date(),
): NodeShieldInterval | null {
  if (!isOccurrenceOpenToday(node, referenceDate)) return null;

  const { startMinutes, endMinutes } = getScheduleWindow(node.schedule);
  const scheduleType: SessionScheduleType =
    node.schedule.type === "class" ? "class" : "duration";

  const bufferMinutes =
    scheduleType === "class" ? settings.classPreBufferMinutes : 0;

  const startsAt = minutesToTodayDate(startMinutes - bufferMinutes, referenceDate);
  const nominalEndsAt = minutesToTodayDate(endMinutes, referenceDate);

  return {
    nodeId: node.id,
    scheduleType,
    startsAtMs: startsAt.getTime(),
    nominalEndsAtMs: nominalEndsAt.getTime(),
  };
}

export function getTodayShieldIntervals(
  nodes: FocusNode[],
  settings: ShieldScheduleSettings,
  referenceDate = new Date(),
): NodeShieldInterval[] {
  return nodes
    .map((node) => getNodeShieldInterval(node, settings, referenceDate))
    .filter((interval): interval is NodeShieldInterval => interval != null)
    .sort((a, b) => a.startsAtMs - b.startsAtMs);
}

/** Union adjacent intervals when the gap between sessions is under the merge threshold. */
export function mergeShieldIntervals(
  intervals: NodeShieldInterval[],
  gapMergeMinutes: number,
): MergedShieldWindow[] {
  if (intervals.length === 0) return [];

  const gapMs = gapMergeMinutes * 60 * 1000;
  const merged: MergedShieldWindow[] = [];

  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval.startsAtMs - last.endMs < gapMs) {
      last.endMs = Math.max(last.endMs, interval.nominalEndsAtMs);
      last.nodeIds.push(interval.nodeId);
    } else {
      merged.push({
        startMs: interval.startsAtMs,
        endMs: interval.nominalEndsAtMs,
        nodeIds: [interval.nodeId],
      });
    }
  }

  return merged;
}

export function computeShieldStartsAt(
  node: FocusNode,
  settings: ShieldScheduleSettings,
  referenceDate = new Date(),
): Date {
  const interval = getNodeShieldInterval(node, settings, referenceDate);
  if (!interval) {
    return referenceDate;
  }
  return new Date(interval.startsAtMs);
}

export function computeRequiredOnSiteMs(node: FocusNode): number | null {
  if (node.schedule.type !== "duration") return null;
  return Math.round(node.schedule.durationHours * 60 * 60 * 1000);
}

/**
 * Which scheduled node should drive the live session right now.
 * Prefers an in-progress active session, then the earliest owed interval.
 */
export function selectPrimaryObligationNode(
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now = Date.now(),
  referenceDate = new Date(),
): FocusNode | null {
  if (activeSession) {
    const current = nodes.find((node) => node.id === activeSession.nodeId);
    if (current && isOccurrenceOpenToday(current, referenceDate)) {
      if (activeSession.scheduleType === "duration" && activeSession.requiredOnSiteMs != null) {
        if (isDurationSessionExpired(activeSession.shieldStartsAt, referenceDate)) {
          // Expired at midnight — obligation cleared elsewhere.
        } else if (activeSession.onSiteAccumulatedMs < activeSession.requiredOnSiteMs) {
          return current;
        }
      } else if (activeSession.scheduleType === "class") {
        const endMs = Math.max(
          new Date(activeSession.endsAt).getTime(),
          activeSession.penaltyShieldEndsAt
            ? new Date(activeSession.penaltyShieldEndsAt).getTime()
            : 0,
        );
        if (now < endMs) return current;
      } else {
        return current;
      }
    }
  }

  const endOfDayMs = getEndOfDayMs(referenceDate);
  const intervals = getTodayShieldIntervals(nodes, settings, referenceDate);
  for (const interval of intervals) {
    if (now < interval.startsAtMs) continue;

    if (interval.scheduleType === "duration") {
      if (now >= endOfDayMs) continue;
    } else if (now >= interval.nominalEndsAtMs) {
      continue;
    }

    const node = nodes.find((item) => item.id === interval.nodeId);
    if (node) return node;
  }

  return null;
}

function getIntervalShieldEndMs(
  interval: NodeShieldInterval,
  activeSession: ActiveSessionSnapshot | null,
  referenceDate: Date,
): number {
  if (interval.scheduleType === "duration") {
    return getEndOfDayMs(referenceDate);
  }

  let endMs = interval.nominalEndsAtMs;
  if (activeSession?.nodeId === interval.nodeId) {
    endMs = Math.max(endMs, new Date(activeSession.endsAt).getTime());
    if (activeSession.penaltyShieldEndsAt) {
      endMs = Math.max(endMs, new Date(activeSession.penaltyShieldEndsAt).getTime());
    }
  }
  return endMs;
}

function isIntervalShieldActive(
  interval: NodeShieldInterval,
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  now: number,
  referenceDate: Date,
): boolean {
  if (now < interval.startsAtMs) return false;

  const todayIso = toIsoDateString(referenceDate);
  const node = nodes.find((item) => item.id === interval.nodeId);
  if (!node || node.completedDates.includes(todayIso)) return false;

  if (interval.scheduleType === "duration") {
    if (now >= getEndOfDayMs(referenceDate)) return false;

    if (activeSession?.nodeId === interval.nodeId && activeSession.requiredOnSiteMs != null) {
      if (isDurationSessionExpired(activeSession.shieldStartsAt, referenceDate)) return false;
      return activeSession.onSiteAccumulatedMs < activeSession.requiredOnSiteMs;
    }

    return true;
  }

  return now < getIntervalShieldEndMs(interval, activeSession, referenceDate);
}

/** Keeps shield on during short gaps between back-to-back sessions without starting the next node early. */
function isGapMergeShieldActive(
  intervals: NodeShieldInterval[],
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now: number,
  referenceDate: Date,
): boolean {
  const gapMs = settings.sessionGapMergeMinutes * 60 * 1000;

  for (let index = 0; index < intervals.length - 1; index++) {
    const previous = intervals[index];
    const next = intervals[index + 1];
    const gapBetween = next.startsAtMs - previous.nominalEndsAtMs;

    if (gapBetween < 0 || gapBetween >= gapMs) continue;
    if (now < previous.nominalEndsAtMs || now >= next.startsAtMs) continue;
    if (isIntervalShieldActive(previous, nodes, activeSession, now, referenceDate)) continue;

    return true;
  }

  return false;
}

function isPerNodeCalendarShieldActive(
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now: number,
  referenceDate: Date,
): boolean {
  const intervals = getTodayShieldIntervals(nodes, settings, referenceDate);

  if (
    intervals.some((interval) =>
      isIntervalShieldActive(interval, nodes, activeSession, now, referenceDate),
    )
  ) {
    return true;
  }

  return isGapMergeShieldActive(
    intervals,
    nodes,
    activeSession,
    settings,
    now,
    referenceDate,
  );
}

/** True when the native app shield should be running. */
export function isAppShieldActive(
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now = Date.now(),
  referenceDate = new Date(),
): boolean {
  if (activeSession?.penaltyShieldEndsAt) {
    if (new Date(activeSession.penaltyShieldEndsAt).getTime() > now) return true;
  }

  if (activeSession && now >= new Date(activeSession.shieldStartsAt).getTime()) {
    if (activeSession.scheduleType === "duration" && activeSession.requiredOnSiteMs != null) {
      if (isDurationSessionExpired(activeSession.shieldStartsAt, referenceDate)) {
        return isPerNodeCalendarShieldActive(
          nodes,
          null,
          settings,
          now,
          referenceDate,
        );
      }
      if (activeSession.onSiteAccumulatedMs < activeSession.requiredOnSiteMs) {
        return true;
      }
    }

    if (activeSession.scheduleType === "class") {
      const endMs = Math.max(
        new Date(activeSession.endsAt).getTime(),
        activeSession.penaltyShieldEndsAt
          ? new Date(activeSession.penaltyShieldEndsAt).getTime()
          : 0,
      );
      if (now < endMs) return true;
    }
  }

  return isPerNodeCalendarShieldActive(
    nodes,
    activeSession,
    settings,
    now,
    referenceDate,
  );
}

/** Epoch ms when the current shield obligation ends — passed to native for survival. */
export function computeShieldEndsAtMs(
  nodes: FocusNode[],
  activeSession: ActiveSessionSnapshot | null,
  settings: ShieldScheduleSettings,
  now = Date.now(),
  referenceDate = new Date(),
): number {
  const endOfDayMs = getEndOfDayMs(referenceDate);
  let maxEnd = now + 60_000;

  if (activeSession?.penaltyShieldEndsAt) {
    maxEnd = Math.max(
      maxEnd,
      new Date(activeSession.penaltyShieldEndsAt).getTime(),
    );
  }

  if (activeSession && now >= new Date(activeSession.shieldStartsAt).getTime()) {
    if (
      activeSession.scheduleType === "duration" &&
      activeSession.requiredOnSiteMs != null &&
      activeSession.onSiteAccumulatedMs < activeSession.requiredOnSiteMs &&
      !isDurationSessionExpired(activeSession.shieldStartsAt, referenceDate)
    ) {
      const remaining =
        activeSession.requiredOnSiteMs - activeSession.onSiteAccumulatedMs;
      maxEnd = Math.max(maxEnd, now + remaining);
      maxEnd = Math.min(maxEnd, endOfDayMs);
    }

    if (activeSession.scheduleType === "class") {
      maxEnd = Math.max(maxEnd, new Date(activeSession.endsAt).getTime());
    }
  }

  const intervals = getTodayShieldIntervals(nodes, settings, referenceDate);
  for (const interval of intervals) {
    if (!isIntervalShieldActive(interval, nodes, activeSession, now, referenceDate)) {
      continue;
    }
    const intervalEnd = getIntervalShieldEndMs(interval, activeSession, referenceDate);
    if (now < intervalEnd) {
      maxEnd = Math.max(maxEnd, intervalEnd);
    }
  }

  if (
    isGapMergeShieldActive(
      intervals,
      nodes,
      activeSession,
      settings,
      now,
      referenceDate,
    )
  ) {
    for (let index = 0; index < intervals.length - 1; index++) {
      const next = intervals[index + 1];
      if (now < next.startsAtMs) {
        maxEnd = Math.max(maxEnd, next.startsAtMs);
      }
    }
  }

  return maxEnd;
}

export function formatOnSiteRemainingLabel(
  accumulatedMs: number,
  requiredMs: number,
): string {
  const remainingMs = Math.max(requiredMs - accumulatedMs, 0);
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m on site left`;
  if (hours > 0) return `${hours}h on site left`;
  return `${minutes}m on site left`;
}

export function formatDurationClock(totalMs: number): string {
  const totalSeconds = Math.max(Math.floor(totalMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
