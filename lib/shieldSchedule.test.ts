import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getNodeShieldInterval,
  getSessionNominalStartMs,
  selectPrimaryObligationNode,
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

function makeClassNode(
  id: string,
  title: string,
  startTime: string,
  endTime: string,
): FocusNode {
  return makeNode({
    id,
    title,
    icon: "class",
    kind: "class",
    locationLabel: title,
    anchorId: `anchor-${id}`,
    schedule: {
      type: "class",
      weekday: 1,
      startTime,
      endTime,
    },
  });
}

function makeClassSession(
  nodeId: string,
  startTimeIso: string,
  endTimeIso: string,
  overrides: Partial<ActiveSessionSnapshot> = {},
): ActiveSessionSnapshot {
  return {
    nodeId,
    zoneLabel: "Room",
    headline: "Head to Room for class",
    nodeTitle: "Class",
    scheduleType: "class",
    shieldStartsAt: startTimeIso,
    endsAt: endTimeIso,
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: null,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    presenceVerified: true,
    ...overrides,
  };
}

describe("selectPrimaryObligationNode", () => {
  const classA = makeClassNode("class-a", "Calculus", "09:00", "10:00");
  const classB = makeClassNode("class-b", "Physics", "10:10", "11:00");
  const gym = makeNode({
    id: "gym-1",
    title: "Morning Workout",
    kind: "gym",
    schedule: {
      type: "duration",
      weekday: 1,
      startTime: "09:00",
      durationHours: 1,
    },
  });

  it("keeps a class live through its own end even with a penalty running", () => {
    const now = new Date("2026-07-27T09:50:00");
    const session = makeClassSession(
      "class-a",
      "2026-07-27T08:30:00",
      "2026-07-27T10:00:00",
      {
        penaltyShieldEndsAt: new Date("2026-07-27T10:20:00").toISOString(),
        penaltyMinutes: 30,
      },
    );

    const obligation = selectPrimaryObligationNode(
      [classA, classB],
      session,
      SETTINGS,
      now.getTime(),
      now,
    );
    assert.equal(obligation?.id, "class-a");
  });

  it("yields a finished class to the next session even if penalty time remains", () => {
    const now = new Date("2026-07-27T10:12:00");
    const session = makeClassSession(
      "class-a",
      "2026-07-27T08:30:00",
      "2026-07-27T10:00:00",
      {
        penaltyShieldEndsAt: new Date("2026-07-27T10:20:00").toISOString(),
        penaltyMinutes: 30,
        penaltyOriginNodeId: "class-a",
      },
    );

    const obligation = selectPrimaryObligationNode(
      [classA, classB],
      session,
      SETTINGS,
      now.getTime(),
      now,
    );
    assert.equal(obligation?.id, "class-b");
  });

  it("keeps an incomplete gym through its own window while the next class is only in pre-buffer", () => {
    const now = new Date("2026-07-27T09:40:00");
    const session = makeDurationSession({
      nodeId: "gym-1",
      onSiteAccumulatedMs: 10 * 60_000,
      presenceVerified: true,
    });

    const obligation = selectPrimaryObligationNode(
      [gym, classB],
      session,
      SETTINGS,
      now.getTime(),
      now,
    );
    assert.equal(obligation?.id, "gym-1");
  });

  it("yields an incomplete gym after its nominal end once the next class has started", () => {
    const now = new Date("2026-07-27T10:12:00");
    const session = makeDurationSession({
      nodeId: "gym-1",
      onSiteAccumulatedMs: 10 * 60_000,
      presenceVerified: true,
      penaltyShieldEndsAt: new Date("2026-07-27T10:30:00").toISOString(),
      penaltyMinutes: 30,
    });

    const obligation = selectPrimaryObligationNode(
      [gym, classB],
      session,
      SETTINGS,
      now.getTime(),
      now,
    );
    assert.equal(obligation?.id, "class-b");
  });

  it("picks the later class even when an earlier incomplete gym has no live snapshot", () => {
    const now = new Date("2026-07-27T10:12:00");
    const obligation = selectPrimaryObligationNode(
      [gym, classB],
      null,
      SETTINGS,
      now.getTime(),
      now,
    );
    assert.equal(obligation?.id, "class-b");
  });

  it("keeps an incomplete gym for the rest of the day when nothing else is owed", () => {
    const now = new Date("2026-07-27T14:00:00");
    const session = makeDurationSession({
      nodeId: "gym-1",
      onSiteAccumulatedMs: 10 * 60_000,
      presenceVerified: true,
    });

    const obligation = selectPrimaryObligationNode(
      [gym],
      session,
      SETTINGS,
      now.getTime(),
      now,
    );
    assert.equal(obligation?.id, "gym-1");
  });
});
