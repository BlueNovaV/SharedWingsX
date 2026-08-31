export const MAGIC = Buffer.from("TWIN", "ascii");
export const PROTOCOL_VERSION = 1;
export const HEADER_SIZE = 10;
export const MAX_UDP_PAYLOAD = 1200;

export const MessageType = {
  Heartbeat: 1,
  Hello: 2,
  JoinReject: 3,
  Snapshot: 4,
  Delta: 5,
  RoleTransfer: 6,
  PanelLock: 7,
  PresencePose: 8,
  DesyncReport: 9,
  WeatherTimePolicy: 10,
  PunchPing: 11,
  SimEvent: 12,
  WorldPose: 13,
  InputEvent: 14,
} as const;

export type MessageTypeId = (typeof MessageType)[keyof typeof MessageType];

export type Role = "pf" | "pm" | "observer";
export type Domain = "flying" | "monitoring" | "shared" | "atc";
export type Seat = "left" | "right" | "jumpLeft" | "jumpRight";
export type SimProduct = "MSFS2020" | "MSFS2024";
export type PresenceSupport = "full" | "offset" | "overlay";

export type HelloPayload = {
  displayName: string;
  packId: string;
  aircraftTitle: string;
  simBuild: string;
  simProduct: SimProduct;
  liveryHash: string;
  seat: Seat;
};

export type JoinRejectPayload = {
  reason: string;
  code:
    | "pack_mismatch"
    | "aircraft_mismatch"
    | "protocol"
    | "room_full"
    | "sim_mismatch";
};

export type RoleTransferPayload = {
  targetName: string;
  role: Role;
  flyingName: string;
  monitoringName: string;
};

export type PanelLockPayload = {
  varId: number;
  lockedBy: string;
  untilMs: number;
};

export type PresencePose = {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  bodyYaw: number;
  bodyX: number;
  bodyY: number;
  bodyZ: number;
  stampMs: number;
  seat: Seat;
};

export type DesyncReportPayload = {
  varId: number;
  name: string;
  localValue: number;
  networkValue: number;
  epsilon: number;
};

export type WeatherTimePolicy = {
  syncTime: boolean;
  syncWeather: boolean;
  hostZuluHour: number;
};

export type VarRecord = { id: number; value: number };

function writeHeader(type: MessageTypeId, seq: number): Buffer {
  const buf = Buffer.alloc(HEADER_SIZE);
  MAGIC.copy(buf, 0);
  buf.writeUInt8(PROTOCOL_VERSION, 4);
  buf.writeUInt8(type, 5);
  buf.writeUInt32LE(seq >>> 0, 6);
  return buf;
}

export function decodeHeader(buf: Buffer): { type: MessageTypeId; seq: number } | null {
  if (buf.length < HEADER_SIZE) return null;
  if (!buf.subarray(0, 4).equals(MAGIC)) return null;
  if (buf.readUInt8(4) !== PROTOCOL_VERSION) return null;
  return { type: buf.readUInt8(5) as MessageTypeId, seq: buf.readUInt32LE(6) };
}

function jsonFrame(type: MessageTypeId, seq: number, payload: unknown): Buffer {
  const json = Buffer.from(JSON.stringify(payload), "utf8");
  return Buffer.concat([writeHeader(type, seq), json]);
}

function readJson<T>(buf: Buffer): T {
  return JSON.parse(buf.subarray(HEADER_SIZE).toString("utf8")) as T;
}

export function encodeHeartbeat(seq: number, sentAt: number): Buffer {
  const body = Buffer.alloc(8);
  body.writeDoubleLE(sentAt, 0);
  return Buffer.concat([writeHeader(MessageType.Heartbeat, seq), body]);
}

export function decodeHeartbeat(buf: Buffer): number {
  return buf.readDoubleLE(HEADER_SIZE);
}

export function encodeHello(seq: number, hello: HelloPayload): Buffer {
  return jsonFrame(MessageType.Hello, seq, hello);
}

