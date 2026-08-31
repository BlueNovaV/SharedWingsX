# SharedWingsX

Standalone **shared flight deck** for Microsoft Flight Simulator 2020 and 2024. Independent product, not a YourControls fork.

SharedWingsX syncs a crew across two to four simulators with **per-domain authority** (flying pilot / pilot monitoring / jump-seat observers) and a **presence** layer so the others are visible in their seats.

## Why it exists

YourControls-style tools sync loose simulator variables and leave both clients fighting the same knobs. They also never show the other person in the cockpit. SharedWingsX is built to sell later as its own product: reliable sync, a modern crew UI, and in-sim presence.

## Repo layout

| Path | Role |
|------|------|
| `protocol/` | SharedWingsX binary protocol (spec + TypeScript codec) |
| `bridge/` | Local engine: SimConnect (or mock), authority, UDP session |
| `app/` | Connect UI + Windows EXE (Electron) |
| `relay/` | Room codes, hole-punch signaling, UDP relay fallback |
| `packs/` | Aircraft JSON (universal SimConnect pack, C172, 787-10) |
| `third_party/fscopilot/` | MIT YAML modules from [FsCopilot](https://github.com/yury-sch/FsCopilot) (G1000/GNS `get`/`set`) |
| `web/` | Product website + EXE download |

## Website

```bash
npm install
npm run site
```

Opens http://127.0.0.1:17323. Product site with official EXE download (`web/public/downloads/SharedWingsX-Setup.exe`, copied from `release/`).

Live `sharedwingsx.app` is not a folder on this PC. Every push to `main` runs `.github/workflows/publish.yml`: it builds the Windows Setup, writes `update.json`, and deploys `web/dist` (including the EXE) to GitHub Pages. Point the domain CNAME at that Pages site. Until DNS exists, use the local site or the GitHub Pages URL.

## Download (Windows)

Pilots only need the EXE. They start a deck or type a 6-letter code. Pack, seats and network path are automatic.

```bash
npm install
npm run dist:win
```

Installers land in `release/` (`npm run dist:win`).

The EXE copies the SharedWingsX Community package by itself (MSFS 2020 and 2024 folders). It never rewrites aircraft files, unlike YourControls “full shared cockpit” installer ticks.

## Versus YourControls

YourControls asks for VC++/WebView2, a Community path, optional aircraft file patches, a username, then Cloud P2P / Cloud Host / Direct IP+port, then a connection list and a Launch Bar Switch keybind to hand over control.

SharedWingsX: one EXE, one code, automatic direct-or-cloud, captain/FO in two seats, Give/Take the aircraft. Same aircraft and spawn still matter; multiplayer stays off.

## Develop

```bash
npm install
npm run dev
```

Open two browser windows on http://localhost:17322. **Start a deck** in one, type the code in the other.

`npm run desktop` runs the same UI inside Electron (after a local build).

## Live SimConnect

The TypeScript bridge talks to `SimConnect.dll` when present. A C# host stub lives in `bridge/simconnect-host/` for a native Windows build against the official SDK.

Install the Community package from `community/twinseat-presence` (the EXE copies it). For in-sim `K:` events compile the original WASM: install the MSFS SDK, then `npm run wasm`.


## License

Proprietary. See `LICENSE` and `EULA.md`. Do not copy YourControls source, YAML, or protocol. MIT FsCopilot YAML modules are vendored separately under `third_party/fscopilot` with their copyright notice.
