import { createSocket, type RemoteInfo, type Socket } from "node:dgram";
import WebSocket from "ws";
import {
  canWrite,
  decodeHeader,
  decodeHello,
  decodeJoinReject,
  decodePanelLock,
  decodePresencePose,
  decodeRoleTransfer,
  decodeVars,
  encodeDelta,
  encodeHello,
  encodeHeartbeat,
  encodePanelLock,
  encodePresencePose,
  encodePunchPing,
  encodeRoleTransfer,
  encodeSimEvent,
  encodeSnapshot,
  MessageType,
  nextSharedLock,
  shouldEmitDelta,
  decodeSimEvent,
  encodeWorldPose,
  decodeWorldPose,
  encodeInputEvent,
  decodeInputEvent,
  encodeWeatherTimePolicy,
  decodeWeatherTimePolicy,
  type DesyncReportPayload,
  type HelloPayload,
  type PanelLock,
  type PresencePose,
  type Role,
  type Seat,
  type WorldPose,
  normalizeRoomCode,
} from "@twinseat/protocol";
import type { AircraftPack } from "./pack.js";
import { seatOffset, titleMatches } from "./pack.js";
import type { SimBackend } from "./sim.js";
import { applyRemoteVar } from "./sim.js";
import { findLanHost } from "./lan.js";
import { cloudRelayUrls, toHttp, toWs } from "./cloud.js";

export type PathMode = "unknown" | "direct" | "relay";

export type UiState = {
  room?: string;
  selfId?: string;
  role: Role;
  seat: Seat;
  path: PathMode;
  latencyMs: number;
  roster: { id: string; name: string; host: boolean; seat?: Seat; role?: string }[];
  flyingName: string;
  monitoringName: string;
  identity: ReturnType<SimBackend["identity"]>;
  packId: string;
  packName: string;
  presenceSupport: AircraftPack["presence"]["support"];
  remotePose: PresencePose | null;
  remotePoses: Partial<Record<Seat, PresencePose>>;
  desyncs: DesyncReportPayload[];
  locks: PanelLock[];
  checklist: { ok: boolean; label: string }[];
  error?: string;
};

type Signaling = {
  type: string;
  [k: string]: unknown;
};

export class TwinSeatSession {
  role: Role = "pf";
  seat: Seat = "left";
  path: PathMode = "unknown";
  latencyMs = 0;
  roster: UiState["roster"] = [];
  flyingName = "";
  monitoringName = "";
  selfId = "";
  room = "";
  displayName: string;
  locks: PanelLock[] = [];
  remotePoses: Partial<Record<Seat, PresencePose>> = {};
  desyncs: DesyncReportPayload[] = [];
  seq = 1;
  lastEmit = new Map<number, { value: number; at: number }>();
  lastHb = 0;
  punchUntil = 0;
  helloSent = false;
  lastRosterN = 0;
  remoteHeld = new Set<number>();
  lastError = "";
  peers = new Map<string, { ip: string; port: number }>();
  relayUdp: { ip: string; port: number } | null = null;
  private udp: Socket;
  private signal: WebSocket | null = null;
  private localPort = 0;
  private hostedWait: { resolve: () => void; reject: (e: Error) => void } | null = null;
  private closingSelf = false;
  private lastWorldSend = 0;
  private lastHostPose: WorldPose | null = null;
  private wasInWorld = false;
  private lastFreezePulse = 0;
  private lastPoseApply = 0;
  private lastHelloAt = 0;
  private lastSnapAt = 0;
  private lastPresenceAt = 0;
  private lastTimeSend = 0;
  private syncReadyAt = 0;
  private lastSyncReady = false;
  private roomHost = false;
  private lastRemote = new Map<number, number>();
  private homeRelayHttp: string;
  private useHttp = false;
  private httpBase = "";
  private httpClientId = "";
  private httpPoll: ReturnType<typeof setInterval> | null = null;
  private cloudBase = "";
  private seenKeys = new Set<string>();
  private othersSeen = false;

