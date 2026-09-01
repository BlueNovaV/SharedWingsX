import { connectBridge, desktop, send, whenOpen, type InstallInfo, type PackInfo, type UiState, type UpdateInfo } from "./bridge.js";
import { AIRCRAFT_LIST, GROUP_LABEL, displayAircraftLine, matchAircraftFromTitle, packIdForAircraft } from "./aircraft.js";

const root = document.getElementById("app")!;
const app = desktop();

let ws: WebSocket | null = null;
let state: UiState | null = null;
let name = localStorage.getItem("twinseat-name") || app.name || "Pilot";
let error = "";
let busy = false;
let copied = false;
let saved = false;
let joinSeat: "right" | "jumpLeft" | "jumpRight" = "right";
let aircraftId = localStorage.getItem("twinseat-aircraft") || "auto";
let install: InstallInfo = { ok: false, message: "Looking for Community folders..." };
let packs: PackInfo[] = [
  { id: "generic-msfs", name: "Automatic (any MSFS aircraft)", support: "offset" },
  { id: "asobo-c172", name: "Cessna 172 Skyhawk", support: "offset" },
  { id: "asobo-787-10", name: "Boeing 787-10", support: "offset" },
  { id: "asobo-747-8", name: "Boeing 747-8", support: "offset" },
];
let packChoice = localStorage.getItem("twinseat-pack") || packIdForAircraft(aircraftId);
let simYear = localStorage.getItem("twinseat-sim") === "MSFS2020" ? "MSFS2020" : "MSFS2024";
let update: UpdateInfo | null = null;
let updateLater = false;
let updateBusy = false;
let updatePct = 0;
let updatePhase = "";
let updateError = "";
let lastLiveKey = "";
let joinCode = (localStorage.getItem("twinseat-code") || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
let lastCopiedRoom = "";
let joinTimer = 0;
let simProc = { msfs2020: false, msfs2024: false };
const APP_VER = "0.4.64";
let settingsOpen = false;
let cardScrollMem: Record<string, number> = {};

function restartCssAnimations(scope: ParentNode): void {
  const nodes = scope.querySelectorAll<HTMLElement>(".boot-bar span, .boot-ring");
  for (const el of Array.from(nodes)) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

function pathLabel(path: string): string {
  if (path === "direct") return "Direct";
  if (path === "relay") return "Cloud";
  return "Automatic";
}

function airportLabel(id: UiState["identity"] | undefined): string {
  if (!id?.inWorld) return "";
  if (id.airportIcao) {
    const place = [id.airportCity, id.airportCountry].filter(Boolean).join(", ");
    return place ? `${id.airportIcao} · ${place}` : id.airportIcao;
  }
  if (Number.isFinite(id.lat) && Number.isFinite(id.lon)) {
    const ns = (id.lat ?? 0) >= 0 ? "N" : "S";
    const ew = (id.lon ?? 0) >= 0 ? "E" : "W";
    return `${ns}${Math.abs(id.lat ?? 0).toFixed(2)} ${ew}${Math.abs(id.lon ?? 0).toFixed(2)}`;
  }
  return "";
}

function aircraftLabel(id: UiState["identity"] | undefined): string {
  const title = id?.aircraftTitle?.trim() ?? "";
  if (title) return displayAircraftLine(title);
  if (id?.connected && !id.mock) return "";
  return "";
}

function seatTitle(seat: string): string {
  if (seat === "left") return "Captain";
  if (seat === "right") return "First Officer";
  if (seat === "jumpLeft") return "Jumpseat L";
  if (seat === "jumpRight") return "Jumpseat R";
  return seat;
}

function rememberCode(raw: string): string {
  const code = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  if (code.length === 6) localStorage.setItem("twinseat-code", code);
  return code;
}

function nameAt(seat: string): string {
  if (state?.seat === seat) return name;
  return state?.roster.find((p) => p.seat === seat)?.name ?? "Empty";
}

function otherFront() {
  return state?.roster.find((p) => p.name !== name && (p.seat === "left" || p.seat === "right"));
}

function iAmHost(): boolean {
  const me = state?.selfId;
  if (!state || !me) return false;
  return state.roster.some((p) => p.host && p.id === me);
}

function cockpitView(opts: { live: boolean; canGive: boolean; canTake: boolean; iFly: boolean }): string {
  const seats = [
    { id: "left", label: "Captain", title: "Captain" },
    { id: "right", label: "First Officer", title: "First Officer" },
    { id: "jumpLeft", label: "Jumpseat L", title: "Jumpseat L" },
    { id: "jumpRight", label: "Jumpseat R", title: "Jumpseat R" },
  ] as const;
  const chips = seats
    .map((s) => {
      const you = (state?.seat ?? "") === s.id && Boolean(state?.room);
      const who = nameAt(s.id);
      const empty = who === "Empty";
      const pick = !opts.live && s.id !== "left" && joinSeat === s.id;
      const cls = `${you ? "you" : empty ? "empty" : "crew"}${pick ? " pick" : ""}`;
      const action =
        opts.live && s.id === "right" && (opts.canGive || opts.canTake)
          ? opts.iFly
            ? "Give"
            : "Take"
          : "";
      return `<button type="button" class="seat-3d ${s.id} ${cls}" data-seat="${s.id}" title="${s.title}"><span class="seat-code">${s.label}</span><span class="seat-who">${escapeHtml(who)}</span>${action ? `<span class="seat-act">${action}</span>` : ""}</button>`;
    })
    .join("");
  return `
    <div class="cabin" role="group" aria-label="Flight deck">
      <img class="cabin-photo" src="./brand/cabin-deck.jpg" alt="" />
      <div class="cabin-vignette"></div>
      <div class="cabin-seats">${chips}</div>
    </div>`;
}

function simOn2024(): boolean {
  if (simProc.msfs2024) return true;
  const id = state?.identity;
  return Boolean(id?.connected && !id.mock && id.simProduct === "MSFS2024");
}

function simOn2020(): boolean {
  if (simOn2024()) return false;
  if (simProc.msfs2020) return true;
  const id = state?.identity;
  return Boolean(id?.connected && !id.mock && id.simProduct === "MSFS2020");
}

function simLampsHtml(): string {
  const y20 = simOn2020();
  const y24 = simOn2024();
  return `<span class="lamp${y20 ? " on" : ""}"><span class="dot${y20 ? " live" : ""}"></span><span class="lamp-lab">MSFS 2020</span></span><span class="lamp${y24 ? " on" : ""}"><span class="dot${y24 ? " live" : ""}"></span><span class="lamp-lab">MSFS 2024</span></span>`;
}

function paintSimLamps(): void {
  document.querySelectorAll("[data-sim-lamps]").forEach((el) => {
    el.innerHTML = simLampsHtml();
  });
}

function applySimHint(): void {
  if (state?.room) return;
  if (simOn2024()) simYear = "MSFS2024";
  else if (simOn2020()) simYear = "MSFS2020";
  else return;
  const a = document.querySelector<HTMLInputElement>('input[name="sim"][value="MSFS2020"]');
  const b = document.querySelector<HTMLInputElement>('input[name="sim"][value="MSFS2024"]');
  if (a) a.checked = simYear === "MSFS2020";
  if (b) b.checked = simYear === "MSFS2024";
  localStorage.setItem("twinseat-sim", simYear);
}

function lobbyEditing(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  return el.id === "code" || el.id === "name";
}

function applySimStatus(info: { msfs2020: boolean; msfs2024: boolean }): void {
  simProc = info;
  applySimHint();
  paintSimLamps();
}

function simAircraft() {
  const title = state?.identity.aircraftTitle?.trim() ?? "";
  return title ? matchAircraftFromTitle(title) : undefined;
}

function resolvedPackId(): string {
  if (aircraftId === "auto") {
    const matched = simAircraft();
    if (matched) return matched.packId;
  }
  return packChoice.split(":")[0] || "generic-msfs";
}

function communityYear(folder: string): string {
  const s = folder.toLowerCase();
  if (s.includes("limitless") || s.includes("2024")) return "MSFS 2024";
  return "MSFS 2020";
}

function shortCommunityPath(folder: string): string {
  const n = folder.replace(/\//g, "\\");
  const drive = n.match(/^([A-Za-z]:)/)?.[1] ?? "";
  const tail = n.split("\\").filter(Boolean).slice(-3).join("\\");
  return drive ? `${drive}\\…\\${tail}` : `…\\${tail}`;
}

function folderForYear(label: string): string | undefined {
  const folders = install.found ?? [];
  return folders.find((folder, i) => (install.labels?.[i] || communityYear(folder)) === label);
}

function communitySelectHtml(live: boolean): string {
  const slot = (label: string, yearKey: string) => {
    const folder = folderForYear(label);
    const pathText = folder ? shortCommunityPath(folder) : "Not found. Click Browse";
    return `<div class="community-slot">
      <span class="community-slot-year">${label}</span>
      <div class="community-slot-row">
        <span class="community-slot-path${folder ? "" : " missing"}">${escapeHtml(pathText)}</span>
        <button type="button" class="ghost-sm" data-pick-year="${yearKey}" ${live ? "disabled" : ""}>Browse</button>
      </div>
    </div>`;
  };
  return `<div class="field">
    <span class="field-head"><span class="field-title">Community folders</span></span>
    <p class="choice-lab">Which sim do you fly?</p>
    <div class="choice choice-dots" id="sim-choice">
      <label><input type="radio" name="sim" value="MSFS2020" ${simYear === "MSFS2020" ? "checked" : ""} ${live ? "disabled" : ""} /> MSFS 2020</label>
      <label><input type="radio" name="sim" value="MSFS2024" ${simYear === "MSFS2024" ? "checked" : ""} ${live ? "disabled" : ""} /> MSFS 2024</label>
    </div>
    ${slot("MSFS 2024", "MSFS2024")}
    ${slot("MSFS 2020", "MSFS2020")}
  </div>`;
}

function missing2020Community(): boolean {
  const folders = install.found ?? [];
  if (simYear !== "MSFS2020") return false;
  return !folders.some((folder) => communityYear(folder) === "MSFS 2020");
}

function packPickerHtml(live: boolean): string {
  const current = packs.find((p) => p.id === resolvedPackId()) ?? packs[0];
  return `<div class="picker" data-picker="pack">
    <button type="button" class="picker-btn" id="pack-open" ${live ? "disabled" : ""}>
      <span class="picker-kicker">Sync pack</span>
      <span class="picker-value">${escapeHtml(current?.name ?? "Automatic")}</span>
    </button>
  </div>`;
}

function currentAircraft() {
  return AIRCRAFT_LIST.find((a) => a.id === aircraftId) ?? AIRCRAFT_LIST[0];
}

function aircraftMenuHtml(): string {
  const groups = [...new Set(AIRCRAFT_LIST.map((a) => a.group))];
  return groups
    .map((group) => {
      const items = AIRCRAFT_LIST.filter((a) => a.group === group)
        .map(
          (a) =>
            `<button type="button" class="picker-item${a.id === aircraftId ? " on" : ""}" data-aircraft="${escapeHtml(a.id)}">${escapeHtml(a.name)}</button>`,
        )
        .join("");
      return `<div class="picker-block"><p class="picker-group">${escapeHtml(GROUP_LABEL[group] ?? group)}</p>${items}</div>`;
    })
    .join("");
}

function packMenuHtml(): string {
  return packs
    .map(
      (p) =>
        `<button type="button" class="picker-item${resolvedPackId() === p.id ? " on" : ""}" data-pack="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`,
    )
    .join("");
}

function aircraftPickerHtml(live: boolean): string {
  const current = currentAircraft();
  const matched = aircraftId === "auto" ? simAircraft() : undefined;
  const value = matched ? `${current.name} · ${matched.name}` : current.name;
  const kicker = matched ? "From sim" : (GROUP_LABEL[current.group] ?? current.group);
  return `<div class="picker" data-picker="aircraft">
    <button type="button" class="picker-btn" id="aircraft-open" ${live ? "disabled" : ""}>
      <span class="picker-kicker">${escapeHtml(kicker)}</span>
      <span class="picker-value">${escapeHtml(value)}</span>
    </button>
  </div>`;
}

function updateToast(): string {
  if (updateLater) return "";
  if (update?.outdated) {
    const busy = updateBusy;
    const label =
      updatePhase === "install"
        ? "Installer starting…"
        : updateBusy
          ? `Downloading… ${updatePct}%`
          : `${update.current} → ${update.latest}`;
    return `
    <aside class="update-toast" role="status">
      <p class="update-kicker">Update</p>
      <h2>Newer version available</h2>
      <p>${escapeHtml(updateError || label)}</p>
      ${busy ? `<div class="bar-track"><span style="width:${updatePct}%"></span></div>` : ""}
      <button type="button" class="btn-update" id="do-update" ${busy ? "disabled" : ""}>${busy ? "Updating…" : "Update"}</button>
      <button type="button" class="update-skip" id="later" ${busy ? "disabled" : ""}>Not now</button>
    </aside>`;
  }
  if (update && update.checked === false) {
    return `
    <aside class="update-toast" role="status">
      <p class="update-kicker">Update</p>
      <h2>Could not check for updates</h2>
      <p>update.json is unreachable.</p>
      <button type="button" class="btn-update" id="retry-update">Retry</button>
      <button type="button" class="update-skip" id="open-setup">Download Setup</button>
      <button type="button" class="update-skip" id="later">Dismiss</button>
    </aside>`;
  }
  return "";
}

function bindUpdate(): void {
  root.querySelector("#do-update")?.addEventListener("click", () => {
    if (!app.startUpdate || updateBusy) return;
    updateBusy = true;
    updateError = "";
    updatePct = 1;
    updatePhase = "download";
    renderBoard();
    void app.startUpdate().then((res) => {
      if (res?.dev) {
        updateBusy = false;
        updateError = "Dev build: the Setup opened in your browser.";
        renderBoard();
        return;
      }
      if (!res?.ok) {
        updateBusy = false;
        updateError = res?.error || "Update failed.";
        renderBoard();
      }
    });
  });
  root.querySelector("#later")?.addEventListener("click", () => {
    if (updateBusy) return;
    updateLater = true;
    renderBoard();
  });
  root.querySelector("#retry-update")?.addEventListener("click", () => {
    void app.recheckUpdate?.().then((info) => {
      if (info) update = info;
      renderBoard();
    });
  });
  root.querySelector("#open-setup")?.addEventListener("click", () => {
    void app.openDownload?.();
  });
  root.querySelector("#check-update")?.addEventListener("click", () => {
    updateLater = false;
    void app.recheckUpdate?.().then((info) => {
      if (info) update = info;
      renderBoard();
    });
  });
}

function leaveDeck(): void {
  if (!ws) return;
  send(ws, { type: "leave" });
  state = null;
  lastLiveKey = "";
  busy = false;
  error = "";
  renderBoard();
}

function showJoinError(text: string): void {
  error = text;
  const card = root.querySelector(".card");
  let el = root.querySelector<HTMLParagraphElement>(".card-err");
  if (!text) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("p");
    el.className = "card-err";
    card?.querySelector("h2")?.insertAdjacentElement("afterend", el);
  }
  el.textContent = text;
}

function setConnectBusy(on: boolean): void {
  const btn = root.querySelector<HTMLButtonElement>("#connect");
  if (!btn) return;
  btn.disabled = on || Boolean(state?.room);
  btn.textContent = on && !state?.room ? "Connecting..." : "Connect";
}

function header(): string {
  const live = Boolean(state?.room);
  return `
    <header class="bar">
      <div class="chrome-drag" aria-hidden="true"></div>
      <div class="bar-left">
        <p class="brand"><img src="./brand/logo.png" alt="" /><span>SharedWingsX</span> <span class="ver">${escapeHtml(update?.current || APP_VER)}</span></p>
      </div>
      ${flightBarHtml()}
      <div class="bar-right">
        ${live ? `<button type="button" class="back js-leave">Leave</button>` : ""}
        <button type="button" class="back" id="open-settings">${settingsOpen ? "Close settings" : "Settings"}</button>
        <div class="win-btns">
          <button type="button" class="win-btn" id="win-min" aria-label="Minimize">–</button>
          <button type="button" class="win-btn" id="win-max" aria-label="Maximize">□</button>
          <button type="button" class="win-btn win-close" id="win-close" aria-label="Close">×</button>
        </div>
      </div>
    </header>`;
}

function settingsPanel(): string {
  const live = Boolean(state?.room);
  const commOk = install.ok;
  return `<section class="card settings-card settings-deck" data-card="settings">
      <h2>Settings</h2>
      <div class="deck-row">
        <span class="deck-kicker">Sim</span>
        <span class="sim-lamps">${simLampsHtml()}</span>
      </div>
      <div class="deck-row">
        <span class="deck-kicker">Community</span>
        <span class="lamp${commOk ? " on" : ""}"><span class="dot${commOk ? " live" : " warn"}"></span><span class="lamp-lab">${commOk ? "Copied" : "Missing"}</span></span>
        <button type="button" class="ghost-sm" id="pick" ${live ? "disabled" : ""}>Test Community</button>
      </div>
      ${communitySelectHtml(live)}
      ${live ? `<label class="field">Name
        <input id="name" value="${escapeHtml(name)}" maxlength="24" />
      </label>` : ""}
      <div class="field">
        <span class="field-head"><span class="field-title">Sync pack</span></span>
        ${packPickerHtml(live)}
      </div>
      <div class="field">
        <span class="field-head"><span class="field-title">Aircraft</span></span>
        ${aircraftPickerHtml(live)}
      </div>
      ${missing2020Community() ? `<p class="hint">MSFS 2020 Community was not found. Browse on the 2020 row.</p>` : ""}
      <div class="deck-row">
        <span class="deck-kicker">App</span>
        <span class="lamp-lab">Version ${escapeHtml(update?.current || APP_VER)}${
          !update
            ? " · checking"
            : update.outdated
              ? ` · ${escapeHtml(update.latest)} ready`
              : update.checked === false
                ? " · check failed"
                : " · current"
        }</span>
      </div>
      <div class="card-foot">
        <button type="button" class="btn-secondary" id="check-update">Check for updates</button>
      </div>
    </section>`;
}

let pickerCleanups: Array<() => void> = [];

function pickerLayer(): HTMLElement {
  let layer = document.getElementById("picker-layer");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = "picker-layer";
  layer.className = "picker-layer";
  layer.hidden = true;
  layer.innerHTML = `
    <button type="button" class="picker-scrim" id="picker-scrim" aria-label="Close list"></button>
    <div class="picker-sheet" role="dialog" aria-modal="true">
      <div class="picker-sheet-head">
        <p class="picker-sheet-title" id="picker-title">Choose</p>
        <button type="button" class="picker-sheet-close" id="picker-close">Close</button>
      </div>
      <div class="picker-sheet-body" id="picker-body"></div>
    </div>`;
  document.body.appendChild(layer);
  layer.querySelector("#picker-scrim")?.addEventListener("click", () => closePickerLayer());
  layer.querySelector("#picker-close")?.addEventListener("click", () => closePickerLayer());
  return layer;
}

function closePickerLayer(): void {
  const layer = document.getElementById("picker-layer");
  if (layer) layer.hidden = true;
  document.body.classList.remove("picker-open");
}

function openPickerLayer(title: string, html: string, itemAttr: string, onPick: (id: string) => void): void {
  const layer = pickerLayer();
  const titleEl = layer.querySelector("#picker-title");
  const body = layer.querySelector("#picker-body");
  if (titleEl) titleEl.textContent = title;
  if (body) {
    body.innerHTML = html;
    body.querySelectorAll<HTMLButtonElement>(`[${itemAttr}]`).forEach((el) => {
      el.addEventListener("click", () => {
        onPick(el.getAttribute(itemAttr) || "");
        closePickerLayer();
        renderBoard();
      });
    });
  }
  layer.hidden = false;
  document.body.classList.add("picker-open");
}

function bindPickers(): void {
  pickerCleanups.forEach((fn) => fn());
  pickerCleanups = [];
  closePickerLayer();
  pickerLayer();
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key === "Escape") closePickerLayer();
  };
  document.addEventListener("keydown", onKey);
  pickerCleanups.push(() => document.removeEventListener("keydown", onKey));

  root.querySelector("#pack-open")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openPickerLayer("Sync pack", packMenuHtml(), "data-pack", (id) => {
      packChoice = id;
      localStorage.setItem("twinseat-pack", packChoice);
    });
  });
  root.querySelector("#aircraft-open")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openPickerLayer("Aircraft", aircraftMenuHtml(), "data-aircraft", (id) => {
      aircraftId = id || "auto";
      packChoice = packIdForAircraft(aircraftId);
      localStorage.setItem("twinseat-aircraft", aircraftId);
      localStorage.setItem("twinseat-pack", packChoice);
    });
  });
}

