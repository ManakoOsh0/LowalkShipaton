import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findOverlappingNode, schedulesOverlap } from "./time";
import type { FocusNode, FocusNodeSchedule } from "@/types/focusNode";

const tuesday = 2 as const;

const class930to1030: FocusNodeSchedule = {
  type: "class",
  weekday: tuesday,
  startTime: "09:30",
  endTime: "10:30",
};

const class1000to1100: FocusNodeSchedule = {
  type: "class",
  weekday: tuesday,
  startTime: "10:00",
  endTime: "11:00",
};

const gym1730: FocusNodeSchedule = {
  type: "duration",
  weekday: tuesday,
  startTime: "17:30",
  durationHours: 1.5,
};

const library1800: FocusNodeSchedule = {
  type: "duration",
  weekday: tuesday,
  startTime: "18:00",
  durationHours: 1,
};

describe("schedulesOverlap", () => {
  it("blocks overlapping class ↔ class on the same weekday", () => {
    assert.equal(schedulesOverlap(class930to1030, class1000to1100), true);
  });

  it("allows class overlapping a duration session's nominal window", () => {
    assert.equal(schedulesOverlap(library1800, gym1730), false);
    assert.equal(schedulesOverlap(gym1730, library1800), false);
  });

  it("allows overlapping duration sessions on the same weekday", () => {
    const eveningGym: FocusNodeSchedule = {
      type: "duration",
      weekday: tuesday,
      startTime: "17:30",
      durationHours: 2,
    };
    assert.equal(schedulesOverlap(gym1730, eveningGym), false);
  });

  it("ignores different weekdays", () => {
    assert.equal(
      schedulesOverlap(class930to1030, { ...class1000to1100, weekday: 3 }),
      false,
    );
  });
});

describe("findOverlappingNode", () => {
  const existing: FocusNode[] = [
    {
      id: "gym-1",
      title: "Evening Gym",
      icon: "gym",
      kind: "gym",
      schedule: gym1730,
      locationLabel: null,
      anchorId: "anchor-gym",
      completedDates: [],
      skippedDates: [],
    },
  ];

  it("returns null when the candidate only overlaps a duration session", () => {
    assert.equal(findOverlappingNode(library1800, existing), null);
  });

  it("returns the conflicting class when two fixed slots intersect", () => {
    const nodes: FocusNode[] = [
      {
        id: "class-1",
        title: "Statistics",
        icon: "class",
        kind: "class",
        schedule: class930to1030,
        locationLabel: "WTW 310",
        anchorId: "anchor-wtw",
        completedDates: [],
        skippedDates: [],
      },
    ];

    assert.equal(findOverlappingNode(class1000to1100, nodes)?.id, "class-1");
  });
});
