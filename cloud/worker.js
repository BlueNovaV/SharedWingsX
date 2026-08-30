const MAX_CREW = 4;
const SEATS = ["left", "right", "jumpLeft", "jumpRight"];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,OPTIONS" };

function roomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function roleForSeat(seat) {
  if (seat === "left") return "pf";
  if (seat === "right") return "pm";
  return "observer";
}

function assignSeat(occupied, preferJump, want) {
  if (want && !occupied.includes(want)) return want;
  const order = preferJump
    ? want === "jumpRight"
      ? ["jumpRight", "jumpLeft"]
      : ["jumpLeft", "jumpRight"]
    : SEATS;
  return order.find((seat) => !occupied.includes(seat)) ?? null;
}

function roster(room) {
  return [...room.peers.values()].map((p) => ({
    id: p.id,
    name: p.name,
    host: p.id === room.hostId,
    seat: p.seat,
    role: p.role,
  }));
}

function emit(peer, msg) {
  if (!peer) return;
  if (peer.ws && peer.ws.readyState === 1) {
    try {
      peer.ws.send(JSON.stringify(msg));
      return;
    } catch {
      /* fall through to queue */
    }
  }
  peer.queue = peer.queue || [];
  peer.queue.push(msg);
  if (peer.queue.length > 400) peer.queue.splice(0, peer.queue.length - 400);
}

function broadcast(room, msg, exceptId) {
  for (const peer of room.peers.values()) {
    if (peer.id !== exceptId) emit(peer, msg);
  }
}

export class TwinSeatLobby {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.rooms = new Map();
    this.idToCode = new Map();
  }

  json(data, status = 200) {
    return Response.json(data, { status, headers: CORS });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const upgrade = (request.headers.get("Upgrade") || "").toLowerCase();

    if (url.pathname === "/health") {
      return this.json({ ok: true, product: "twinseat-relay", rooms: this.rooms.size });
    }
    if (url.pathname === "/poll" && request.method === "GET") {
      const id = url.searchParams.get("id") || "";
      const peer = this.findPeer(id);
      const messages = peer?.queue?.splice(0, 80) ?? [];
      if (peer) peer.lastSeen = Date.now();
      return this.json({ ok: true, messages });
    }
    if (url.pathname === "/rpc" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return this.json({ ok: false, messages: [] }, 400);
      }
      const replies = this.handle(String(body.clientId || crypto.randomUUID()), body);
      return this.json({ ok: true, messages: replies });
    }
    if (upgrade !== "websocket") {
      return new Response("SharedWingsX relay", { status: 200, headers: CORS });
    }
    const pair = new WebSocketPair();
    this.accept(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  findPeer(id) {
    const code = this.idToCode.get(id);
    if (!code) return null;
    return this.rooms.get(code)?.peers.get(id) ?? null;
  }

  accept(ws) {
    ws.accept();
    const id = crypto.randomUUID();
    ws.addEventListener("message", (ev) => {
      let parsed;
      try {
        parsed = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      const replies = this.handle(id, parsed, ws);
      const peer = this.findPeer(id) || { ws, queue: [], id };
      for (const msg of replies) emit(peer, msg);
    });
    ws.addEventListener("close", () => this.drop(id));
  }

  handle(id, msg, ws = null) {
    const replies = [];
    const reply = (m) => replies.push(m);
    const type = String(msg.type ?? "");

    if (type === "host") {
      const code = roomCode();
      const name = String(msg.name ?? "Pilot");
      const packId = String(msg.packId ?? "generic-msfs");
      const room = { code, hostId: id, packId, peers: new Map() };
      const peer = { id, name, ws, queue: [], seat: "left", role: "pf", lastSeen: Date.now() };
      room.peers.set(id, peer);
      this.rooms.set(code, room);
      this.idToCode.set(id, code);
      reply({ type: "hosted", code, id, packId, seat: "left", role: "pf", roster: roster(room) });
      return replies;
    }

    if (type === "join") {
      const code = String(msg.code ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      const name = String(msg.name ?? "Pilot");
      const packId = String(msg.packId ?? "");
      const room = this.rooms.get(code);
      if (!room || !room.peers.has(room.hostId)) {
        reply({
          type: "error",
          code: "no_room",
          reason: "Unknown room code. The host must click Start deck and keep SharedWingsX open.",
        });
        return replies;
      }
      if (room.peers.size >= MAX_CREW) {
        reply({ type: "error", code: "room_full", reason: "Room is full (4)" });
        return replies;
      }
      const occupied = [...room.peers.values()].map((p) => p.seat);
      const wantRaw = String(msg.seat ?? "");
      const want = SEATS.includes(wantRaw) ? wantRaw : null;
      const preferJump = Boolean(msg.observer) || want === "jumpLeft" || want === "jumpRight";
      const seat = assignSeat(occupied, preferJump, want);
      if (!seat) {
        reply({ type: "error", code: "room_full", reason: "No free seat" });
        return replies;
      }
      const role = preferJump ? "observer" : roleForSeat(seat);
      const packsClash =
        packId && packId !== room.packId && packId !== "generic-msfs" && room.packId !== "generic-msfs";
      if (packsClash) {
        reply({ type: "error", code: "pack_mismatch", reason: `Host pack is ${room.packId}` });
        return replies;
      }
      const peer = { id, name, ws, queue: [], seat, role, lastSeen: Date.now() };
      room.peers.set(id, peer);
      this.idToCode.set(id, code);
      reply({ type: "joined", code, id, packId: room.packId, seat, role, roster: roster(room) });
      broadcast(room, { type: "roster", roster: roster(room) }, id);
      return replies;
    }

    const code = this.idToCode.get(id);
    const room = code ? this.rooms.get(code) : null;
    const peer = room?.peers.get(id);
    if (!peer || !room) return replies;
    peer.lastSeen = Date.now();
    if (ws) peer.ws = ws;

    if (type === "use_relay") {
      reply({ type: "relay_mode", udpPort: 0 });
      broadcast(room, { type: "relay_mode", udpPort: 0 }, id);
      return replies;
    }
    if (type === "game") {
      broadcast(room, { type: "game", data: msg.data }, id);
      return replies;
    }
    if (type === "swap-command") {
      const left = [...room.peers.values()].find((p) => p.seat === "left");
      const right = [...room.peers.values()].find((p) => p.seat === "right");
      if (!left || !right) {
        reply({ type: "error", code: "no_fo", reason: "Captain and first officer must both be in the deck." });
        return replies;
      }
      const leftSeat = left.seat;
      left.seat = right.seat;
      right.seat = leftSeat;
      left.role = roleForSeat(left.seat);
      right.role = roleForSeat(right.seat);
      const payload = { type: "roster", roster: roster(room) };
      for (const p of room.peers.values()) emit(p, payload);
      return replies;
    }
    return replies;
  }

  drop(id) {
    const code = this.idToCode.get(id);
    this.idToCode.delete(id);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;
    room.peers.delete(id);
    if (room.peers.size === 0) {
      this.rooms.delete(code);
      return;
    }
    if (room.hostId === id) {
      broadcast(room, { type: "ended", reason: "The host left. The deck is closed." }, id);
      return;
    }
    broadcast(room, { type: "roster", roster: roster(room) }, id);
  }
}

export default {
  async fetch(request, env) {
    const id = env.LOBBY.idFromName("twinseat");
    return env.LOBBY.get(id).fetch(request);
  },
};
