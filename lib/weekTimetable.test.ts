import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  blockFrame,
  blockFrameForDay,
  dayColumnHeight,
  estimateBlockContentHeight,
  formatSessionDuration,
  layoutDaySessionBlocks,
  nowLineOffset,
  resolveDayTimetableMinutes,
  resolveHorizontalScrollToColumn,
  resolveMaxHorizontalScrollOffset,
  resolveWeekColumnStride,
  resolveWeekColumnWidth,
  resolveTimetableHours,
  resolveTimetableScrollOffset,
  resolveWeekScheduleFocus,
  sessionProgressRatio,
  shouldShowNowLineForDay,
  timetableGridHeight,
} from "./weekTimetable";
import type { WeekDaySchedule } from "@/types/dashboard";

function makeDay(
  overrides: Partial<WeekDaySchedule> & Pick<WeekDaySchedule, "weekday" | "dateIso">,
): WeekDaySchedule {
  return {
    dayLabel: "Monday",
    dateLabel: "Mar 9",
    isToday: false,
    items: [],
    ...overrides,
  };
}

describe("resolveWeekColumnWidth", () => {
  it("fits exactly three columns inside the screen padding", () => {
    const screenWidth = 390;
    const columnWidth = resolveWeekColumnWidth(screenWidth);
    const totalWidth = columnWidth * 3 + 10 * 2;

    assert.equal(totalWidth, screenWidth - 32);
  });
});

describe("resolveHorizontalScrollToColumn", () => {
  it("clamps the last day so header pills stay aligned with columns", () => {
    const screenWidth = 390;
    const columnWidth = resolveWeekColumnWidth(screenWidth);
    const viewportWidth = screenWidth - 32;
    const maxOffset = resolveMaxHorizontalScrollOffset(7, columnWidth, viewportWidth);
    const sundayOffset = resolveHorizontalScrollToColumn(
      6,
      7,
      columnWidth,
      viewportWidth,
    );

    assert.equal(sundayOffset, maxOffset);
    assert.ok(sundayOffset < 6 * resolveWeekColumnStride(columnWidth));
  });
});

describe("resolveTimetableHours", () => {
  it("defaults to 8–17 when the week has no sessions", () => {
    const week = [makeDay({ weekday: 1, dateIso: "2026-03-09" })];
    assert.deepEqual(resolveTimetableHours(week), {
      startHour: 8,
      endHour: 17,
    });
  });

  it("pads one hour around the earliest and latest sessions", () => {
    const week = [
      makeDay({
        weekday: 1,
        dateIso: "2026-03-09",
        items: [
          {
            id: "a",
            title: "Morning",
            timeLabel: "9:00 AM",
            locationLabel: "Room 1",
            kind: "class",
            accent: "blue",
            status: "upcoming",
            startMinutes: 9 * 60,
            endMinutes: 10 * 60 + 30,
            dateIso: "2026-03-09",
            isToday: false,
          },
          {
            id: "b",
            title: "Afternoon",
            timeLabel: "2:00 PM",
            locationLabel: "Gym",
            kind: "gym",
            accent: "green",
            status: "upcoming",
            startMinutes: 14 * 60,
            endMinutes: 15 * 60,
            dateIso: "2026-03-09",
            isToday: false,
          },
        ],
      }),
    ];

    assert.deepEqual(resolveTimetableHours(week), {
      startHour: 8,
      endHour: 16,
    });
  });
});

describe("blockFrame", () => {
  it("maps minutes into top/height using the hour scale", () => {
    const frame = blockFrame(9 * 60 + 30, 11 * 60, 8, 60);
    assert.equal(frame.top, 90);
    assert.equal(frame.height, 90);
  });

  it("enforces a minimum block height for short sessions", () => {
    const frame = blockFrame(9 * 60, 9 * 60 + 15, 8, 52);
    assert.equal(frame.height, 56);
  });
});

