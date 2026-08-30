import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pack = join(root, "community", "twinseat-presence");
const logo = join(root, "branding", "logo.png");
const infoDir = join(pack, "ContentInfo", "twinseat-presence");
const thumb = join(infoDir, "Thumbnail.jpg");

mkdirSync(infoDir, { recursive: true });

const ps = `
Add-Type -AssemblyName System.Drawing
$logo = [System.Drawing.Image]::FromFile(${JSON.stringify(logo)})
$bmp = New-Object System.Drawing.Bitmap 320, 240
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(255, 11, 13, 18))
$scale = [Math]::Min(200.0 / $logo.Width, 160.0 / $logo.Height)
$w = [Math]::Max(1, [int]($logo.Width * $scale))
$h = [Math]::Max(1, [int]($logo.Height * $scale))
$x = [int]((320 - $w) / 2)
$y = [int]((240 - $h) / 2)
$g.DrawImage($logo, $x, $y, $w, $h)
$jpg = [System.Drawing.Imaging.ImageFormat]::Jpeg
$bmp.Save(${JSON.stringify(thumb)}, $jpg)
$g.Dispose()
$bmp.Dispose()
$logo.Dispose()
`;

const res = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
if (res.status !== 0 || !existsSync(thumb)) {
  console.error(res.stdout || "");
  console.error(res.stderr || "");
  throw new Error("Could not write ContentInfo Thumbnail.jpg from branding/logo.png");
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) walk(full, out);
    else if (name.name !== "layout.json" && name.name !== "manifest.json" && !name.name.startsWith("manifest.msfs")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(pack).filter((f) => existsSync(f) && statSync(f).size > 0);
const content = files.map((full) => {
  const st = statSync(full);
  return {
    path: relative(pack, full).replaceAll("\\", "/"),
    size: st.size,
    date: Math.floor(st.mtimeMs),
  };
});
writeFileSync(join(pack, "layout.json"), `${JSON.stringify({ content }, null, 2)}\n`);
console.log("Wrote", thumb, "and layout.json with", content.length, "files");
