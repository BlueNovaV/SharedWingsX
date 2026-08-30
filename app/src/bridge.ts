export type PackInfo = { id: string; name: string; support: string };

export type UiState = {
  room?: string;
  selfId?: string;
  role: string;
  seat: string;
  path: string;
  latencyMs: number;
  roster: { id: string; name: string; host: boolean; seat?: string; role?: string }[];
  flyingName: string;
  monitoringName: string;
    identity: {
    connected: boolean;
    mock: boolean;
    inWorld?: boolean;
    aircraftTitle: string;
    simProduct: string;
    airportIcao?: string;
    airportCity?: string;
    airportCountry?: string;
    lat?: number;
    lon?: number;
    onGround?: boolean;
  };
  packId: string;
  packName: string;
  presenceSupport: string;
  remotePose: {
    headYaw: number;
    headPitch: number;
    bodyX: number;
    bodyY: number;
    bodyZ: number;
  } | null;
  remotePoses?: Record<
    string,
    { headYaw: number; headPitch: number; bodyX: number; bodyY: number; bodyZ: number }
  >;
  desyncs: { varId: number; name: string; localValue: number; networkValue: number }[];
  locks: { varId: number; lockedBy: string; untilMs: number }[];
  checklist: { ok: boolean; label: string }[];
  error?: string;
};

export type BridgeMsg =
  | { type: "hello"; packs: PackInfo[] }
  | { type: "state"; state: UiState }
  | { type: "error"; reason: string };

export type InstallInfo = { ok: boolean; message: string; found?: string[]; copied?: string[]; labels?: string[] };

export type UpdateInfo = {
  current: string;
  latest: string;
  downloadUrl: string;
  notes: string;
  sha256?: string;
  outdated: boolean;
  checked?: boolean;
};

export type UpdateProgress = { pct: number; phase: string };

export type TwinSeatDesktop = {
  name?: string;
  getInstall?: () => Promise<InstallInfo>;
  pickCommunity?: (prefer?: string) => Promise<InstallInfo>;
  rescanCommunity?: () => Promise<InstallInfo>;
  copy?: (text: string) => Promise<boolean>;
  getPorts?: () => Promise<{ bridgePort?: number }>;
  getUpdate?: () => Promise<UpdateInfo>;
  recheckUpdate?: () => Promise<UpdateInfo>;
  startUpdate?: () => Promise<{ ok: boolean; error?: string; dev?: boolean }>;
  openDownload?: () => Promise<boolean>;
  getSim?: () => Promise<{ msfs2020: boolean; msfs2024: boolean }>;
  onSim?: (cb: (info: { msfs2020: boolean; msfs2024: boolean }) => void) => void;
  onUpdate?: (cb: (info: UpdateInfo) => void) => void;
  onUpdateProgress?: (cb: (info: UpdateProgress) => void) => void;
};

export function desktop(): TwinSeatDesktop {
  return (window as unknown as { twinseat?: TwinSeatDesktop }).twinseat ?? {};
}

export function connectBridge(onMsg: (m: BridgeMsg) => void, port = 17321): WebSocket {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  ws.addEventListener("message", (ev) => onMsg(JSON.parse(String(ev.data)) as BridgeMsg));
  return ws;
}

export function send(ws: WebSocket, msg: object): void {
  const payload = JSON.stringify(msg);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(payload);
    return;
  }
  if (ws.readyState === WebSocket.CONNECTING) {
    ws.addEventListener("open", () => ws.send(payload), { once: true });
  }
}

export function whenOpen(ws: WebSocket, ms = 8000): Promise<void> {
  if (ws.readyState === WebSocket.OPEN) return Promise.resolve();
  if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
    return Promise.reject(new Error("Could not reach the SharedWingsX engine. Restart the app."));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Engine did not start. Restart SharedWingsX.")), ms);
    ws.addEventListener(
      "open",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
