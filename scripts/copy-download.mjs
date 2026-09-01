import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { relayUrl } = require("../app/electron/site.cjs");
const version = JSON.parse(readFileSync(join(root, "app", "package.json"), "utf8")).version;
const setupFile = "SharedWingsX-Setup.exe";

const destDir = join(root, "web", "public", "downloads");
const releaseDir = join(root, "release");
mkdirSync(destDir, { recursive: true });

function keepDownloadName(name) {
  return new Set([
    ".gitkeep",
    setupFile,
    `${setupFile}.sha256`,
    `SharedWingsX-Setup-${version}.exe`,
    `SharedWingsX-Setup-${version}.exe.blockmap`,
    `SharedWingsX-${version}-linux-x64.zip`,
    "SharedWingsX-linux-x64.zip",
    `SharedWingsX-${version}.zip`,
    "SharedWingsX.AppImage",
    `SharedWingsX-${version}.AppImage`,
  ]).has(name);
}

function pruneOldInstallers(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (keepDownloadName(name)) continue;
    if (!/\.(exe|zip|AppImage|blockmap|sha256)$/i.test(name)) continue;
    if (!/SharedWingsX|TwinSeat|DeckPair|NovaDeck/i.test(name)) continue;
    try {
      unlinkSync(join(dir, name));
      console.log("Removed old", join(dir, name));
    } catch (err) {
      console.warn("Could not remove", join(dir, name), err);
    }
  }
}

pruneOldInstallers(destDir);
pruneOldInstallers(releaseDir);

const setupExact = join(releaseDir, `SharedWingsX-Setup-${version}.exe`);
const fromRelease = existsSync(releaseDir)
  ? readdirSync(releaseDir)
      .filter((name) => /^SharedWingsX-Setup-.*\.exe$/i.test(name) || /^SharedWingsX-.*-portable\.exe$/i.test(name))
      .map((name) => join(releaseDir, name))
  : [];
const src = [setupExact, ...fromRelease].find((p) => existsSync(p));
let sha256 = "";
if (src) {
  copyFileSync(src, join(destDir, setupFile));
  copyFileSync(src, join(destDir, `SharedWingsX-Setup-${version}.exe`));
  sha256 = createHash("sha256").update(readFileSync(src)).digest("hex");
  writeFileSync(join(destDir, `${setupFile}.sha256`), `${sha256}  ${setupFile}\n`);
  console.log("Copied", setupFile, "from", src);
} else {
  console.warn("No installer in release/. Run npm run dist:win");
}

const linuxAppImageExact = join(releaseDir, `SharedWingsX-${version}.AppImage`);
const linuxAppImageFound = existsSync(releaseDir)
  ? readdirSync(releaseDir).filter((name) => /^SharedWingsX-.*\.AppImage$/i.test(name)).map((name) => join(releaseDir, name))
  : [];
const linuxAppImageSrc = [linuxAppImageExact, ...linuxAppImageFound].find((p) => existsSync(p));
if (linuxAppImageSrc) {
  copyFileSync(linuxAppImageSrc, join(destDir, "SharedWingsX.AppImage"));
  copyFileSync(linuxAppImageSrc, join(destDir, `SharedWingsX-${version}.AppImage`));
  console.log("Copied SharedWingsX.AppImage from", linuxAppImageSrc);
}

const linuxZipName = `SharedWingsX-${version}-linux-x64.zip`;
const linuxZipExact = join(releaseDir, linuxZipName);
const linuxZipGeneric = join(releaseDir, `SharedWingsX-${version}.zip`);
const linuxUnpacked = join(releaseDir, "linux-unpacked");
const linuxBinary = ["SharedWingsX", "sharedwingsx"].find((name) => existsSync(join(linuxUnpacked, name)));
if (!existsSync(linuxZipExact) && existsSync(linuxUnpacked) && linuxBinary) {
  const zip = spawnSync("tar", ["-a", "-c", "-f", linuxZipExact, "-C", linuxUnpacked, "."], { stdio: "inherit" });
  if (zip.status !== 0) {
    console.warn("Could not zip linux-unpacked for the site download.");
  }
}
const linuxZipSrc = [linuxZipExact, linuxZipGeneric].find((p) => existsSync(p));
if (linuxZipSrc) {
  copyFileSync(linuxZipSrc, join(destDir, linuxZipName));
  copyFileSync(linuxZipSrc, join(destDir, "SharedWingsX-linux-x64.zip"));
  console.log("Copied Linux zip from", linuxZipSrc);
}

const githubRepo = process.env.GITHUB_REPOSITORY || "BlueNovaV/sharedwingsx";
const downloadUrl = `https://github.com/${githubRepo}/releases/download/v${version}/SharedWingsX-Setup-${version}.exe`;

const update = {
  version,
  downloadUrl,
  notes: "Clean product site: card hover, scroll reveals, no gimmicks.",
  sha256,
  relayUrl: process.env.TWINSEAT_CLOUD_RELAY || relayUrl,
};
writeFileSync(join(root, "web", "public", "update.json"), `${JSON.stringify(update, null, 2)}\n`);
console.log("Wrote update.json", update.version, update.downloadUrl);
pruneOldInstallers(destDir);
pruneOldInstallers(releaseDir);
