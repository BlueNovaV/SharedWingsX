import { createSocket } from "node:dgram";
import { networkInterfaces } from "node:os";

export const LAN_PORT = 17329;

function broadcasts(): string[] {
  const out = new Set(["255.255.255.255"]);
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family !== "IPv4" || a.internal) continue;
      const parts = a.address.split(".");
      if (parts.length === 4) out.add(`${parts[0]}.${parts[1]}.${parts[2]}.255`);
    }
  }
  return [...out];
}

export function startLanAnnounce(getRooms: () => { code: string; httpPort: number; udpPort: number }[]): () => void {
  const udp = createSocket({ type: "udp4", reuseAddr: true });
  let timer: ReturnType<typeof setInterval> | null = null;

  const sendBeacon = (room: { code: string; httpPort: number; udpPort: number }, ip: string, port: number) => {
    udp.send(Buffer.from(`TS1|${room.code}|${room.httpPort}|${room.udpPort}`, "utf8"), port, ip);
  };

  udp.on("error", () => {});
  udp.on("message", (msg, rinfo) => {
    const text = String(msg);
    if (!text.startsWith("TSQ|")) return;
    const want = text.slice(4).trim();
    for (const room of getRooms()) {
      if (room.code === want) sendBeacon(room, rinfo.address, rinfo.port);
    }
  });
  udp.bind(LAN_PORT, () => {
    try {
      udp.setBroadcast(true);
    } catch {
      /* ignore */
    }
    timer = setInterval(() => {
      for (const room of getRooms()) {
        for (const host of broadcasts()) sendBeacon(room, host, LAN_PORT);
      }
    }, 700);
  });
  return () => {
    if (timer) clearInterval(timer);
    try {
      udp.close();
    } catch {
      /* ignore */
    }
  };
}
