const { app, BrowserWindow, ipcMain, clipboard, dialog, shell, screen } = require("electron");
const path = require("path");
const { bootEngine } = require("./engine.cjs");
const { installCommunity, rememberCommunityFolder } = require("./community.cjs");
const { checkUpdate, applyUpdate } = require("./update.cjs");
const { detectSims } = require("./sim-status.cjs");
const { relayUrl } = require("./site.cjs");

if (relayUrl && !process.env.TWINSEAT_CLOUD_RELAY) {
  process.env.TWINSEAT_CLOUD_RELAY = relayUrl;
}

process.on("uncaughtException", (err) => {
  console.error("[twinseat] uncaught", err);
});
process.on("unhandledRejection", (err) => {
  console.error("[twinseat] rejection", err);
});

app.commandLine.appendSwitch("disable-features", "Translate,TranslateUI,CalculateNativeWinOcclusion");
app.commandLine.appendSwitch("enable-lcd-text");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function packsPath() {
  if (app.isPackaged) return path.join(process.resourcesPath, "packs");
  return path.join(__dirname, "..", "..", "packs");
}

function fscopilotPath() {
  if (app.isPackaged) return path.join(process.resourcesPath, "fscopilot");
  return path.join(__dirname, "..", "..", "third_party", "fscopilot");
}

function communitySource() {
  if (app.isPackaged) return path.join(process.resourcesPath, "community", "twinseat-presence");
  return path.join(__dirname, "..", "..", "community", "twinseat-presence");
}

let installInfo = { found: [], copied: [], ok: false, message: "" };
let ports = { bridgePort: 17321 };
let mainWindow = null;
let updateInfo = {
  current: "0.0.0",
  latest: "0.0.0",
  downloadUrl: "",
  notes: "",
  outdated: false,
};
let updateBusy = false;
let updateCheck = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

ipcMain.handle("twinseat:install", () => installInfo);
ipcMain.handle("twinseat:rescan-community", () => {
  installInfo = installCommunity(communitySource(), { userData: app.getPath("userData") });
  return installInfo;
});
ipcMain.handle("twinseat:pick-community", async (_e, prefer) => {
  const want2020 = String(prefer || "") === "MSFS2020";
  const year = want2020 ? "MSFS2020" : "MSFS2024";
  const res = await dialog.showOpenDialog(mainWindow ?? undefined, {
    title: want2020 ? "Pick the MSFS 2020 Community folder" : "Pick the MSFS 2024 Community folder",
    properties: ["openDirectory"],
  });
  if (res.canceled || !res.filePaths[0]) return installInfo;
  rememberCommunityFolder(app.getPath("userData"), res.filePaths[0], year);
  installInfo = installCommunity(communitySource(), { userData: app.getPath("userData") });
  return installInfo;
});
ipcMain.handle("twinseat:copy", (_e, text) => {
  clipboard.writeText(String(text ?? ""));
  return true;
});
ipcMain.handle("twinseat:ports", () => ports);

function sendUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("twinseat:update", updateInfo);
  }
}

async function runUpdateCheck() {
  if (updateCheck) return updateCheck;
  updateCheck = checkUpdate(app.getVersion(), !app.isPackaged)
    .then((info) => {
      updateInfo = info;
      sendUpdate();
      return info;
    })
    .finally(() => {
      updateCheck = null;
    });
  return updateCheck;
}

async function startInstalledUpdate() {
  if (updateBusy) return { ok: false, error: "Update is already running." };
  if (!updateInfo.outdated || !updateInfo.downloadUrl) {
    return { ok: false, error: "There is no newer version." };
  }
  updateBusy = true;
  const sendProgress = (pct, phase) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("twinseat:update-progress", { pct, phase });
    }
  };
  try {
    if (!app.isPackaged) {
      if (updateInfo.downloadUrl) await shell.openExternal(updateInfo.downloadUrl);
      updateBusy = false;
      return { ok: true, dev: true };
    }
    await applyUpdate(updateInfo, {
      unpackaged: false,
      onProgress: sendProgress,
      quit: () => app.quit(),
    });
    return { ok: true };
  } catch (err) {
    updateBusy = false;
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

ipcMain.handle("twinseat:update", async () => {
  if (updateCheck) return updateCheck;
  return updateInfo;
});
ipcMain.handle("twinseat:recheck-update", () => runUpdateCheck());
ipcMain.handle("twinseat:start-update", () => startInstalledUpdate());
ipcMain.handle("twinseat:open-download", async () => {
  if (!updateInfo.downloadUrl) return false;
  await shell.openExternal(updateInfo.downloadUrl);
  return true;
});
ipcMain.handle("twinseat:sim", () => detectSims());
ipcMain.on("twinseat:win-min", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on("twinseat:win-max", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on("twinseat:win-close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

function sendSim() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("twinseat:sim", detectSims());
  }
}

async function createWindow() {
  process.env.TWINSEAT_PACKS = packsPath();
  process.env.TWINSEAT_FSCOPILOT = fscopilotPath();
  process.env.TWINSEAT_FREE_PORTS = "1";
  installInfo = installCommunity(communitySource(), { userData: app.getPath("userData") });
  try {
    ports = await bootEngine();
  } catch (err) {
    dialog.showErrorBox(
      "SharedWingsX",
      "Could not start the cockpit engine. Close another SharedWingsX or a leftover dev server and try again.\n\n" +
        String(err),
    );
    app.quit();
    return;
  }

  const work = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(820, Math.max(760, work.width - 160)),
    height: Math.min(700, Math.max(600, work.height - 120)),
    minWidth: 720,
    minHeight: 560,
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    backgroundColor: "#0b0d12",
    title: "SharedWingsX",
    autoHideMenuBar: true,
    show: true,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      spellcheck: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  void runUpdateCheck();
  mainWindow.once("ready-to-show", () => mainWindow.show());
  await mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  await mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  if (!mainWindow.isVisible()) mainWindow.show();
  sendSim();
  mainWindow.webContents.once("did-finish-load", () => {
    sendSim();
  });
  setInterval(() => {
    void runUpdateCheck();
  }, 4 * 60 * 60 * 1000);
  setInterval(sendSim, 2000);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
