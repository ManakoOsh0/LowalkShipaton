import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseClockPair } from "./heroFlipClock";

describe("parseClockPair", () => {
  it("parses MM:SS countdown labels", () => {
    assert.deepEqual(parseClockPair("45:07"), {
      left: "45",
      right: "07",
    });
  });

  it("parses H:MM:SS countdown labels", () => {
    assert.deepEqual(parseClockPair("1:59:53"), {
      hours: "01",
      left: "59",
      right: "53",
    });
  });

  it("rejects unsupported formats", () => {
    assert.equal(parseClockPair("1h 30m"), null);
    assert.equal(parseClockPair(""), null);
  });
});
