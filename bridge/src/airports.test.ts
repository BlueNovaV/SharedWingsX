import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { airportLine, nearestAirport } from "./airports.js";

describe("airports", () => {
  it("finds Schiphol from nearby coordinates", () => {
    const ap = nearestAirport(52.3086, 4.7639);
    assert.equal(ap?.icao, "EHAM");
    assert.equal(airportLine(ap), "EHAM · Amsterdam, Netherlands");
  });

  it("returns null far from any listed field", () => {
    assert.equal(nearestAirport(0, 0), null);
  });
});
