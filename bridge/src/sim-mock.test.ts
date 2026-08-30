import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findPack, loadPacks } from "./pack.js";
import { MockSim } from "./sim.js";

describe("mock sim", () => {
  it("reads and writes throttle", () => {
    const pack = findPack(loadPacks(), "", "asobo-c172")!;
    const sim = new MockSim(pack);
    const thr = pack.variables.find((v) => v.id === 4)!;
    sim.write(thr, 42);
    assert.equal(sim.read(thr), 42);
    assert.equal(sim.identity().mock, true);
  });
});
