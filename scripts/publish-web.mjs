import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "web", "dist");
const setup = join(root, "web", "public", "downloads", "SharedWingsX-Setup.exe");

function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  return res.status === 0;
}

if (process.env.GITHUB_ACTIONS) {
  console.log("GitHub Actions publishes the site and Setup after this build.");
  process.exit(0);
}

if (!existsSync(dist)) {
  console.warn("No web/dist yet. Run npm run site:build first.");
  process.exit(0);
}

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_TOKEN;
if (token) {
  const ok = run("npx", [
    "--yes",
    "wrangler",
    "pages",
    "deploy",
    "web/dist",
    "--project-name",
    process.env.CLOUDFLARE_PAGES_PROJECT || "sharedwingsx",
    "--commit-dirty=true",
  ]);
  process.exit(ok ? 0 : 1);
}

console.log("");
console.log("Website files are ready in web/dist.");
if (existsSync(setup)) {
  console.log("Setup is at web/public/downloads/SharedWingsX-Setup.exe");
}
console.log("");
console.log("Live publish is automatic via GitHub:");
console.log("  1. Put this project on GitHub (branch main).");
console.log("  2. Settings, Pages: Source = GitHub Actions.");
console.log("  3. Each push to main builds the site plus SharedWingsX-Setup.exe.");
console.log("  4. Point sharedwingsx.app (CNAME) at that GitHub Pages site.");
console.log("");
console.log("sharedwingsx.app has no DNS yet. Download from that address will not work.");
console.log("Local: npm run site  ->  http://127.0.0.1:17323");
console.log("");
