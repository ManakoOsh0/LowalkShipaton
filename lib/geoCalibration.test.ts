import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Anchor } from "@/types/anchor";

import {
  MAX_CALIBRATION_DRIFT_FROM_SOURCE_METERS,
  MAX_CALIBRATION_MAP_NUDGE_METERS,
  validateCalibrationCapture,
  validateCalibrationSave,
} from "./geo";

function makeAnchor(overrides: Partial<Anchor> = {}): Anchor {
  return {
    id: "anchor-1",
    name: "Library",
    placeId: "geo:1,2:library",
    formattedAddress: "Campus Library",
    sourceLatitude: -25.75,
    sourceLongitude: 28.23,
    latitude: -25.75,
    longitude: 28.23,
    radiusMeters: 30,
    calibrated: false,
    ...overrides,
  };
}

describe("validateCalibrationCapture", () => {
  it("allows deferred anchors without venue coords", () => {
    const anchor = makeAnchor({
      latitude: 0,
      longitude: 0,
      sourceLatitude: 0,
      sourceLongitude: 0,
    });
    assert.equal(
      validateCalibrationCapture(anchor, { latitude: -25.76, longitude: 28.24 }),
      null,
    );
  });

  it("rejects capture far from the venue source pin", () => {
    const anchor = makeAnchor();
    const message = validateCalibrationCapture(anchor, {
      latitude: -25.85,
      longitude: 28.35,
    });
    assert.match(message ?? "", /too far from the scheduled venue/i);
  });

  it("requires inside geofence when recalibrating", () => {
    const anchor = makeAnchor({
      calibrated: true,
      latitude: -25.75,
      longitude: 28.23,
      radiusMeters: 20,
    });
    const message = validateCalibrationCapture(anchor, {
      latitude: -25.752,
      longitude: 28.232,
    });
    assert.match(message ?? "", /inside the current geofence/i);
  });
});

describe("validateCalibrationSave", () => {
  it("rejects map nudges beyond the fine-tune radius", () => {
    const anchor = makeAnchor();
    const captured = { latitude: -25.75, longitude: 28.23 };
    const proposed = {
      latitude: captured.latitude + 0.001,
      longitude: captured.longitude,
    };
    const message = validateCalibrationSave(anchor, captured, proposed);
    assert.match(message ?? "", new RegExp(`${MAX_CALIBRATION_MAP_NUDGE_METERS}m`));
  });

  it("accepts a small nudge near the venue", () => {
    const anchor = makeAnchor();
    const captured = { latitude: -25.75, longitude: 28.23 };
    const proposed = {
      latitude: captured.latitude + 0.0001,
      longitude: captured.longitude + 0.0001,
    };
    assert.equal(validateCalibrationSave(anchor, captured, proposed), null);
  });

  it("rejects proposed center beyond drift from source", () => {
    const anchor = makeAnchor();
    const edgeOffset = (MAX_CALIBRATION_DRIFT_FROM_SOURCE_METERS - 20) / 111_000;
    const nudgeOffset = 30 / 111_000;
    const captured = {
      latitude: anchor.sourceLatitude + edgeOffset,
      longitude: anchor.sourceLongitude,
    };
    const proposed = {
      latitude: captured.latitude + nudgeOffset,
      longitude: captured.longitude,
    };
    const message = validateCalibrationSave(anchor, captured, proposed);
    assert.match(message ?? "", /too far from your venue/i);
  });
});