  constructor(
    readonly pack: AircraftPack,
    public sim: SimBackend,
    public relayHttp: string,
    public relayUdpHost: string,
    public relayUdpPort: number,
    displayName: string,
    seat: Seat,
  ) {
    this.displayName = displayName;
    this.seat = seat;
    this.homeRelayHttp = relayHttp;
    this.udp = createSocket("udp4");
    this.udp.on("message", (msg, rinfo) => this.onUdp(msg, rinfo));
    this.udp.bind(0, () => {
      const addr = this.udp.address();
      this.localPort = typeof addr === "string" ? 0 : addr.port;
    });
  }

  ui(): UiState {
    const id = this.sim.identity();
    return {
      room: this.room || undefined,
      selfId: this.selfId || undefined,
      role: this.role,
      seat: this.seat,
      path: this.path,
      latencyMs: this.latencyMs,
      roster: this.roster,
      flyingName: this.flyingName,
      monitoringName: this.monitoringName,
      identity: id,
      packId: this.pack.id,
      packName: this.pack.name,
      presenceSupport: this.pack.presence.support,
      remotePose: this.remotePoses.right ?? Object.values(this.remotePoses)[0] ?? null,
      remotePoses: this.remotePoses,
      desyncs: this.desyncs,
      locks: this.locks,
      checklist: this.checklist(id.aircraftTitle),
      error: this.lastError || undefined,
    };
  }

  checklist(aircraftTitle: string) {
    return [
      { ok: this.sim.identity().connected, label: "Simulator connected" },
      { ok: titleMatches(this.pack, aircraftTitle), label: "Aircraft matches pack" },
      { ok: Boolean(this.room), label: "In a room" },
      { ok: this.path !== "unknown" || this.roster.length <= 1, label: "Network path ready" },
    ];
  }

  async host(): Promise<void> {
    const cloud = await this.connectAnyCloud();
    if (!cloud) {
      try {
        await this.connectSignal(this.homeRelayHttp);
      } catch {
        throw new Error(
          "Could not reach the SharedWingsX cloud. Check https://twinseat-relay.rune-innocent.workers.dev/health then try again.",
        );
      }
    }
    await this.waitForRoom(() => {
      this.sendSignal({ type: "host", name: this.displayName, packId: this.pack.id });
    });
    this.role = "pf";
    this.flyingName = this.displayName;
    this.path = cloud ? "relay" : "direct";
    this.sendSignal({ type: "use_relay" });
  }

  async join(codeRaw: string, observer = false, preferSeat?: Seat): Promise<void> {
    const code = normalizeRoomCode(codeRaw);
    if (code.length < 4) {
      throw new Error("Enter the 6-character room code from the host.");
    }
    const cloud = await this.connectAnyCloud();
    if (cloud) {
      try {
        await this.waitForRoom(() => this.sendJoin(code, observer, preferSeat));
        this.path = "relay";
        this.sendSignal({ type: "use_relay" });
        return;
      } catch (err) {
        if (!/unknown room code/i.test(err instanceof Error ? err.message : String(err))) throw err;
      }
    }
    const lan = await findLanHost(code);
    if (lan) {
      this.useHttp = false;
      this.relayUdpHost = lan.ip;
      this.relayUdpPort = lan.udpPort;
      await this.connectSignal(`http://${lan.ip}:${lan.httpPort}`);
      await this.waitForRoom(() => this.sendJoin(code, observer, preferSeat));
      return;
    }
    if (cloud) {
      throw new Error(
        "The host must click Start deck and keep SharedWingsX 0.4.65 open.",
      );
    }
    throw new Error(
      "Could not reach the SharedWingsX cloud. Open https://twinseat-relay.rune-innocent.workers.dev/health on both PCs, then Connect again.",
    );
  }

