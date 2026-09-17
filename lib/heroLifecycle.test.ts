import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPreBufferHeroMessage } from "@/lib/preBufferCopy";
import { selectHeroCardData } from "@/store/selectors";
import type { Anchor } from "@/types/anchor";
import type { FocusNode } from "@/types/focusNode";
import type { ActiveSessionSnapshot } from "@/types/session";

const SETTINGS = {
  classPreBufferMinutes: 30,
  sessionGapMergeMinutes: 30,
};

const ANCHOR: Anchor = {
  id: "anchor-1",
  name: "Main Library",
  placeId: "geo:1",
  formattedAddress: "Campus Library",
  sourceLatitude: -25.754,
  sourceLongitude: 28.231,
  latitude: -25.754,
  longitude: 28.231,
  radiusMeters: 45,
  calibrated: true,
};

function makeClassNode(): FocusNode {
  return {
    id: "class-1",
    title: "Statistics",
    icon: "book",
    kind: "class",
    locationLabel: "IT 4-1",
    anchorId: "anchor-1",
    completedDates: [],
    skippedDates: [],
    schedule: {
      type: "class",
      weekday: 1,
      startTime: "09:00",
      endTime: "10:30",
    },
  };
}

function makeActiveSession(): ActiveSessionSnapshot {
  return {
    nodeId: "class-1",
    nodeTitle: "Statistics",
    zoneLabel: "IT 4-1",
    headline: "Head to IT 4-1 for class",
    scheduleType: "class",
    shieldStartsAt: new Date("2026-07-27T08:30:00").toISOString(),
    endsAt: new Date("2026-07-27T10:30:00").toISOString(),
    onSiteAccumulatedMs: 0,
    onSiteLastTickAt: null,
    requiredOnSiteMs: null,
    awaySince: null,
    penaltyShieldEndsAt: null,
    penaltyMinutes: null,
    penaltyOriginNodeId: null,
    presenceVerified: false,
  };
}

describe("selectHeroCardData pre-buffer lifecycle", () => {
  const referenceDate = new Date("2026-07-27T08:45:00");
  const nodes = [makeClassNode()];

  it("shows traveling metrics during pre-buffer when outside the geofence", () => {
    const hero = selectHeroCardData(
      nodes,
      [ANCHOR],
      makeActiveSession(),
      {
        userPosition: { latitude: -25.76, longitude: 28.24 },
        isInsideGeofence: false,
        isInsideGeofenceForDisplay: false,
        verificationSecondsRemaining: null,
        locationUnavailable: false,
        backgroundLocationDenied: false,
      },
      referenceDate,
      SETTINGS,
    );

    assert.equal(hero.title, "On your way.");
    assert.equal(hero.icon, "traveller");
    assert.ok(hero.travelStats);
    assert.equal(isPreBufferHeroMessage(hero), false);
  });

  it("shows verifying UI during pre-buffer when display-inside", () => {
    const hero = selectHeroCardData(
      nodes,
      [ANCHOR],
      makeActiveSession(),
      {
        userPosition: { latitude: -25.754, longitude: 28.231 },
        isInsideGeofence: true,
        isInsideGeofenceForDisplay: true,
        verificationSecondsRemaining: 4,
        locationUnavailable: false,
        backgroundLocationDenied: false,
      },
      referenceDate,
      SETTINGS,
    );

    assert.equal(hero.title, "You're here.");
    assert.equal(isPreBufferHeroMessage(hero), false);
    assert.ok(hero.countdownLabel);
  });

  it("uses travel instead of pre-buffer hero when shield is open without a live snapshot", () => {
    const hero = selectHeroCardData(
      nodes,
      [ANCHOR],
      null,
      {
        userPosition: { latitude: -25.76, longitude: 28.24 },
        isInsideGeofence: false,
        isInsideGeofenceForDisplay: false,
        verificationSecondsRemaining: null,
        locationUnavailable: false,
        backgroundLocationDenied: false,
      },
      referenceDate,
      SETTINGS,
    );

    assert.equal(hero.title, "On your way.");
    assert.equal(isPreBufferHeroMessage(hero), false);
  });
});
