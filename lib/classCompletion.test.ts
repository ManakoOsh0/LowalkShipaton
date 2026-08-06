import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLASS_EARLY_COMPLETE_FAST_AWAY_MS,
  CLASS_EARLY_COMPLETE_FAST_RATIO,
  getClassNominalStartMs,
  getClassScheduledDurationMs,
  getClassSessionCountdown,
  meetsClassAttendanceThreshold,
  resolveClassCompletionOutcome,
  shouldCompleteClassOnDeparture,
} from "./classCompletion";
import type { ShieldScheduleSettings } from "./shieldSchedule";
import type { ActiveSessionSnapshot } from "@/types/session";

const SETTINGS: ShieldScheduleSettings = {
  classPreBufferMinutes: 30,
  sessionGapMergeMinutes: 30,
};

function makeClassSession(overrides: Partial<ActiveSessionSnapshot> = {}): ActiveSessionSnapshot {
  const shieldStartsAt = new Date("2026-07-27T08:30:00").toISOString();
  const endsAt = new Date("2026-07-27T10:30:00").toISOString();
  return {
    nodeId: "class-1",
    zoneLabel: "Room 204",
    headline: "Head to Room 204 for class",
    nodeTitle: "Calculus",
    scheduleType: "class",
    shieldStartsAt,
    endsAt,
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

describe("getClassSessionCountdown", () => {
  it("uses pre-class phase before nominal start", () => {
    const session = makeClassSession();
    const nowMs = new Date("2026-07-27T08:45:00").getTime();
    const countdown = getClassSessionCountdown(session, SETTINGS, nowMs);

    assert.equal(countdown.phase, "pre_class");
    assert.equal(countdown.countdownMs, 15 * 60_000);
    assert.equal(countdown.progressRatio, 0);
  });

  it("uses nominal class duration during session", () => {
    const session = makeClassSession();
    const nowMs = new Date("2026-07-27T09:45:00").getTime();
    const countdown = getClassSessionCountdown(session, SETTINGS, nowMs);

    assert.equal(countdown.phase, "in_session");
    assert.equal(countdown.countdownMs, 45 * 60_000);
    assert.equal(countdown.progressRatio, 0.5);
  });
});

describe("getClassNominalStartMs", () => {
  it("excludes pre-buffer from nominal start", () => {
    const session = makeClassSession();
    const nominalStart = getClassNominalStartMs(session, SETTINGS);
    assert.equal(nominalStart, new Date("2026-07-27T09:00:00").getTime());
    assert.equal(getClassScheduledDurationMs(session, SETTINGS), 90 * 60_000);
  });
});

describe("resolveClassCompletionOutcome", () => {
  it("completes at expiry with 90% on-site while away", () => {
    const session = makeClassSession({
      onSiteAccumulatedMs: 90 * 60_000 * 0.9,
      awaySince: new Date("2026-07-27T10:25:00").toISOString(),
    });
    const nowMs = new Date("2026-07-27T10:31:00").getTime();

    assert.equal(
      resolveClassCompletionOutcome(session, SETTINGS, nowMs, false),
      "complete",
    );
  });

  it("leaves incomplete at expiry with 30% on-site while away", () => {
    const session = makeClassSession({
      onSiteAccumulatedMs: 90 * 60_000 * 0.3,
      awaySince: new Date("2026-07-27T10:00:00").toISOString(),
    });
    const nowMs = new Date("2026-07-27T10:31:00").getTime();

    assert.equal(
      resolveClassCompletionOutcome(session, SETTINGS, nowMs, false),
      "incomplete",
    );
  });

  it("completes when inside geofence at bell", () => {
    const session = makeClassSession({
      onSiteAccumulatedMs: 20 * 60_000,
    });
    const nowMs = new Date("2026-07-27T10:30:00").getTime();

    assert.equal(
      resolveClassCompletionOutcome(session, SETTINGS, nowMs, true),
      "complete",
    );
  });
});

describe("meetsClassAttendanceThreshold", () => {
  it("respects fast and standard tiers", () => {
    const scheduledMs = 90 * 60_000;
    assert.equal(meetsClassAttendanceThreshold(72 * 60_000, scheduledMs, "fast"), true);
    assert.equal(meetsClassAttendanceThreshold(45 * 60_000, scheduledMs, "standard"), true);
    assert.equal(meetsClassAttendanceThreshold(40 * 60_000, scheduledMs, "standard"), false);
  });
});

describe("shouldCompleteClassOnDeparture", () => {
  it("completes immediately when fast tier met and less than 2m remain", () => {
    const session = makeClassSession({
      onSiteAccumulatedMs: 90 * 60_000 * CLASS_EARLY_COMPLETE_FAST_RATIO,
      awaySince: new Date("2026-07-27T10:29:00").toISOString(),
    });
    const nowMs = new Date("2026-07-27T10:29:10").getTime();

    assert.equal(shouldCompleteClassOnDeparture(session, SETTINGS, nowMs), true);
  });

  it("waits for away timer when enough class time remains", () => {
    const session = makeClassSession({
      onSiteAccumulatedMs: 90 * 60_000 * CLASS_EARLY_COMPLETE_FAST_RATIO,
      awaySince: new Date("2026-07-27T10:00:00").toISOString(),
    });
    const nowMs = new Date("2026-07-27T10:01:00").getTime();

    assert.equal(shouldCompleteClassOnDeparture(session, SETTINGS, nowMs), false);
    assert.equal(
      shouldCompleteClassOnDeparture(
        session,
        SETTINGS,
        nowMs + CLASS_EARLY_COMPLETE_FAST_AWAY_MS,
      ),
      true,
    );
  });
});
