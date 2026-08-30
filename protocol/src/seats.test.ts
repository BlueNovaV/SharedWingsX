import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assignSeat, roleForSeat } from "./seats.js";

describe("seats", () => {
  it("gives host left, FO right, then jump seats", () => {
    assert.equal(assignSeat([], false), "left");
    assert.equal(assignSeat(["left"], false), "right");
    assert.equal(assignSeat(["left", "right"], false), "jumpLeft");
    assert.equal(assignSeat(["left", "right", "jumpLeft"], false), "jumpRight");
    assert.equal(assignSeat(["left", "right", "jumpLeft", "jumpRight"], false), null);
  });

  it("puts observers in jump seats so FO can still join", () => {
    assert.equal(assignSeat(["left"], true), "jumpLeft");
    assert.equal(assignSeat(["left", "jumpLeft"], true), "jumpRight");
    assert.equal(assignSeat(["left"], true, "jumpRight"), "jumpRight");
    assert.equal(assignSeat(["left", "jumpRight"], true, "jumpRight"), "jumpLeft");
    assert.equal(roleForSeat("jumpLeft"), "observer");
    assert.equal(roleForSeat("right"), "pm");
  });
});
