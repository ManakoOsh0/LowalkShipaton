import type { ScheduleItem, WeekDaySchedule } from "@/types/dashboard";

import { SCREEN_PADDING } from "@/lib/layout";

export const TIMETABLE_HOUR_HEIGHT = 52;
/** @deprecated Use resolveWeekColumnWidth — columns size to fit three days on screen. */
export const WEEK_COLUMN_WIDTH = 112;
export const WEEK_COLUMN_GAP = 10;
export const WEEK_VISIBLE_COLUMN_COUNT = 3;
export const WEEK_COLUMN_PIXELS_PER_MINUTE = 1.35;
export const TIMETABLE_GUTTER_WIDTH = 40;
export const TIMETABLE_MIN_BLOCK_HEIGHT = 56;
export const WEEK_BLOCK_GAP = 4;
export const TIMETABLE_DEFAULT_START_HOUR = 8;
export const TIMETABLE_DEFAULT_END_HOUR = 17;
export const TIMETABLE_BLOCK_INSET = 4;
export const WEEK_EMPTY_COLUMN_HEIGHT = 120;

/** Width for one day column so exactly three columns fill the screen. */
export function resolveWeekColumnWidth(
  screenWidth: number,
  paddingHorizontal = SCREEN_PADDING,
): number {
  const viewportWidth = screenWidth - paddingHorizontal * 2;
  const gapTotal = WEEK_COLUMN_GAP * (WEEK_VISIBLE_COLUMN_COUNT - 1);
  return (viewportWidth - gapTotal) / WEEK_VISIBLE_COLUMN_COUNT;
}

export function resolveWeekColumnStride(columnWidth: number): number {
  return columnWidth + WEEK_COLUMN_GAP;
}

export function resolveWeekContentWidth(
  dayCount: number,
  columnWidth: number,
): number {
  return dayCount * columnWidth + Math.max(dayCount - 1, 0) * WEEK_COLUMN_GAP;
}

export function resolveMaxHorizontalScrollOffset(
  dayCount: number,
  columnWidth: number,
  viewportWidth: number,
): number {
  return Math.max(resolveWeekContentWidth(dayCount, columnWidth) - viewportWidth, 0);
}

/** Scroll offset that centers a day column, clamped to the week's scroll range. */
export function resolveHorizontalScrollToColumn(
  targetIndex: number,
  dayCount: number,
  columnWidth: number,
  viewportWidth: number,
): number {
  const columnStride = resolveWeekColumnStride(columnWidth);
  const centeredOffset =
    targetIndex * columnStride - (viewportWidth - columnWidth) / 2;
  const maxOffset = resolveMaxHorizontalScrollOffset(
    dayCount,
    columnWidth,
    viewportWidth,
  );

  return Math.min(Math.max(centeredOffset, 0), maxOffset);
}