function bindCode(): void {
  const input = root.querySelector<HTMLInputElement>("#code");
  if (!input) return;
  input.value = joinCode;
  input.disabled = Boolean(state?.room);
  input.addEventListener("input", () => {
    const caret = input.selectionStart ?? joinCode.length;
    joinCode = rememberCode(input.value);
    if (input.value !== joinCode) {
      input.value = joinCode;
      const next = Math.min(caret, joinCode.length);
      input.setSelectionRange(next, next);
    }
    window.clearTimeout(joinTimer);
    if (joinCode.length === 6) {
      joinTimer = window.setTimeout(() => tryJoin(), 280);
    }
  });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      window.clearTimeout(joinTimer);
      tryJoin();
    }
  });
  input.addEventListener("paste", (ev) => {
    const text = ev.clipboardData?.getData("text") ?? "";
    const chars = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (!chars) return;
    ev.preventDefault();
    joinCode = rememberCode(chars);
    input.value = joinCode;
    window.clearTimeout(joinTimer);
    if (joinCode.length === 6) tryJoin();
  });
}

function bindBoard(): void {
  const live = Boolean(state?.room);
  const fo = otherFront();
  const iFly = state?.role === "pf";
  const observer = state?.role === "observer";
  const host = iAmHost();
  const canGive = Boolean(live && iFly && fo && !observer);
  const canTake = Boolean(live && !iFly && host && fo && (state?.seat === "left" || state?.seat === "right"));
  const nameInput = root.querySelector<HTMLInputElement>("#name");
  nameInput?.addEventListener("input", () => {
    name = nameInput.value.trim() || "Pilot";
    localStorage.setItem("twinseat-name", name);
  });
  root.querySelector("#open-settings")?.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    renderBoard();
  });
  root.querySelector("#win-min")?.addEventListener("click", () => app.winMin?.());
  root.querySelector("#win-max")?.addEventListener("click", () => app.winMax?.());
  root.querySelector("#win-close")?.addEventListener("click", () => app.winClose?.());
  root.querySelector(".chrome-drag")?.addEventListener("dblclick", () => app.winMax?.());
  root.querySelector("#apply")?.addEventListener("click", () => {
    const next = root.querySelector<HTMLInputElement>("#name")?.value.trim() || "Pilot";
    name = next;
    localStorage.setItem("twinseat-name", name);
    const btn = root.querySelector("#apply");
    if (btn) btn.textContent = "Saved";
    window.setTimeout(() => {
      const again = root.querySelector("#apply");
      if (again) again.textContent = "Save";
    }, 1400);
  });
  root.querySelector("#pick")?.addEventListener("click", async () => {
    if (!app.rescanCommunity) return;
    install = await app.rescanCommunity();
    renderBoard();
  });
  root.querySelectorAll<HTMLButtonElement>("[data-pick-year]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!app.pickCommunity) return;
      install = await app.pickCommunity(btn.dataset.pickYear);
      renderBoard();
    });
  });
  root.querySelectorAll<HTMLInputElement>('input[name="sim"]').forEach((el) => {
    el.addEventListener("change", () => {
      simYear = el.value === "MSFS2020" ? "MSFS2020" : "MSFS2024";
      localStorage.setItem("twinseat-sim", simYear);
      paintSimLamps();
    });
  });
  bindPickers();
  root.querySelector("#start")?.addEventListener("click", () => {
    void startDeck();
  });
  root.querySelector("#connect")?.addEventListener("click", () => tryJoin());
  root.querySelectorAll<HTMLButtonElement>("[data-seat]").forEach((el) => {
    el.addEventListener("click", () => {
      const seat = el.dataset.seat ?? "";
      if (!state?.room) {
        if (seat === "left") return;
        joinSeat = seat === "jumpLeft" || seat === "jumpRight" ? seat : "right";
        renderBoard();
        return;
      }
      if (seat === "right" && (canGive || canTake) && ws) send(ws, { type: "swap-command" });
    });
  });
  root.querySelectorAll<HTMLInputElement>('input[name="seat"]').forEach((el) => {
    el.addEventListener("change", () => {
      const value = el.value;
      joinSeat = value === "jumpLeft" || value === "jumpRight" ? value : "right";
    });
  });
  root.querySelector("#copy")?.addEventListener("click", async () => {
    const code = state?.room ?? "";
    if (app.copy) await app.copy(code);
    else await navigator.clipboard.writeText(code);
    copied = true;
    const btn = root.querySelector("#copy");
    if (btn) btn.textContent = "Copied";
    window.setTimeout(() => {
      copied = false;
      const again = root.querySelector("#copy");
      if (again) again.textContent = "Copy";
    }, 1600);
  });
  root.querySelector("#hand")?.addEventListener("click", () => {
    if (!ws) return;
    send(ws, { type: "swap-command" });
  });
  root.querySelector("#obs")?.addEventListener("click", () => {
    if (!ws || !fo) return;
    send(ws, { type: "transfer", targetName: fo.name, role: "observer" });
  });
  root.querySelectorAll(".js-leave").forEach((el) => el.addEventListener("click", leaveDeck));
  bindCode();
  bindUpdate();
}

