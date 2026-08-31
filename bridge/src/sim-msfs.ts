import type { SimConnectConnection } from "node-simconnect";
import type { Seat } from "@twinseat/protocol";
import type { AircraftPack, PackVar } from "./pack.js";
import { seatOffset } from "./pack.js";
import { MockSim, type SimBackend, type SimIdentity, type WorldPose } from "./sim.js";
import { nearestAirport } from "./airports.js";
import { discreteEventsForVar, inputEventPriority, skipInputEventName } from "./sim-events.js";
import { bodyOffsetToWorld } from "./presence.js";

type SimConnectMod = typeof import("node-simconnect");
let sc: SimConnectMod;

function usableName(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (/ATCCOM/i.test(t)) return false;
  if (/\.text$/i.test(t)) return false;
  return true;
}

function metersBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(s)));
}

const TITLE_DEF = 1;
const TITLE_REQ = 1;
const READ_DEF = 2;
const READ_REQ = 2;
const POS_DEF = 3;
const POS_REQ = 3;
const POSE_WRITE = 4;
const VEL_WRITE = 5;
const ROT_WRITE = 6;
const MOTION_DEF = 7;
const MOTION_REQ = 7;
const ATC_DEF = 8;
const ATC_REQ = 8;
const CAM_DEF = 9;
const CAM_REQ = 9;
const GROUND_POSE_WRITE = 10;
const INIT_POSE_WRITE = 11;
const AVATAR_POSE_DEF = 12;
const FREEZE_DEF = 13;
const FREEZE_REQ = 13;
const TIME_DEF = 14;
const TIME_REQ = 14;
const CMD_DATA_ID = 21;
const CMD_DEF_ID = 22;
const INPUT_LIST_REQ = 41;
const AVATAR_REQ: Record<Seat, number> = { left: 61, right: 62, jumpLeft: 63, jumpRight: 64 };
const AVATAR_TITLE = "TwinSeat Avatar";
const EVENT_GROUP = 1;
const WRITE_BASE = 1000;
const EVENT_BASE = 2000;
const FIRE_BASE = 4000;

export async function connectMsfs(pack: AircraftPack): Promise<SimBackend | null> {
  if (process.platform !== "win32") return null;
  try {
    sc = await import("node-simconnect");
    const opened = await Promise.race([
      sc.open("SharedWingsX", sc.Protocol.KittyHawk),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("SimConnect timeout")), 8000);
      }),
    ]);
    return new MsfsSim(pack, opened.handle, opened.recvOpen);
  } catch {
    return null;
  }
}

class MsfsSim implements SimBackend {
  values = new Map<number, number>();
  yaw = 0;
  pitch = 0;
  roll = 0;
  private title = "";
  private appName: string;
  private appMajor = 0;
  private appMinor = 0;
  private appBuild = 0;
  private outbound: { name: string; data: number }[] = [];
  private eventsMapped = new Set<string>();
  private writing = new Set<number>();
  private handle: SimConnectConnection;
  private pack: AircraftPack;
  private synced: PackVar[];
  private lat = Number.NaN;
  private lon = Number.NaN;
  private alt = Number.NaN;
  private pitchDeg = 0;
  private bankDeg = 0;
  private headingDeg = 0;
  private onGround = false;
  private cameraState = Number.NaN;
  private atcType = "";
  private atcModel = "";
  private vx = 0;
  private vy = 0;
  private vz = 0;
  private rx = 0;
  private ry = 0;
  private rz = 0;
  private physicsHold = false;
  private closed = false;
  private fireIds = new Map<string, number>();
  private nextFireId = FIRE_BASE;
  private lastAxis = new Map<string, number>();
  private lastDiscrete = new Map<string, number>();
  private outboundInput: { hash: bigint; value: number }[] = [];
  private muteInput = new Map<string, number>();
  private muteEvent = new Map<number, number>();
  private eventByClient = new Map<number, string>();
  private lastWarpAt = 0;
  private cmdSeq = 1;
  private cmdReady = false;
  private freezeLat = 0;
  private freezeAlt = 0;
  private freezeAtt = 0;
  private zuluHours = Number.NaN;
  private zuluMinutes = 0;
  private followPose: WorldPose | null = null;
  private pinSeats = new Set<Seat>();
  private avatarIds = new Map<Seat, number>();
  private avatarPending = new Set<Seat>();
  private avatarSpawnAt = new Map<Seat, number>();
  private placing = false;

