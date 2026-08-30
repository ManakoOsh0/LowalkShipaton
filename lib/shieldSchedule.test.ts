import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getNodeShieldInterval,
  getSessionNominalStartMs,
  type ShieldScheduleSettings,
} from "./shieldSchedule";
import type { FocusNode } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

const SETTINGS: ShieldScheduleSettings = {
  classPreBufferMinutes: 30,
  sessionGapMergeMinutes: 30,
};

const REFERENCE_DATE = new Date("2026-07-27T08:00:00");

function makeNode(
  overrides: Partial<FocusNode> & Pick<FocusNode, "schedule">,
): FocusNode {
  return {
    id: "node-1",
    title: "Test Session",
    icon: "dumbbell",
    kind: "gym",
    locationLabel: "Gym",
    anchorId: "anchor-1",
    completedDates: [],
    skippedDates: [],
    ...overrides,
  };
}

function makeDurationSession(
  overrides: Partial<ActiveSessionSnapshot> = {},
): ActiveSessionSnapshot {
  const shieldStartsAt = new Date("2026-07-27T08:30:00").toISOString();
  const endsAt = new Date("2026-07-27T23:59:59").toISOString();
  return {
    nodeId: "gym-1",
    zoneLabel: "Campus Gym",
    headline: "Go to Campus Gym",
    nodeTitle: "Morning Workout",
    scheduleType: "duration",
    shieldStartsAt,
    endsAt,
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: 60 * 60_000,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    presenceVerified: false,
    ...overrides,
  };
}

describe("getNodeShieldInterval", () => {
  it("applies pre-buffer to class sessions", () => {
    const node = makeNode({
      id: "class-1",
      kind: "class",
      schedule: {
        type: "class",
        weekday: 1,
        startTime: "09:00",
        endTime: "10:30",
      },
    });

    const interval = getNodeShieldInterval(node, SETTINGS, REFERENCE_DATE);
    assert.ok(interval);
    assert.equal(interval.scheduleType, "class");
    assert.equal(interval.startsAtMs, new Date("2026-07-27T08:30:00").getTime());
    assert.equal(interval.nominalEndsAtMs, new Date("2026-07-27T10:30:00").getTime());
  });

  it("applies pre-buffer to duration sessions (gym/library/custom)", () => {
    const node = makeNode({
      id: "gym-1",
      kind: "gym",
      schedule: {
        type: "duration",
        weekday: 1,
        startTime: "09:00",
        durationHours: 1,
      },
    });

    const interval = getNodeShieldInterval(node, SETTINGS, REFERENCE_DATE);
    assert.ok(interval);
    assert.equal(interval.scheduleType, "duration");
    assert.equal(interval.startsAtMs, new Date("2026-07-27T08:30:00").getTime());
    assert.equal(interval.nominalEndsAtMs, new Date("2026-07-27T10:00:00").getTime());
  });
});

describe("getSessionNominalStartMs", () => {
  it("returns scheduled startTime for class sessions", () => {
    const session = makeDurationSession({
      scheduleType: "class",
      shieldStartsAt: new Date("2026-07-27T08:30:00").toISOString(),
      endsAt: new Date("2026-07-27T10:30:00").toISOString(),
      requiredOnSiteMs: null,
    });

    assert.equal(
      getSessionNominalStartMs(session, SETTINGS),
      new Date("2026-07-27T09:00:00").getTime(),
    );
  });

  it("returns scheduled startTime for duration sessions", () => {
    const session = makeDurationSession();

    assert.equal(
      getSessionNominalStartMs(session, SETTINGS),
      new Date("2026-07-27T09:00:00").getTime(),
    );
  });
});