export function decodeHello(buf: Buffer): HelloPayload {
  return readJson<HelloPayload>(buf);
}

export function encodeJoinReject(payload: JoinRejectPayload): Buffer {
  return jsonFrame(MessageType.JoinReject, 0, payload);
}

export function decodeJoinReject(buf: Buffer): JoinRejectPayload {
  return readJson<JoinRejectPayload>(buf);
}

function encodeVars(type: MessageTypeId, seq: number, vars: VarRecord[]): Buffer {
  const body = Buffer.alloc(2 + vars.length * 10);
  body.writeUInt16LE(vars.length, 0);
  let o = 2;
  for (const v of vars) {
    body.writeUInt16LE(v.id, o);
    body.writeDoubleLE(v.value, o + 2);
    o += 10;
  }
  return Buffer.concat([writeHeader(type, seq), body]);
}

export function encodeSnapshot(seq: number, vars: VarRecord[]): Buffer {
  return encodeVars(MessageType.Snapshot, seq, vars);
}

export function encodeDelta(seq: number, vars: VarRecord[]): Buffer {
  return encodeVars(MessageType.Delta, seq, vars);
}

export function decodeVars(buf: Buffer): VarRecord[] {
  const n = buf.readUInt16LE(HEADER_SIZE);
  const out: VarRecord[] = [];
  let o = HEADER_SIZE + 2;
  for (let i = 0; i < n; i++) {
    out.push({ id: buf.readUInt16LE(o), value: buf.readDoubleLE(o + 2) });
    o += 10;
  }
  return out;
}

export function encodeRoleTransfer(payload: RoleTransferPayload): Buffer {
  return jsonFrame(MessageType.RoleTransfer, 0, payload);
}

export function decodeRoleTransfer(buf: Buffer): RoleTransferPayload {
  return readJson<RoleTransferPayload>(buf);
}

export function encodePanelLock(payload: PanelLockPayload): Buffer {
  return jsonFrame(MessageType.PanelLock, 0, payload);
}

export function decodePanelLock(buf: Buffer): PanelLockPayload {
  return readJson<PanelLockPayload>(buf);
}

export function encodePresencePose(seq: number, pose: PresencePose): Buffer {
  const body = Buffer.alloc(33);
  const fields = [
    pose.headYaw,
    pose.headPitch,
    pose.headRoll,
    pose.bodyYaw,
    pose.bodyX,
    pose.bodyY,
    pose.bodyZ,
    pose.stampMs,
  ];
  fields.forEach((value, i) => body.writeFloatLE(value, i * 4));
  const seatByte = pose.seat === "left" ? 0 : pose.seat === "jumpLeft" ? 2 : pose.seat === "jumpRight" ? 3 : 1;
  body.writeUInt8(seatByte, 32);
  return Buffer.concat([writeHeader(MessageType.PresencePose, seq), body]);
}

export function decodePresencePose(buf: Buffer): PresencePose {
  const o = HEADER_SIZE;
  const seatByte = buf.length >= o + 33 ? buf.readUInt8(o + 32) : 1;
  const seats: Seat[] = ["left", "right", "jumpLeft", "jumpRight"];
  return {
    headYaw: buf.readFloatLE(o),
    headPitch: buf.readFloatLE(o + 4),
    headRoll: buf.readFloatLE(o + 8),
    bodyYaw: buf.readFloatLE(o + 12),
    bodyX: buf.readFloatLE(o + 16),
    bodyY: buf.readFloatLE(o + 20),
    bodyZ: buf.readFloatLE(o + 24),
    stampMs: buf.readFloatLE(o + 28),
    seat: seats[seatByte] ?? "right",
  };
}

export function encodeDesyncReport(payload: DesyncReportPayload): Buffer {
  return jsonFrame(MessageType.DesyncReport, 0, payload);
}

export function decodeDesyncReport(buf: Buffer): DesyncReportPayload {
  return readJson<DesyncReportPayload>(buf);
}