export function formatSessionDuration(totalMinutes: number): string {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${totalMinutes}m`;
}

const WEEKDAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export function getWeekdayAbbreviation(weekday: number): string {
  return WEEKDAY_ABBR[weekday] ?? "DAY";
}

export function getDateDayNumber(dateIso: string): number {
  const day = Number.parseInt(dateIso.split("-")[2] ?? "0", 10);
  return Number.isFinite(day) ? day : 0;
}

export function weekHasSessions(week: WeekDaySchedule[]): boolean {
  return week.some((day) => day.items.length > 0);
}

/** Tight hour window for one day column — avoids empty space above the first block. */
export function resolveDayTimetableMinutes(day: WeekDaySchedule): {
  startMinutes: number;
  endMinutes: number;
} {
  if (day.items.length === 0) {
    const startMinutes = TIMETABLE_DEFAULT_START_HOUR * 60;
    return {
      startMinutes,
      endMinutes: TIMETABLE_DEFAULT_END_HOUR * 60,
    };
  }

  let minMinutes = Infinity;
  let maxMinutes = -Infinity;

  for (const item of day.items) {
    minMinutes = Math.min(minMinutes, item.startMinutes);
    maxMinutes = Math.max(maxMinutes, item.endMinutes);
  }

  return {
    startMinutes: Math.max(0, minMinutes - 15),
    endMinutes: Math.min(24 * 60, maxMinutes + 15),
  };
}

export function dayColumnHeight(
  day: WeekDaySchedule,
  pixelsPerMinute = WEEK_COLUMN_PIXELS_PER_MINUTE,
): number {
  if (day.items.length === 0) {
    return WEEK_EMPTY_COLUMN_HEIGHT;
  }

  const { startMinutes, endMinutes } = resolveDayTimetableMinutes(day);
  return Math.max(
    (endMinutes - startMinutes) * pixelsPerMinute + 8,
    WEEK_EMPTY_COLUMN_HEIGHT,
  );
}

/** Map session window into coordinates inside a single day column. */
export function blockFrameForDay(
  startMinutes: number,
  endMinutes: number,
  dayStartMinutes: number,
  pixelsPerMinute = WEEK_COLUMN_PIXELS_PER_MINUTE,
): { top: number; height: number } {
  const top = (startMinutes - dayStartMinutes) * pixelsPerMinute;
  const rawHeight = (endMinutes - startMinutes) * pixelsPerMinute;

  return {
    top: Math.max(top, 0),
    height: Math.max(rawHeight, TIMETABLE_MIN_BLOCK_HEIGHT),
  };
}

export type SessionBlockContent = {
  showLocation: boolean;
  showEndTime: boolean;
  titleLines: number;
  locationLines: number;
};

export type SessionBlockLayout = {
  item: ScheduleItem;
  frame: { top: number; height: number };
  content: SessionBlockContent;
};

const BLOCK_PADDING_V = 12;
const BLOCK_TIME_LINE_H = 12;
const BLOCK_TITLE_LINE_H = 14;
const BLOCK_META_LINE_H = 11;
const BLOCK_SECTION_GAP = 3;
const BLOCK_INNER_GAP = 2;

const CONTENT_TIERS: SessionBlockContent[] = [
  { showLocation: true, showEndTime: true, titleLines: 2, locationLines: 2 },
  { showLocation: true, showEndTime: false, titleLines: 2, locationLines: 2 },
  { showLocation: true, showEndTime: false, titleLines: 2, locationLines: 1 },
  { showLocation: true, showEndTime: false, titleLines: 1, locationLines: 1 },
  { showLocation: false, showEndTime: false, titleLines: 2, locationLines: 0 },
  { showLocation: false, showEndTime: false, titleLines: 1, locationLines: 0 },
];

/** Pixel height needed to render a block with the given content tier. */
export function estimateBlockContentHeight(
  item: ScheduleItem,
  content: SessionBlockContent,
): number {
  let height = BLOCK_PADDING_V + BLOCK_TIME_LINE_H + BLOCK_SECTION_GAP;
  height += BLOCK_TITLE_LINE_H * content.titleLines;

  if (content.showLocation && item.locationLabel.trim().length > 0) {
    height += BLOCK_INNER_GAP + BLOCK_META_LINE_H * content.locationLines;
  }

  height += BLOCK_INNER_GAP + BLOCK_META_LINE_H;

  if (content.showEndTime) {
    height += BLOCK_SECTION_GAP + BLOCK_TIME_LINE_H;
  }

  return height;
}

function pickBlockContent(
  item: ScheduleItem,
  availableHeight: number,
  timeHeight: number,
): { content: SessionBlockContent; height: number } {
  const hasLocation = item.locationLabel.trim().length > 0;
  const usableTiers = CONTENT_TIERS.filter(
    (tier) => !tier.showLocation || hasLocation,
  );

  for (const tier of usableTiers) {
    const needed = estimateBlockContentHeight(item, tier);
    const height = Math.max(needed, timeHeight, TIMETABLE_MIN_BLOCK_HEIGHT);
    if (height <= availableHeight) {
      return { content: tier, height };
    }
  }

  const fallback = usableTiers[usableTiers.length - 1] ?? CONTENT_TIERS.at(-1)!;
  const needed = estimateBlockContentHeight(item, fallback);
  const height = Math.max(
    Math.min(Math.max(needed, timeHeight, TIMETABLE_MIN_BLOCK_HEIGHT), availableHeight),
    TIMETABLE_MIN_BLOCK_HEIGHT,
  );

  return { content: fallback, height };
}

/** Position session blocks with content-aware heights that avoid overlap. */
export function layoutDaySessionBlocks(
  items: ScheduleItem[],
  dayStartMinutes: number,
  pixelsPerMinute = WEEK_COLUMN_PIXELS_PER_MINUTE,
): SessionBlockLayout[] {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);

  return sorted.map((item, index) => {
    const top = Math.max((item.startMinutes - dayStartMinutes) * pixelsPerMinute, 0);
    const timeHeight = (item.endMinutes - item.startMinutes) * pixelsPerMinute;
    const nextTop =
      index < sorted.length - 1
        ? (sorted[index + 1].startMinutes - dayStartMinutes) * pixelsPerMinute
        : top + Math.max(timeHeight, estimateBlockContentHeight(item, CONTENT_TIERS[0]));
    const availableHeight = Math.max(nextTop - top - WEEK_BLOCK_GAP, TIMETABLE_MIN_BLOCK_HEIGHT);
    const { content, height } = pickBlockContent(item, availableHeight, timeHeight);

    return {
      item,
      frame: { top, height },
      content,
    };
  });
}

export function dayColumnHeightForLayouts(
  layouts: SessionBlockLayout[],
  dayStartMinutes: number,
  dayEndMinutes: number,
  pixelsPerMinute = WEEK_COLUMN_PIXELS_PER_MINUTE,
): number {
  if (layouts.length === 0) {
    return WEEK_EMPTY_COLUMN_HEIGHT;
  }

  const timeHeight = (dayEndMinutes - dayStartMinutes) * pixelsPerMinute + 8;
  const contentHeight =
    layouts.reduce(
      (max, layout) => Math.max(max, layout.frame.top + layout.frame.height),
      0,
    ) + 8;

  return Math.max(timeHeight, contentHeight, WEEK_EMPTY_COLUMN_HEIGHT);
}

/** Pixel offset of a focus session inside its day column body. */
export function resolveFocusBlockTop(
  day: WeekDaySchedule,
  focusItemId: string,
): number | null {
  const { startMinutes } = resolveDayTimetableMinutes(day);
  const layouts = layoutDaySessionBlocks(day.items, startMinutes);
  const match = layouts.find((layout) => layout.item.id === focusItemId);
  return match?.frame.top ?? null;
}

/** @deprecated Global week grid — kept for tests. */
export function resolveTimetableHours(week: WeekDaySchedule[]): {
  startHour: number;
  endHour: number;
} {
  let minMinutes = Infinity;
  let maxMinutes = -Infinity;

  for (const day of week) {
    for (const item of day.items) {
      minMinutes = Math.min(minMinutes, item.startMinutes);
      maxMinutes = Math.max(maxMinutes, item.endMinutes);
    }
  }

  if (!Number.isFinite(minMinutes)) {
    return {
      startHour: TIMETABLE_DEFAULT_START_HOUR,
      endHour: TIMETABLE_DEFAULT_END_HOUR,
    };
  }

  const startHour = Math.max(0, Math.floor(minMinutes / 60) - 1);
  const endHour = Math.min(24, Math.ceil(maxMinutes / 60) + 1);

  return { startHour, endHour: Math.max(endHour, startHour + 1) };
}

export function timetableGridHeight(
  startHour: number,
  endHour: number,
  hourHeight = TIMETABLE_HOUR_HEIGHT,
): number {
  return (endHour - startHour) * hourHeight;
}

export function blockFrame(
  startMinutes: number,
  endMinutes: number,
  startHour: number,
  hourHeight = TIMETABLE_HOUR_HEIGHT,
): { top: number; height: number } {
  const gridStartMinutes = startHour * 60;
  const top = ((startMinutes - gridStartMinutes) / 60) * hourHeight;
  const rawHeight = ((endMinutes - startMinutes) / 60) * hourHeight;

  return {
    top,
    height: Math.max(rawHeight, TIMETABLE_MIN_BLOCK_HEIGHT),
  };
}

export function nowLineOffsetForDay(
  now: Date,
  dayStartMinutes: number,
  dayEndMinutes: number,
  pixelsPerMinute = WEEK_COLUMN_PIXELS_PER_MINUTE,
): number | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < dayStartMinutes || nowMinutes > dayEndMinutes) {
    return null;
  }

  return (nowMinutes - dayStartMinutes) * pixelsPerMinute;
}

/** Hide the now line when it would cut through a session block. */
export function shouldShowNowLineForDay(
  nowOffset: number,
  layouts: SessionBlockLayout[],
): boolean {
  return !layouts.some((layout) => {
    const blockTop = layout.frame.top;
    const blockBottom = layout.frame.top + layout.frame.height;
    return nowOffset >= blockTop && nowOffset <= blockBottom;
  });
}

export function nowLineOffset(
  now: Date,
  startHour: number,
  endHour: number,
  hourHeight = TIMETABLE_HOUR_HEIGHT,
): number | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const gridStart = startHour * 60;
  const gridEnd = endHour * 60;

  if (nowMinutes < gridStart || nowMinutes > gridEnd) {
    return null;
  }

  return ((nowMinutes - gridStart) / 60) * hourHeight;
}

export function resolveTimetableScrollOffset(
  week: WeekDaySchedule[],
  startHour: number,
  endHour: number,
  referenceDate = new Date(),
  hourHeight = TIMETABLE_HOUR_HEIGHT,
): number {
  const todayInWeek = week.some((day) => day.isToday);
  if (todayInWeek) {
    const nowOffset = nowLineOffset(referenceDate, startHour, endHour, hourHeight);
    if (nowOffset !== null) {
      return Math.max(nowOffset - 120, 0);
    }
  }

  const firstItem = week
    .flatMap((day) => day.items)
    .sort((a, b) => a.startMinutes - b.startMinutes)[0];

  if (!firstItem) {
    return 0;
  }

  const { top } = blockFrame(
    firstItem.startMinutes,
    firstItem.endMinutes,
    startHour,
    hourHeight,
  );
  return Math.max(top - 80, 0);
}

/** Statuses that deserve auto-focus — never completed, skipped, or missed. */
function isActionableFocusStatus(status: ScheduleItem["status"]): boolean {
  return status === "active" || status === "upcoming" || status === "overdue";
}

/** Next actionable session for auto-focus — active first, then upcoming/overdue. */
export function resolveWeekScheduleFocus(
  week: WeekDaySchedule[],
  selectedDateIso?: string,
): { item: ScheduleItem; day: WeekDaySchedule } | null {
  const selectedDay = selectedDateIso
    ? week.find((day) => day.dateIso === selectedDateIso)
    : undefined;
  const today = week.find((day) => day.isToday);
  const priorityDays = [
    selectedDay,
    today,
    ...week.filter(
      (day) => day !== selectedDay && day !== today,
    ),
  ].filter((day): day is WeekDaySchedule => Boolean(day));

  for (const day of priorityDays) {
    const active = day.items.find((item) => item.status === "active");
    if (active) {
      return { item: active, day };
    }

    const next = day.items.find((item) => isActionableFocusStatus(item.status));
    if (next) {
      return { item: next, day };
    }
  }

  return null;
}

export function sessionProgressRatio(
  item: ScheduleItem,
  referenceDate = new Date(),
): number | null {
  if (item.status !== "active") {
    return null;
  }

  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const span = item.endMinutes - item.startMinutes;
  if (span <= 0) {
    return null;
  }

  return Math.min(Math.max((nowMinutes - item.startMinutes) / span, 0), 1);
}

export function formatScheduleDateHeading(day: WeekDaySchedule): string {
  const date = new Date(`${day.dateIso}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
