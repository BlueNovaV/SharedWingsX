import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bodyOffsetToWorld } from "./presence.js";

describe("crew pin offset", () => {
  it("puts a right-seat offset east when the aircraft points north", () => {
    const w = bodyOffsetToWorld(52, 4, 0, 0, 0, 0, 1, 0, 0);
    assert.ok(w.lon > 4);
    assert.ok(Math.abs(w.lat - 52) < 1e-6);
  });

  it("puts a right-seat offset south when the aircraft points east", () => {
    const w = bodyOffsetToWorld(52, 4, 0, 0, 0, 90, 1, 0, 0);
    assert.ok(w.lat < 52);
    assert.ok(Math.abs(w.lon - 4) < 1e-6);
  });

  it("raises altitude for a positive up offset", () => {
    const w = bodyOffsetToWorld(52, 4, 100, 0, 0, 0, 0, 2, 0);
    assert.ok(w.alt > 106 && w.alt < 107);
  });
});
