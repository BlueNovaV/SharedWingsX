const en: Record<string, string> = {
  navHow: "How it works",
  navAircraft: "Aircraft",
  navApp: "The app",
  navFaq: "Questions",
  eyebrow: "MSFS 2020 and 2024, Windows and Linux",
  heroTitle: "One cockpit. Two people.",
  heroLede:
    "Shared cockpit as a product, not a zip treasure hunt. One app, one session code, captain and first officer in the same seats.",
  cta: "Download",
  cta2: "Download SharedWingsX",
  ctaSub: "Windows installer · 0.4.44 · ~95 MB",
  heroMeta: "Windows and Linux, no account",
  strip1: "No Community drag-drop",
  strip2: "No port forwarding",
  strip3: "PMDG to stock, same app",
  strip4: "Presence in the other seat",
  airTitle: "Built to fly anything MSFS will load",
  airCopy:
    "Universal SimConnect layer for every MSFS aircraft: PMDG 737, 777, 747, Fenix, iFly, Asobo. Dedicated packs for C172 and 787-10. Aircraft files stay untouched. Payware CDU/FMS is not pixel-perfect; flight controls, thrust, gear, flaps, radios and ATC sync.",
  airUni: "Universal",
  airUniSub: "Every MSFS title via SimConnect",
  airC172: "Dedicated pack",
  air787: "Dedicated pack",
  howTitle: "Four steps. No installer theatre.",
  s1t: "App",
  s1: "SharedWingsX-Setup.exe. Presence is copied into Community for you.",
  s2t: "Sim",
  s2: "Same aircraft, same spawn, same weather. Multiplayer off. Crash physics off.",
  s3t: "Code",
  s3: "Host clicks Start deck. A six-character session code appears. The other pilot pastes it and clicks Connect.",
  s4t: "Crew",
  s4: "You see each other in the seat. You hand over flying on the person.",
  sHint: "No Visual C++, no WebView2. Pick the Community folder only if MSFS has never been launched.",
  appTitle: "The Windows app",
  appCopy:
    "This is SharedWingsX. Host starts a deck, a six-character code appears, the other seats join. MSFS 2020 and 2024 lamps sit in the footer. Same version on every PC.",
  faqTitle: "Questions",
  q1: "Is SharedWingsX free?",
  q1a: "Yes. Download the Windows Setup (~95 MB) or the Linux zip. No account, no subscription. MSFS itself is Windows-only; Linux can host or join a deck, but SimConnect needs Windows.",
  q2: "Does the other person need SharedWingsX too?",
  q2a: "Yes. Everyone uses the same version (currently 0.4.44). The host starts a deck and shares the six-character session code.",
  q3: "How does it work?",
  q3a: "SharedWingsX syncs the cockpit between both pilots. Captain left, first officer right. Radios and ATC for both; you hand over flying on the person.",
  q4: "Does it work on VATSIM or IVAO?",
  q4a: "Yes. SharedWingsX is not vPilot or Altitude. The captain logs into the network as usual. The first officer connects as observer (same callsign, extra letter, observer mode). Radios in the sim sync through SharedWingsX. Turn AI traffic off so you both see the same picture. One person files the plan: the host.",
  q6: "Do I need to open ports?",
  q6a: "No. No router, no port forwarding. You only share the session code. SharedWingsX uses a cloud relay so both PCs can find the same deck.",
  q5: "PMDG, Fenix, and the rest?",
  q5a: "Yes through the universal layer: PMDG, Fenix, and the rest of MSFS. Flight controls, thrust, gear, flaps, radios and ATC sync. Payware CDU/FMS buttons are not 100%. Dedicated packs follow for those.",
  q7: "Why other shared cockpits make the aircraft fight?",
  q7a: "SharedWingsX is not Microsoft Flight Simulator multiplayer. Keep MSFS multiplayer off so you do not get two airframes in one world. Only the captain writes flying controls. The first officer has radios, MCP and overhead. Shared switches use a short last-mover lock so both sims do not pull the same lever. Jump seats watch only. You still need the same aircraft, same spawn and the same weather/time. Payware FMS internals are not a second pixel-perfect box.",
  q8: "Flight plan, VATSIM, smartCARS, Volanta?",
  q8a: "Load the same flight plan in both FMCs (SimBrief on both PCs). SharedWingsX does not clone the whole payware CDU. The first officer sees the same radios, squawk and MCP as they move. VATSIM/IVAO: captain runs vPilot or Altitude; first officer is observer. smartCARS, Volanta and similar trackers run on the captain’s sim (one flight). SharedWingsX does not replace those apps; they sit next to it.",
  q9: "Windows says the download is unsafe?",
  q9a: "SharedWingsX is made by BluNova Virtual Airlines. SmartScreen shows Unknown publisher until Setup is signed with a Windows code-signing certificate in that company name. Until then: More info, then Run anyway. The installer is about 95 MB — a 12 KB file is not the app. Discord: discord.gg/bluenovav · info@blunovav.com",
  copy: "© BluNova Virtual Airlines by Jordy. All rights reserved.",
};