  private async connectAnyCloud(): Promise<boolean> {
    this.stopHttpPoll();
    this.useHttp = false;
    for (const url of cloudRelayUrls()) {
      try {
        await this.connectSignal(url);
        this.useHttp = false;
        this.cloudBase = toHttp(url);
        return true;
      } catch (err) {
        console.warn("[twinseat] cloud ws failed", url, err instanceof Error ? err.message : err);
      }
      try {
        await this.connectHttp(url);
        this.cloudBase = toHttp(url);
        return true;
      } catch (err) {
        console.warn("[twinseat] cloud http failed", url, err instanceof Error ? err.message : err);
      }
    }
    return false;
  }

  private abortAfter(ms: number): AbortSignal {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  }

  private async connectHttp(url: string): Promise<void> {
    const base = url.replace(/\/$/, "").replace(/^ws/i, "http");
    const res = await fetch(`${base}/health`, { signal: this.abortAfter(8000) });
    if (!res.ok) throw new Error(`health ${res.status}`);
    const body = (await res.json()) as { ok?: boolean };
    if (!body.ok) throw new Error("health");
    if (this.signal) {
      try {
        this.signal.close();
      } catch {
        /* ignore */
      }
      this.signal = null;
    }
    this.httpBase = base;
    this.httpClientId = crypto.randomUUID();
    this.useHttp = true;
    this.relayHttp = base;
    this.startHttpPoll();
  }

  private startHttpPoll(): void {
    this.stopHttpPoll();
    this.httpPoll = setInterval(() => {
      void this.httpPull();
    }, 120);
  }

  private stopHttpPoll(): void {
    if (this.httpPoll) {
      clearInterval(this.httpPoll);
      this.httpPoll = null;
    }
  }

  private async httpPull(): Promise<void> {
    if (!this.httpBase || !this.httpClientId) return;
    try {
      const res = await fetch(`${this.httpBase}/poll?id=${encodeURIComponent(this.httpClientId)}`, {
        signal: this.abortAfter(8000),
      });
      if (!res.ok) return;
      const body = (await res.json()) as { messages?: Signaling[] };
      for (const msg of body.messages ?? []) this.onSignal(msg);
    } catch {
      /* ignore */
    }
  }

