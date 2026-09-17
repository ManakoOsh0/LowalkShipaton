import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  shouldShowArrivalCelebration,
  type ArrivalCelebrationGate,
} from "@/lib/arrivalCelebration";
import type { ActiveSessionSnapshot } from "@/types/session";

function makeSession(
  nodeId: string,
  presenceVerified = false,
): ActiveSessionSnapshot {
  return {
    nodeId,
    nodeTitle: nodeId,
    zoneLabel: "Room 101",
    headline: "Focus",
    shieldStartsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    scheduleType: "class",
    presenceVerified,
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: null,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    penaltyOriginNodeId: null,
  };
}

function gate(overrides: Partial<ArrivalCelebrationGate>): ArrivalCelebrationGate {
  return {
    activeSession: makeSession("class-a"),
    obligationNodeId: "class-a",
    anchoringRequest: false,
    insideGeofence: true,
    lastCelebratedSessionNodeId: null,
    ...overrides,
  };
}

describe("shouldShowArrivalCelebration", () => {
  it("shows for the first check-in inside the geofence", () => {
    assert.equal(shouldShowArrivalCelebration(gate({})), true);
  });

  it("does not repeat for the same unverified session while still inside", () => {
    assert.equal(
      shouldShowArrivalCelebration(
        gate({ lastCelebratedSessionNodeId: "class-a" }),
      ),
      false,
    );
  });

  it("shows again after leaving and re-entering the same session", () => {
    assert.equal(
      shouldShowArrivalCelebration(
        gate({ lastCelebratedSessionNodeId: null }),
      ),
      true,
    );
  });

  it("shows for a back-to-back session without leaving the geofence", () => {
    assert.equal(
      shouldShowArrivalCelebration(
        gate({
          activeSession: makeSession("class-b"),
          obligationNodeId: "class-b",
          lastCelebratedSessionNodeId: "class-a",
        }),
      ),
      true,
    );
  });

  it("waits until the live session matches the current obligation", () => {
    assert.equal(
      shouldShowArrivalCelebration(
        gate({
          activeSession: makeSession("class-a"),
          obligationNodeId: "class-b",
        }),
      ),
      false,
    );
  });

  it("skips verified sessions and anchoring flows", () => {
    assert.equal(
      shouldShowArrivalCelebration(
        gate({ activeSession: makeSession("class-a", true) }),
      ),
      false,
    );
    assert.equal(
      shouldShowArrivalCelebration(gate({ anchoringRequest: true })),
      false,
    );
    assert.equal(
      shouldShowArrivalCelebration(gate({ insideGeofence: false })),
      false,
    );
  });
});
