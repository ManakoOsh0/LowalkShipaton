import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computePeriodRecap, computeTodayRecap } from "./consistencyRecap";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";

const WEDNESDAY = new Date(2026, 7, 19, 18, 0, 0); // weekday 3

const anchors: Anchor[] = [
  {
    id: "anchor-library",
    name: "Engineering Library",
    placeId: "place-library",
    formattedAddress: null,
    sourceLatitude: 0,
    sourceLongitude: 0,
    latitude: 0,
    longitude: 0,
    radiusMeters: 45,
    calibrated: true,
  },
  {
    id: "anchor-class",
    name: "EMS Building",
    placeId: "place-ems",
    formattedAddress: null,
    sourceLatitude: 0,
    sourceLongitude: 0,
    latitude: 0,
    longitude: 0,
    radiusMeters: 30,
    calibrated: true,
  },
  {
    id: "anchor-gym",
    name: "Campus Gym",
    placeId: "place-gym",
    formattedAddress: null,
    sourceLatitude: 0,
    sourceLongitude: 0,
    latitude: 0,
    longitude: 0,
    radiusMeters: 60,
    calibrated: true,
  },
];

function node(overrides: Partial<FocusNode> & Pick<FocusNode, "id" | "kind">): FocusNode {
  return {
    title: overrides.kind,
    icon: overrides.kind,
    schedule: {
      type: "duration",
      weekday: 3,
      startTime: "08:00",
      durationHours: 1,
    },
    locationLabel: null,
    anchorId: null,
    completedDates: [],
    skippedDates: [],
    ...overrides,
  };
}

describe("consistency recap", () => {
  it("builds today's receipt from completed sessions and planned windows", () => {
    const nodes: FocusNode[] = [
      node({
        id: "gym",
        kind: "gym",
        title: "Morning Gym",
        anchorId: "anchor-gym",
        schedule: { type: "duration", weekday: 3, startTime: "07:00", durationHours: 1 },
        completedDates: ["2026-08-19"],
      }),
      node({
        id: "class",
        kind: "class",
        title: "Lecture",
        anchorId: "anchor-class",
        schedule: { type: "class", weekday: 3, startTime: "09:00", endTime: "10:30" },
        completedDates: ["2026-08-19"],
      }),
      node({
        id: "library",
        kind: "library",
        title: "Library",
        anchorId: "anchor-library",
        schedule: { type: "duration", weekday: 3, startTime: "14:00", durationHours: 1 },
        completedDates: [],
      }),
    ];

    const recap = computeTodayRecap(nodes, anchors, WEDNESDAY);

    assert.equal(recap.title, "Today");
    assert.equal(recap.sessionsCompleted, 2);
    assert.equal(recap.sessionsPlanned, 3);
    assert.equal(recap.focusMinutes, 150);
    assert.equal(recap.plannedMinutes, 210);
    assert.equal(recap.sessionCompletionPercent, 67);
    assert.deepEqual(recap.placesVisited, ["Gym", "Class"]);
    assert.equal(recap.locationCount, 2);
    assert.equal(recap.showedUpDays, 0);
    assert.equal(recap.plannedDays, 1);
  });

  it("counts a planned day as showed up only when every session is complete", () => {
    const nodes: FocusNode[] = [
      node({
        id: "gym",
        kind: "gym",
        anchorId: "anchor-gym",
        completedDates: ["2026-08-19"],
      }),
      node({
        id: "class",
        kind: "class",
        anchorId: "anchor-class",
        schedule: { type: "class", weekday: 3, startTime: "09:00", endTime: "10:00" },
        completedDates: ["2026-08-19"],
      }),
    ];

    const recap = computeTodayRecap(nodes, anchors, WEDNESDAY);
    assert.equal(recap.sessionsCompleted, 2);
    assert.equal(recap.sessionsPlanned, 2);
    assert.equal(recap.showedUpDays, 1);
    assert.equal(recap.sessionCompletionPercent, 100);
  });

  it("treats two nodes at the same venue as one location across the week", () => {
    const nodes: FocusNode[] = [
      node({
        id: "monday-class",
        kind: "class",
        title: "Stats",
        anchorId: "anchor-class",
        schedule: { type: "class", weekday: 1, startTime: "09:00", endTime: "10:00" },
        completedDates: ["2026-08-17"],
      }),
      node({
        id: "econ",
        kind: "class",
        title: "Econ",
        anchorId: "anchor-class",
        schedule: { type: "class", weekday: 3, startTime: "11:00", endTime: "12:00" },
        completedDates: ["2026-08-19"],
      }),
      node({
        id: "wednesday-stats",
        kind: "class",
        title: "Stats lab",
        anchorId: "anchor-class",
        schedule: { type: "class", weekday: 3, startTime: "09:00", endTime: "10:00" },
        completedDates: ["2026-08-19"],
      }),
      node({
        id: "monday-gym",
        kind: "gym",
        anchorId: "anchor-gym",
        schedule: { type: "duration", weekday: 1, startTime: "07:00", durationHours: 1 },
        completedDates: ["2026-08-17"],
      }),
    ];

    const recap = computePeriodRecap(nodes, anchors, "week", WEDNESDAY);
    assert.equal(recap.title, "This week");
    assert.equal(recap.sessionsCompleted, 4);
    assert.equal(recap.locationCount, 2);
    assert.equal(recap.plannedDays, 2);
    assert.equal(recap.showedUpDays, 2);
  });
});
