import { getScheduleTimeLabel } from "@/lib/time";
import type { FocusNode, Weekday } from "@/types/focusNode";

const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export type ScheduleConflictDetails = {
  nodeId: string;
  title: string;
  timeLabel: string;
  weekday: Weekday;
};

export function buildScheduleConflictDetails(node: FocusNode): ScheduleConflictDetails {
  return {
    nodeId: node.id,
    title: node.title,
    timeLabel: getScheduleTimeLabel(node.schedule),
    weekday: node.schedule.weekday,
  };
}

/** User-facing overlap copy — names the conflicting session, day, and time window. */
export function formatScheduleConflictMessage(conflict: ScheduleConflictDetails): string {
  const dayLabel = WEEKDAY_LABELS[conflict.weekday];
  return `"${conflict.title}" (${conflict.timeLabel}) on ${dayLabel} is already scheduled at that time.`;
}

export function formatScheduleConflictDeletionBlocked(
  reason: "active" | "penalty",
): string {
  if (reason === "penalty") {
    return "Finish the extra app lock on that session before removing it from your schedule.";
  }
  return "Finish that session before removing it from your schedule.";
}