describe("layoutDaySessionBlocks", () => {
  it("grows blocks to fit content without overlapping the next session", () => {
    const items = [
      {
        id: "a",
        title: "Statistics Lecture",
        timeLabel: "9:00 AM",
        locationLabel: "EMS Building Room 2-14",
        kind: "class" as const,
        accent: "blue" as const,
        status: "upcoming" as const,
        startMinutes: 9 * 60,
        endMinutes: 10 * 60 + 30,
        dateIso: "2026-03-11",
        isToday: true,
      },
      {
        id: "b",
        title: "Economics",
        timeLabel: "11:00 AM",
        locationLabel: "Room 101",
        kind: "class" as const,
        accent: "blue" as const,
        status: "upcoming" as const,
        startMinutes: 11 * 60,
        endMinutes: 12 * 60,
        dateIso: "2026-03-11",
        isToday: true,
      },
    ];

    const layouts = layoutDaySessionBlocks(items, 8 * 60);
    assert.ok(layouts[0].frame.height >= estimateBlockContentHeight(items[0], layouts[0].content));
    assert.ok(
      layouts[0].frame.top + layouts[0].frame.height + 4 <= layouts[1].frame.top,
    );
  });
});

describe("nowLineOffset", () => {
  it("returns null when the current time is outside the grid", () => {
    const now = new Date(2026, 2, 9, 7, 30);
    assert.equal(nowLineOffset(now, 8, 17), null);
  });

  it("positions the line relative to the grid start hour", () => {
    const now = new Date(2026, 2, 9, 10, 30);
    assert.equal(nowLineOffset(now, 8, 17, 60), 150);
  });
});

describe("shouldShowNowLineForDay", () => {
  it("hides the line when it falls inside a session block", () => {
    const layouts = [
      {
        item: {} as never,
        frame: { top: 900, height: 56 },
        content: {
          showLocation: false,
          showEndTime: false,
          titleLines: 1,
          locationLines: 0,
        },
      },
    ];

    assert.equal(shouldShowNowLineForDay(920, layouts), false);
    assert.equal(shouldShowNowLineForDay(850, layouts), true);
  });
});

describe("timetableGridHeight", () => {
  it("multiplies the hour span by row height", () => {
    assert.equal(timetableGridHeight(8, 17, 52), 9 * 52);
  });
});

describe("resolveTimetableScrollOffset", () => {
  it("scrolls to the first block when today is not in the week", () => {
    const week = [
      makeDay({
        weekday: 1,
        dateIso: "2026-03-09",
        items: [
          {
            id: "a",
            title: "Late",
            timeLabel: "11:00 AM",
            locationLabel: "Room",
            kind: "class",
            accent: "blue",
            status: "upcoming",
            startMinutes: 11 * 60,
            endMinutes: 12 * 60,
            dateIso: "2026-03-09",
            isToday: false,
          },
        ],
      }),
    ];

    assert.equal(
      resolveTimetableScrollOffset(week, 8, 17, new Date(2026, 2, 9, 9, 0), 52),
      76,
    );
  });
});

describe("resolveDayTimetableMinutes", () => {
  it("tightens the window to the day's sessions with a small buffer", () => {
    const day = makeDay({
      weekday: 6,
      dateIso: "2026-03-14",
      items: [
        {
          id: "gym",
          title: "Morning Gym",
          timeLabel: "7:00 AM",
          locationLabel: "Gym",
          kind: "gym",
          accent: "green",
          status: "completed",
          startMinutes: 7 * 60,
          endMinutes: 8 * 60,
          dateIso: "2026-03-14",
          isToday: true,
        },
        {
          id: "stats",
          title: "Statistics Lecture",
          timeLabel: "9:00 AM",
          locationLabel: "Room",
          kind: "class",
          accent: "blue",
          status: "completed",
          startMinutes: 9 * 60,
          endMinutes: 10 * 60 + 30,
          dateIso: "2026-03-14",
          isToday: true,
        },
      ],
    });

    assert.deepEqual(resolveDayTimetableMinutes(day), {
      startMinutes: 7 * 60 - 15,
      endMinutes: 10 * 60 + 30 + 15,
    });
  });
});

describe("blockFrameForDay", () => {
  it("starts the first block near the top of its day column", () => {
    const frame = blockFrameForDay(7 * 60, 8 * 60, 7 * 60 - 15);
    assert.equal(frame.top, 15 * 1.35);
    assert.equal(frame.height, 60 * 1.35);
  });
});