  private async httpRpc(msg: object): Promise<void> {
    if (!this.httpBase || !this.httpClientId) return;
    const res = await fetch(`${this.httpBase}/rpc`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: this.abortAfter(10000),
      body: JSON.stringify({ ...msg, clientId: this.httpClientId }),
    });
    if (!res.ok) throw new Error(`rpc ${res.status}`);
    const body = (await res.json()) as { messages?: Signaling[] };
    for (const m of body.messages ?? []) this.onSignal(m);
  }

  private sendJoin(code: string, observer: boolean, preferSeat?: Seat): void {
    this.sendSignal({
      type: "join",
      code,
      name: this.displayName,
      packId: this.pack.id === "generic-msfs" ? "" : this.pack.id,
      observer,
      seat: preferSeat,
    });
  }

  private waitForRoom(send: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.hostedWait = null;
        reject(new Error("Relay did not answer. Close other SharedWingsX copies and try again."));
      }, 15000);
      this.hostedWait = {
        resolve: () => {
          clearTimeout(timer);
          this.hostedWait = null;
          resolve();
        },
        reject: (err) => {
          clearTimeout(timer);
          this.hostedWait = null;
          reject(err);
        },
      };
      send();
    });
  }

  replaceSim(sim: SimBackend): void {
    try {
      this.sim.setPhysicsHold(false, true);
    } catch {
      /* previous sim may already be gone */
    }
    this.sim = sim;
    this.lastFreezePulse = 0;
  }

  private meOnRoster() {
    return this.roster.find((p) => p.id === this.selfId) ?? this.roster.find((p) => p.name === this.displayName);
  }

  /** The player who started the deck owns the aircraft. Others follow. */
  private iAmPoseSource(): boolean {
    if (this.roomHost) return true;
    const me = this.meOnRoster();
    if (me?.host) return true;
    if (this.roster.some((p) => p.host)) return false;
    return false;
  }

  private hasCrew(): boolean {
    return this.roster.length > 1 || this.othersSeen;
  }

  private shouldHoldFollower(): boolean {
    return Boolean(this.room && this.hasCrew() && !this.iAmPoseSource());
  }

  private cockpitReady(now = Date.now()): boolean {
    return this.syncReadyAt > 0 && now >= this.syncReadyAt;
  }

  transfer(targetName: string, role: Role): void {
    const payload = {
      targetName,
      role,
      flyingName: role === "pf" ? targetName : this.flyingName,
      monitoringName: role === "pm" ? targetName : this.monitoringName,
    };
    if (targetName === this.displayName) this.role = role;
    this.flyingName = payload.flyingName;
    this.monitoringName = payload.monitoringName;
    this.sendGame(encodeRoleTransfer(payload));
  }

  swapCommand(): void {
    this.sendSignal({ type: "swap-command" });
  }

  private applyRoster(list: UiState["roster"]): void {
    this.roster = list;
    if (list.length > 1) this.othersSeen = true;
    const me = list.find((p) => p.id === this.selfId) ?? list.find((p) => p.name === this.displayName);
    if (me?.seat && me.seat !== this.seat) this.remoteHeld.clear();
    if (me?.seat) this.seat = me.seat;
    if (me?.role) this.role = me.role as Role;
    const pf = list.find((p) => p.role === "pf");
    const pm = list.find((p) => p.role === "pm");
    if (pf) this.flyingName = pf.name;
    if (pm) this.monitoringName = pm.name;
  }

  private connectSignal(url = this.relayHttp): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.signal) {
        this.closingSelf = true;
        this.signal.removeAllListeners();
        try {
          this.signal.close();
        } catch {
          /* ignore */
        }
        this.signal = null;
        this.closingSelf = false;
      }
      this.relayHttp = url;
      const ws = new WebSocket(toWs(url), {
        handshakeTimeout: 8000,
        perMessageDeflate: false,
        headers: { "User-Agent": "SharedWingsX/0.4.65" },
      });
      this.signal = ws;
      const timer = setTimeout(() => {
        try {
          ws.terminate();
        } catch {
          /* ignore */
        }
        reject(new Error("Could not reach SharedWingsX internet relay."));
      }, 8000);
      ws.on("open", () => {
        clearTimeout(timer);
        resolve();
      });
      ws.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
      ws.on("message", (raw) => {
        try {
          this.onSignal(JSON.parse(String(raw)) as Signaling);
        } catch {
          /* ignore */
        }
      });
      ws.on("close", () => {
        if (this.closingSelf) return;
        if (this.room) this.endDeck("The host left. The deck is closed.");
      });
    });
  }

  private sendSignal(msg: object): void {
    if (this.useHttp && this.httpBase) {
      void this.httpRpc(msg).catch((err) => {
        this.hostedWait?.reject(err instanceof Error ? err : new Error(String(err)));
      });
      return;
    }
    if (this.signal?.readyState === WebSocket.OPEN) this.signal.send(JSON.stringify(msg));
  }

  private onSignal(msg: Signaling): void {
    if (msg.type === "ended") {
      this.endDeck(String(msg.reason ?? "The host left. The deck is closed."));
      return;
    }
    if (msg.type === "hosted" || msg.type === "joined") {
      this.lastError = "";
      this.roomHost = msg.type === "hosted";
      this.room = String(msg.code);
      this.selfId = String(msg.id);
      this.roster = (msg.roster as UiState["roster"]) ?? [];
      if (msg.seat) this.seat = msg.seat as Seat;
      if (msg.role) this.role = msg.role as Role;
      this.applyRoster(this.roster);
      this.registerUdp();
      this.punchUntil = Date.now() + 3000;
      this.ensureGamePull();
      this.hostedWait?.resolve();
      return;
    }
    if (msg.type === "roster") {
      this.applyRoster((msg.roster as UiState["roster"]) ?? []);
      return;
    }
    if (msg.type === "game" && typeof msg.data === "string") {
      try {
        this.onUdp(Buffer.from(msg.data, "base64"), {
          address: "0.0.0.0",
          port: 0,
          family: "IPv4",
          size: 0,
        });
      } catch {
        /* ignore */
      }
      return;
    }
    if (msg.type === "udp_reflex") {
      this.sendSignal({ type: "punch_addr", ip: msg.ip, port: msg.port });
      return;
    }
    if (msg.type === "peer_addr") {
      this.peers.set(String(msg.id), { ip: String(msg.ip), port: Number(msg.port) });
      const peer = this.peers.get(String(msg.id));
      if (peer) this.udp.send(encodePunchPing(1), peer.port, peer.ip);
      return;
    }
    if (msg.type === "relay_mode") {
      this.path = "relay";
      this.relayUdp = { ip: this.relayUdpHost, port: this.relayUdpPort };
    }
    if (msg.type === "error") {
      this.lastError = String(msg.reason ?? "Could not connect");
      this.hostedWait?.reject(new Error(this.lastError));
    }
  }

  private registerUdp(): void {
    const payload = Buffer.from(`${this.room}|${this.selfId}`, "utf8");
    this.udp.send(Buffer.concat([Buffer.from([0x52, 1]), payload]), this.relayUdpPort, this.relayUdpHost);
  }

  private ensureGamePull(): void {
    const base = this.httpBase || this.cloudBase;
    const id = this.httpClientId || this.selfId;
    if (!base || !id) return;
    this.httpBase = base;
    this.httpClientId = id;
    this.startHttpPoll();
  }

  private rememberPacket(buf: Buffer): boolean {
    const key = `${buf.length}:${buf.subarray(0, Math.min(buf.length, 24)).toString("hex")}`;
    if (this.seenKeys.has(key)) return false;
    this.seenKeys.add(key);
    if (this.seenKeys.size > 500) {
      const first = this.seenKeys.values().next().value;
      if (first != null) this.seenKeys.delete(first);
    }
    return true;
  }

  private sendGame(buf: Buffer): void {
    if ((this.signal?.readyState === WebSocket.OPEN || this.useHttp) && this.room) {
      this.sendSignal({ type: "game", data: buf.toString("base64") });
    }
    if (!this.useHttp) void this.pushGameHttp(buf);
    if (this.path === "direct" && this.peers.size) {
      for (const peer of this.peers.values()) this.udp.send(buf, peer.port, peer.ip);
      return;
    }
    if (this.room && this.path !== "relay") {
      this.udp.send(Buffer.concat([Buffer.from([0x52, 2]), buf]), this.relayUdpPort, this.relayUdpHost);
    }
  }

  private async pushGameHttp(buf: Buffer): Promise<void> {
    const base = this.httpBase || this.cloudBase;
    const id = this.httpClientId || this.selfId;
    if (!base || !id || !this.room) return;
    try {
      const res = await fetch(`${base}/rpc`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: this.abortAfter(4000),
        body: JSON.stringify({ type: "game", data: buf.toString("base64"), clientId: id }),
      });
      if (!res.ok) return;
      const body = (await res.json()) as { messages?: Signaling[] };
      for (const m of body.messages ?? []) this.onSignal(m);
    } catch {
      /* WS path still open */
    }
  }

  private onUdp(msg: Buffer, rinfo: RemoteInfo): void {
    let game = msg;
    if (msg[0] === 0x52 && msg[1] === 2) game = msg.subarray(2);
    const header = decodeHeader(game);
    if (!header) return;
    if (!this.rememberPacket(game) && header.type !== MessageType.Heartbeat) return;

    if (header.type === MessageType.PunchPing) {
      if (!rinfo.port) return;
      this.path = "direct";
      this.peers.set(`${rinfo.address}:${rinfo.port}`, { ip: rinfo.address, port: rinfo.port });
      return;
    }

    if (header.type === MessageType.Heartbeat) {
      this.latencyMs = Math.max(0, Date.now() - this.lastHb);
      return;
    }

    if (header.type === MessageType.Hello) {
      const hello = decodeHello(game);
      if (hello.packId !== this.pack.id && hello.packId !== "generic-msfs" && this.pack.id !== "generic-msfs") {
        return;
      }
      this.othersSeen = true;
      if (this.iAmPoseSource() && this.cockpitReady()) this.sendGame(encodeSnapshot(this.seq++, this.snapshotVars()));
      return;
    }

    if (header.type === MessageType.JoinReject) {
      decodeJoinReject(game);
      return;
    }

    if (header.type === MessageType.Snapshot || header.type === MessageType.Delta) {
      const vars = decodeVars(game);
      const now = Date.now();
      for (const rec of vars) {
        const def = this.pack.variables.find((v) => v.id === rec.id);
        if (!def?.sync) continue;
        const lock = this.locks.find((l) => l.varId === rec.id && l.untilMs > now);
        if (lock && lock.lockedBy === this.displayName) continue;
        this.lastRemote.set(rec.id, rec.value);
        this.lastEmit.set(rec.id, { value: rec.value, at: now });
        this.remoteHeld.add(rec.id);
        if (this.cockpitReady(now)) applyRemoteVar(this.sim, this.pack, rec.id, rec.value);
      }
      return;
    }

    if (header.type === MessageType.RoleTransfer) {
      const p = decodeRoleTransfer(game);
      this.flyingName = p.flyingName;
      this.monitoringName = p.monitoringName;
      if (p.targetName === this.displayName) this.role = p.role;
      return;
    }

    if (header.type === MessageType.PanelLock) {
      const lock = decodePanelLock(game);
      this.locks = this.locks.filter((l) => l.varId !== lock.varId);
      this.locks.push(lock);
      return;
    }

    if (header.type === MessageType.PresencePose) {
      const pose = decodePresencePose(game);
      this.remotePoses = { ...this.remotePoses, [pose.seat]: pose };
      return;
    }

    if (header.type === MessageType.WorldPose) {
      if (this.iAmPoseSource()) return;
      const pose = decodeWorldPose(game);
      this.lastHostPose = pose;
      this.sim.setFollowPose(pose);
      this.sim.applyWorldPose(pose);
      this.lastPoseApply = Date.now();
      return;
    }

    if (header.type === MessageType.WeatherTimePolicy) {
      if (this.iAmPoseSource()) return;
      const policy = decodeWeatherTimePolicy(game);
      if (policy.syncTime) this.sim.applyZuluHour(policy.hostZuluHour);
      return;
    }

    if (header.type === MessageType.SimEvent) {
      if (!this.cockpitReady()) return;
      const ev = decodeSimEvent(game);
      const def = (this.pack.events ?? []).find((e) => e.id === ev.eventId);
      if (!def) return;
      this.sim.transmitEvent(def.sim, ev.data, true);
    }

    if (header.type === MessageType.InputEvent) {
      if (!this.cockpitReady()) return;
      const input = decodeInputEvent(game);
      this.sim.applyInputEvent(input.hash, input.value);
    }
  }

  tick(): void {
    const now = Date.now();
    this.sim.tick(40);
    this.locks = this.locks.filter((l) => l.untilMs > now);

    if (this.room && this.punchUntil && now > this.punchUntil && this.path === "unknown") {
      this.sendSignal({ type: "use_relay" });
      this.path = "relay";
      this.punchUntil = 0;
    }

    if (now - this.lastHb > 500 && this.room) {
      this.lastHb = now;
      this.sendGame(encodeHeartbeat(this.seq++, now));
    }

    if (this.room && this.hasCrew() && now - this.lastHelloAt > 1500) {
      this.lastHelloAt = now;
      this.lastRosterN = this.roster.length;
      this.helloPeer();
    }

    const pose = this.sim.worldPose();
    const inWorld = Boolean(pose);
    if (inWorld) {
      if (!this.syncReadyAt) this.syncReadyAt = now + 3000;
    } else {
      this.syncReadyAt = 0;
      this.lastSyncReady = false;
    }
    const ready = this.cockpitReady(now);
    const hold = this.shouldHoldFollower();
    const enteredWorld = inWorld && !this.wasInWorld;

    if (ready && !this.lastSyncReady) {
      for (const [id, value] of this.lastRemote) {
        applyRemoteVar(this.sim, this.pack, id, value);
      }
    }
    this.lastSyncReady = ready;

    if (hold && ready) {
      for (const [id, value] of this.lastRemote) {
        applyRemoteVar(this.sim, this.pack, id, value);
      }
    }
    this.sim.setFollowPose(hold && this.lastHostPose ? this.lastHostPose : null);
    const pins: Seat[] = [];
    for (const p of this.roster) {
      if (p.id === this.selfId || p.name === this.displayName) continue;
      const seat = (p.seat || "") as Seat;
      if (seat && seat !== this.seat && !pins.includes(seat)) pins.push(seat);
    }
    this.sim.syncCrewPins(this.room && this.hasCrew() ? pins : []);
    if (hold && (enteredWorld || now - this.lastFreezePulse > 8000)) {
      this.sim.setPhysicsHold(true, true);
      this.lastFreezePulse = now;
    } else if (!hold) {
      this.sim.setPhysicsHold(false);
    }
    this.wasInWorld = inWorld;

    if (this.room && this.hasCrew() && pose && this.iAmPoseSource() && ready) {
      const worldGap = pose.onGround ? 100 : 50;
      if (now - this.lastWorldSend > worldGap) {
        this.lastWorldSend = now;
        this.sendGame(encodeWorldPose(this.seq++, pose));
      }
    }

    if (this.room && this.hasCrew() && ready) {
      for (const ev of this.sim.drainEvents()) {
        const def = (this.pack.events ?? []).find((e) => e.sim === ev.name);
        if (!def) continue;
        if (this.role === "observer") continue;
        if (!canWrite(this.displayName, this.role, def.domain, def.id, now, this.locks)) continue;
        this.sendGame(encodeSimEvent(this.seq++, { eventId: def.id, data: ev.data }));
      }
      if (this.role !== "observer") {
        for (const input of this.sim.drainInputEvents()) {
          this.sendGame(encodeInputEvent(this.seq++, input));
        }
      } else {
        this.sim.drainInputEvents();
      }
      const cam = this.sim.camera();
      if (now - this.lastPresenceAt > 100) {
        this.lastPresenceAt = now;
        const offset = seatOffset(this.pack, this.seat);
        this.sendGame(
          encodePresencePose(this.seq++, {
            headYaw: cam.yaw,
            headPitch: cam.pitch,
            headRoll: cam.roll,
            bodyYaw: 0,
            bodyX: offset.x,
            bodyY: offset.y,
            bodyZ: offset.z,
            stampMs: now,
            seat: this.seat,
          }),
        );
      }
    }

    const delta = this.collectOwnedDeltas(now);
    if (delta.length && this.room && ready) {
      this.sendGame(encodeDelta(this.seq++, delta));
    }

    if (this.room && this.hasCrew() && this.iAmPoseSource() && ready && now - this.lastSnapAt > 200) {
      this.lastSnapAt = now;
      this.sendGame(encodeSnapshot(this.seq++, this.snapshotVars()));
    }

    if (this.room && this.hasCrew() && this.iAmPoseSource() && ready && now - this.lastTimeSend > 8000) {
      this.lastTimeSend = now;
      const z = this.sim.zulu();
      if (z) {
        this.sendGame(
          encodeWeatherTimePolicy({
            syncTime: true,
            syncWeather: false,
            hostZuluHour: z.hour + z.minute / 60,
          }),
        );
      }
    }
  }

  injectLocal(varId: number, value: number): void {
    const def = this.pack.variables.find((v) => v.id === varId);
    if (!def) return;
    const now = Date.now();
    if (!canWrite(this.displayName, this.role, def.domain, varId, now, this.locks)) return;
    this.sim.write(def, value);
    this.claimVar(varId, now);
  }

  helloPeer(): void {
    const idn = this.sim.identity();
    const hello: HelloPayload = {
      displayName: this.displayName,
      packId: this.pack.id,
      aircraftTitle: idn.aircraftTitle,
      simBuild: idn.simBuild,
      simProduct: idn.simProduct,
      liveryHash: idn.liveryHash,
      seat: this.seat,
    };
    this.sendGame(encodeHello(this.seq++, hello));
  }

  private snapshotVars(now = Date.now()) {
    return this.pack.variables
      .filter((v) => {
        if (!v.sync) return false;
        if (this.iAmPoseSource()) return true;
        if (this.remoteHeld.has(v.id)) return false;
        return canWrite(this.displayName, this.role, v.domain, v.id, now, this.locks);
      })
      .map((v) => ({ id: v.id, value: this.sim.read(v) }));
  }

  private collectOwnedDeltas(now: number) {
    const out: { id: number; value: number }[] = [];
    for (const v of this.pack.variables) {
      if (!v.sync) continue;
      if (!this.iAmPoseSource() && !canWrite(this.displayName, this.role, v.domain, v.id, now, this.locks)) continue;
      const value = this.sim.read(v);
      const prev = this.lastEmit.get(v.id);
      if (!prev) {
        this.lastEmit.set(v.id, { value, at: now });
        continue;
      }
      if (this.remoteHeld.has(v.id) && Math.abs(value - prev.value) < v.epsilon) {
        continue;
      }
      if (!shouldEmitDelta(prev.value, value, v.epsilon, prev.at, now, this.pack.minDeltaMs)) {
        continue;
      }
      this.remoteHeld.delete(v.id);
      this.lastEmit.set(v.id, { value, at: now });
      this.claimVar(v.id, now);
      out.push({ id: v.id, value });
    }
    return out;
  }

  private claimVar(varId: number, now: number): void {
    const lock = nextSharedLock(this.displayName, varId, now, this.pack.sharedLockMs);
    this.locks = this.locks.filter((l) => l.varId !== varId);
    this.locks.push(lock);
    this.sendGame(encodePanelLock(lock));
  }

  private endDeck(reason: string): void {
    if (!this.room) {
      if (reason) this.lastError = reason;
      return;
    }
    this.leave();
    this.lastError = reason;
  }

  leave(): void {
    this.closingSelf = true;
    this.roomHost = false;
    this.room = "";
    this.selfId = "";
    this.roster = [];
    this.path = "unknown";
    this.peers.clear();
    this.relayUdp = null;
    this.helloSent = false;
    this.punchUntil = 0;
    this.lastWorldSend = 0;
    this.lastHostPose = null;
    this.wasInWorld = false;
    this.lastHelloAt = 0;
    this.lastSnapAt = 0;
    this.lastRemote.clear();
    this.lastError = "";
    this.useHttp = false;
    this.othersSeen = false;
    this.seenKeys.clear();
    this.stopHttpPoll();
    this.sim.setPhysicsHold(false);
    try {
      this.signal?.close();
    } catch {
      /* ignore */
    }
    this.signal = null;
    try {
      this.udp.close();
    } catch {
      /* ignore */
    }
  }
}
