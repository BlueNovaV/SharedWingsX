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

export function findLanHost(
  code: string,
  timeoutMs = 2500,
): Promise<{ ip: string; httpPort: number; udpPort: number } | null> {
  return new Promise((resolve) => {
    const udp = createSocket("udp4");
    let done = false;
    const finish = (value: { ip: string; httpPort: number; udpPort: number } | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearInterval(probe);
      try {
        udp.close();
      } catch {
        /* ignore */
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    const probe = setInterval(() => sendQuery(), 350);
    const sendQuery = () => {
      const msg = Buffer.from(`TSQ|${code}`, "utf8");
      for (const host of broadcasts()) {
        try {
          udp.send(msg, LAN_PORT, host);
        } catch {
          /* ignore */
        }
      }
    };
    udp.on("error", () => finish(null));
    udp.on("message", (msg, rinfo) => {
      const parts = String(msg).split("|");
      if (parts[0] !== "TS1" || parts[1] !== code) return;
      const httpPort = Number(parts[2]);
      const udpPort = Number(parts[3]);
      if (!httpPort) return;
      finish({ ip: rinfo.address, httpPort, udpPort });
    });
    udp.bind(0, () => {
      try {
        udp.setBroadcast(true);
      } catch {
        /* ignore */
      }
      sendQuery();
    });
  });
}
