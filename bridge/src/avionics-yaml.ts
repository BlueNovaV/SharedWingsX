import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Domain } from "@twinseat/protocol";
import type { AircraftPack, PackVar } from "./pack.js";

export type YamlLink = {
  get: string;
  set?: string;
  skp?: string;
};

export type YamlModule = {
  include: string[];
  shared: YamlLink[];
  master: YamlLink[];
  ignore: string[];
};

export type CalcMap = {
  get: string;
  set?: string;
  units: string;
};

const BANNED = /\b(process|require|import|eval|Function|globalThis|window|document|child_process)\b/;

export function avionicsYamlDir(): string {
  if (process.env.TWINSEAT_AVIONICS_YAML) return process.env.TWINSEAT_AVIONICS_YAML;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return join(here, "..", "..", "third_party", "avionics-yaml");
  } catch {
    return join(process.cwd(), "third_party", "avionics-yaml");
  }
}

export function parseAvionicsYaml(text: string): YamlModule {
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const out: YamlModule = { include: [], shared: [], master: [], ignore: [] };
  let section: "include" | "shared" | "master" | "ignore" | "" = "";
  let item: YamlLink | null = null;
  let collectingSet = false;
  let setIndent = 0;
  let setBuf: string[] = [];

  const flushSet = () => {
    if (!collectingSet || !item) return;
    item.set = setBuf.join("\n").replace(/\n$/, "");
    collectingSet = false;
    setBuf = [];
  };

  const pushItem = () => {
    flushSet();
    if (!item?.get) {
      item = null;
      return;
    }
    if (section === "shared") out.shared.push(item);
    else if (section === "master") out.master.push(item);
    item = null;
  };

  for (const raw of lines) {
    if (collectingSet) {
      const indent = raw.length - raw.trimStart().length;
      if (raw.trim() === "") {
        setBuf.push("");
        continue;
      }
      if (indent > setIndent) {
        setBuf.push(raw.slice(setIndent + 2) || raw.trim());
        continue;
      }
      flushSet();
    }
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed === "include:") {
      pushItem();
      section = "include";
      continue;
    }
    if (trimmed === "shared:") {
      pushItem();
      section = "shared";
      continue;
    }
    if (trimmed === "master:") {
      pushItem();
      section = "master";
      continue;
    }
    if (trimmed === "ignore:") {
      pushItem();
      section = "ignore";
      continue;
    }
    if (section === "include" && trimmed.startsWith("- ")) {
      out.include.push(trimmed.slice(2).trim());
      continue;
    }
    if (section === "ignore" && trimmed.startsWith("- ")) {
      out.ignore.push(trimmed.slice(2).trim());
      continue;
    }
    const getMatch = trimmed.match(/^- get:\s*(.*)$/);
    if (getMatch) {
      pushItem();
      item = { get: stripHashComment(getMatch[1] ?? "").trim() };
      continue;
    }
    if (!item) continue;
    const setMatch = raw.match(/^\s+set:\s*(.*)$/);
    if (setMatch) {
      const rest = (setMatch[1] ?? "").trim();
      if (rest === "|" || rest === ">" || rest === "|-" || rest === ">-") {
        collectingSet = true;
        setIndent = raw.length - raw.trimStart().length;
        setBuf = [];
        continue;
      }
      item.set = unquoteYamlScalar(rest);
      continue;
    }
    const skpMatch = raw.match(/^\s+skp:\s*(.*)$/);
    if (skpMatch) item.skp = stripHashComment(skpMatch[1] ?? "").trim();
  }
  pushItem();
  return out;
}

export function stripHashComment(s: string): string {
  let inS = false;
  let inD = false;
  let inT = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inD && !inT) inS = !inS;
    else if (c === '"' && !inS && !inT) inD = !inD;
    else if (c === "`" && !inS && !inD) inT = !inT;
    else if (c === "#" && !inS && !inD && !inT) return s.slice(0, i).trimEnd();
  }
  return s;
}