  constructor(pack: AircraftPack, handle: SimConnectConnection, recvOpen: {
    applicationName?: string;
    applicationVersionMajor?: number;
    applicationVersionMinor?: number;
    applicationBuildMajor?: number;
  }) {
    this.pack = pack;
    this.handle = handle;
    this.appName = recvOpen.applicationName ?? "MSFS";
    this.appMajor = Number(recvOpen.applicationVersionMajor) || 0;
    this.appMinor = Number(recvOpen.applicationVersionMinor) || 0;
    this.appBuild = Number(recvOpen.applicationBuildMajor) || 0;
    this.synced = pack.variables.filter((v) => v.sync);
    for (const v of pack.variables) this.values.set(v.id, 0);

    handle.addToDataDefinition(TITLE_DEF, "TITLE", null, sc.SimConnectDataType.STRING256);
    handle.requestDataOnSimObject(
      TITLE_REQ,
      TITLE_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.SIM_FRAME,
    );
    handle.addToDataDefinition(ATC_DEF, "ATC TYPE", null, sc.SimConnectDataType.STRING256);
    handle.addToDataDefinition(ATC_DEF, "ATC MODEL", null, sc.SimConnectDataType.STRING256);
    handle.requestDataOnSimObject(
      ATC_REQ,
      ATC_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.SECOND,
    );

    for (const v of this.synced) {
      handle.addToDataDefinition(READ_DEF, v.sim, v.unit, sc.SimConnectDataType.FLOAT64);
      handle.addToDataDefinition(WRITE_BASE + v.id, v.sim, v.unit, sc.SimConnectDataType.FLOAT64);
    }
    if (this.synced.length) {
      handle.requestDataOnSimObject(
        READ_REQ,
        READ_DEF,
        sc.SimConnectConstants.OBJECT_ID_USER,
        sc.SimConnectPeriod.VISUAL_FRAME,
      );
    }

    handle.addToDataDefinition(POS_DEF, "PLANE LATITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POS_DEF, "PLANE LONGITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POS_DEF, "PLANE ALTITUDE", "feet", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POS_DEF, "PLANE PITCH DEGREES", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POS_DEF, "PLANE BANK DEGREES", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POS_DEF, "PLANE HEADING DEGREES TRUE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POS_DEF, "SIM ON GROUND", "bool", sc.SimConnectDataType.FLOAT64);
    handle.requestDataOnSimObject(
      POS_REQ,
      POS_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.VISUAL_FRAME,
    );
    handle.addToDataDefinition(CAM_DEF, "CAMERA STATE", "Number", sc.SimConnectDataType.FLOAT64);
    handle.requestDataOnSimObject(
      CAM_REQ,
      CAM_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.SIM_FRAME,
    );
    handle.addToDataDefinition(FREEZE_DEF, "IS LATITUDE LONGITUDE FREEZE ON", "Bool", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(FREEZE_DEF, "IS ALTITUDE FREEZE ON", "Bool", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(FREEZE_DEF, "IS ATTITUDE FREEZE ON", "Bool", sc.SimConnectDataType.FLOAT64);
    handle.requestDataOnSimObject(
      FREEZE_REQ,
      FREEZE_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.SIM_FRAME,
    );
    handle.addToDataDefinition(TIME_DEF, "ZULU TIME", "Hours", sc.SimConnectDataType.FLOAT64);
    handle.requestDataOnSimObject(
      TIME_REQ,
      TIME_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.SECOND,
    );
    try {
      handle.mapClientDataNameToID("SharedWingsX.Cmd", CMD_DATA_ID);
      handle.createClientData(CMD_DATA_ID, 64, false);
      handle.addToClientDataDefinition(CMD_DEF_ID, 0, 64);
      this.cmdReady = true;
    } catch (err) {
      console.warn("[twinseat] in-sim command channel skipped", err instanceof Error ? err.message : err);
    }

    handle.addToDataDefinition(POSE_WRITE, "PLANE LATITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POSE_WRITE, "PLANE LONGITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POSE_WRITE, "PLANE ALTITUDE", "feet", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POSE_WRITE, "PLANE PITCH DEGREES", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POSE_WRITE, "PLANE BANK DEGREES", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(POSE_WRITE, "PLANE HEADING DEGREES TRUE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(AVATAR_POSE_DEF, "PLANE LATITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(AVATAR_POSE_DEF, "PLANE LONGITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(AVATAR_POSE_DEF, "PLANE ALTITUDE", "feet", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(AVATAR_POSE_DEF, "PLANE PITCH DEGREES", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(AVATAR_POSE_DEF, "PLANE BANK DEGREES", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(AVATAR_POSE_DEF, "PLANE HEADING DEGREES TRUE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(GROUND_POSE_WRITE, "PLANE LATITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(GROUND_POSE_WRITE, "PLANE LONGITUDE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(GROUND_POSE_WRITE, "PLANE ALTITUDE", "feet", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(GROUND_POSE_WRITE, "PLANE HEADING DEGREES TRUE", "degrees", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(INIT_POSE_WRITE, "Initial Position", null, sc.SimConnectDataType.INITPOSITION);
    handle.addToDataDefinition(VEL_WRITE, "VELOCITY BODY X", "feet per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(VEL_WRITE, "VELOCITY BODY Y", "feet per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(VEL_WRITE, "VELOCITY BODY Z", "feet per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(ROT_WRITE, "ROTATION VELOCITY BODY X", "radians per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(ROT_WRITE, "ROTATION VELOCITY BODY Y", "radians per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(ROT_WRITE, "ROTATION VELOCITY BODY Z", "radians per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(MOTION_DEF, "VELOCITY BODY X", "feet per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(MOTION_DEF, "VELOCITY BODY Y", "feet per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(MOTION_DEF, "VELOCITY BODY Z", "feet per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(MOTION_DEF, "ROTATION VELOCITY BODY X", "radians per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(MOTION_DEF, "ROTATION VELOCITY BODY Y", "radians per second", sc.SimConnectDataType.FLOAT64);
    handle.addToDataDefinition(MOTION_DEF, "ROTATION VELOCITY BODY Z", "radians per second", sc.SimConnectDataType.FLOAT64);
    handle.requestDataOnSimObject(
      MOTION_REQ,
      MOTION_DEF,
      sc.SimConnectConstants.OBJECT_ID_USER,
      sc.SimConnectPeriod.VISUAL_FRAME,
    );

    handle.on("simObjectData", (recv) => {
      try {
        if (recv.defineID === TITLE_DEF || recv.requestID === TITLE_REQ) {
          if (recv.data.remaining() >= 4) {
            const next = recv.data.readString256()?.replace(/\0/g, "").trim() ?? "";
            if (next) this.title = next;
          }
          return;
        }
        if (recv.defineID === POS_DEF || recv.requestID === POS_REQ) {
          if (recv.data.remaining() >= 56) {
            this.lat = recv.data.readFloat64();
            this.lon = recv.data.readFloat64();
            this.alt = recv.data.readFloat64();
            this.pitchDeg = recv.data.readFloat64();
            this.bankDeg = recv.data.readFloat64();
            this.headingDeg = recv.data.readFloat64();
            this.onGround = recv.data.readFloat64() > 0.5;
          }
          this.pinAfterPose();
          return;
        }
        if (recv.defineID === CAM_DEF || recv.requestID === CAM_REQ) {
          if (recv.data.remaining() >= 8) this.cameraState = recv.data.readFloat64();
          return;
        }
        if (recv.defineID === FREEZE_DEF || recv.requestID === FREEZE_REQ) {
          if (recv.data.remaining() >= 24) {
            this.freezeLat = recv.data.readFloat64();
            this.freezeAlt = recv.data.readFloat64();
            this.freezeAtt = recv.data.readFloat64();
            this.enforceFreeze();
          }
          return;
        }
        if (recv.defineID === TIME_DEF || recv.requestID === TIME_REQ) {
          if (recv.data.remaining() >= 8) {
            const hours = recv.data.readFloat64();
            if (Number.isFinite(hours)) {
              this.zuluHours = Math.floor(hours) % 24;
              this.zuluMinutes = Math.max(0, Math.min(59, Math.round((hours % 1) * 60)));
            }
          }
          return;
        }
        if (recv.defineID === ATC_DEF || recv.requestID === ATC_REQ) {
          if (recv.data.remaining() >= 4) {
            const type = recv.data.readString256()?.replace(/\0/g, "").trim() ?? "";
            const model = recv.data.remaining() >= 4 ? recv.data.readString256()?.replace(/\0/g, "").trim() ?? "" : "";
            if (usableName(type)) this.atcType = type;
            if (usableName(model)) this.atcModel = model;
          }
          return;
        }
        if (recv.defineID === MOTION_DEF || recv.requestID === MOTION_REQ) {
          if (recv.data.remaining() >= 48) {
            this.vx = recv.data.readFloat64();
            this.vy = recv.data.readFloat64();
            this.vz = recv.data.readFloat64();
            this.rx = recv.data.readFloat64();
            this.ry = recv.data.readFloat64();
            this.rz = recv.data.readFloat64();
          }
          return;
        }
        if (recv.defineID !== READ_DEF && recv.requestID !== READ_REQ) return;
        const n = Math.min(this.synced.length, recv.defineCount || this.synced.length);
        for (let i = 0; i < n; i++) {
          if (recv.data.remaining() < 8) break;
          const value = recv.data.readFloat64();
          const v = this.synced[i];
          if (this.writing.has(v.id)) continue;
          this.values.set(v.id, value);
        }
      } catch (err) {
        console.warn("[twinseat] SimConnect packet skipped", err instanceof Error ? err.message : err);
      }
    });
    this.subscribeCockpitEvents();
    try {
      handle.enumerateInputEvents(INPUT_LIST_REQ);
    } catch (err) {
      console.warn("[twinseat] input event list skipped", err instanceof Error ? err.message : err);
    }
    handle.on("inputEventsList", (list) => {
      const rows = [...(list.inputEventDescriptors ?? [])].sort(
        (a, b) => inputEventPriority(String(a.name ?? "")) - inputEventPriority(String(b.name ?? "")),
      );
      let n = 0;
      for (const row of rows) {
        const name = String(row.name ?? "");
        if (skipInputEventName(name)) continue;
        if (Number(row.type) !== 0) continue;
        if (n++ > 800) break;
        try {
          handle.subscribeInputEvent(row.inputEventIdHash);
        } catch {
          /* aircraft without this event */
        }
      }
    });
    handle.on("subscribeInputEvent", (ev) => {
      const hash = BigInt(ev.inputEventIdHash);
      const key = hash.toString();
      const until = this.muteInput.get(key) ?? 0;
      if (Date.now() < until) return;
      const value = typeof ev.value === "number" ? ev.value : Number(ev.value);
      if (!Number.isFinite(value)) return;
      this.outboundInput.push({ hash, value });
    });
    handle.on("event", (ev) => {
      const name = this.eventByClient.get(ev.clientEventId);
      if (!name) return;
      const until = this.muteEvent.get(ev.clientEventId) ?? 0;
      if (Date.now() < until) return;
      this.outbound.push({ name, data: ev.data >>> 0 });
    });
    handle.on("assignedObjectID", (recv) => {
      for (const [seat, req] of Object.entries(AVATAR_REQ) as [Seat, number][]) {
        if (recv.requestID !== req) continue;
        this.avatarPending.delete(seat);
        this.avatarIds.set(seat, recv.objectID);
        this.freezeAvatar(recv.objectID);
        this.placeAvatar(seat, recv.objectID);
      }
    });
    handle.on("exception", (ex) => {
      console.warn("[twinseat] SimConnect", ex.exception, ex.sendId);
    });
    handle.on("quit", () => {
      this.closed = true;
      this.dropAvatars();
      console.warn("[twinseat] SimConnect quit");
    });
    handle.on("close", () => {
      this.closed = true;
      this.dropAvatars();
    });
  }

  private subscribeCockpitEvents(): void {
    const events = this.pack.events ?? [];
    for (let i = 0; i < events.length; i++) {
      const name = events[i].sim;
      const id = EVENT_BASE + i;
      try {
        this.handle.mapClientEventToSimEvent(id, name);
        this.handle.addClientEventToNotificationGroup(EVENT_GROUP, id, false);
        this.eventsMapped.add(name);
        this.eventByClient.set(id, name);
      } catch {
        /* event not on this sim */
      }
    }
    try {
      this.handle.setNotificationGroupPriority(EVENT_GROUP, sc.NotificationPriority.HIGHEST);
    } catch {
      /* ignore */
    }
  }

  private hasPosition(): boolean {
    if (!Number.isFinite(this.lat) || !Number.isFinite(this.lon) || !Number.isFinite(this.alt)) return false;
    return Math.abs(this.lat) > 0.05 || Math.abs(this.lon) > 0.05;
  }

  private onWorldMap(): boolean {
    if (!Number.isFinite(this.cameraState)) return false;
    return Math.round(this.cameraState) >= 12;
  }

  private spawned(): boolean {
    if (!this.hasPosition()) return false;
    if (this.onWorldMap()) return false;
    return true;
  }

  private aircraftLine(): string {
    if (usableName(this.title)) return this.title;
    return [this.atcType, this.atcModel].filter(usableName).join(" ").trim();
  }

  identity(): SimIdentity {
    const name = this.appName.toLowerCase();
    const simProduct =
      name.includes("2024") ||
      name.includes("limitless") ||
      this.appMajor >= 12 ||
      this.appBuild >= 12
        ? "MSFS2024"
        : "MSFS2020";
    const ready = this.spawned();
    const ap = ready ? nearestAirport(this.lat, this.lon, 80) : null;
    return {
      connected: !this.closed,
      mock: false,
      inWorld: ready && !this.closed,
      aircraftTitle: this.closed ? "" : this.aircraftLine(),
      simBuild: `${this.appName} ${this.appMajor}.${this.appMinor}.${this.appBuild}`.trim(),
      simProduct,
      liveryHash: "",
      airportIcao: ap?.icao ?? "",
      airportCity: ap?.city ?? "",
      airportCountry: ap?.country ?? "",
      lat: ready ? this.lat : undefined,
      lon: ready ? this.lon : undefined,
      onGround: ready ? this.onGround : undefined,
    };
  }

  worldPose(): WorldPose | null {
    if (!this.hasPosition()) return null;
    return {
      lat: this.lat,
      lon: this.lon,
      alt: this.alt,
      pitch: this.pitchDeg,
      bank: this.bankDeg,
      heading: this.headingDeg,
      vx: this.vx,
      vy: this.vy,
      vz: this.vz,
      rx: this.rx,
      ry: this.ry,
      rz: this.rz,
      onGround: this.onGround,
    };
  }

  applyWorldPose(pose: WorldPose): void {
    try {
      this.fire("FREEZE_LATITUDE_LONGITUDE_SET", 0);
      const far =
        !this.hasPosition() || metersBetween(this.lat, this.lon, pose.lat, pose.lon) > 25;
      const now = Date.now();
      if (far && now - this.lastWarpAt > 400) {
        this.lastWarpAt = now;
        const init = new sc.RawBuffer(56);
        init.writeFloat64(pose.lat);
        init.writeFloat64(pose.lon);
        init.writeFloat64(pose.alt);
        init.writeFloat64(pose.onGround ? 0 : pose.pitch);
        init.writeFloat64(pose.onGround ? 0 : pose.bank);
        init.writeFloat64(pose.heading);
        init.writeInt32(pose.onGround ? 1 : 0);
        init.writeInt32(pose.onGround ? 0 : Math.max(0, Math.round(Math.hypot(pose.vx ?? 0, pose.vz ?? 0) * 0.592484)));
        this.handle.setDataOnSimObject(INIT_POSE_WRITE, sc.SimConnectConstants.OBJECT_ID_USER, {
          buffer: init,
          arrayCount: 0,
          tagged: false,
        });
      }
      const ground = new sc.RawBuffer(32);
      ground.writeFloat64(pose.lat);
      ground.writeFloat64(pose.lon);
      ground.writeFloat64(pose.alt);
      ground.writeFloat64(pose.heading);
      this.handle.setDataOnSimObject(GROUND_POSE_WRITE, sc.SimConnectConstants.OBJECT_ID_USER, {
        buffer: ground,
        arrayCount: 0,
        tagged: false,
      });
      if (!pose.onGround) {
        const poseBuf = new sc.RawBuffer(48);
        poseBuf.writeFloat64(pose.lat);
        poseBuf.writeFloat64(pose.lon);
        poseBuf.writeFloat64(pose.alt);
        poseBuf.writeFloat64(pose.pitch);
        poseBuf.writeFloat64(pose.bank);
        poseBuf.writeFloat64(pose.heading);
        this.handle.setDataOnSimObject(POSE_WRITE, sc.SimConnectConstants.OBJECT_ID_USER, {
          buffer: poseBuf,
          arrayCount: 0,
          tagged: false,
        });
      }
      const velBuf = new sc.RawBuffer(24);
      velBuf.writeFloat64(pose.vx ?? 0);
      velBuf.writeFloat64(pose.onGround ? 0 : (pose.vy ?? 0));
      velBuf.writeFloat64(pose.vz ?? 0);
      this.handle.setDataOnSimObject(VEL_WRITE, sc.SimConnectConstants.OBJECT_ID_USER, {
        buffer: velBuf,
        arrayCount: 0,
        tagged: false,
      });
      const rotBuf = new sc.RawBuffer(24);
      rotBuf.writeFloat64(pose.onGround ? 0 : (pose.rx ?? 0));
      rotBuf.writeFloat64(pose.ry ?? 0);
      rotBuf.writeFloat64(pose.onGround ? 0 : (pose.rz ?? 0));
      this.handle.setDataOnSimObject(ROT_WRITE, sc.SimConnectConstants.OBJECT_ID_USER, {
        buffer: rotBuf,
        arrayCount: 0,
        tagged: false,
      });
    } catch (err) {
      console.warn("[twinseat] pose write skipped", err instanceof Error ? err.message : err);
    }
  }

  setFollowPose(pose: WorldPose | null): void {
    this.followPose = pose;
  }

  syncCrewPins(seats: Seat[]): void {
    this.pinSeats = new Set(seats);
    for (const seat of [...this.avatarIds.keys()]) {
      if (!this.pinSeats.has(seat)) this.removeAvatar(seat);
    }
    this.spawnMissingAvatars();
  }

  setPhysicsHold(on: boolean, force = false): void {
    if (!force && this.physicsHold === on) return;
    this.physicsHold = on;
    this.enforceFreeze(true);
  }

  private enforceFreeze(force = false): void {
    const wantLat = 0;
    const wantAlt = this.physicsHold ? 1 : 0;
    const wantAtt = this.physicsHold ? 1 : 0;
    if (force || this.freezeLat > 0.5) this.fire("FREEZE_LATITUDE_LONGITUDE_SET", wantLat);
    if (force || (this.freezeAlt > 0.5) !== (wantAlt === 1)) this.fire("FREEZE_ALTITUDE_SET", wantAlt);
    if (force || (this.freezeAtt > 0.5) !== (wantAtt === 1)) this.fire("FREEZE_ATTITUDE_SET", wantAtt);
  }

  private pumpCmd(name: string, data: number): void {
    if (!this.cmdReady) return;
    const seq = this.cmdSeq++ >>> 0 || 1;
    const buf = Buffer.alloc(64);
    buf.writeUInt32LE(seq, 0);
    buf.writeInt32LE(data | 0, 4);
    buf.write(name.replace(/[^A-Z0-9_]/gi, "").slice(0, 55), 8, "ascii");
    try {
      this.handle.setClientData(CMD_DATA_ID, CMD_DEF_ID, 0, 0, 64, buf);
    } catch {
      this.cmdReady = false;
    }
  }

  read(v: PackVar): number {
    return this.values.get(v.id) ?? 0;
  }

  write(v: PackVar, value: number): void {
    this.values.set(v.id, value);
    this.writing.add(v.id);
    const buf = new sc.RawBuffer(16);
    buf.writeFloat64(value);
    this.handle.setDataOnSimObject(WRITE_BASE + v.id, sc.SimConnectConstants.OBJECT_ID_USER, {
      buffer: buf,
      arrayCount: 0,
      tagged: false,
    });
    this.fireAxis(v.sim, value);
    for (const discrete of discreteEventsForVar(v.sim, value)) {
      if (this.lastDiscrete.get(discrete.name) === discrete.data) continue;
      this.lastDiscrete.set(discrete.name, discrete.data);
      this.fire(discrete.name, discrete.data);
    }
    setTimeout(() => this.writing.delete(v.id), 160);
  }

  camera() {
    return { yaw: this.yaw, pitch: this.pitch, roll: this.roll };
  }

  tick(): void {
    this.spawnMissingAvatars();
  }

  private pinAfterPose(): void {
    if (this.placing) return;
    this.placing = true;
    try {
      if (this.followPose) this.applyWorldPose(this.followPose);
      this.spawnMissingAvatars();
      for (const [seat, id] of this.avatarIds) this.placeAvatar(seat, id);
    } finally {
      this.placing = false;
    }
  }

  private pinSource(): {
    lat: number;
    lon: number;
    alt: number;
    pitch: number;
    bank: number;
    heading: number;
  } | null {
    if (this.followPose) {
      return {
        lat: this.followPose.lat,
        lon: this.followPose.lon,
        alt: this.followPose.alt,
        pitch: this.followPose.onGround ? 0 : this.followPose.pitch,
        bank: this.followPose.onGround ? 0 : this.followPose.bank,
        heading: this.followPose.heading,
      };
    }
    if (!this.hasPosition()) return null;
    return {
      lat: this.lat,
      lon: this.lon,
      alt: this.alt,
      pitch: this.pitchDeg,
      bank: this.bankDeg,
      heading: this.headingDeg,
    };
  }

  private spawnMissingAvatars(): void {
    if (this.closed) return;
    const src = this.pinSource();
    if (!src) return;
    const now = Date.now();
    for (const seat of this.pinSeats) {
      if (this.avatarIds.has(seat) || this.avatarPending.has(seat)) continue;
      if (now - (this.avatarSpawnAt.get(seat) ?? 0) < 8000) continue;
      this.avatarSpawnAt.set(seat, now);
      this.avatarPending.add(seat);
      try {
        const off = seatOffset(this.pack, seat);
        const world = bodyOffsetToWorld(src.lat, src.lon, src.alt, src.pitch, src.bank, src.heading, off.x, off.y, off.z);
        const init = new sc.InitPosition();
        init.latitude = world.lat;
        init.longitude = world.lon;
        init.altitude = world.alt;
        init.pitch = world.pitch;
        init.bank = world.bank;
        init.heading = world.heading;
        init.onGround = false;
        init.airspeed = 0;
        this.handle.aICreateSimulatedObject(AVATAR_TITLE, init, AVATAR_REQ[seat]);
      } catch (err) {
        this.avatarPending.delete(seat);
        console.warn("[twinseat] avatar spawn skipped", err instanceof Error ? err.message : err);
      }
    }
  }

  private placeAvatar(seat: Seat, objectId: number): void {
    const src = this.pinSource();
    if (!src) return;
    const off = seatOffset(this.pack, seat);
    const world = bodyOffsetToWorld(src.lat, src.lon, src.alt, src.pitch, src.bank, src.heading, off.x, off.y, off.z);
    try {
      const buf = new sc.RawBuffer(48);
      buf.writeFloat64(world.lat);
      buf.writeFloat64(world.lon);
      buf.writeFloat64(world.alt);
      buf.writeFloat64(world.pitch);
      buf.writeFloat64(world.bank);
      buf.writeFloat64(world.heading);
      this.handle.setDataOnSimObject(AVATAR_POSE_DEF, objectId, {
        buffer: buf,
        arrayCount: 0,
        tagged: false,
      });
    } catch {
      /* object gone */
    }
  }

  private freezeAvatar(objectId: number): void {
    try {
      this.handle.aIReleaseControl(objectId, 80);
    } catch {
      /* ignore */
    }
    this.fireOn(objectId, "FREEZE_LATITUDE_LONGITUDE_SET", 1);
    this.fireOn(objectId, "FREEZE_ALTITUDE_SET", 1);
    this.fireOn(objectId, "FREEZE_ATTITUDE_SET", 1);
  }

  private removeAvatar(seat: Seat): void {
    const id = this.avatarIds.get(seat);
    this.avatarIds.delete(seat);
    this.avatarPending.delete(seat);
    if (id == null) return;
    try {
      this.handle.aIRemoveObject(id, 90 + AVATAR_REQ[seat]);
    } catch {
      /* already gone */
    }
  }

  private dropAvatars(): void {
    for (const seat of [...this.avatarIds.keys()]) this.removeAvatar(seat);
    this.avatarPending.clear();
  }

  private fireOn(objectId: number, name: string, data: number): void {
    let id = this.fireIds.get(name);
    if (id == null) {
      id = this.nextFireId++;
      this.fireIds.set(name, id);
      this.handle.mapClientEventToSimEvent(id, name);
    }
    try {
      this.handle.transmitClientEvent(
        objectId,
        id,
        data >>> 0,
        sc.NotificationPriority.HIGHEST,
        sc.EventFlag.EVENT_FLAG_GROUPID_IS_PRIORITY,
      );
    } catch {
      /* ignore */
    }
  }

  private fire(name: string, data: number): void {
    let id = this.fireIds.get(name);
    if (id == null) {
      id = this.nextFireId++;
      this.fireIds.set(name, id);
      this.handle.mapClientEventToSimEvent(id, name);
    }
    const targets = [sc.SimConnectConstants.OBJECT_ID_USER, 1];
    for (const objectId of targets) {
      try {
        this.handle.transmitClientEvent(
          objectId,
          id,
          data >>> 0,
          sc.NotificationPriority.HIGHEST,
          sc.EventFlag.EVENT_FLAG_GROUPID_IS_PRIORITY,
        );
      } catch {
        /* ignore */
      }
      try {
        this.handle.transmitClientEventEx(
          objectId,
          id,
          sc.NotificationPriority.HIGHEST,
          sc.EventFlag.EVENT_FLAG_GROUPID_IS_PRIORITY,
          data >>> 0,
        );
      } catch {
        /* older sim */
      }
    }
    this.pumpCmd(name, data >>> 0);
    for (const [cid, n] of this.eventByClient) {
      if (n === name) this.muteEvent.set(cid, Date.now() + 180);
    }
  }

  private fireAxis(sim: string, value: number): void {
    const axis = (n: number) => Math.max(-16384, Math.min(16383, Math.round(n * 16384)));
    const throttle = (p: number) => {
      if (Math.abs(p) > 120) return Math.max(0, Math.min(16383, Math.round(p)));
      return Math.max(0, Math.min(16383, Math.round((p / 100) * 16383)));
    };
    const pairs: { name: string; data: number }[] = [];
    switch (sim) {
      case "YOKE POSITION X":
      case "AILERON POSITION":
        pairs.push({ name: "AXIS_AILERONS_SET", data: axis(value) });
        break;
      case "YOKE POSITION Y":
      case "ELEVATOR POSITION":
        pairs.push({ name: "AXIS_ELEVATOR_SET", data: axis(value) });
        break;
      case "RUDDER PEDAL POSITION":
      case "RUDDER POSITION":
        pairs.push({ name: "AXIS_RUDDER_SET", data: axis(value) });
        break;
      case "GENERAL ENG THROTTLE LEVER POSITION:1":
      case "L:WT_Virtual_Throttle_Lever_Pos_1":
        pairs.push({ name: "AXIS_THROTTLE1_SET", data: throttle(value) });
        pairs.push({ name: "THROTTLE1_SET", data: throttle(value) });
        break;
      case "GENERAL ENG THROTTLE LEVER POSITION:2":
      case "L:WT_Virtual_Throttle_Lever_Pos_2":
        pairs.push({ name: "AXIS_THROTTLE2_SET", data: throttle(value) });
        pairs.push({ name: "THROTTLE2_SET", data: throttle(value) });
        break;
      case "GENERAL ENG THROTTLE LEVER POSITION:3":
      case "L:WT_Virtual_Throttle_Lever_Pos_3":
        pairs.push({ name: "AXIS_THROTTLE3_SET", data: throttle(value) });
        pairs.push({ name: "THROTTLE3_SET", data: throttle(value) });
        break;
      case "GENERAL ENG THROTTLE LEVER POSITION:4":
      case "L:WT_Virtual_Throttle_Lever_Pos_4":
        pairs.push({ name: "AXIS_THROTTLE4_SET", data: throttle(value) });
        pairs.push({ name: "THROTTLE4_SET", data: throttle(value) });
        break;
      default:
        return;
    }
    for (const pair of pairs) {
      if (this.lastAxis.get(pair.name) === pair.data) continue;
      this.lastAxis.set(pair.name, pair.data);
      this.fire(pair.name, pair.data >>> 0);
    }
  }

  transmitEvent(name: string, data: number, fromNetwork = false): void {
    const events = this.pack.events ?? [];
    const idx = events.findIndex((e) => e.sim === name);
    if (idx < 0) return;
    const eventId = EVENT_BASE + idx;
    if (!this.eventsMapped.has(name)) {
      this.handle.mapClientEventToSimEvent(eventId, name);
      this.eventsMapped.add(name);
    }
    this.fire(name, data >>> 0);
    this.muteEvent.set(eventId, Date.now() + 180);
    if (!fromNetwork) this.outbound.push({ name, data });
  }

  drainEvents(): { name: string; data: number }[] {
    const out = this.outbound;
    this.outbound = [];
    return out;
  }

  zulu(): { hour: number; minute: number } | null {
    if (!Number.isFinite(this.zuluHours)) return null;
    return { hour: this.zuluHours, minute: this.zuluMinutes };
  }

  applyZuluHour(hour: number): void {
    if (!Number.isFinite(hour)) return;
    const h = ((Math.floor(hour) % 24) + 24) % 24;
    const m = Math.max(0, Math.min(59, Math.round((hour % 1) * 60)));
    this.fire("ZULU_HOURS_SET", h);
    this.fire("ZULU_MINUTES_SET", m);
  }

  applyInputEvent(hash: bigint, value: number): void {
    try {
      this.muteInput.set(hash.toString(), Date.now() + 220);
      this.handle.setInputEvent(hash, value);
    } catch (err) {
      console.warn("[twinseat] input event write skipped", err instanceof Error ? err.message : err);
    }
  }

  drainInputEvents(): { hash: bigint; value: number }[] {
    const out = this.outboundInput;
    this.outboundInput = [];
    return out;
  }
}

export async function createSim(pack: AircraftPack): Promise<SimBackend> {
  const live = await connectMsfs(pack);
  if (live) {
    console.log("[twinseat] SimConnect connected");
    return live;
  }
  console.log("[twinseat] SimConnect not found, mock cockpit");
  return new MockSim(pack);
}
