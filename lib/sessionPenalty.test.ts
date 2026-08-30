import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getFocusNodeRemovalLockReason,
  isFocusNodeRemovalLocked,
  isPenaltyShieldActive,
} from "./sessionPenalty";
import type { ActiveSessionSnapshot } from "@/types/session";

function makeSession(
  overrides: Partial<ActiveSessionSnapshot> = {},
): ActiveSessionSnapshot {
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
    presenceVerified: true,
    ...overrides,
  };
}

describe("isPenaltyShieldActive", () => {
  it("is false with no session or no penalty window", () => {
    assert.equal(isPenaltyShieldActive(null), false);
    assert.equal(isPenaltyShieldActive(makeSession()), false);
  });

  it("is true while the extra lock time is still in the future", () => {
    const now = new Date("2026-07-27T10:40:00").getTime();
    const session = makeSession({
      penaltyShieldEndsAt: new Date("2026-07-27T11:00:00").toISOString(),
      penaltyMinutes: 30,
    });
    assert.equal(isPenaltyShieldActive(session, now), true);
  });

  it("is false after the extra lock time has expired", () => {
    const now = new Date("2026-07-27T11:00:00").getTime();
    const session = makeSession({
      penaltyShieldEndsAt: new Date("2026-07-27T11:00:00").toISOString(),
      penaltyMinutes: 30,
    });
    assert.equal(isPenaltyShieldActive(session, now), false);
  });
});

describe("isFocusNodeRemovalLocked", () => {
  const now = new Date("2026-07-27T10:40:00").getTime();
  const penalized = makeSession({
    nodeId: "class-1",
    penaltyShieldEndsAt: new Date("2026-07-27T11:00:00").toISOString(),
    penaltyMinutes: 30,
  });

  it("locks the live penalized node so deleting it cannot drop the shield", () => {
    assert.equal(isFocusNodeRemovalLocked("class-1", penalized, now), true);
    assert.equal(getFocusNodeRemovalLockReason("class-1", penalized, now), "penalty");
  });

  it("leaves other Focus Nodes deletable during the same penalty", () => {
    assert.equal(isFocusNodeRemovalLocked("gym-1", penalized, now), false);
  });

  it("locks the live session even without a penalty", () => {
    assert.equal(isFocusNodeRemovalLocked("class-1", makeSession(), now), true);
    assert.equal(getFocusNodeRemovalLockReason("class-1", makeSession(), now), "active");
  });

  it("does not lock delete when there is no live session on that node", () => {
    assert.equal(isFocusNodeRemovalLocked("class-1", null, now), false);
    assert.equal(isFocusNodeRemovalLocked("gym-1", makeSession(), now), false);
  });
});
