import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.CSC_LINK && !process.env.WIN_CSC_LINK) {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = "false";
}

const signed = Boolean(process.env.CSC_LINK || process.env.WIN_CSC_LINK || process.env.CSC_NAME);
const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
if (!signed) {
  console.warn(
    "Windows Setup is unsigned. SmartScreen will show Unknown publisher until you sign with an Authenticode certificate (OV or EV) whose organization is BluNova Virtual Airlines.",
  );
  console.warn("After you have a .pfx: set CSC_LINK to the file path and CSC_KEY_PASSWORD, then run npm run dist:win.");
}
const args = ["electron-builder", "--win", "nsis", `-c.win.signExecutable=${signed}`];
const result = spawnSync("npx", args, {
  cwd: appDir,
  stdio: "inherit",
  shell: true,
  env: process.env,
});
process.exit(result.status === null ? 1 : result.status);
