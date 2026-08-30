const { execFileSync } = require("child_process");

function exeNames() {
  try {
    const out = execFileSync("tasklist", ["/FO", "CSV", "/NH"], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 4000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const names = [];
    for (const line of String(out).split(/\r?\n/)) {
      const m = line.match(/^"([^"]+)"/);
      if (m) names.push(m[1].toLowerCase());
    }
    return names;
  } catch {
    return [];
  }
}

function detectSims() {
  if (process.platform !== "win32") return { msfs2020: false, msfs2024: false };
  const names = exeNames();
  let msfs2024 = names.some(
    (n) => n === "flightsimulator2024.exe" || n.includes("flightsimulator2024") || n === "msfs2024.exe",
  );
  let msfs2020 = names.some((n) => n === "flightsimulator.exe");
  if (msfs2024) msfs2020 = false;
  else if (msfs2020) {
    try {
      const verbose = execFileSync("tasklist", ["/FI", "IMAGENAME eq FlightSimulator.exe", "/V", "/FO", "CSV", "/NH"], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 4000,
      });
      if (/2024|limitless/i.test(String(verbose))) {
        msfs2024 = true;
        msfs2020 = false;
      }
    } catch {
      /* keep exe-name result */
    }
  }
  return { msfs2020, msfs2024 };
}

module.exports = { detectSims };
