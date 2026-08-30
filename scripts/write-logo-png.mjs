import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "branding", "logo.png");
if (!existsSync(src)) throw new Error("Missing branding/logo.png");

for (const dest of [
  join(root, "web", "public", "brand"),
  join(root, "app", "public", "brand"),
]) {
  mkdirSync(dest, { recursive: true });
  copyFileSync(src, join(dest, "logo.png"));
}
const mark = join(root, "branding", "mark.svg");
if (existsSync(mark)) {
  copyFileSync(mark, join(root, "web", "public", "brand", "mark.svg"));
  copyFileSync(mark, join(root, "app", "public", "brand", "mark.svg"));
}
console.log("Copied logo.png to app and web brand folders");