function flightBarHtml(): string {
  const id = state?.identity;
  const ac = aircraftLabel(id);
  const apt = airportLabel(id);
  const liveSim = Boolean(id?.connected && !id.mock);
  const title = [ac, apt].filter(Boolean).join(" · ");
  return `<div class="bar-mid" data-flight-bar title="${escapeHtml(title)}">
      <span class="flight-ac" data-flight-ac>${escapeHtml(ac)}</span>
      <span class="flight-sep" data-flight-sep${apt ? "" : " hidden"}>·</span>
      <span class="flight-apt" data-flight-apt>${escapeHtml(apt)}</span>
      ${liveSim ? "" : `<span class="flight-wait">Waiting for MSFS</span>`}
    </div>`;
}

function paintFlightBar(): void {
  const id = state?.identity;
  const ac = aircraftLabel(id);
  const apt = airportLabel(id);
  const acEl = document.querySelector("[data-flight-ac]");
  const aptEl = document.querySelector("[data-flight-apt]");
  const sep = document.querySelector("[data-flight-sep]");
  const bar = document.querySelector("[data-flight-bar]");
  if (acEl) acEl.textContent = ac;
  if (aptEl) aptEl.textContent = apt;
  if (sep instanceof HTMLElement) sep.hidden = !apt;
  if (bar instanceof HTMLElement) bar.title = [ac, apt].filter(Boolean).join(" · ");
}