export function unquoteYamlScalar(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export function parseGet(raw: string): { kind: string; sim: string; units: string; get: string } | null {
  const get = stripHashComment(raw).trim();
  if (get.length < 3 || get[1] !== ":") return null;
  const kind = get[0]!.toUpperCase();
  const rest = get.slice(2);
  const comma = rest.indexOf(",");
  const name = (comma >= 0 ? rest.slice(0, comma) : rest).trim();
  const units = (comma >= 0 ? rest.slice(comma + 1) : "").trim();
  if (kind === "A") {
    return { kind, sim: name, units: units || "Number", get };
  }
  if (kind === "L") {
    return { kind, sim: `L:${name}`, units: units || "Number", get };
  }
  if (kind === "H") {
    const event = name.replace(/\s.*/, "");
    return { kind, sim: `H:${event}`, units: "Number", get: `H:${event}` };
  }
  return null;
}

export function evalCalcSet(link: YamlLink, value: number, current: number): string {
  const parsed = parseGet(link.get);
  const get = parsed?.get ?? link.get.trim();
  const units = parsed?.units ?? "Number";
  const set = link.set?.trim();
  const valueStr = formatNum(value);
  if (!set) {
    if (parsed?.kind === "H") return `1 (>${parsed.sim})`;
    return units ? `${valueStr} (>${get}, ${units})` : `${valueStr} (>${get})`;
  }
  if (BANNED.test(set)) return "";
  if (/['`?{}]/.test(set) || /^\s*(switch|if\b)/.test(set) || set.includes("return ")) {
    try {
      const body = /^\s*(switch|if\b)/.test(set) || set.includes("return ")
        ? `"use strict"; ${set}`
        : `"use strict"; return (${set});`;
      const out = Function("value", "current", body)(value, current);
      return String(out ?? "");
    } catch {
      return "";
    }
  }
  if (set.startsWith("(")) return `${valueStr} ${set}`;
  return set;
}

export function sanitizeRpn(code: string): string {
  const s = code.replace(/\s+/g, " ").trim().slice(0, 240);
  if (!s) return "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const ok =
      (c >= 48 && c <= 57) ||
      (c >= 65 && c <= 90) ||
      (c >= 97 && c <= 122) ||
      c === 32 ||
      c === 40 ||
      c === 41 ||
      c === 44 ||
      c === 46 ||
      c === 58 ||
      c === 61 ||
      c === 62 ||
      c === 95 ||
      c === 43 ||
      c === 45 ||
      c === 42 ||
      c === 47;
    if (!ok) return "";
  }
  return s;
}

export function loadAvionicsModuleFile(rel: string, root = avionicsYamlDir(), seen = new Set<string>()): YamlLink[] {
  const file = join(root, "Definitions", ...rel.split("/"));
  if (seen.has(file) || !existsSync(file)) return [];
  seen.add(file);
  const parsed = parseAvionicsYaml(readFileSync(file, "utf8"));
  const links: YamlLink[] = [];
  for (const inc of parsed.include) links.push(...loadAvionicsModuleFile(inc, root, seen));
  links.push(...parsed.shared, ...parsed.master);
  return links;
}

export function modulesForTitle(aircraftTitle: string, packId?: string): string[] {
  const t = aircraftTitle.toLowerCase();
  const out: string[] = [];
  const g1000 =
    packId === "asobo-c172" ||
    /g1000|\bnxi\b|garmin 1000|skyhawk|cessna 172|cessna 182|da40|da62|sr22|bonanza|baron|tbm 930|pc-12|pc12/.test(t);
  if (g1000) out.push("modules/AS_G1000_NXi.yaml");
  if (/gtn\s*750|gtn\s*650|pms50/.test(t)) out.push("modules/PMS50_GTN_650-750.yaml");
  if (/gns\s*530|as530/.test(t)) out.push("modules/AS_GNS530.yaml");
  if (/gns\s*430|as430/.test(t)) out.push("modules/AS_GNS430.yaml");
  return [...new Set(out)];
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

function domainForSim(sim: string): Domain {
  const u = sim.toUpperCase();
  if (/COM |NAV |ADF|XPNDR|TRANSPONDER|KOHLSMAN/.test(u)) return "atc";
  if (/AUTOPILOT|FLIGHT DIRECTOR|YAW DAMPER/.test(u)) return "monitoring";
  return "shared";
}

function epsilonFor(units: string): number {
  const u = units.toLowerCase();
  if (u.includes("bool") || u.includes("enum")) return 0.5;
  if (u.includes("hz")) return 1;
  if (u.includes("feet") && u.includes("minute")) return 20;
  if (u.includes("feet")) return 5;
  if (u.includes("degree")) return 0.35;
  if (u.includes("millibar")) return 0.05;
  if (u.includes("percent")) return 1;
  if (u.includes("knot")) return 0.5;
  return 0.25;
}

export function linksToVars(links: YamlLink[], startId: number): PackVar[] {
  const seen = new Set<string>();
  const vars: PackVar[] = [];
  let id = startId;
  for (const link of links) {
    const parsed = parseGet(link.get);
    if (!parsed) continue;
    if (seen.has(parsed.sim)) continue;
    seen.add(parsed.sim);
    const calc: CalcMap = { get: parsed.get, set: link.set, units: parsed.units };
    vars.push({
      id: id++,
      name: parsed.sim,
      sim: parsed.sim,
      unit: parsed.units,
      domain: domainForSim(parsed.sim),
      sync: true,
      epsilon: epsilonFor(parsed.units),
      calc,
    });
    if (vars.length >= 280) break;
  }
  return vars;
}

export function applyAvionicsYamlModules(pack: AircraftPack, aircraftTitle: string): AircraftPack {
  const mods = modulesForTitle(aircraftTitle, pack.id);
  if (!mods.length) return pack;
  const have = new Set(pack.variables.map((v) => v.sim));
  const links = mods.flatMap((m) => loadAvionicsModuleFile(m));
  const extra = linksToVars(links, 5000).filter((v) => !have.has(v.sim));
  if (!extra.length) return pack;
  return { ...pack, variables: [...pack.variables, ...extra] };
}
