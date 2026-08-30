import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createSocket, type RemoteInfo } from "node:dgram";
import { createServer as createNetServer } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";
import { MAX_CREW, assignSeat, normalizeRoomCode, roleForSeat, type Role, type Seat } from "@twinseat/protocol";
import { startLanAnnounce } from "./lan.js";

export async function freeTcpPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

type Peer = {
  id: string;
  name: string;
  ws: WebSocket;
  publicIp?: string;
  publicPort?: number;
  wantsDirect: boolean;
  seat: Seat;
  role: Role;
};

type Room = {
  code: string;
  hostId: string;
  packId: string;
  peers: Map<string, Peer>;
};

const rooms = new Map<string, Room>();
const wsToRoom = new Map<WebSocket, { code: string; id: string }>();

function roomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function send(ws: WebSocket, msg: unknown): void {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function roster(room: Room) {
  return [...room.peers.values()].map((p) => ({
    id: p.id,
    name: p.name,
    host: p.id === room.hostId,
    seat: p.seat,
    role: p.role,
  }));
}

function broadcast(room: Room, msg: unknown, except?: WebSocket): void {
  for (const peer of room.peers.values()) {
    if (peer.ws !== except) send(peer.ws, msg);
  }
}

let started = false;
let boundHttp = 0;
let boundUdp = 0;

export async function startRelay(): Promise<{ httpPort: number; udpPort: number }> {
  if (started) {
    return { httpPort: boundHttp, udpPort: boundUdp };
  }
  started = true;

  const preferredHttp =
    process.env.TWINSEAT_FREE_PORTS === "1"
      ? 0
      : Number(process.env.PORT || (/^\d+$/.test(String(process.env.TWINSEAT_RELAY_HTTP ?? "")) ? process.env.TWINSEAT_RELAY_HTTP : 17320));
  const preferredUdp =
    process.env.TWINSEAT_FREE_PORTS === "1" ? 0 : Number(process.env.TWINSEAT_RELAY_UDP ?? 17320);

  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/health" || req.url?.startsWith("/health?")) {
      res.writeHead(200, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ ok: true, product: "twinseat-relay", rooms: rooms.size }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    const id = crypto.randomUUID();

    ws.on("message", (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }
      const type = String(msg.type ?? "");

      if (type === "host") {
        const code = roomCode();
        const name = String(msg.name ?? "Pilot");
        const packId = String(msg.packId ?? "asobo-c172");
        const room: Room = {
          code,
          hostId: id,
          packId,
          peers: new Map(),
        };
        room.peers.set(id, { id, name, ws, wantsDirect: true, seat: "left", role: "pf" });
        rooms.set(code, room);
        wsToRoom.set(ws, { code, id });
        send(ws, { type: "hosted", code, id, packId, seat: "left", role: "pf", roster: roster(room) });
        return;
      }

      if (type === "join") {
        const code = normalizeRoomCode(String(msg.code ?? ""));
        const name = String(msg.name ?? "Pilot");
        const packId = String(msg.packId ?? "");
        const room = rooms.get(code);
        if (!room) {
          send(ws, {
            type: "error",
            code: "no_room",
            reason: "Unknown room code. The host must keep SharedWingsX open on the same Wi-Fi.",
          });
          return;
        }
        if (room.peers.size >= MAX_CREW) {
          send(ws, { type: "error", code: "room_full", reason: "Room is full (4)" });
          return;
        }
        const occupied = [...room.peers.values()].map((p) => p.seat);
        const wantRaw = String(msg.seat ?? "");
        const want =
          wantRaw === "jumpLeft" || wantRaw === "jumpRight" || wantRaw === "right" || wantRaw === "left"
            ? wantRaw
            : null;
        const preferJump = Boolean(msg.observer) || want === "jumpLeft" || want === "jumpRight";
        const seat = assignSeat(occupied, preferJump, want);
        if (!seat) {
          send(ws, { type: "error", code: "room_full", reason: "No free seat" });
          return;
        }
        const role = preferJump ? "observer" : roleForSeat(seat);
        const packsClash =
          packId &&
          packId !== room.packId &&
          packId !== "generic-msfs" &&
          room.packId !== "generic-msfs";
        if (packsClash) {
          send(ws, { type: "error", code: "pack_mismatch", reason: `Host pack is ${room.packId}` });
          return;
        }
        room.peers.set(id, { id, name, ws, wantsDirect: true, seat, role });
        wsToRoom.set(ws, { code, id });
        send(ws, { type: "joined", code, id, packId: room.packId, seat, role, roster: roster(room) });
        broadcast(room, { type: "roster", roster: roster(room) });
        return;
      }

      const loc = wsToRoom.get(ws);
      if (!loc) return;
      const room = rooms.get(loc.code);
      if (!room) return;
      const peer = room.peers.get(loc.id);
      if (!peer) return;

      if (type === "punch_addr") {
        peer.publicIp = String(msg.ip ?? "");
        peer.publicPort = Number(msg.port ?? 0);
        const others = [...room.peers.values()].filter((p) => p.id !== peer.id && p.publicIp);
        for (const other of others) {
          send(peer.ws, {
            type: "peer_addr",
            id: other.id,
            ip: other.publicIp,
            port: other.publicPort,
          });
          send(other.ws, {
            type: "peer_addr",
            id: peer.id,
            ip: peer.publicIp,
            port: peer.publicPort,
          });
        }
        return;
      }

      if (type === "use_relay") {
        peer.wantsDirect = false;
        send(ws, { type: "relay_mode", udpPort: boundUdp });
        broadcast(room, { type: "relay_mode", udpPort: boundUdp }, ws);
        return;
      }

      if (type === "game") {
        broadcast(room, { type: "game", data: msg.data }, ws);
        return;
      }

      if (type === "swap-command") {
        const left = [...room.peers.values()].find((p) => p.seat === "left");
        const right = [...room.peers.values()].find((p) => p.seat === "right");
        if (!left || !right) {
          send(ws, { type: "error", code: "no_fo", reason: "Captain and first officer must both be in the deck." });
          return;
        }
        const front = peer.seat === "left" || peer.seat === "right";
        if (!front) {
          send(ws, { type: "error", code: "no_swap", reason: "Jump seats cannot transfer command." });
          return;
        }
        const isHost = peer.id === room.hostId;
        const isCaptain = peer.role === "pf";
        if (!isCaptain && !isHost) {
          send(ws, { type: "error", code: "no_swap", reason: "Only the captain or the host can transfer command." });
          return;
        }
        const leftSeat = left.seat;
        left.seat = right.seat;
        right.seat = leftSeat;
        left.role = roleForSeat(left.seat);
        right.role = roleForSeat(right.seat);
        const payload = { type: "roster", roster: roster(room) };
        for (const p of room.peers.values()) send(p.ws, payload);
      }
    });

    ws.on("close", () => {
      const loc = wsToRoom.get(ws);
      if (!loc) return;
      const room = rooms.get(loc.code);
      wsToRoom.delete(ws);
      if (!room) return;
      room.peers.delete(loc.id);
      if (room.peers.size === 0) {
        rooms.delete(loc.code);
        return;
      }
      if (room.hostId === loc.id) {
        const payload = { type: "ended", reason: "The host left. The deck is closed." };
        for (const peer of room.peers.values()) {
          send(peer.ws, payload);
          try {
            peer.ws.close();
          } catch {
            /* ignore */
          }
          wsToRoom.delete(peer.ws);
        }
        rooms.delete(loc.code);
        return;
      }
      broadcast(room, { type: "roster", roster: roster(room) });
    });
  });

  const udpBind = new Map<string, { room: string; peerId: string }>();
  const udp = createSocket("udp4");

  udp.on("message", (msg, rinfo: RemoteInfo) => {
    if (msg.length < 2 || msg[0] !== 0x52) return;
    const kind = msg[1];
    if (kind === 1) {
      const text = msg.subarray(2).toString("utf8");
      const [code, peerId] = text.split("|");
      if (!code || !peerId) return;
      udpBind.set(`${rinfo.address}:${rinfo.port}`, { room: code, peerId });
      const room = rooms.get(code);
      const peer = room?.peers.get(peerId);
      if (peer) {
        peer.publicIp = rinfo.address;
        peer.publicPort = rinfo.port;
        send(peer.ws, { type: "udp_reflex", ip: rinfo.address, port: rinfo.port });
      }
      return;
    }
    if (kind === 2) {
      const key = `${rinfo.address}:${rinfo.port}`;
      const from = udpBind.get(key);
      if (!from) return;
      const room = rooms.get(from.room);
      if (!room) return;
      const payload = msg.subarray(2);
      for (const [bindKey, bind] of udpBind) {
        if (bind.room !== from.room || bind.peerId === from.peerId) continue;
        const [ip, portStr] = bindKey.split(":");
        udp.send(Buffer.concat([Buffer.from([0x52, 2]), payload]), Number(portStr), ip);
      }
    }
  });

  try {
    await new Promise<void>((resolve, reject) => {
    udp.bind(preferredUdp, () => {
      const addr = udp.address();
      boundUdp = typeof addr === "object" ? addr.port : preferredUdp;
      console.log(`[twinseat-relay] UDP ${boundUdp}`);
      resolve();
    });
    udp.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && preferredUdp !== 0) {
        udp.bind(0, () => {
          const addr = udp.address();
          boundUdp = typeof addr === "object" ? addr.port : 0;
          console.log(`[twinseat-relay] UDP ${boundUdp}`);
          resolve();
        });
        return;
      }
      reject(err);
    });
  });
  } catch (err) {
    boundUdp = 0;
    console.warn("[twinseat-relay] UDP not bound", err instanceof Error ? err.message : err);
  }

  await new Promise<void>((resolve, reject) => {
    const onListen = (): void => {
      const addr = httpServer.address();
      boundHttp = typeof addr === "object" && addr ? addr.port : preferredHttp;
      console.log(`[twinseat-relay] signaling ws://0.0.0.0:${boundHttp}`);
      resolve();
    };
    httpServer.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && preferredHttp !== 0) {
        httpServer.listen(0, "0.0.0.0", onListen);
        return;
      }
      reject(err);
    });
    httpServer.listen(preferredHttp, "0.0.0.0", onListen);
  });

  startLanAnnounce(() =>
    [...rooms.values()].map((room) => ({
      code: room.code,
      httpPort: boundHttp,
      udpPort: boundUdp,
    })),
  );

  return { httpPort: boundHttp, udpPort: boundUdp };
}