function renderBoard(): void {
  const codeEl = document.querySelector<HTMLInputElement>("#code");
  if (codeEl && !state?.room) {
    joinCode = rememberCode(codeEl.value);
  }
  const live = Boolean(state?.room);
  const fo = otherFront();
  const iFly = state?.role === "pf";
  const observer = state?.role === "observer";
  const host = iAmHost();
  const canGive = Boolean(live && iFly && fo && !observer);
  const canTake = Boolean(live && !iFly && host && fo && (state?.seat === "left" || state?.seat === "right"));

  Array.from(root.querySelectorAll<HTMLElement>("[data-card]")).forEach((el) => {
    const key = el.dataset.card || "";
    if (key) cardScrollMem[key] = el.scrollTop;
  });
  const active = document.activeElement;
  const activeId = active instanceof HTMLElement ? active.id : "";
  const sel =
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      ? { start: active.selectionStart, end: active.selectionEnd }
      : null;

  const home = `
        <section class="card deck-home${live ? " in-flight" : ""}" data-card="deck">
          ${error ? `<p class="card-err${/version/i.test(error) ? " hard" : ""}">${escapeHtml(error)}</p>` : ""}
          ${
            live
              ? `<div class="session-strip">
                   <span class="sess-code" aria-label="Session code">${escapeHtml(state?.room ?? "")}</span>
                   ${host ? `<button type="button" class="ghost-sm" id="copy">${copied ? "Copied" : "Copy"}</button>` : ""}
                   <span class="lamp"><span class="dot ${state?.path === "direct" ? "ok" : "warn"}"></span><span class="lamp-lab">${escapeHtml(pathLabel(state?.path ?? ""))}</span></span>
                   <span class="lamp-lab">${escapeHtml(aircraftLabel(state?.identity) || "Aircraft")}</span>
                   ${canGive || canTake ? `<button type="button" class="ghost-sm" id="hand">${iFly ? "Give" : "Take"}</button>` : ""}
                   ${fo && !observer ? `<button type="button" class="ghost-sm" id="obs">FO observer</button>` : ""}
                 </div>`
              : `<div class="name-row">
                   <label for="name">Name</label>
                   <input id="name" value="${escapeHtml(name)}" maxlength="24" />
                 </div>
                 <div class="deck-split">
                   <div class="deck-pane">
                     <h2>Host</h2>
                     <p class="hint">Start a session. Share the six-character code.</p>
                     <div class="card-foot">
                       <button type="button" class="btn-host" id="start" ${busy ? "disabled" : ""}>${busy ? "Starting..." : "Start deck"}</button>
                     </div>
                   </div>
                   <div class="deck-pane">
                     <h2>Join</h2>
                     <input id="code" class="code-one" maxlength="6" autocomplete="off" spellcheck="false" inputmode="text" aria-label="Session code" value="${escapeHtml(joinCode)}" />
                     <div class="card-foot">
                       <button type="button" class="btn-join" id="connect" ${busy ? "disabled" : ""}>${busy ? "Connecting..." : "Connect"}</button>
                     </div>
                   </div>
                 </div>`
          }
          ${cockpitView({ live, canGive, canTake, iFly })}
        </section>`;

  root.innerHTML = `
    <div class="frame board-frame">
      ${updateToast()}
      ${header()}
      <div class="board">
        ${settingsOpen ? settingsPanel() : home}
      </div>
      <footer class="status">
        <span class="sim-lamps status-item" data-sim-lamps>${simLampsHtml()}</span>
        <span class="status-item"><span class="lamp${install.ok ? " on" : ""}"><span class="dot${install.ok ? " live" : " warn"}"></span><span class="lamp-lab">Community</span></span></span>
        <span class="status-item"><span class="dot ${live && state?.path === "direct" ? "ok" : live ? "warn" : ""}"></span><span class="lamp-lab">${live ? escapeHtml(pathLabel(state?.path ?? "")) : "Path"}</span></span>
        <span class="status-copy">© BluNova Virtual Airlines by Jordy</span>
      </footer>
    </div>`;

  bindBoard();
  const restoreScroll = (): void => {
    Array.from(root.querySelectorAll<HTMLElement>("[data-card]")).forEach((el) => {
      const key = el.dataset.card || "";
      el.scrollTop = cardScrollMem[key] ?? 0;
    });
  };
  restoreScroll();
  requestAnimationFrame(restoreScroll);
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus();
      if (sel) {
        const start = sel.start ?? el.value.length;
        const end = sel.end ?? el.value.length;
        try {
          el.setSelectionRange(start, end);
        } catch {
          /* ignore */
        }
      }
    }
  }
}

