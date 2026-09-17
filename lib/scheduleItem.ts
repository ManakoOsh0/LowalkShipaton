import type { ScheduleItem, ScheduleItemStatus } from "@/types/dashboard";
import type { SessionDetailData, SessionOccurrenceStatus } from "@/types/sessionDetail";

const KIND_ACCENTS: Record<ScheduleItem["kind"], ScheduleItem["accent"]> = {
  class: "blue",
  gym: "green",
  library: "green",
  custom: "blue",
};

function toScheduleItemStatus(status: SessionOccurrenceStatus): ScheduleItemStatus {
  if (status === "scheduled") return "upcoming";
  return status;
}

/** Map session detail into the shared schedule row / action sheet shape. */
export function scheduleItemFromSessionDetail(detail: SessionDetailData): ScheduleItem {
  return {
    id: detail.nodeId,
    title: detail.title,
    timeLabel: detail.timeLabel,
    locationLabel: detail.locationLabel,
    kind: detail.kind,
    accent: KIND_ACCENTS[detail.kind],
    status: toScheduleItemStatus(detail.status),
    startMinutes: detail.startMinutes,
    endMinutes: detail.endMinutes,
    dateIso: detail.dateIso,
    isToday: detail.isToday,
  };
}

/** Skip today — any incomplete today occurrence the user can still opt out of. */
export function canSkipScheduleItem(item: ScheduleItem): boolean {
  if (!item.isToday) return false;
  return (
    item.status === "upcoming" ||
    item.status === "active" ||
    item.status === "overdue"
  );
}
