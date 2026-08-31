import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findPack, loadPacks, titleMatches } from "./pack.js";

describe("packs", () => {
  const packs = loadPacks();

  it("loads c172, 787, 747 and generic fallback", () => {
    assert.ok(packs.some((p) => p.id === "asobo-c172"));
    assert.ok(packs.some((p) => p.id === "asobo-787-10"));
    assert.ok(packs.some((p) => p.id === "asobo-747-8"));
    assert.ok(packs.some((p) => p.id === "generic-msfs"));
  });

  it("matches 747-8 titles and keeps WT throttle LVars off the generic pack", () => {
    assert.equal(findPack(packs, "Boeing 747-8 Intercontinental Asobo")?.id, "asobo-747-8");
    const generic = findPack(packs, "Cessna 152")!;
    assert.equal(generic.variables.some((v) => v.sim.startsWith("L:WT_Virtual_Throttle")), false);
    const wide = findPack(packs, "", "asobo-747-8")!;
    assert.ok(wide.variables.some((v) => v.sim === "L:WT_Virtual_Throttle_Lever_Pos_1"));
  });

  it("maps AP and battery to SET events", async () => {
    const { discreteEventsForVar } = await import("./sim-events.js");
    assert.equal(discreteEventsForVar("AUTOPILOT MASTER", 1)[0]?.name, "AUTOPILOT_ON");
    assert.equal(discreteEventsForVar("ELECTRICAL MASTER BATTERY:1", 1)[0]?.name, "BATTERY1_SET");
    assert.equal(discreteEventsForVar("AUTOPILOT HEADING LOCK DIR", 270)[0]?.data, 270);
  });

  it("uses universal pack for PMDG and unknown titles", () => {
    assert.equal(findPack(packs, "PMDG 737-800")?.id, "generic-msfs");
    assert.equal(findPack(packs, "Fenix A320")?.id, "generic-msfs");
    assert.equal(findPack(packs, "")?.id, "generic-msfs");
  });

  it("matches skyhawk titles", () => {
    const c172 = findPack(packs, "", "asobo-c172");
    assert.ok(c172);
    assert.equal(titleMatches(c172, "Cessna Skyhawk G1000"), true);
    assert.equal(titleMatches(c172, "Boeing 787-10 Asobo"), false);
  });

  it("does not sync derived N1", () => {
    const c172 = findPack(packs, "", "asobo-c172")!;
    assert.equal(c172.variables.find((v) => v.id === 90)?.sync, false);
  });

  it("shares ATC with both seats", () => {
    const c172 = findPack(packs, "", "asobo-c172")!;
    assert.equal(c172.variables.find((v) => v.id === 20)?.domain, "atc");
    assert.equal(c172.variables.find((v) => v.id === 50)?.sim, "ATC CLEARED IFR");
    assert.ok((c172.events ?? []).some((e) => e.sim === "ATC_MENU_1"));
  });

  it("defines jump seat offsets", () => {
    const wide = findPack(packs, "", "asobo-787-10")!;
    assert.ok(wide.presence.seats?.jumpLeft);
    assert.ok(wide.presence.seats?.jumpRight);
  });
});
