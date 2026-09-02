const fs = require("fs");
const path = require("path");

function userCfgFiles() {
  const local = process.env.LOCALAPPDATA || "";
  const roaming = process.env.APPDATA || "";
  return [
    path.join(roaming, "Microsoft Flight Simulator", "UserCfg.opt"),
    path.join(roaming, "Microsoft Flight Simulator 2024", "UserCfg.opt"),
    path.join(local, "Packages", "Microsoft.FlightSimulator_8wekyb3d8bbwe", "LocalCache", "UserCfg.opt"),
    path.join(local, "Packages", "Microsoft.Limitless_8wekyb3d8bbwe", "LocalCache", "UserCfg.opt"),
  ];
}

function communityFromUserCfg(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(/InstalledPackagesPath\s+"([^"]+)"/) || text.match(/InstalledPackagesPath\s+(\S+)/);
    if (!match) return null;
    const packages = match[1].replace(/\\+$/g, "");
    return path.join(packages, "Community");
  } catch {
    return null;
  }
}

function steamLibraryRoots() {
  const vdfs = [
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Steam", "steamapps", "libraryfolders.vdf"),
    path.join("C:\\Program Files (x86)", "Steam", "steamapps", "libraryfolders.vdf"),
    path.join(process.env.LOCALAPPDATA || "", "Steam", "steamapps", "libraryfolders.vdf"),
  ];
  const roots = [];
  for (const vdf of vdfs) {
    try {
      const text = fs.readFileSync(vdf, "utf8");
      const matches = [...text.matchAll(/"path"\s+"([^"]+)"/g)];
      for (const m of matches) roots.push(m[1].replace(/\\\\/g, "\\"));
    } catch {
      /* missing */
    }
  }
  return roots;
}

function steamCommunityFolders() {
  const roots = [
    process.env["ProgramFiles(x86)"],
    process.env.ProgramFiles,
    "C:\\Program Files (x86)",
    "C:\\Program Files",
    ...steamLibraryRoots(),
  ].filter(Boolean);
  const names = [
    "Microsoft Flight Simulator",
    "MicrosoftFlightSimulator",
    "Microsoft Flight Simulator 2020",
    "Microsoft Flight Simulator 2024",
  ];
  const out = [];
  for (const root of roots) {
    const steamCommon = path.join(root, "steamapps", "common");
    const common = fs.existsSync(steamCommon) ? steamCommon : path.join(root, "Steam", "steamapps", "common");
    for (const name of names) {
      out.push(path.join(common, name, "Community"));
    }
  }
  return out;
}

function steamAppCommunityFolders() {
  const appIds = ["1250410", "2537590"];
  const out = [];
  const libs = steamLibraryRoots();
  const extra = [
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Steam"),
    "C:\\Program Files (x86)\\Steam",
  ];
  for (const lib of [...libs, ...extra]) {
    const steamapps = fs.existsSync(path.join(lib, "steamapps"))
      ? path.join(lib, "steamapps")
      : path.join(lib, "Steam", "steamapps");
    for (const id of appIds) {
      try {
        const acf = fs.readFileSync(path.join(steamapps, `appmanifest_${id}.acf`), "utf8");
        const dir = acf.match(/"installdir"\s+"([^"]+)"/);
        if (dir) out.push(path.join(steamapps, "common", dir[1], "Community"));
      } catch {
        /* missing */
      }
    }
  }
  return out;
}

function communityLabel(folder) {
  const s = String(folder || "").toLowerCase();
  if (s.includes("limitless") || s.includes("2024")) return "MSFS 2024";
  return "MSFS 2020";
}

function defaultCandidates() {
  return [...userCfgCommunityFolders(), ...guessedCommunityFolders()];
}

function savedPathFile(userData, year) {
  if (year === "MSFS2020") return path.join(userData, "community-folder-2020.txt");
  if (year === "MSFS2024") return path.join(userData, "community-folder-2024.txt");
  return path.join(userData, "community-folder.txt");
}

function readSavedFile(userData, year) {
  if (!userData) return null;
  try {
    const value = fs.readFileSync(savedPathFile(userData, year), "utf8").trim();
    return value || null;
  } catch {
    return null;
  }
}

function readSavedFolders(userData) {
  return [readSavedFile(userData, "MSFS2020"), readSavedFile(userData, "MSFS2024"), readSavedFile(userData, "")].filter(Boolean);
}

function writeSaved(userData, folder, year) {
  fs.mkdirSync(userData, { recursive: true });
  const key = String(year || "").includes("2020") ? "MSFS2020" : "MSFS2024";
  fs.writeFileSync(savedPathFile(userData, key), folder, "utf8");
}

