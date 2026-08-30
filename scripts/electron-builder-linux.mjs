import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
// AppImage needs Linux/symlink support. On Windows we ship a zip of the Linux binary.
const target = process.platform === "win32" ? "zip" : "AppImage";
const result = spawnSync("npx", ["electron-builder", "--linux", target], {
  cwd: appDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" },
});
if (result.status !== 0) {
  console.warn("Linux package skipped or failed. Windows MSFS still needs the Windows Setup.");
  process.exit(0);
}
