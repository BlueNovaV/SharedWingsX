import { WebSocketServer, type WebSocket } from "ws";
import type { AddressInfo } from "node:net";
import { TwinSeatSession, type UiState } from "./session.js";
import { findPack, loadPacks } from "./pack.js";
import { createSim, connectMsfs } from "./sim-msfs.js";
import type { Role, Seat } from "@twinseat/protocol";

let started = false;
let boundUi = 0;

export type BridgeOptions = {
  uiPort?: number;
  relayHttp?: string;
  relayUdpHost?: string;
  relayUdpPort?: number;
};

export function startBridge(opts: BridgeOptions = {}): Promise<{ uiPort: number }> {
  if (started) return Promise.resolve({ uiPort: boundUi });
  started = true;

  const packs = loadPacks();
  let session: TwinSeatSession | null = null;
  let probe: Awaited<ReturnType<typeof createSim>> | null = null;
  const clients = new Set<WebSocket>();
  let lastUi = 0;

  const relayHttp = opts.relayHttp ?? process.env.TWINSEAT_RELAY_HTTP ?? "http://127.0.0.1:17320";
  const relayUdpHost = opts.relayUdpHost ?? process.env.TWINSEAT_RELAY_UDP_HOST ?? "127.0.0.1";
  const relayUdpPort = opts.relayUdpPort ?? Number(process.env.TWINSEAT_RELAY_UDP ?? 17320);
  const preferredUi =
    process.env.TWINSEAT_FREE_PORTS === "1" ? 0 : (opts.uiPort ?? Number(process.env.TWINSEAT_BRIDGE_WS ?? 17321));

  function idleUi(): UiState {
    const identity = probe?.identity() ?? {
      connected: false,
      mock: true,
      aircraftTitle: "",
      simBuild: "",
      simProduct: "MSFS2020" as const,
      liveryHash: "",
      inWorld: false,
    };
    return {
      role: "pf",
      seat: "left",
      path: "unknown",
      latencyMs: 0,
      roster: [],
      flyingName: "",
      monitoringName: "",
      identity,
      packId: "",
      packName: "",
      presenceSupport: "overlay",
      remotePose: null,
      remotePoses: {},
      desyncs: [],
      locks: [],
      checklist: [],
    };
  }

  function broadcastUi(force = false): void {
    const now = Date.now();
    if (!force && now - lastUi < 200) return;
    if (!session && !probe && !force) return;
    lastUi = now;
    const payloadState = session ? session.ui() : idleUi();
    const payload = JSON.stringify({ type: "state", state: payloadState });
    if (session && payloadState.error) session.lastError = "";
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    }
  }

  function autoPack(aircraftTitle: string, packId?: string): NonNullable<ReturnType<typeof findPack>> {
    return findPack(packs, aircraftTitle, packId || undefined) ?? findPack(packs, "", "generic-msfs")!;
  }

  function simIsLive(sim: Awaited<ReturnType<typeof createSim>> | null): boolean {
    if (!sim) return false;
    const id = sim.identity();
    return id.connected && !id.mock;
  }

  async function attachLiveSim(): Promise<void> {
    if (simIsLive(probe)) return;
    const live = await connectMsfs(autoPack("", "generic-msfs"));
    if (!live) return;
    probe = live;
    if (session) session.replaceSim(live);
    console.log("[twinseat] SimConnect connected");
    broadcastUi(true);
  }

  async function ensureSession(name: string, seat: Seat, packId?: string): Promise<TwinSeatSession> {
    if (session) return session;
    await attachLiveSim();
    const pack = autoPack("", packId);
    const sim = simIsLive(probe) && pack.id === "generic-msfs" ? probe! : await createSim(pack);
    if (pack.id === "generic-msfs") probe = sim;
    session = new TwinSeatSession(
      pack,
      sim,
      relayHttp,
      relayUdpHost,
      relayUdpPort,
      name,
      seat,
    );
    return session;
  }

  void attachLiveSim();
  setInterval(() => {
    void attachLiveSim();
  }, 4000);

  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ port: preferredUi, host: "127.0.0.1" });
    const onListening = (): void => {
      const addr = wss.address() as AddressInfo;
      boundUi = addr.port;
      console.log(`[twinseat-bridge] UI ws://127.0.0.1:${boundUi}  packs=${packs.map((p) => p.id).join(",")}`);
      resolve({ uiPort: boundUi });
    };
    wss.once("listening", () => {
      onListening();
      wire(wss);
    });
    wss.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && preferredUi !== 0) {
        const retry = new WebSocketServer({ port: 0, host: "127.0.0.1" });
        retry.once("listening", () => {
          const addr = retry.address() as AddressInfo;
          boundUi = addr.port;
          wire(retry);
          console.log(`[twinseat-bridge] UI ws://127.0.0.1:${boundUi}`);
          resolve({ uiPort: boundUi });
        });
        retry.on("error", reject);
        return;
      }
      reject(err);
    });

    function wire(server: WebSocketServer): void {
      server.on("connection", (ws) => {
        clients.add(ws);
        ws.send(
          JSON.stringify({ type: "hello", packs: packs.map((p) => ({ id: p.id, name: p.name, support: p.support })) }),
        );
        if (session) ws.send(JSON.stringify({ type: "state", state: session.ui() }));

        ws.on("message", async (raw) => {
          const msg = JSON.parse(String(raw)) as Record<string, unknown>;
          const type = String(msg.type ?? "");
          const name = String(msg.name ?? "Pilot");
          try {
            if (type === "leave") {
              session?.leave();
              session = null;
              broadcastUi(true);
              return;
            }
            if (type === "host") {
              session?.leave();
              session = null;
              await (await ensureSession(name, "left", String(msg.packId ?? "generic-msfs"))).host();
            }
            if (type === "join") {
              session?.leave();
              session = null;
              const wantRaw = String(msg.seat ?? "");
              const want = (["left", "right", "jumpLeft", "jumpRight"] as Seat[]).includes(wantRaw as Seat)
                ? (wantRaw as Seat)
                : undefined;
              const observer = Boolean(msg.observer) || want === "jumpLeft" || want === "jumpRight";
              const next = await ensureSession(name, want ?? (observer ? "jumpLeft" : "right"), String(msg.packId ?? ""));
              await next.join(String(msg.code ?? ""), observer, want);
            }
            if (type === "swap-command" && session) {
              session.swapCommand();
            }
            if (type === "transfer" && session) {
              session.transfer(String(msg.targetName), String(msg.role) as Role);
            }
            broadcastUi(true);
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            ws.send(JSON.stringify({ type: "error", reason }));
            if (session && !session.room) session.lastError = "";
          }
        });

        ws.on("close", () => clients.delete(ws));
      });
    }

    setInterval(() => {
      if (session) session.tick();
      else probe?.tick(40);
      broadcastUi();
    }, 40);
  });
}
