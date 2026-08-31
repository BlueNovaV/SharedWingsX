import type { AircraftPack, PackVar } from "./pack.js";

export type SimIdentity = {
  connected: boolean;
  mock: boolean;
  inWorld: boolean;
  aircraftTitle: string;
  simBuild: string;
  simProduct: "MSFS2020" | "MSFS2024";
  liveryHash: string;
  airportIcao?: string;
  airportCity?: string;
  airportCountry?: string;
  lat?: number;
  lon?: number;
  onGround?: boolean;
};

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

export interface SimBackend {
  identity(): SimIdentity;
  worldPose(): WorldPose | null;
  applyWorldPose(pose: WorldPose): void;
  setPhysicsHold(on: boolean, force?: boolean): void;
  read(v: PackVar): number;
  write(v: PackVar, value: number): void;
  camera(): { yaw: number; pitch: number; roll: number };
  tick(dtMs: number): void;
  transmitEvent(name: string, data: number, fromNetwork?: boolean): void;
  drainEvents(): { name: string; data: number }[];
  applyInputEvent(hash: bigint, value: number): void;
  drainInputEvents(): { hash: bigint; value: number }[];
}

export class MockSim implements SimBackend {
  values = new Map<number, number>();
  yaw = 0;
  pitch = 0;
  roll = 0;
  aircraftTitle: string;
  private outbound: { name: string; data: number }[] = [];
  private outboundInput: { hash: bigint; value: number }[] = [];
  constructor(pack: AircraftPack, aircraftTitle?: string) {
    this.aircraftTitle = aircraftTitle ?? pack.titleMatchers[0] ?? pack.name;
    for (const v of pack.variables) {
      this.values.set(v.id, v.domain === "flying" && v.id <= 3 ? 0 : 0);
    }
    const thr = pack.variables.find((v) => v.name.includes("THROTTLE"));
    if (thr) this.values.set(thr.id, 0);
  }
  identity(): SimIdentity {
    return {
      connected: true,
      mock: true,
      inWorld: false,
      aircraftTitle: this.aircraftTitle,
      simBuild: "mock-0",
      simProduct: "MSFS2024",
      liveryHash: "",
    };
  }
  worldPose() {
    return null;
  }
  applyWorldPose(): void {}
  setPhysicsHold(_on: boolean, _force?: boolean): void {}
  read(v: PackVar): number {
    return this.values.get(v.id) ?? 0;
  }
  write(v: PackVar, value: number): void {
    this.values.set(v.id, value);
  }
  camera() {
    return { yaw: this.yaw, pitch: this.pitch, roll: this.roll };
  }
  tick(dtMs: number): void {
    this.yaw = Math.sin(Date.now() / 1800) * 8;
    this.pitch = Math.cos(Date.now() / 2200) * 3;
    void dtMs;
  }
  transmitEvent(name: string, data: number, fromNetwork = false): void {
    if (!fromNetwork) this.outbound.push({ name, data });
  }
  drainEvents(): { name: string; data: number }[] {
    const out = this.outbound;
    this.outbound = [];
    return out;
  }
  applyInputEvent(): void {}
  drainInputEvents(): { hash: bigint; value: number }[] {
    const out = this.outboundInput;
    this.outboundInput = [];
    return out;
  }
}

export function applyRemoteVar(sim: SimBackend, pack: AircraftPack, id: number, value: number): void {
  const v = pack.variables.find((x) => x.id === id);
  if (!v || !v.sync) return;
  sim.write(v, value);
}
