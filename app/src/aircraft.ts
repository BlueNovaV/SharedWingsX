export type AircraftOption = { id: string; name: string; packId: string; group: string };

export const GROUP_LABEL: Record<string, string> = {
  Any: "Any airframe",
  Asobo: "Asobo · Microsoft",
  PMDG: "PMDG",
  Fenix: "Fenix Simulations",
  iFly: "iFly",
  iniBuilds: "iniBuilds",
  FlyByWire: "FlyByWire",
  Headwind: "Headwind",
  Salty: "Salty Simulations",
  "Working Title": "Working Title",
  Hype: "Hype Performance",
  "Just Flight": "Just Flight",
  A2A: "A2A Simulations",
  Other: "Other",
};

export const AIRCRAFT_LIST: AircraftOption[] = [
  { id: "auto", name: "Automatic (what is loaded in the sim)", packId: "generic-msfs", group: "Any" },
  { id: "asobo-c172", name: "Cessna 172 Skyhawk", packId: "asobo-c172", group: "Asobo" },
  { id: "asobo-152", name: "Cessna 152", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-182", name: "Cessna 182 Skylane", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-208", name: "Cessna 208 B Grand Caravan", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-longitude", name: "Cessna Citation Longitude", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-cj4", name: "Cessna Citation CJ4", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-da40", name: "Diamond DA40 NG", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-da62", name: "Diamond DA62", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-bonanza", name: "Beechcraft Bonanza G36", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-baron", name: "Beechcraft Baron G58", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-kingair", name: "Beechcraft King Air 350i", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-tbm", name: "Daher TBM 930", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-pc12", name: "Pilatus PC-12", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-sr22", name: "Cirrus SR22", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-pitts", name: "Aviat Pitts S-1", packId: "generic-msfs", group: "Other" },
  { id: "asobo-a320", name: "Airbus A320neo (Asobo)", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-a310", name: "Airbus A310-300", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-747", name: "Boeing 747-8i (Asobo)", packId: "generic-msfs", group: "Asobo" },
  { id: "asobo-787-10", name: "Boeing 787-10", packId: "asobo-787-10", group: "Asobo" },
  { id: "asobo-737max", name: "Boeing 737 MAX 8 (Asobo)", packId: "generic-msfs", group: "Asobo" },
  { id: "pmdg-737-600", name: "PMDG 737-600", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-737-700", name: "PMDG 737-700", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-737-800", name: "PMDG 737-800", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-737-900", name: "PMDG 737-900", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-737-max", name: "PMDG 737 MAX", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-777-200er", name: "PMDG 777-200ER", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-777-300er", name: "PMDG 777-300ER", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-777f", name: "PMDG 777F", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-747-400", name: "PMDG 747-400", packId: "generic-msfs", group: "PMDG" },
  { id: "pmdg-747-8", name: "PMDG 747-8", packId: "generic-msfs", group: "PMDG" },
  { id: "fenix-a319", name: "Fenix A319", packId: "generic-msfs", group: "Fenix" },
  { id: "fenix-a320", name: "Fenix A320", packId: "generic-msfs", group: "Fenix" },
  { id: "fenix-a321", name: "Fenix A321", packId: "generic-msfs", group: "Fenix" },
  { id: "ifly-737max", name: "iFly 737 MAX", packId: "generic-msfs", group: "iFly" },
  { id: "inibuilds-a330", name: "iniBuilds A330", packId: "generic-msfs", group: "iniBuilds" },
  { id: "inibuilds-a350", name: "iniBuilds A350", packId: "generic-msfs", group: "iniBuilds" },
  { id: "inibuilds-a380", name: "iniBuilds A380", packId: "generic-msfs", group: "iniBuilds" },
  { id: "flybywire-a32nx", name: "FlyByWire A32NX", packId: "generic-msfs", group: "FlyByWire" },
  { id: "flybywire-a380", name: "FlyByWire A380", packId: "generic-msfs", group: "FlyByWire" },
  { id: "headwind-a339", name: "Headwind A330-900", packId: "generic-msfs", group: "Headwind" },
  { id: "salty-747", name: "Salty Simulations 747", packId: "generic-msfs", group: "Salty" },
  { id: "workingtitle-cj4", name: "Working Title CJ4", packId: "generic-msfs", group: "Working Title" },
  { id: "hype-atr", name: "Hype Performance ATR", packId: "generic-msfs", group: "Hype" },
  { id: "justflight-pa28", name: "Just Flight PA-28", packId: "generic-msfs", group: "Just Flight" },
  { id: "a2a-comanche", name: "A2A Comanche", packId: "generic-msfs", group: "A2A" },
  { id: "piston-other", name: "Other piston / GA", packId: "generic-msfs", group: "Other" },
  { id: "jet-other", name: "Other airliner / jet", packId: "generic-msfs", group: "Other" },
];

export function aircraftOptionsHtml(selected: string): string {
  const groups = [...new Set(AIRCRAFT_LIST.map((a) => a.group))];
  return groups
    .map((group) => {
      const opts = AIRCRAFT_LIST.filter((a) => a.group === group)
        .map(
          (a) =>
            `<option value="${a.id}" ${selected === a.id ? "selected" : ""}>${a.name}</option>`,
        )
        .join("");
      return `<optgroup label="${GROUP_LABEL[group] ?? group}">${opts}</optgroup>`;
    })
    .join("");
}

export function packIdForAircraft(aircraftId: string): string {
  return AIRCRAFT_LIST.find((a) => a.id === aircraftId)?.packId ?? "generic-msfs";
}

const MAKER_MARKS: { maker: string; re: RegExp }[] = [
  { maker: "PMDG", re: /\bpmdg\b/i },
  { maker: "Fenix", re: /\bfenix\b/i },
  { maker: "iFly", re: /\bifly\b/i },
  { maker: "iniBuilds", re: /inibuilds|ini-builds/i },
  { maker: "FlyByWire", re: /flybywire|fly by wire|\bfbw\b|a32nx/i },
  { maker: "Working Title", re: /working\s*title/i },
  { maker: "Just Flight", re: /just\s*flight/i },
  { maker: "Hype Performance", re: /hype\s*performance/i },
  { maker: "Headwind", re: /\bheadwind\b/i },
  { maker: "Salty Simulations", re: /\bsalty\b/i },
  { maker: "A2A", re: /\ba2a\b/i },
  { maker: "Got Friends", re: /got\s*friends/i },
  { maker: "Aviat", re: /\baviat\b|\bpitts\b/i },
];

export function detectMaker(text: string): string {
  for (const row of MAKER_MARKS) {
    if (row.re.test(text)) return row.maker;
  }
  return "";
}

function formatKnownAircraft(a: AircraftOption): string {
  const maker =
    a.group === "Asobo"
      ? "Asobo"
      : a.group === "Working Title"
        ? "Working Title"
        : a.group === "Just Flight"
          ? "Just Flight"
          : a.group === "Salty"
            ? "Salty Simulations"
            : a.group === "Hype"
              ? "Hype Performance"
              : a.group === "A2A"
                ? "A2A"
                : a.group;
  let name = a.name.replace(/\s*\(Asobo\)\s*/g, "").trim();
  const escaped = maker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  name = name.replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
  if (a.group === "Other" || a.group === "Any") return name;
  return `${maker} · ${name}`;
}

export function displayAircraftLine(title: string): string {
  const raw = title
    .replace(/ATCCOM\.[A-Za-z0-9_.]+/gi, " ")
    .replace(/\.text\b/gi, " ")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";
  const matched = matchAircraftFromTitle(raw);
  if (matched && matched.id !== "auto" && matched.group !== "Other") {
    return formatKnownAircraft(matched);
  }
  const maker = detectMaker(raw);
  if (maker && !raw.toLowerCase().includes(maker.toLowerCase())) return `${maker} · ${raw}`;
  return raw;
}

export function matchAircraftFromTitle(title: string): AircraftOption | undefined {
  const t = title.toLowerCase();
  if (t.length < 3) return undefined;
  const maker = detectMaker(title);
  const hints: { id: string; needles: string[]; makers?: string[] }[] = [
    { id: "pmdg-737-max", needles: ["737 max", "737-8", "737-9", "b38m"], makers: ["PMDG"] },
    { id: "pmdg-737-900", needles: ["737-900", "737 900"], makers: ["PMDG"] },
    { id: "pmdg-737-800", needles: ["737-800", "737 800", "b738", "pmdg 738"], makers: ["PMDG"] },
    { id: "pmdg-737-700", needles: ["737-700", "737 700"], makers: ["PMDG"] },
    { id: "pmdg-737-600", needles: ["737-600", "737 600"], makers: ["PMDG"] },
    { id: "pmdg-777-300er", needles: ["777-300", "777 300", "b77w"], makers: ["PMDG"] },
    { id: "pmdg-777-200er", needles: ["777-200", "777 200"], makers: ["PMDG"] },
    { id: "pmdg-777f", needles: ["777f"], makers: ["PMDG"] },
    { id: "pmdg-747-8", needles: ["747-8", "747 8"], makers: ["PMDG"] },
    { id: "pmdg-747-400", needles: ["747-400", "747 400"], makers: ["PMDG"] },
    { id: "fenix-a321", needles: ["a321"], makers: ["Fenix"] },
    { id: "fenix-a320", needles: ["a320"], makers: ["Fenix"] },
    { id: "fenix-a319", needles: ["a319"], makers: ["Fenix"] },
    { id: "ifly-737max", needles: ["737 max", "737-8"], makers: ["iFly"] },
    { id: "inibuilds-a380", needles: ["a380"], makers: ["iniBuilds"] },
    { id: "inibuilds-a350", needles: ["a350"], makers: ["iniBuilds"] },
    { id: "inibuilds-a330", needles: ["a330"], makers: ["iniBuilds"] },
    { id: "flybywire-a380", needles: ["a380"], makers: ["FlyByWire"] },
    { id: "flybywire-a32nx", needles: ["a32nx", "a320"], makers: ["FlyByWire"] },
    { id: "headwind-a339", needles: ["a330", "a339"], makers: ["Headwind"] },
    { id: "workingtitle-cj4", needles: ["cj4", "citation"], makers: ["Working Title"] },
    { id: "hype-atr", needles: ["atr"], makers: ["Hype Performance"] },
    { id: "justflight-pa28", needles: ["pa-28", "pa28", "cherokee", "arrow"], makers: ["Just Flight"] },
    { id: "a2a-comanche", needles: ["comanche"], makers: ["A2A"] },
    { id: "asobo-787-10", needles: ["787-10", "787 10", "dreamliner"] },
    { id: "asobo-747", needles: ["747-8i"] },
    { id: "asobo-737max", needles: ["737 max 8"] },
    { id: "asobo-c172", needles: ["skyhawk", "c172"] },
    { id: "asobo-a320", needles: ["a320neo"] },
    { id: "asobo-152", needles: ["cessna 152", "c152"] },
    { id: "asobo-182", needles: ["skylane", "c182"] },
    { id: "asobo-208", needles: ["caravan", "c208"] },
    { id: "asobo-da40", needles: ["da40"] },
    { id: "asobo-da62", needles: ["da62"] },
    { id: "asobo-tbm", needles: ["tbm"] },
    { id: "asobo-pc12", needles: ["pc-12", "pc12"] },
    { id: "asobo-sr22", needles: ["sr22"] },
    { id: "asobo-pitts", needles: ["pitts", "s-1s", "pts1"] },
  ];
  const filtered = maker ? hints.filter((h) => !h.makers || h.makers.includes(maker)) : hints.filter((h) => !h.makers);
  for (const hint of filtered.length ? filtered : hints) {
    if (hint.needles.some((n) => t.includes(n))) {
      return AIRCRAFT_LIST.find((a) => a.id === hint.id);
    }
  }
  const named = [...AIRCRAFT_LIST]
    .filter((a) => a.id !== "auto")
    .sort((a, b) => b.name.length - a.name.length)
    .find((a) => t.includes(a.name.toLowerCase()));
  return named;
}
