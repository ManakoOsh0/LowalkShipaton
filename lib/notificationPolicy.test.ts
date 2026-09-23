import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  fitNotificationBody,
  fitNotificationTitle,
  NOTIFICATION_BODY_EXPANDED_MAX,
  NOTIFICATION_TITLE_MAX,
} from "@/lib/notificationCopy";

describe("notificationPolicy", () => {
  it("truncates long titles with an ellipsis", () => {
    const long = "A".repeat(NOTIFICATION_TITLE_MAX + 10);
    const result = fitNotificationTitle(long);
    assert.equal(result.length, NOTIFICATION_TITLE_MAX);
    assert.ok(result.endsWith("…"));
  });

  it("truncates long bodies within expanded limit", () => {
    const long = "B".repeat(NOTIFICATION_BODY_EXPANDED_MAX + 20);
    const result = fitNotificationBody(long);
    assert.equal(result.length, NOTIFICATION_BODY_EXPANDED_MAX);
    assert.ok(result.endsWith("…"));
  });
});
