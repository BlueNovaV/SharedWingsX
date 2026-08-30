import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canWrite, desynced, shouldEmitDelta } from "./authority.js";

describe("authority", () => {
  it("only lets the captain fly", () => {
    assert.equal(canWrite("a", "pf", "flying", 1, 0, []), true);
    assert.equal(canWrite("a", "pm", "flying", 1, 0, []), false);
    assert.equal(canWrite("a", "observer", "flying", 1, 0, []), false);
    assert.equal(canWrite("a", "observer", "shared", 1, 0, []), false);
  });

  it("lets captain and FO both write ATC", () => {
    assert.equal(canWrite("a", "pf", "atc", 20, 0, []), true);
    assert.equal(canWrite("a", "pm", "atc", 20, 0, []), true);
    assert.equal(canWrite("a", "observer", "atc", 20, 0, []), false);
  });

  it("honours shared locks", () => {
    const locks = [{ varId: 9, lockedBy: "a", untilMs: 1000 }];
    assert.equal(canWrite("b", "pm", "shared", 9, 500, locks), false);
    assert.equal(canWrite("a", "pm", "shared", 9, 500, locks), true);
    assert.equal(canWrite("b", "pm", "shared", 9, 2000, locks), true);
  });

  it("rate-limits deltas", () => {
    assert.equal(shouldEmitDelta(0, 0.0001, 0.01, 0, 50, 40), false);
    assert.equal(shouldEmitDelta(0, 0.2, 0.01, 0, 50, 40), true);
    assert.equal(shouldEmitDelta(0, 0.2, 0.01, 0, 10, 40), false);
  });

  it("detects desync", () => {
    assert.equal(desynced(0.1, 0.11, 0.05), false);
    assert.equal(desynced(0.1, 0.9, 0.05), true);
  });
});
