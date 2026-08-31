const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("twinseat", {
  name: process.env.USERNAME || process.env.USER || "Pilot",
  getInstall: () => ipcRenderer.invoke("twinseat:install"),
  pickCommunity: (prefer) => ipcRenderer.invoke("twinseat:pick-community", prefer),
  rescanCommunity: () => ipcRenderer.invoke("twinseat:rescan-community"),
  copy: (text) => ipcRenderer.invoke("twinseat:copy", text),
  getPorts: () => ipcRenderer.invoke("twinseat:ports"),
  getUpdate: () => ipcRenderer.invoke("twinseat:update"),
  recheckUpdate: () => ipcRenderer.invoke("twinseat:recheck-update"),
  startUpdate: () => ipcRenderer.invoke("twinseat:start-update"),
  openDownload: () => ipcRenderer.invoke("twinseat:open-download"),
  getSim: () => ipcRenderer.invoke("twinseat:sim"),
  onSim: (cb) => {
    ipcRenderer.on("twinseat:sim", (_event, info) => cb(info));
  },
  onUpdate: (cb) => {
    ipcRenderer.on("twinseat:update", (_event, info) => cb(info));
  },
  onUpdateProgress: (cb) => {
    ipcRenderer.on("twinseat:update-progress", (_event, info) => cb(info));
  },
  winMin: () => ipcRenderer.send("twinseat:win-min"),
  winMax: () => ipcRenderer.send("twinseat:win-max"),
  winClose: () => ipcRenderer.send("twinseat:win-close"),
});