function renderConnect(): void {
  renderBoard();
}

function renderLive(): void {
  renderBoard();
}

async function startDeck(): Promise<void> {
  if (!ws || busy || state?.room) return;
  settingsOpen = false;
  busy = true;
  error = "";
  renderBoard();
  try {
    await whenOpen(ws);
    send(ws, { type: "host", name, packId: resolvedPackId() });
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    busy = false;
    renderBoard();
  }
}

function tryJoin(): void {
  if (state?.room) return;
  const field = root.querySelector<HTMLInputElement>("#code");
  if (field) joinCode = rememberCode(field.value);
  const code = joinCode;
  if (code.length !== 6) {
    showJoinError("Enter the six-character code.");
    field?.focus();
    return;
  }
  if (!ws || busy) return;
  settingsOpen = false;
  busy = true;
  showJoinError("");
  setConnectBusy(true);
  const observer = joinSeat === "jumpLeft" || joinSeat === "jumpRight";
  void whenOpen(ws)
    .then(() =>
      send(ws!, {
        type: "join",
        code,
        name,
        observer,
        seat: joinSeat,
        packId: resolvedPackId(),
      }),
    )
    .catch((err) => {
      busy = false;
      setConnectBusy(false);
      showJoinError(err instanceof Error ? err.message : String(err));
      field?.focus();
    });
}

