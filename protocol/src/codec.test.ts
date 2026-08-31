import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeHeader,
  decodeHello,
  decodePresencePose,
  decodeVars,
  encodeDelta,
  encodeHello,
  encodePresencePose,
  encodeSimEvent,
  decodeSimEvent,
  encodeInputEvent,
  decodeInputEvent,
  encodeWorldPose,
  decodeWorldPose,
  MessageType,
} from "./codec.js";

describe("codec", () => {
  it("roundtrips hello", () => {
    const buf = encodeHello(7, {
      displayName: "Alex",
      packId: "asobo-c172",
      aircraftTitle: "Cessna Skyhawk G1000",
      simBuild: "1.37",
      simProduct: "MSFS2024",
      liveryHash: "",
      seat: "left",
    });
    const h = decodeHeader(buf);
    assert.equal(h?.type, MessageType.Hello);
    assert.equal(h?.seq, 7);
    assert.equal(decodeHello(buf).packId, "asobo-c172");
  });

  it("roundtrips delta vars", () => {
    const buf = encodeDelta(3, [
      { id: 1, value: 0.5 },
      { id: 4, value: -1.25 },
    ]);
    assert.deepEqual(decodeVars(buf), [
      { id: 1, value: 0.5 },
      { id: 4, value: -1.25 },
    ]);
  });

  it("roundtrips presence", () => {
    const pose = {
      headYaw: 12,
      headPitch: -4,
      headRoll: 0.5,
      bodyYaw: 1,
      bodyX: 0.4,
      bodyY: 0.1,
      bodyZ: 0.3,
      stampMs: 1000,
      seat: "right" as const,
    };
    const got = decodePresencePose(encodePresencePose(1, pose));
    assert.ok(Math.abs(got.headYaw - 12) < 0.001);
    assert.ok(Math.abs(got.bodyX - 0.4) < 0.001);
    assert.equal(got.seat, "right");
  });

  it("roundtrips world pose", () => {
    const pose = { lat: 52.3, lon: 4.76, alt: 12.5, pitch: 0.1, bank: -0.2, heading: 240, vx: 1, vy: 0, vz: 3, rx: 0, ry: 0.01, rz: 0, onGround: true };
    const got = decodeWorldPose(encodeWorldPose(4, pose));
    assert.ok(Math.abs(got.lat - 52.3) < 1e-9);
    assert.ok(Math.abs(got.heading - 240) < 1e-9);
    assert.ok(Math.abs(got.vz - 3) < 1e-9);
    assert.equal(got.onGround, true);
  });

  it("roundtrips ATC menu events", () => {
    const buf = encodeSimEvent(9, { eventId: 102, data: 0 });
    assert.equal(decodeHeader(buf)?.type, MessageType.SimEvent);
    assert.deepEqual(decodeSimEvent(buf), { eventId: 102, data: 0 });
  });

  it("roundtrips cockpit input events", () => {
    const buf = encodeInputEvent(3, { hash: 0x1234abcdn, value: 0.75 });
    assert.equal(decodeHeader(buf)?.type, MessageType.InputEvent);
    const got = decodeInputEvent(buf);
    assert.equal(got.hash, 0x1234abcdn);
    assert.ok(Math.abs(got.value - 0.75) < 1e-9);
  });
});
