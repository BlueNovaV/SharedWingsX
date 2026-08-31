import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Domain, PresenceSupport, Seat } from "@twinseat/protocol";
import { COCKPIT_SIM_EVENTS } from "./sim-events.js";
import { applyAvionicsYamlModules } from "./avionics-yaml.js";

export type PackVar = {
  id: number;
  name: string;
  sim: string;
  unit: string;
  domain: Domain;
  sync: boolean;
  epsilon: number;
  calc?: { get: string; set?: string; units: string };
};

export type PackEvent = {
  id: number;
  name: string;
  sim: string;
  domain: Domain;
};

export const DEFAULT_ATC_EVENTS: PackEvent[] = [
  { id: 101, name: "ATC", sim: "ATC", domain: "atc" },
  { id: 102, name: "ATC_MENU_1", sim: "ATC_MENU_1", domain: "atc" },
  { id: 103, name: "ATC_MENU_2", sim: "ATC_MENU_2", domain: "atc" },
  { id: 104, name: "ATC_MENU_3", sim: "ATC_MENU_3", domain: "atc" },
  { id: 105, name: "ATC_MENU_4", sim: "ATC_MENU_4", domain: "atc" },
  { id: 106, name: "ATC_MENU_5", sim: "ATC_MENU_5", domain: "atc" },
  { id: 107, name: "ATC_MENU_6", sim: "ATC_MENU_6", domain: "atc" },
  { id: 108, name: "ATC_MENU_7", sim: "ATC_MENU_7", domain: "atc" },
  { id: 109, name: "ATC_MENU_8", sim: "ATC_MENU_8", domain: "atc" },
  { id: 110, name: "ATC_MENU_9", sim: "ATC_MENU_9", domain: "atc" },
  { id: 111, name: "COM_STBY_RADIO_SWAP", sim: "COM_STBY_RADIO_SWAP", domain: "atc" },
  { id: 112, name: "COM2_RADIO_SWAP", sim: "COM2_RADIO_SWAP", domain: "atc" },
  { id: 113, name: "XPNDR_IDENT", sim: "XPNDR_IDENT", domain: "atc" },
];

export const DEFAULT_COCKPIT_EVENTS: PackEvent[] = COCKPIT_SIM_EVENTS.map((sim, i) => ({
  id: 200 + i,
  name: sim,
  sim,
  domain: "shared" as Domain,
}));

function mergeEvents(pack: AircraftPack): PackEvent[] {
  const seen = new Set<string>();
  const out: PackEvent[] = [];
  for (const ev of [...DEFAULT_COCKPIT_EVENTS, ...DEFAULT_ATC_EVENTS, ...(pack.events ?? [])]) {
    if (seen.has(ev.sim)) continue;
    seen.add(ev.sim);
    out.push(ev);
  }
  return out;
}

export type AircraftPack = {
  id: string;
  name: string;
  support: PresenceSupport;
  sim: string[];
  titleMatchers: string[];
  sharedLockMs: number;
  minDeltaMs: number;
  notes?: string;
  fallback?: boolean;
  presence: {
    support: PresenceSupport;
    selfSeatDefault: "left" | "right" | "jumpLeft" | "jumpRight";
    nodes: { left: string; right: string; jumpLeft?: string; jumpRight?: string };
    remoteSeat: {
      offset: { x: number; y: number; z: number };
      pbh: { pitch: number; bank: number; heading: number };
    };
    seats?: Partial<
      Record<
        "left" | "right" | "jumpLeft" | "jumpRight",
        { offset: { x: number; y: number; z: number }; node?: string }
      >
    >;
    hideLocalAvatar: boolean;
  };
  events?: PackEvent[];
  variables: PackVar[];
};

export function packsDir(): string {
  if (process.env.TWINSEAT_PACKS) return process.env.TWINSEAT_PACKS;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return join(here, "..", "..", "packs");
  } catch {
    return join(process.cwd(), "packs");
  }
}

export function loadPacks(dir = packsDir()): AircraftPack[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "schema.json")
    .map((f) => {
      const pack = JSON.parse(readFileSync(join(dir, f), "utf8")) as AircraftPack;
      pack.events = mergeEvents(pack);
      return pack;
    });
}

export function findPack(packs: AircraftPack[], aircraftTitle: string, packId?: string): AircraftPack | null {
  let pack: AircraftPack | null = null;
  if (packId) pack = packs.find((p) => p.id === packId) ?? null;
  else {
    const title = aircraftTitle.toLowerCase();
    pack =
      packs.find(
        (p) => !p.fallback && p.titleMatchers.some((m) => title.includes(m.toLowerCase())),
      ) ??
      packs.find((p) => p.fallback) ??
      null;
  }
  if (!pack) return null;
  return applyAvionicsYamlModules(pack, aircraftTitle);
}

export function titleMatches(pack: AircraftPack, aircraftTitle: string): boolean {
  if (pack.fallback) return true;
  const title = aircraftTitle.toLowerCase();
  return pack.titleMatchers.some((m) => title.includes(m.toLowerCase()));
}

export function seatOffset(
  pack: AircraftPack,
  seat: Seat,
): { x: number; y: number; z: number } {
  const named = pack.presence.seats?.[seat]?.offset;
  if (named) return named;
  const fo = pack.presence.remoteSeat.offset;
  if (seat === "right") return fo;
  if (seat === "left") return { x: -fo.x, y: fo.y, z: fo.z };
  if (seat === "jumpLeft") return { x: -0.38, y: fo.y, z: -0.95 };
  return { x: 0.38, y: fo.y, z: -0.95 };
}
