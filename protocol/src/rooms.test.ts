import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeRoomCode } from "./rooms.js";

describe("room codes", () => {
  it("strips spaces and lower case", () => {
    assert.equal(normalizeRoomCode("ab cd-ef"), "ABCDEF");
    assert.equal(normalizeRoomCode("  k7np2q "), "K7NP2Q");
  });
});
