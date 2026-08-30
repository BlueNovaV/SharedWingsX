import { startRelay } from "../../relay/src/server";
import { startBridge } from "../../bridge/src/server";

export async function bootEngine(): Promise<{ bridgePort: number; relayHttp: string; udpPort: number }> {
  const relay = await startRelay();
  const relayHttp = `http://127.0.0.1:${relay.httpPort}`;
  process.env.TWINSEAT_RELAY_HTTP = relayHttp;
  process.env.TWINSEAT_RELAY_UDP = String(relay.udpPort);
  const bridge = await startBridge({
    relayHttp,
    relayUdpHost: "127.0.0.1",
    relayUdpPort: relay.udpPort,
  });
  return { bridgePort: bridge.uiPort, relayHttp, udpPort: relay.udpPort };
}
