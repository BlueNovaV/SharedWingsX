import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const loaded = require("png-to-ico");
const pngToIco = typeof loaded === "function" ? loaded : loaded.default;
const src = join(root, "branding", "logo.png");
const build = join(root, "app", "build");
mkdirSync(build, { recursive: true });

if (!existsSync(src)) throw new Error("Missing branding/logo.png");

for (const name of readdirSync(build)) {
  if (/^(icon-\d+\.png|\d+x\d+\.png|installerIcon\.ico|uninstallerIcon\.ico)$/i.test(name)) {
    unlinkSync(join(build, name));
  }
}

const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
const ps = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile(${JSON.stringify(src)})
$build = ${JSON.stringify(build)}
foreach ($sz in @(${sizes.join(",")})) {
  $bmp = New-Object System.Drawing.Bitmap $sz, $sz
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 18, 32))
  $g.DrawImage($src, 0, 0, $sz, $sz)
  $bmp.Save((Join-Path $build ("icon-$sz.png")), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Save((Join-Path $build ("$sz" + "x$sz.png")), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}
$src.Dispose()
`;

const res = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
if (res.status !== 0) {
  console.error(res.stdout || "");
  console.error(res.stderr || "");
  throw new Error("Could not resize logo for Windows icon");
}

const sized = sizes.map((sz) => join(build, `icon-${sz}.png`));
for (const p of sized) {
  if (!existsSync(p)) throw new Error(`Missing ${p}`);
}

copyFileSync(join(build, "512x512.png"), join(build, "icon.png"));
copyFileSync(join(build, "512x512.png"), join(root, "branding", "app-icon.png"));
const icoFiles = sizes.filter((sz) => sz <= 256).map((sz) => join(build, `icon-${sz}.png`));
const buf = await pngToIco(icoFiles);
writeFileSync(join(build, "icon.ico"), buf);
copyFileSync(join(build, "icon.ico"), join(build, "installerIcon.ico"));
copyFileSync(join(build, "icon.ico"), join(build, "uninstallerIcon.ico"));

const webBrand = join(root, "web", "public", "brand");
mkdirSync(webBrand, { recursive: true });
copyFileSync(join(build, "icon.ico"), join(webBrand, "icon.ico"));

console.log("Wrote app/build/icon.ico from branding/logo.png", buf.length, "bytes", sizes.join(","));