function normalizeCommunityDir(picked) {
  if (!picked) return picked;
  const nested = path.join(picked, "Community");
  if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) return nested;
  return picked;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function replaceDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(src, dest);
}

function uniqueExisting(paths, options = {}) {
  const createMissing = options.createMissing === true;
  const seen = new Set();
  const out = [];
  for (const folder of paths) {
    if (!folder) continue;
    let resolved = folder;
    try {
      if (!fs.existsSync(folder)) {
        const parent = path.dirname(folder);
        if (
          createMissing &&
          path.basename(folder).toLowerCase() === "community" &&
          fs.existsSync(parent)
        ) {
          fs.mkdirSync(folder, { recursive: true });
        } else {
          continue;
        }
      }
      resolved = path.resolve(folder);
    } catch {
      continue;
    }
    const key = resolved.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(resolved);
  }
  return out;
}

function sameFolder(a, b) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

function guessedCommunityFolders() {
  const local = process.env.LOCALAPPDATA || "";
  const roaming = process.env.APPDATA || "";
  return [
    path.join(local, "Packages", "Microsoft.FlightSimulator_8wekyb3d8bbwe", "LocalCache", "Packages", "Community"),
    path.join(local, "Packages", "Microsoft.Limitless_8wekyb3d8bbwe", "LocalCache", "Packages", "Community"),
    path.join(roaming, "Microsoft Flight Simulator", "Packages", "Community"),
    path.join(roaming, "Microsoft Flight Simulator 2024", "Packages", "Community"),
    ...steamAppCommunityFolders(),
    ...steamCommunityFolders(),
  ];
}

function userCfgCommunityFolders() {
  return userCfgFiles().map(communityFromUserCfg).filter(Boolean);
}

function installCommunity(sourceRoot, options = {}) {
  if (process.platform !== "win32") {
    return {
      found: [],
      copied: [],
      ok: true,
      message: "Linux build: MSFS Community is Windows-only. You can start or join a deck. SimConnect needs Windows MSFS.",
    };
  }
  const userData = options.userData;
  const extra = options.extraFolders ?? [];
  const cfg = uniqueExisting(userCfgCommunityFolders(), { createMissing: true });
  const cfgYears = new Set(cfg.map(communityLabel));
  const guessed = uniqueExisting(guessedCommunityFolders()).filter((folder) => {
    if (cfg.some((item) => sameFolder(item, folder))) return false;
    if (cfgYears.has(communityLabel(folder))) return false;
    return true;
  });
  const picked = uniqueExisting(extra, { createMissing: true });
  const savedFolders = uniqueExisting(readSavedFolders(userData), { createMissing: true });
  const found = uniqueExisting([...picked, ...cfg, ...savedFolders, ...guessed]);
  const copied = [];
  if (!sourceRoot || !fs.existsSync(sourceRoot)) {
    return { found, copied, ok: false, message: "Presence package is not bundled in this build.", wasm: false };
  }
  for (const folder of found) {
    const dest = path.join(folder, "twinseat-presence");
    replaceDir(sourceRoot, dest);
    copied.push(dest);
  }
  if (!found.length) {
    return {
      found,
      copied,
      ok: false,
      message: "Community folder not found. Launch MSFS once, or pick the folder yourself. No zip, no drag-drop.",
      wasm: false,
    };
  }
  const yearSet = [...new Set(copied.map(communityLabel))];
  let message = yearSet.length === 1 ? `Presence is in ${yearSet[0]} Community.` : "Presence is in Community.";
  if (yearSet.length > 1) {
    message = `Presence is in ${yearSet.join(" and ")}.`;
  } else if (copied.length > 1) {
    message = `Presence copied to ${copied.length} ${yearSet[0] || "Community"} folders.`;
  }
  const wasm = copied.some((d) => fs.existsSync(path.join(d, "modules", "twinseat_presence.wasm")));
  if (!wasm) {
    message += " K-events go through SimConnect. Glass H-events need the MSFS SDK WASM.";
  }
  return {
    found,
    copied,
    ok: true,
    wasm,
    labels: found.map((folder) => communityLabel(folder)),
    message,
  };
}

function rememberCommunityFolder(userData, picked, year) {
  const folder = normalizeCommunityDir(picked);
  writeSaved(userData, folder, year || communityLabel(folder));
  return folder;
}

module.exports = {
  installCommunity,
  defaultCandidates,
  rememberCommunityFolder,
  normalizeCommunityDir,
  communityLabel,
  steamAppCommunityFolders,
};