export function encodeWeatherTimePolicy(payload: WeatherTimePolicy): Buffer {
  return jsonFrame(MessageType.WeatherTimePolicy, 0, payload);
}

export function decodeWeatherTimePolicy(buf: Buffer): WeatherTimePolicy {
  return readJson<WeatherTimePolicy>(buf);
}

export function encodePunchPing(token: number): Buffer {
  const body = Buffer.alloc(4);
  body.writeUInt32LE(token, 0);
  return Buffer.concat([writeHeader(MessageType.PunchPing, 0), body]);
}

export type SimEventPayload = { eventId: number; data: number };

export function encodeSimEvent(seq: number, payload: SimEventPayload): Buffer {
  const body = Buffer.alloc(6);
  body.writeUInt16LE(payload.eventId, 0);
  body.writeUInt32LE(payload.data >>> 0, 2);
  return Buffer.concat([writeHeader(MessageType.SimEvent, seq), body]);
}

export function decodeSimEvent(buf: Buffer): SimEventPayload {
  return {
    eventId: buf.readUInt16LE(HEADER_SIZE),
    data: buf.readUInt32LE(HEADER_SIZE + 2),
  };
}

export type InputEventPayload = { hash: bigint; value: number };

export function encodeInputEvent(seq: number, payload: InputEventPayload): Buffer {
  const body = Buffer.alloc(16);
  body.writeBigUInt64LE(payload.hash, 0);
  body.writeDoubleLE(payload.value, 8);
  return Buffer.concat([writeHeader(MessageType.InputEvent, seq), body]);
}

export function decodeInputEvent(buf: Buffer): InputEventPayload {
  return {
    hash: buf.readBigUInt64LE(HEADER_SIZE),
    value: buf.readDoubleLE(HEADER_SIZE + 8),
  };
}

export type WorldPose = {
  lat: number;
  lon: number;
  alt: number;
  pitch: number;
  bank: number;
  heading: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  onGround: boolean;
};

export function encodeWorldPose(seq: number, pose: WorldPose): Buffer {
  const body = Buffer.alloc(97);
  body.writeDoubleLE(pose.lat, 0);
  body.writeDoubleLE(pose.lon, 8);
  body.writeDoubleLE(pose.alt, 16);
  body.writeDoubleLE(pose.pitch, 24);
  body.writeDoubleLE(pose.bank, 32);
  body.writeDoubleLE(pose.heading, 40);
  body.writeDoubleLE(pose.vx ?? 0, 48);
  body.writeDoubleLE(pose.vy ?? 0, 56);
  body.writeDoubleLE(pose.vz ?? 0, 64);
  body.writeDoubleLE(pose.rx ?? 0, 72);
  body.writeDoubleLE(pose.ry ?? 0, 80);
  body.writeDoubleLE(pose.rz ?? 0, 88);
  body.writeUInt8(pose.onGround ? 1 : 0, 96);
  return Buffer.concat([writeHeader(MessageType.WorldPose, seq), body]);
}

export function decodeWorldPose(buf: Buffer): WorldPose {
  const o = HEADER_SIZE;
  const wide = buf.length >= o + 97;
  return {
    lat: buf.readDoubleLE(o),
    lon: buf.readDoubleLE(o + 8),
    alt: buf.readDoubleLE(o + 16),
    pitch: buf.readDoubleLE(o + 24),
    bank: buf.readDoubleLE(o + 32),
    heading: buf.readDoubleLE(o + 40),
    vx: wide ? buf.readDoubleLE(o + 48) : 0,
    vy: wide ? buf.readDoubleLE(o + 56) : 0,
    vz: wide ? buf.readDoubleLE(o + 64) : 0,
    rx: wide ? buf.readDoubleLE(o + 72) : 0,
    ry: wide ? buf.readDoubleLE(o + 80) : 0,
    rz: wide ? buf.readDoubleLE(o + 88) : 0,
    onGround: wide ? Boolean(buf.readUInt8(o + 96)) : buf.length > o + 48 ? Boolean(buf.readUInt8(o + 48)) : false,
  };
}
