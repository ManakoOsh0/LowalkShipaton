import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  countApplicablePermissions,
  selectNextPermissionStep,
  type PermissionCheck,
} from "./requiredPermissionSteps";

function check(
  id: PermissionCheck["id"],
  granted: boolean,
  applicable = true,
): PermissionCheck {
  return {
    id,
    title: id,
    body: "",
    cta: "",
    settingsHint: null,
    granted,
    applicable,
  };
}

describe("requiredPermissions", () => {
  it("selects the first applicable ungranted step", () => {
    const next = selectNextPermissionStep([
      check("locationForeground", true),
      check("locationBackground", false),
      check("notifications", false),
    ]);
    assert.equal(next?.id, "locationBackground");
  });

  it("skips steps that are not applicable on this platform", () => {
    const next = selectNextPermissionStep([
      check("locationForeground", true),
      check("usageAccess", false, false),
      check("overlay", false, false),
      check("notifications", false),
    ]);
    assert.equal(next?.id, "notifications");
  });

  it("returns null when every applicable permission is granted", () => {
    const next = selectNextPermissionStep([
      check("locationForeground", true),
      check("usageAccess", false, false),
    ]);
    assert.equal(next, null);
  });

  it("counts only applicable permissions for the progress label", () => {
    const progress = countApplicablePermissions([
      check("locationForeground", true),
      check("usageAccess", false, false),
      check("notifications", false),
    ]);
    assert.deepEqual(progress, { granted: 1, total: 2 });
  });
});