const nl: Record<string, string> = {
  navHow: "Gebruik",
  navAircraft: "Toestellen",
  navApp: "De app",
  navFaq: "FAQ",
  eyebrow: "Microsoft Flight Simulator 2020 & 2024",
  heroTitle: "Eén cockpit.<br />Twee mensen.",
  heroLede:
    "Shared cockpit als product, niet als zip-avontuur. Eén Windows-app, één code, captain en first officer in dezelfde stoelen.",
  cta: "Download",
  cta2: "Download SharedWingsX",
  ctaSub: "Windows-installer · 0.4.44 · ~95 MB",
  heroMeta: "Windows en Linux, geen account",
  strip1: "Geen Community-sleep",
  strip2: "Geen poorten openzetten",
  strip3: "PMDG tot stock, dezelfde app",
  strip4: "Presence in de andere stoel",
  airTitle: "Gebouwd om overal mee te vliegen",
  airCopy:
    "Universele SimConnect-laag voor elk MSFS-toestel: PMDG 737, 777, 747, Fenix, iFly, Asobo. Dedicated packs voor C172 en 787-10. Aircraft-bestanden blijven onaangeroerd. CDU/FMS van payware is niet pixel-perfect; stuurvlakken, gassen, gear, flaps, radio’s en ATC synchen.",
  airUni: "Universeel",
  airUniSub: "Alle MSFS-titels via SimConnect",
  airC172: "Dedicated pack",
  air787: "Dedicated pack",
  howTitle: "Vier stappen. Geen installer-theater.",
  s1t: "App",
  s1: "SharedWingsX-Setup.exe. Presence gaat zelf naar Community.",
  s2t: "Sim",
  s2: "Zelfde toestel, spawn en weer. Multiplayer uit. Crash physics uit.",
  s3t: "Code",
  s3: "De host klikt Start deck. Er verschijnt een code van zes tekens. De ander plakt die en klikt Connect.",
  s4t: "Crew",
  s4: "Je ziet elkaar in de stoel. Besturing geef je op de persoon.",
  sHint: "Geen Visual C++, geen WebView2. Community-map alleen kiezen als MSFS nog nooit is gestart.",
  appTitle: "De Windows-app",
  appCopy:
    "Dit is SharedWingsX. De host start een deck, er verschijnt een code van zes tekens, de andere stoelen joinen. MSFS 2020- en 2024-lampjes staan onderin. Iedereen dezelfde versie.",
  faqTitle: "Vragen",
  q1: "Is SharedWingsX gratis?",
  q1a: "Ja. Download de Windows-Setup (~95 MB) of de Linux-zip. Geen account. MSFS zelf is Windows-only; Linux kan een deck hosten of joinen, SimConnect heeft Windows nodig.",
  q2: "Moet de ander SharedWingsX ook hebben?",
  q2a: "Ja. Iedereen dezelfde versie (nu 0.4.44). De host start een deck en deelt de sessiecode van zes tekens.",
  q3: "Hoe werkt het?",
  q3a: "SharedWingsX synct de cockpit. Captain links, first officer rechts. Radios en ATC voor beide; besturing geef je op de persoon.",
  q4: "VATSIM of IVAO?",
  q4a: "Ja. SharedWingsX is geen vPilot of Altitude. De captain logt zelf in op het netwerk. De first officer verbindt als observer (zelfde callsign, extra letter, observer-modus). Radio’s in de sim synchen via SharedWingsX. Zet AI-verkeer uit zodat jullie hetzelfde zien. Eén persoon dient het flightplan in: de host.",
  q6: "Moet ik poorten openzetten?",
  q6a: "Nee. Geen router, geen port forwarding. SharedWingsX probeert eerst een directe link. Lukt dat niet, dan gaat het vanzelf via de cloud. Jullie delen alleen de code in de app.",
  q5: "PMDG en Fenix?",
  q5a: "Ja via de universele laag. Stuurvlakken, gassen, gear, flaps, radio’s, ATC. Payware-CDU is niet 100%.",
  q7: "Waarom glitcht het vliegtuig bij andere shared cockpits?",
  q7a: "SharedWingsX is geen MSFS-multiplayer. Zet multiplayer uit, anders staan er twee kisten in één wereld. Alleen de captain schrijft vliegcontrols. De FO heeft radio’s, MCP en overhead. Shared switches hebben een korte last-mover-lock. Jump seats kijken alleen mee. Zelfde toestel, spawn, weer en tijd blijven nodig. De payware-FMS is geen tweede pixel-perfect scherm.",
  q8: "Flightplan, VATSIM, smartCARS, Volanta?",
  q8a: "Zet hetzelfde flightplan in beide FMC’s (SimBrief op beide pc’s). SharedWingsX kopieert de hele payware-CDU niet. De FO ziet wel dezelfde radio’s, squawk en MCP. VATSIM/IVAO: captain draait vPilot of Altitude; FO als observer. smartCARS, Volanta en soortgelijke trackers op de captain-sim (één vlucht). SharedWingsX vervangt die apps niet.",
  q9: "Windows zegt dat de download onveilig is?",
  q9a: "SharedWingsX is van BluNova Virtual Airlines. SmartScreen toont Onbekende uitgever tot de Setup is ondertekend met een Windows code-signingcertificaat op die bedrijfsnaam. Tot die tijd: Meer info, daarna Toch uitvoeren. De installer is ongeveer 95 MB — een bestand van 12 KB is de app niet. Discord: discord.gg/bluenovav · info@blunovav.com",
  copy: "© BluNova Virtual Airlines by Jordy. Alle rechten voorbehouden.",
};

