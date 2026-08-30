# SharedWingsX Community package

Copy `twinseat-presence/` into your MSFS **Community** folder after compiling WASM with the SDK.

After SharedWingsX installs it, the package shows in MSFS under **Marketplace → My Library → Community** as **SharedWingsX**, with the SharedWingsX logo thumbnail. That is the installed Community library, not a listing on the Microsoft Marketplace store.

| Sim | Manifest |
|-----|----------|
| MSFS 2020 | `manifest.msfs2020.json` → copy over `manifest.json` |
| MSFS 2024 | `manifest.msfs2024.json` → copy over `manifest.json` |
|-----|----------|
| MSFS 2020 | `manifest.msfs2020.json` → copy over `manifest.json` |
| MSFS 2024 | `manifest.msfs2024.json` → copy over `manifest.json` |

**2024:** attach to `PILOT_0` / `PILOT_1` when the aircraft exposes them.  
**2020 / missing nodes:** bridge writes LVars; WASM parents the placeholder avatar using pack XYZ offsets.

LVars (written by the session engine / future SimConnect host):

- `L:TWINSEAT_REMOTE_HEAD_YAW` (and `_PITCH` / `_ROLL`) for the FO
- `L:TWINSEAT_SEAT2_*` and `L:TWINSEAT_SEAT3_*` for jump seats (yaw/pitch/roll + body X/Y/Z)

Up to four crew: captain, FO, jump left, jump right. Jump seats are observers.

The included glTF is a **placeholder silhouette**. Replace with a licensed crew mesh before shipping a paid product.

Source: `community/src/twinseat_presence.cpp`