describe("dayColumnHeight", () => {
  it("matches the day window instead of the full week", () => {
    const day = makeDay({
      weekday: 6,
      dateIso: "2026-03-14",
      items: [
        {
          id: "gym",
          title: "Morning Gym",
          timeLabel: "7:00 AM",
          locationLabel: "Gym",
          kind: "gym",
          accent: "green",
          status: "completed",
          startMinutes: 7 * 60,
          endMinutes: 8 * 60,
          dateIso: "2026-03-14",
          isToday: true,
        },
      ],
    });

    assert.ok(dayColumnHeight(day) < 300);
  });
});

describe("formatSessionDuration", () => {
  it("formats hours and minutes compactly", () => {
    assert.equal(formatSessionDuration(90), "1h 30m");
    assert.equal(formatSessionDuration(60), "1h");
    assert.equal(formatSessionDuration(45), "45m");
  });
});

describe("resolveWeekScheduleFocus", () => {
  it("prefers the active session on today", () => {
    const week = [
      makeDay({
        weekday: 3,
        dateIso: "2026-03-11",
        isToday: true,
        items: [
          {
            id: "done",
            title: "Morning",
            timeLabel: "8:00 AM",
            locationLabel: "A",
            kind: "class",
            accent: "blue",
            status: "completed",
            startMinutes: 8 * 60,
            endMinutes: 9 * 60,
            dateIso: "2026-03-11",
            isToday: true,
          },
          {
            id: "live",
            title: "English",
            timeLabel: "9:00 AM",
            locationLabel: "Rm 143",
            kind: "class",
            accent: "blue",
            status: "active",
            startMinutes: 9 * 60,
            endMinutes: 11 * 60,
            dateIso: "2026-03-11",
            isToday: true,
          },
        ],
      }),
    ];

    assert.equal(resolveWeekScheduleFocus(week)?.item.id, "live");
  });

  it("returns null when every session on today is already complete", () => {
    const week = [
      makeDay({
        weekday: 6,
        dateIso: "2026-03-14",
        isToday: true,
        items: [
          {
            id: "gym",
            title: "Morning Gym",
            timeLabel: "7:00 AM",
            locationLabel: "Gym",
            kind: "gym",
            accent: "green",
            status: "completed",
            startMinutes: 7 * 60,
            endMinutes: 8 * 60,
            dateIso: "2026-03-14",
            isToday: true,
          },
        ],
      }),
    ];

    assert.equal(resolveWeekScheduleFocus(week), null);
  });

  it("skips completed sessions and focuses the next upcoming one", () => {
    const week = [
      makeDay({
        weekday: 3,
        dateIso: "2026-03-11",
        isToday: true,
        items: [
          {
            id: "done",
            title: "Morning",
            timeLabel: "8:00 AM",
            locationLabel: "A",
            kind: "class",
            accent: "blue",
            status: "completed",
            startMinutes: 8 * 60,
            endMinutes: 9 * 60,
            dateIso: "2026-03-11",
            isToday: true,
          },
          {
            id: "next",
            title: "English",
            timeLabel: "2:00 PM",
            locationLabel: "Rm 143",
            kind: "class",
            accent: "blue",
            status: "upcoming",
            startMinutes: 14 * 60,
            endMinutes: 16 * 60,
            dateIso: "2026-03-11",
            isToday: true,
          },
        ],
      }),
    ];

    assert.equal(resolveWeekScheduleFocus(week)?.item.id, "next");
  });
});

describe("sessionProgressRatio", () => {
  it("returns null for non-active sessions", () => {
    const item = {
      id: "a",
      title: "Class",
      timeLabel: "9:00 AM",
      locationLabel: "Room",
      kind: "class" as const,
      accent: "blue" as const,
      status: "upcoming" as const,
      startMinutes: 9 * 60,
      endMinutes: 10 * 60,
      dateIso: "2026-03-11",
      isToday: true,
    };

    assert.equal(sessionProgressRatio(item), null);
  });
});