function apply(lang: "nl" | "en"): void {
  document.documentElement.lang = lang;
  const table = lang === "nl" ? nl : en;
  document.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => {
    const key = el.dataset.i;
    if (!key) return;
    const value = table[key];
    if (value) el.innerHTML = value;
  });
  const btn = document.getElementById("lang");
  if (btn) btn.textContent = lang === "nl" ? "EN" : "NL";
}

const localSite = location.hostname === "127.0.0.1" || location.hostname === "localhost";
if (localSite) {
  document.querySelectorAll<HTMLAnchorElement>('a[href*="SharedWingsX-Setup"], a[href$=".AppImage"], a[href*="linux-x64"]').forEach((a) => {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    void fetch(url.pathname + url.search, { method: "HEAD" })
      .then((res) => {
        if (res.ok) return;
        a.removeAttribute("download");
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          alert("Build the Windows app first with npm run dist:win, then npm run site.");
        });
      })
      .catch(() => {
        /* missing local file or blocked request — keep the link */
      });
  });
}
const hero = document.querySelector<HTMLVideoElement>(".hero-video");
const fallback = document.querySelector(".hero-fallback");
function startBgVideo(el: HTMLVideoElement, onFail?: () => void): void {
  el.muted = true;
  el.defaultMuted = true;
  el.playsInline = true;
  el.loop = true;
  const go = (): void => {
    void el.play().catch(() => onFail?.());
  };
  if (el.readyState >= 2) go();
  else el.addEventListener("canplay", go, { once: true });
  el.addEventListener("error", () => onFail?.());
}
hero?.addEventListener("playing", () => fallback?.classList.remove("show"));
if (hero) startBgVideo(hero, () => fallback?.classList.add("show"));
let lang: "nl" | "en" = "en";
apply("en");
document.getElementById("lang")?.addEventListener("click", () => {
  lang = lang === "nl" ? "en" : "nl";
  apply(lang);
});

void fetch("./update.json")
  .then((res) => (res.ok ? res.json() : null))
  .then((info: { version?: string } | null) => {
    const version = String(info?.version ?? "").trim();
    if (!version) return;
    en.ctaSub = `Windows installer · ${version} · ~95 MB`;
    nl.ctaSub = `Windows-installer · ${version} · ~95 MB`;
    en.q2a = `Yes. Everyone uses the same version (currently ${version}). The host starts a deck and shares the six-character session code.`;
    nl.q2a = `Ja. Iedereen dezelfde versie (nu ${version}). De host start een deck en deelt de sessiecode van zes tekens.`;
    document.querySelectorAll("[data-rel-ver]").forEach((el) => {
      el.textContent = version;
    });
    apply(lang);
  })
  .catch(() => {
    /* keep HTML fallback */
  });

