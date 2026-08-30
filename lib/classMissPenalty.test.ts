import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findClassMissPenaltyCandidate,
  resolveClassMissPenaltyDecision,
} from "./classMissPenalty";
import type { ShieldScheduleSettings } from "./shieldSchedule";
import type { FocusNode } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

const SETTINGS: ShieldScheduleSettings = {
  classPreBufferMinutes: 30,
  sessionGapMergeMinutes: 30,
};

function makeClassNode(overrides: Partial<FocusNode> = {}): FocusNode {
  return {
    id: "class-1",
    title: "Calculus",
    icon: "class",
    kind: "class",
    schedule: {
      type: "class",
      weekday: 1,
      startTime: "09:00",
      endTime: "10:30",
    },
    locationLabel: "Room 204",
    anchorId: "anchor-1",
    completedDates: [],
    skippedDates: [],
    missPenaltyDates: [],
    ...overrides,
  };
}

function makeClassSession(overrides: Partial<ActiveSessionSnapshot> = {}): ActiveSessionSnapshot {
  return {
    nodeId: "class-1",
    zoneLabel: "Room 204",
    headline: "Head to Room 204 for class",
    nodeTitle: "Calculus",
    scheduleType: "class",
    shieldStartsAt: new Date("2026-07-27T08:30:00").toISOString(),
    endsAt: new Date("2026-07-27T10:30:00").toISOString(),
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: null,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    presenceVerified: false,
    ...overrides,
  };
}

describe("resolveClassMissPenaltyDecision", () => {
  it("applies a penalty for an incomplete no-show class", () => {
    const decision = resolveClassMissPenaltyDecision(
      makeClassSession(),
      makeClassNode(),
      "2026-07-27",
      new Date("2026-07-27T10:35:00").getTime(),
      false,
      SETTINGS,
    );

    assert.equal(decision.action, "apply_penalty");
  });

  it("clears after an away penalty has already expired", () => {
    const decision = resolveClassMissPenaltyDecision(
      makeClassSession({
        penaltyShieldEndsAt: new Date("2026-07-27T10:20:00").toISOString(),
        penaltyMinutes: 30,
      }),
      makeClassNode(),
      "2026-07-27",
      new Date("2026-07-27T10:35:00").getTime(),
      false,
      SETTINGS,
    );

    assert.equal(decision.action, "clear");
  });

  it("keeps the session alive while a penalty is active", () => {
    const decision = resolveClassMissPenaltyDecision(
      makeClassSession({
        penaltyShieldEndsAt: new Date("2026-07-27T11:00:00").toISOString(),
        penaltyMinutes: 30,
      }),
      makeClassNode(),
      "2026-07-27",
      new Date("2026-07-27T10:35:00").getTime(),
      false,
      SETTINGS,
    );

    assert.equal(decision.action, "keep_penalty");
  });

  it("does not penalize skipped classes", () => {
    const decision = resolveClassMissPenaltyDecision(
      makeClassSession(),
      makeClassNode({ skippedDates: ["2026-07-27"] }),
      "2026-07-27",
      new Date("2026-07-27T10:35:00").getTime(),
      false,
      SETTINGS,
    );

    assert.equal(decision.action, "clear");
  });
});

describe("findClassMissPenaltyCandidate", () => {
  it("finds a class that ended earlier today without completion", () => {
    const node = makeClassNode({
      schedule: {
        type: "class",
        weekday: 1,
        startTime: "09:00",
        endTime: "10:30",
      },
    });

    const candidate = findClassMissPenaltyCandidate(
      [node],
      null,
      SETTINGS,
      new Date("2026-07-27T11:00:00").getTime(),
      new Date("2026-07-27T11:00:00"),
    );

    assert.equal(candidate?.id, "class-1");
  });

  it("ignores classes that already received a miss penalty", () => {
    const node = makeClassNode({
      missPenaltyDates: ["2026-07-27"],
    });

    const candidate = findClassMissPenaltyCandidate(
      [node],
      null,
      SETTINGS,
      new Date("2026-07-27T11:00:00").getTime(),
      new Date("2026-07-27T11:00:00"),
    );

    assert.equal(candidate, null);
  });
});
