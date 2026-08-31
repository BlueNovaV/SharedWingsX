const { createHash } = require("node:crypto");
const { spawn } = require("node:child_process");
const { createWriteStream } = require("node:fs");
const { mkdir, unlink, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { siteUrl } = require("./site.cjs");

function parseVersion(value) {
  return String(value ?? "0")
    .split(/[.-]/)
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);
}

function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

function siteHost() {
  try {
    return new URL(String(siteUrl)).hostname.replace(/^www\./, "");
  } catch {
    return "sharedwingsx.app";
  }
}

function feedUrls(unpackaged) {
  const site = String(siteUrl).replace(/\/$/, "");
  const urls = [
    process.env.TWINSEAT_UPDATE_FEED,
    `${site}/update.json`,
    "https://raw.githubusercontent.com/BlueNovaV/SharedWingsX/main/web/public/update.json",
    "https://raw.githubusercontent.com/BlueNovaV/sharedwingsx/main/web/public/update.json",
    "https://bluenovav.github.io/SharedWingsX/update.json",
    "https://bluenovav.github.io/sharedwingsx/update.json",
    "https://github.com/BlueNovaV/SharedWingsX/releases/latest/download/update.json",
    "https://github.com/BlueNovaV/sharedwingsx/releases/latest/download/update.json",
    "https://cdn.jsdelivr.net/gh/BlueNovaV/SharedWingsX@main/web/public/update.json",
  ];
  if (unpackaged || process.env.TWINSEAT_DEV_UPDATE === "1") {
    urls.unshift("http://127.0.0.1:17323/update.json");
  }
  return [...new Set(urls.filter(Boolean))];
}

function downloadAllowed(url, unpackaged) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (parsed.protocol === "https:") {
      if (host === siteHost()) return true;
      if (host === "github.com" || host.endsWith(".github.io")) return true;
      if (host === "raw.githubusercontent.com") return true;
      if (host === "cdn.jsdelivr.net") return true;
      if (host === "objects.githubusercontent.com") return true;
      if (host === "release-assets.githubusercontent.com") return true;
    }
    if (host === "127.0.0.1" || host === "localhost") {
      if (unpackaged) return true;
      if (parsed.port === "17323") return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function readFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "SharedWingsX-Update/1.0",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.version || !data?.downloadUrl) return null;
    if (data.relayUrl && !process.env.TWINSEAT_CLOUD_RELAY) {
      process.env.TWINSEAT_CLOUD_RELAY = String(data.relayUrl);
    }
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function emptyResult(current) {
  return {
    current,
    latest: current,
    downloadUrl: `${String(siteUrl).replace(/\/$/, "")}/downloads/SharedWingsX-Setup.exe`,
    notes: "",
    sha256: "",
    outdated: false,
    checked: false,
  };
}

async function checkUpdate(currentVersion, unpackaged = false) {
  const current = String(currentVersion || "0.0.0");
  const attempts = feedUrls(unpackaged).map(async (url) => {
    const data = await readFeed(url);
    if (!data) throw new Error("empty");
    return data;
  });
  let feed = null;
  try {
    feed = await Promise.any(attempts);
  } catch {
    feed = null;
  }
  if (!feed) return emptyResult(current);
  return {
    current,
    latest: String(feed.version),
    downloadUrl: String(feed.downloadUrl),
    notes: String(feed.notes ?? ""),
    sha256: String(feed.sha256 ?? ""),
    outdated: isNewer(feed.version, current),
    checked: true,
  };
}

async function applyUpdate(info, { unpackaged, onProgress, quit }) {
  if (!info?.downloadUrl || !downloadAllowed(info.downloadUrl, unpackaged)) {
    throw new Error("Update URL is not allowed.");
  }
  if (unpackaged) {
    throw new Error("DEV");
  }
  const dir = join(tmpdir(), "twinseat-update");
  await mkdir(dir, { recursive: true });
  const dest = join(dir, `SharedWingsX-Setup-${info.latest}.exe`);
  onProgress?.(2, "download");
  const res = await fetch(info.downloadUrl, {
    cache: "no-store",
    redirect: "follow",
    headers: { "User-Agent": "SharedWingsX-Update/1.0" },
  });
  if (!res.ok || !res.body) throw new Error("Could not download the new Setup.");
  const total = Number(res.headers.get("content-length")) || 0;
  let received = 0;
  const hash = createHash("sha256");
  const out = createWriteStream(dest);
  const source = Readable.fromWeb(res.body);
  source.on("data", (chunk) => {
    received += chunk.length;
    hash.update(chunk);
    if (total) onProgress?.(Math.min(92, Math.round((received / total) * 92)), "download");
  });
  await pipeline(source, out);
  if (info.sha256) {
    const got = hash.digest("hex");
    if (got.toLowerCase() !== String(info.sha256).toLowerCase()) {
      await unlink(dest).catch(() => {});
      throw new Error("Update file did not match. Try again later.");
    }
  }
  onProgress?.(96, "install");
  const bat = join(dir, "run.cmd");
  await writeFile(
    bat,
    `@echo off\r\ntimeout /t 2 /nobreak >nul\r\nstart "" /wait "${dest}" /S\r\n`,
    "utf8",
  );
  spawn(process.env.ComSpec || "cmd.exe", ["/c", bat], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
  onProgress?.(100, "install");
  setTimeout(() => quit?.(), 400);
}

module.exports = { checkUpdate, isNewer, applyUpdate, downloadAllowed };
