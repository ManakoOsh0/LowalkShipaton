import type { ScheduleItemKind } from "@/types/dashboard";
import type { FocusNodeInsights } from "@/lib/focusNodeStats";

export type SessionOccurrenceStatus =
  | "active"
  | "upcoming"
  | "completed"
  | "skipped"
  | "scheduled"
  | "missed"
  | "overdue";

export type SessionDetailData = {
  nodeId: string;
  title: string;
  kind: ScheduleItemKind;
  timeLabel: string;
  locationLabel: string;
  dateIso: string;
  dateLabel: string;
  isToday: boolean;
  status: SessionOccurrenceStatus;
  statusLabel: string;
  scheduledDurationLabel: string;
  endsInLabel?: string;
  coinsEarned: number | null;
  countedTowardGoal: boolean;
  insights: FocusNodeInsights;
};
