export function toHttp(url: string): string {
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
  const pinned = "https://twinseat-relay.rune-innocent.workers.dev";
  const out: string[] = [pinned];
  const env = process.env.TWINSEAT_CLOUD_RELAY?.trim();
  if (env && !/127\.0\.0\.1|localhost/i.test(env)) out.push(toHttp(env));
  for (const extra of String(process.env.TWINSEAT_CLOUD_RELAYS ?? "").split(",")) {
    const u = extra.trim();
    if (u && !/127\.0\.0\.1|localhost/i.test(u)) out.push(toHttp(u));
  }
  return [...new Set(out)];
}
