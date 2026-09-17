import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatAwaitingCheckInDetailLine,
  formatDurationAwayNotificationBody,
  formatSessionDetailLabel,
  getAwayGraceRemainingMs,
  getCarriedPenaltyFields,
  getDurationOnSiteRemainingMs,
  getFocusNodeRemovalLockReason,
  getLeaveSessionWarningBody,
  isFocusNodeRemovalLocked,
  isPenaltyShieldActive,
  isPenaltyTakeoverForLiveSession,
  isStaleUnverifiedClassSession,
  CLASS_AWAY_LEAVE_SHEET_BODY,
  DURATION_AWAY_LEAVE_SHEET_BODY,
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

describe("carried penalty vs live-session takeover", () => {
  const now = new Date("2026-07-27T10:12:00").getTime();

  it("carries remaining lock fields onto a later session", () => {
    const previous = makeSession({
      nodeId: "class-a",
      penaltyShieldEndsAt: new Date("2026-07-27T10:20:00").toISOString(),
      penaltyMinutes: 30,
    });
    const carried = getCarriedPenaltyFields(previous, now);
    assert.deepEqual(carried, {
      penaltyShieldEndsAt: previous.penaltyShieldEndsAt,
      penaltyMinutes: 30,
      penaltyOriginNodeId: "class-a",
    });
  });

  it("does not carry an expired lock", () => {
    const previous = makeSession({
      penaltyShieldEndsAt: new Date("2026-07-27T10:00:00").toISOString(),
      penaltyMinutes: 30,
    });
    assert.equal(getCarriedPenaltyFields(previous, now), null);
  });

  it("treats the originating session as a penalty takeover", () => {
    const session = makeSession({
      nodeId: "class-a",
      penaltyShieldEndsAt: new Date("2026-07-27T10:20:00").toISOString(),
      penaltyMinutes: 30,
      penaltyOriginNodeId: "class-a",
    });
    assert.equal(isPenaltyTakeoverForLiveSession(session, now), true);
  });

  it("does not take over Hero when the lock was carried onto a later node", () => {
    const session = makeSession({
      nodeId: "class-b",
      penaltyShieldEndsAt: new Date("2026-07-27T10:20:00").toISOString(),
      penaltyMinutes: 30,
      penaltyOriginNodeId: "class-a",
    });
    assert.equal(isPenaltyTakeoverForLiveSession(session, now), false);
    assert.equal(isPenaltyShieldActive(session, now), true);
  });
});

describe("isStaleUnverifiedClassSession", () => {
  it("is true for an ended miss snapshot with no active penalty", () => {
    const now = new Date("2026-07-27T20:00:00").getTime();
    const session = makeSession({
      presenceVerified: false,
      endsAt: new Date("2026-07-27T16:20:00").toISOString(),
      penaltyShieldEndsAt: new Date("2026-07-27T17:00:00").toISOString(),
      penaltyMinutes: 30,
    });
    assert.equal(isStaleUnverifiedClassSession(session, now), true);
  });

  it("is false while the miss penalty is still active", () => {
    const now = new Date("2026-07-27T16:40:00").getTime();
    const session = makeSession({
      presenceVerified: false,
      endsAt: new Date("2026-07-27T16:20:00").toISOString(),
      penaltyShieldEndsAt: new Date("2026-07-27T17:00:00").toISOString(),
      penaltyMinutes: 30,
    });
    assert.equal(isStaleUnverifiedClassSession(session, now), false);
  });

  it("is false for a verified class still in session", () => {
    const now = new Date("2026-07-27T10:00:00").getTime();
    assert.equal(isStaleUnverifiedClassSession(makeSession(), now), false);
  });
});

describe("formatAwaitingCheckInDetailLine", () => {
  it("omits the pre-start countdown used by formatSessionDetailLabel", () => {
    const session = makeSession({
      presenceVerified: false,
      shieldStartsAt: new Date("2026-07-27T08:30:00").toISOString(),
      endsAt: new Date("2026-07-27T10:30:00").toISOString(),
    });
    const beforeStart = new Date("2026-07-27T08:45:00");

    assert.equal(
      formatAwaitingCheckInDetailLine(session, beforeStart),
      undefined,
    );
    assert.match(
      formatSessionDetailLabel(session, beforeStart),
      /starts in \d{2}:\d{2}/,
    );
  });

  it("keeps post-start check-in detail after nominal start", () => {
    const session = makeSession({
      presenceVerified: false,
      shieldStartsAt: new Date("2026-07-27T08:30:00").toISOString(),
      endsAt: new Date("2026-07-27T10:30:00").toISOString(),
    });
    const afterStart = new Date("2026-07-27T09:15:00");

    assert.match(
      formatAwaitingCheckInDetailLine(session, afterStart) ?? "",
      /Head to venue/,
    );
  });
});

describe("duration away (no presence penalty)", () => {
  const gym = makeSession({
    nodeId: "gym-1",
    zoneLabel: "Campus Gym",
    headline: "Go to Campus Gym",
    nodeTitle: "Morning Workout",
    scheduleType: "duration",
    shieldStartsAt: new Date("2026-07-27T08:30:00").toISOString(),
    endsAt: new Date("2026-07-27T10:00:00").toISOString(),
    onSiteAccumulatedMs: 5 * 60_000,
    requiredOnSiteMs: 2 * 60 * 60_000,
    awaySince: new Date("2026-07-27T09:05:00").toISOString(),
    presenceVerified: true,
  });

  it("has no class grace countdown", () => {
    const now = new Date("2026-07-27T09:06:00").getTime();
    assert.equal(getAwayGraceRemainingMs(gym, now), null);
  });

  it("keeps remaining on-site quota after leaving", () => {
    assert.equal(getDurationOnSiteRemainingMs(gym), 115 * 60_000);
  });

  it("tells the user to finish or stay locked until midnight", () => {
    const now = new Date("2026-07-27T09:06:00");
    assert.match(
      formatSessionDetailLabel(gym, now),
      /return to finish, or locked until midnight/,
    );
    assert.doesNotMatch(formatSessionDetailLabel(gym, now), /Return within/);
  });

  it("still shows a carried class lock on a gym snapshot", () => {
    const now = new Date("2026-07-27T09:06:00");
    const carried = {
      ...gym,
      penaltyShieldEndsAt: new Date("2026-07-27T09:35:00").toISOString(),
      penaltyMinutes: 30,
      penaltyOriginNodeId: "class-a",
    };
    assert.match(formatSessionDetailLabel(carried, now), /\+30m lock/);
  });

  it("uses midnight-lock copy on the leave sheet and notification", () => {
    assert.equal(getLeaveSessionWarningBody("duration"), DURATION_AWAY_LEAVE_SHEET_BODY);
    assert.equal(getLeaveSessionWarningBody("class"), CLASS_AWAY_LEAVE_SHEET_BODY);
    assert.match(
      formatDurationAwayNotificationBody("Campus Gym"),
      /midnight/,
    );
  });
});