async function boot(): Promise<void> {
  let splashStarted = false;
  const startSplash = (): void => {
    if (splashStarted) return;
    splashStarted = true;
    const splash = document.getElementById("boot");
    restartCssAnimations(document);
    window.setTimeout(() => {
      splash?.classList.add("out");
    }, 1800);
    window.setTimeout(() => {
      splash?.remove();
    }, 2200);
  };
  if (document.visibilityState === "visible") startSplash();
  else {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "visible") startSplash();
      },
      { once: true },
    );
  }
  window.setTimeout(startSplash, 120);
  renderBoard();
  void app.getInstall?.().then((info) => {
    install = info;
    if (!state?.room && !lobbyEditing()) renderBoard();
  });
  const applyUpdate = (info: UpdateInfo) => {
    update = info;
    if (!lobbyEditing()) renderBoard();
  };
  app.onUpdate?.(applyUpdate);
  app.onUpdateProgress?.((info) => {
    updatePct = info.pct;
    updatePhase = info.phase;
    const fill = document.querySelector<HTMLElement>(".bar-track span");
    if (fill) fill.style.width = `${info.pct}%`;
  });
  void app.getUpdate?.().then((info) => {
    if (info) applyUpdate(info);
  });
  const ports = await app.getPorts?.();
  const port = ports?.bridgePort ?? 17321;
  ws = connectBridge((msg) => {
    if (msg.type === "hello") {
      if (msg.packs?.length) packs = msg.packs;
      if (!state?.room && !lobbyEditing()) renderBoard();
      return;
    }
    if (msg.type === "error") {
      busy = false;
      setConnectBusy(false);
      showJoinError(msg.reason);
      lastLiveKey = "lobby";
      root.querySelector<HTMLInputElement>("#code")?.focus();
      return;
    }
      if (msg.type === "state") {
      state = msg.state;
      if (state.room) error = "";
      if (!state.room) {
        const next = `lobby|${state.identity.inWorld ? "1" : "0"}|${state.identity.aircraftTitle}|${state.identity.airportIcao ?? ""}|${state.identity.mock ? "m" : "l"}|${state.identity.simProduct}`;
        const leftRoom = Boolean(lastLiveKey) && !lastLiveKey.startsWith("lobby");
        busy = false;
        if (leftRoom || lastLiveKey !== next) {
          lastLiveKey = next;
          renderBoard();
        } else {
          paintFlightBar();
          paintSimLamps();
        }
        if (state.error && !busy) showJoinError(state.error);
        return;
      }
      const key = [
        state.room,
        state.role,
        state.seat,
        state.path,
        state.roster.map((p) => `${p.seat}:${p.name}`).join(","),
        state.flyingName,
        state.identity.inWorld ? "w" : "m",
        state.identity.aircraftTitle,
        state.identity.airportIcao ?? "",
        state.identity.mock ? "mock" : "live",
        state.identity.simProduct,
      ].join("|");
      if (key !== lastLiveKey) {
        lastLiveKey = key;
        busy = false;
        rememberCode(state.room);
        if (lastCopiedRoom !== state.room && iAmHost()) {
          lastCopiedRoom = state.room;
          void (app.copy ? app.copy(state.room) : navigator.clipboard.writeText(state.room));
        }
        renderBoard();
      } else {
        const pill = document.querySelector(".path-pill");
        if (pill) {
          pill.innerHTML = `<span class="dot ${state.identity.connected && !state.identity.mock ? "ok" : "warn"}"></span><span class="path-pill-text">${pathLabel(state.path)} · ${Math.round(state.latencyMs)} ms</span>`;
        }
        paintFlightBar();
        paintSimLamps();
      }
    }
  }, port);
  void app.getSim?.().then((info) => {
    if (info) applySimStatus(info);
  });
  app.onSim?.(applySimStatus);
  void whenOpen(ws).catch((err) => {
    error = err instanceof Error ? err.message : String(err);
    if (!state?.room && !lobbyEditing()) renderBoard();
  });
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && state?.room) leaveDeck();
  });
}

void boot();
