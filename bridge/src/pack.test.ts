import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findPack, loadPacks, titleMatches } from "./pack.js";

describe("packs", () => {
  const packs = loadPacks();

  it("loads c172, 787 and generic fallback", () => {
    assert.ok(packs.some((p) => p.id === "asobo-c172"));
    assert.ok(packs.some((p) => p.id === "asobo-787-10"));
    assert.ok(packs.some((p) => p.id === "generic-msfs"));
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
