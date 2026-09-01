const en: Record<string, string> = {
  navHow: "How it works",
  navAircraft: "Aircraft",
  navApp: "The app",
  navFaq: "Questions",
  eyebrow: "MSFS 2020 and 2024, Windows and Linux",
  heroTitle: "One cockpit. Two people.",
  heroLede:
    "Shared cockpit as a product, not a zip treasure hunt. One app, one session code, captain and first officer in the same seats.",
  heroWhisper: "Zelfde stoel. Twee PCs.",
  cta: "Download",
  cta2: "Download SharedWingsX",
  ctaSub: "Windows installer · 0.4.67 · ~95 MB",
  heroMeta: "Windows and Linux, no account",
  strip1: "No Community drag-drop",
  strip2: "No port forwarding",
  strip3: "PMDG to stock, same app",
  strip4: "Presence in the other seat",
  ready1t: "Same aircraft",
  ready1: "Load the same title on both PCs. Packs follow the sim name.",
  ready2t: "Same spawn",
  ready2: "Same parking, weather and time. One world, two seats.",
  ready3t: "Multiplayer off",
  ready3: "MSFS multiplayer on means two airframes. SharedWingsX is not that.",
  readyFail: "If those three are wrong, the guest will not follow. Fix spawn first, then throttles.",
  loopHint: "Host starts a deck. Guest types the code.",
  changeAll: "All releases",
  sdLeft: "Left seat · flies",
  sdRight: "Right seat · radios",
  sdJump: "Watch only",
  sdHand: "Give / Take",
  airTitle: "Built to fly anything MSFS will load",
  airCopy:
    "Universal SimConnect layer for every MSFS aircraft: PMDG 737, 777, 747, Fenix, iFly, Asobo. Dedicated packs for C172 and 787-10. Aircraft files stay untouched. Payware CDU, EFB and FMS are not a second identical box. Flight controls, thrust, gear, flaps, radios and ATC sync.",
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
    "This is SharedWingsX. Host and join sit on one screen. Settings open from the header. Updates appear as a corner toast. Same version on every PC.",
  faqTitle: "Questions",
  endTitle: "Ready when you are.",
  endCopy: "Same installer on both PCs. No account.",
  q1: "Is SharedWingsX free?",
  q1a: "Yes. Download the Windows Setup (~95 MB) or the Linux zip. No account, no subscription. MSFS itself is Windows-only; Linux can host or join a deck, but SimConnect needs Windows.",
  q2: "Does the other person need SharedWingsX too?",
  q2a: "Yes. Everyone uses the same version (currently 0.4.67). The host starts a deck and shares the six-character session code.",
  q3: "How does it work?",
  q3a: "SharedWingsX syncs the cockpit between both pilots. Captain left, first officer right. Radios and ATC for both; you hand over flying on the person.",
  q4: "Does it work on VATSIM or IVAO?",
  q4a: "Yes. SharedWingsX is not vPilot or Altitude. The captain logs into the network as usual. The first officer connects as observer (same callsign, extra letter, observer mode). Radios in the sim sync through SharedWingsX. Turn AI traffic off so you both see the same picture. One person files the plan: the host.",
  q6: "Do I need to open ports?",
  q6a: "No. No router, no port forwarding. You only share the session code. SharedWingsX uses a cloud relay so both PCs can find the same deck.",
  q5: "PMDG, Fenix, and the rest?",
  q5a: "Yes through the universal layer: PMDG, Fenix, iFly, Asobo and the rest of MSFS. Yoke, thrust, gear, flaps, radios and ATC sync. The payware CDU, EFB and FMS are not a second identical box. On Fenix, let the captain set fuel and payload, use one transponder, and expect standby radios and some overhead clicks to drift. On PMDG, baro and some MCP keys follow whoever is flying. Dedicated packs (C172, 787-10) cover more of those aircraft.",
  q7: "Why other shared cockpits make the aircraft fight?",
  q7a: "SharedWingsX is not Microsoft Flight Simulator multiplayer. Keep MSFS multiplayer off so you do not get two airframes in one world. Only the captain writes flying controls. The first officer has radios, MCP and overhead. Shared switches use a short last-mover lock so both sims do not pull the same lever. Fuel, payload and time stay with the captain when the FO is not flying, so autothrottle does not fight. We do not stack a second physics engine on MSFS. Jump seats watch only. Same aircraft, spawn, weather and time remain required.",
  q8: "Flight plan, VATSIM, smartCARS, Volanta?",
  q8a: "Load the same flight plan in both FMCs (SimBrief on both PCs). SharedWingsX does not clone the whole payware CDU or tablet keyboard. The first officer sees the same radios, squawk and MCP as they move. VATSIM/IVAO: captain runs vPilot or Altitude; first officer is observer. smartCARS, Volanta and similar trackers run on the captain’s sim (one flight). SharedWingsX does not replace those apps; they sit next to it.",
  q10: "MSFS 2024 as well as 2020?",
  q10a: "Yes. The footer lamps show which sim is running. Both PCs need the same sim. A 2020 title loaded in 2024 can miss lights, trim or touchscreens. If the guest stops moving, reconnect: only the captain writes world pose.",
  q9: "Windows says the download is unsafe?",
  q9a: "SharedWingsX is made by BluNova Virtual Airlines. SmartScreen shows Unknown publisher until Setup is signed with a Windows code-signing certificate in that company name. Until then: More info, then Run anyway. The installer is about 95 MB. A 12 KB file is not the app. Discord: discord.gg/bluenovav · info@blunovav.com",
  copy: "© BluNova Virtual Airlines by Jordy. All rights reserved.",
};

