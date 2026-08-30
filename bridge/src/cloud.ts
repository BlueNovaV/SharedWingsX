function toHttp(url: string): string {
  return url
    .trim()
    .replace(/\/$/, "")
    .replace(/^ws:\/\//i, "http://")
    .replace(/^wss:\/\//i, "https://");
}

export function toWs(url: string): string {
  return toHttp(url).replace(/^http/, "ws");
}

export function cloudRelayUrls(): string[] {
  const out: string[] = [];
  const env = process.env.TWINSEAT_CLOUD_RELAY?.trim();
  if (env) out.push(toHttp(env));
  for (const extra of String(process.env.TWINSEAT_CLOUD_RELAYS ?? "").split(",")) {
    const u = extra.trim();
    if (u) out.push(toHttp(u));
  }
  out.push("https://twinseat-relay.rune-innocent.workers.dev");
  return [...new Set(out)];
}
