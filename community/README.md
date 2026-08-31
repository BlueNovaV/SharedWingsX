# SharedWingsX Community package

The Windows Setup copies `twinseat-presence/` into MSFS Community. Aircraft files are never rewritten.

## In-sim calculator (WASM)

Throttles and switches on many 2020/2024 titles need `K:` events inside the sim. That module is original SharedWingsX code (`community/src/twinseat_presence.cpp`).

1. Install the **MSFS 2020 or 2024 SDK** (WASM / Platform Toolset).
2. Optional: set `MSFS_SDK` to the SDK folder (for example `C:\MSFS 2024 SDK`).
3. From the repo: `npm run wasm`
4. Restart MSFS. Setup (or Settings → Community) copies the package including `modules/twinseat_presence.wasm`.

`npm run dist:win` runs the same compile when the SDK is on that machine. GitHub Actions usually has no SDK, so the public Setup may ship **without** the `.wasm` until you build locally with the SDK and ship that installer, or add the SDK to CI.

Without the `.wasm`, SharedWingsX still syncs over SimConnect; glass/747 may ignore some SET events.

| Sim | Manifest |
|-----|----------|
| MSFS 2020 | `manifest.msfs2020.json` → copy over `manifest.json` |
| MSFS 2024 | `manifest.msfs2024.json` → copy over `manifest.json` |

After install, the package shows in MSFS under **Marketplace → My Library → Community** as **SharedWingsX**.

The included glTF is a **placeholder silhouette**. Do not import GPL YAML or VCockpit patches from other shared-cockpit tools.