const nl: Record<string, string> = {
  navHow: "Gebruik",
  navAircraft: "Toestellen",
  navApp: "De app",
  navFaq: "FAQ",
  eyebrow: "Microsoft Flight Simulator 2020 & 2024",
  heroTitle: "Eén cockpit. Twee mensen.",
  heroLede:
    "Shared cockpit als product, niet als zip-avontuur. Eén Windows-app, één code, captain en first officer in dezelfde stoelen.",
  cta: "Download",
  cta2: "Download SharedWingsX",
  ctaSub: "Windows-installer · 0.4.67 · ~95 MB",
  heroMeta: "Windows en Linux, geen account",
  strip1: "Geen Community-sleep",
  strip2: "Geen poorten openzetten",
  strip3: "PMDG tot stock, dezelfde app",
  strip4: "Presence in de andere stoel",
  ready1t: "Zelfde toestel",
  ready1: "Zelfde titel op beide pc’s. Packs volgen de sim-naam.",
  ready2t: "Zelfde spawn",
  ready2: "Zelfde parkeerplaats, weer en tijd. Eén wereld, twee stoelen.",
  ready3t: "Multiplayer uit",
  ready3: "MSFS-multiplayer aan betekent twee kisten. SharedWingsX is dat niet.",
  readyFail: "Kloppen die drie niet, dan volgt de guest niet. Eerst spawn, dan throttles.",
  loopHint: "De host start een deck. De guest typt de code.",
  changeAll: "Alle releases",
  sdLeft: "Linkerstoel · vliegt",
  sdRight: "Rechterstoel · radio’s",
  sdJump: "Alleen meekijken",
  sdHand: "Give / Take",
  airTitle: "Gebouwd om overal mee te vliegen",
  airCopy:
    "Universele SimConnect-laag voor elk MSFS-toestel: PMDG 737, 777, 747, Fenix, iFly, Asobo. Dedicated packs voor C172 en 787-10. Aircraft-bestanden blijven onaangeroerd. Payware-CDU, EFB en FMS zijn geen tweede identiek scherm. Stuurvlakken, gassen, gear, flaps, radio’s en ATC synchen.",
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
    "Dit is SharedWingsX. Host en join op één scherm. Settings via de header. Updates als hoektorst. Iedereen dezelfde versie.",
  faqTitle: "Vragen",
  endTitle: "Klaar wanneer jij het bent.",
  endCopy: "Zelfde installer op beide pc’s. Geen account.",
  q1: "Is SharedWingsX gratis?",
  q1a: "Ja. Download de Windows-Setup (~95 MB) of de Linux-zip. Geen account. MSFS zelf is Windows-only; Linux kan een deck hosten of joinen, SimConnect heeft Windows nodig.",
  q2: "Moet de ander SharedWingsX ook hebben?",
  q2a: "Ja. Iedereen dezelfde versie (nu 0.4.67). De host start een deck en deelt de sessiecode van zes tekens.",
  q3: "Hoe werkt het?",
  q3a: "SharedWingsX synct de cockpit. Captain links, first officer rechts. Radios en ATC voor beide; besturing geef je op de persoon.",
  q4: "VATSIM of IVAO?",
  q4a: "Ja. SharedWingsX is geen vPilot of Altitude. De captain logt zelf in op het netwerk. De first officer verbindt als observer (zelfde callsign, extra letter, observer-modus). Radio’s in de sim synchen via SharedWingsX. Zet AI-verkeer uit zodat jullie hetzelfde zien. Eén persoon dient het flightplan in: de host.",
  q6: "Moet ik poorten openzetten?",
  q6a: "Nee. Geen router, geen port forwarding. SharedWingsX probeert eerst een directe link. Lukt dat niet, dan gaat het vanzelf via de cloud. Jullie delen alleen de code in de app.",
  q5: "PMDG en Fenix?",
  q5a: "Ja via de universele laag: PMDG, Fenix, iFly, Asobo en de rest. Stuurvlakken, gassen, gear, flaps, radio’s en ATC synchen. De payware-CDU, EFB en FMS zijn geen tweede identiek scherm. Op Fenix: fuel en payload bij de captain, één transponder, standby-radio’s en sommige overhead-knoppen kunnen achterlopen. Op PMDG volgen baro en een deel van de MCP wie er vliegt. Dedicated packs (C172, 787-10) dekken meer van die kisten.",
  q7: "Waarom glitcht het vliegtuig bij andere shared cockpits?",
  q7a: "SharedWingsX is geen MSFS-multiplayer. Zet multiplayer uit, anders staan er twee kisten in één wereld. Alleen de captain schrijft vliegcontrols. De FO heeft radio’s, MCP en overhead. Shared switches hebben een korte last-mover-lock. Fuel, payload en tijd blijven bij de captain als de FO niet vliegt, zodat autothrottle niet vecht. We zetten geen tweede physics-engine op MSFS. Jump seats kijken alleen mee. Zelfde toestel, spawn, weer en tijd blijven nodig.",
  q8: "Flightplan, VATSIM, smartCARS, Volanta?",
  q8a: "Zet hetzelfde flightplan in beide FMC’s (SimBrief op beide pc’s). SharedWingsX kopieert de hele payware-CDU of tablet-toetsenbord niet. De FO ziet wel dezelfde radio’s, squawk en MCP. VATSIM/IVAO: captain draait vPilot of Altitude; FO als observer. smartCARS, Volanta en soortgelijke trackers op de captain-sim (één vlucht). SharedWingsX vervangt die apps niet.",
  q10: "MSFS 2024 én 2020?",
  q10a: "Ja. De lampjes onderin tonen welke sim draait. Beide pc’s dezelfde sim. Een 2020-titel in 2024 kan lights, trim of touchscreens missen. Blijft de guest stilstaan: opnieuw verbinden. Alleen de captain schrijft de wereldpose.",
  q9: "Windows zegt dat de download onveilig is?",
  q9a: "SharedWingsX is van BluNova Virtual Airlines. SmartScreen toont Onbekende uitgever tot de Setup is ondertekend met een Windows code-signingcertificaat op die bedrijfsnaam. Tot die tijd: Meer info, daarna Toch uitvoeren. De installer is ongeveer 95 MB. Een bestand van 12 KB is de app niet. Discord: discord.gg/bluenovav · info@blunovav.com",
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
        /* missing local file or blocked request: keep the link */
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
const whisper = document.getElementById("hero-whisper");
if (whisper && /^nl\b/i.test(navigator.language) && lang === "en") {
  whisper.hidden = false;
  whisper.textContent = en.heroWhisper;
}
document.getElementById("lang")?.addEventListener("click", () => {
  lang = lang === "nl" ? "en" : "nl";
  apply(lang);
  if (whisper) {
    whisper.hidden = lang !== "en" || !/^nl\b/i.test(navigator.language);
    if (!whisper.hidden) whisper.textContent = en.heroWhisper;
  }
});

const header = document.querySelector(".top");
const line = document.getElementById("scroll-line");
const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const onScroll = (): void => {
  const y = window.scrollY;
  header?.classList.toggle("scrolled", y > 8);
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  if (line) line.style.width = `${(y / max) * 100}%`;
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const reveals = document.querySelectorAll(".reveal");
if (!motionOk) {
  reveals.forEach((el) => el.classList.add("on"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("on");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
  );
  reveals.forEach((el) => io.observe(el));
  window.setTimeout(() => {
    reveals.forEach((el) => el.classList.add("on"));
  }, 1200);
}

void fetch("./update.json")
  .then((res) => (res.ok ? res.json() : null))
  .then((info: { version?: string; notes?: string } | null) => {
    const version = String(info?.version ?? "").trim();
    const notes = String(info?.notes ?? "").trim();
    if (version) {
      en.ctaSub = `Windows installer · ${version} · ~95 MB`;
      nl.ctaSub = `Windows-installer · ${version} · ~95 MB`;
      en.q2a = `Yes. Everyone uses the same version (currently ${version}). The host starts a deck and shares the six-character session code.`;
      nl.q2a = `Ja. Iedereen dezelfde versie (nu ${version}). De host start een deck en deelt de sessiecode van zes tekens.`;
      document.querySelectorAll("[data-rel-ver]").forEach((el) => {
        el.textContent = version;
      });
      document.querySelectorAll<HTMLAnchorElement>('a[href*="linux-x64.zip"]').forEach((a) => {
        a.href = `./downloads/SharedWingsX-${version}-linux-x64.zip`;
      });
    }
    const notesEl = document.getElementById("change-notes");
    if (notesEl && notes) notesEl.textContent = notes;
    apply(lang);
  })
  .catch(() => {
    /* keep HTML fallback */
  });

