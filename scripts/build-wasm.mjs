import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "community", "src", "twinseat_presence.cpp");
const pack = join(root, "community", "twinseat-presence");
const outDir = join(pack, "modules");
const outWasm = join(outDir, "twinseat_presence.wasm");

function firstExisting(paths) {
  return paths.find((p) => p && existsSync(p)) ?? null;
}

function sdkRoots() {
  const env = [process.env.MSFS_SDK, process.env.MSFS_2024_SDK, process.env.MSFS2024_SDK].filter(Boolean);
  return [
    ...env,
    "C:\\MSFS 2024 SDK",
    "C:\\MSFS SDK",
    join(process.env["ProgramFiles"] || "C:\\Program Files", "MSFS 2024 SDK"),
    join(process.env["ProgramFiles"] || "C:\\Program Files", "MSFS SDK"),
  ];
}

function findSdk() {
  for (const rootPath of sdkRoots()) {
    const wasmInclude = join(rootPath, "WASM", "include");
    if (existsSync(wasmInclude)) return rootPath;
  }
  return null;
}

function findClang(sdk) {
  return firstExisting([
    join(sdk, "WASM", "llvm", "bin", "clang++.exe"),
    join(sdk, "WASM", "llvm", "bin", "clang-cl.exe"),
    join(sdk, "WASM", "wasi-sdk", "bin", "clang++.exe"),
  ]);
}

function libDir(sdk) {
  return firstExisting([
    join(sdk, "WASM", "wasi-sysroot", "lib", "wasm32-wasi"),
    join(sdk, "WASM", "wasi-sysroot", "lib", "wasm32-wasip1"),
  ]);
}

function writeLayout() {
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
}

const sdk = findSdk();
if (!sdk) {
  console.warn("[wasm] MSFS SDK not found. Install the 2020 or 2024 SDK, or set MSFS_SDK.");
  console.warn("[wasm] Desktop Setup still ships; in-sim calculator stays off until you run npm run wasm.");
  process.exit(0);
}

const clang = findClang(sdk);
if (!clang) {
  console.warn("[wasm] SDK at", sdk, "has no clang++. Repair the SDK (WASM / Platform Toolset).");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
const sysroot = join(sdk, "WASM", "wasi-sysroot");
const wasmInc = join(sdk, "WASM", "include");
const simInc = join(sdk, "SimConnect SDK", "include");
const libs = libDir(sdk);
const versionsLib = firstExisting([
  join(sdk, "WASM", "lib", "MSFS_WasmVersions.a"),
  libs ? join(libs, "MSFS_WasmVersions.a") : "",
]);

const args = [
  "-target",
  "wasm32-unknown-wasi",
  `--sysroot=${sysroot}`,
  "-D_MSFS_WASM=1",
  "-D__MSFS_WASM=1",
  "-D__wasi__",
  "-fno-exceptions",
  "-fms-extensions",
  "-fvisibility=hidden",
  "-mthread-model",
  "single",
  "-O2",
  `-I${wasmInc}`,
  `-I${sysroot}/include`,
  `-I${join(sysroot, "include", "c++", "v1")}`,
  `-I${simInc}`,
  "-Wl,--no-entry",
  "-Wl,--allow-undefined",
  "-Wl,--export=malloc",
  "-Wl,--export=free",
  "-Wl,--export=module_init",
  "-Wl,--export=module_deinit",
  "-Wl,--export=module_update",
  "-lc",
  "-lc++",
  "-lc++abi",
  `-o${outWasm}`,
  src,
];
if (libs) args.splice(args.indexOf("-lc"), 0, `-L${libs}`);
if (versionsLib) args.push(versionsLib);

console.log("[wasm] SDK", sdk);
console.log("[wasm]", clang);
const res = spawnSync(clang, args, { encoding: "utf8" });
if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);
if (res.status !== 0 || !existsSync(outWasm)) {
  console.error("[wasm] compile failed");
  process.exit(1);
}
writeLayout();
console.log("[wasm] wrote", outWasm, statSync(outWasm).size, "bytes");
