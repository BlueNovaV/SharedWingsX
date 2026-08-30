# TwinSeat protocol v1

Independent binary protocol. Not compatible with YourControls.

## Transport

- UDP datagrams, max 1200 bytes payload (safe under typical MTU).
- Large snapshots are split into `SnapshotPart` frames.
- Signaling (room codes, punch) uses WebSocket JSON on the relay HTTP port.

## Packet header (10 bytes)

| Offset | Size | Field |
|--------|------|--------|
| 0 | 4 | Magic `TWIN` (`0x54 0x57 0x49 0x4E`) |
| 4 | 1 | Version `1` |
| 5 | 1 | Message type |
| 6 | 4 | Sequence (uint32 LE), 0 if not applicable |

## Message types

| Id | Name | Authority notes |
|----|------|-----------------|
| 1 | Heartbeat | RTT / liveness |
| 2 | Hello | Protocol + pack id + sim identity |
| 3 | JoinReject | Checklist failure |
| 4 | Snapshot | Full owned+shared state |
| 5 | Delta | Changed vars only |
| 6 | RoleTransfer | PF / PM / observer |
| 7 | PanelLock | Shared-domain lock |
| 8 | PresencePose | Head/torso at 20 to 30 Hz |
| 9 | DesyncReport | UI HUD |
| 10 | WeatherTimePolicy | Host policy only |
| 11 | PunchPing | Direct-path probe after hole punch |
| 12 | SimEvent | ATC menu / radio events (both seats) |

## ATC (both seats)

Captain and FO both write the `atc` domain. Radios, squawk and ATC menu keys (`ATC`, `ATC_MENU_1` to `ATC_MENU_9`) are sent as `SimEvent` plus synced vars (`ATC CLEARED IFR/TAXI/TAKEOFF/LANDING`, COM, transponder). When the FO requests clearance, the captain’s sim receives the same menu event and clearance flags.

Do **not** expect the in-sim ATC *window* pixels to match; the request and the resulting clearance state do.

## Roles

- `flying` / `monitoring` / `shared` / `atc`: captain and FO both write; last mover holds a short lock so idle hardware does not snap the other seat back. The remote sim applies those values so levers and knobs move in both cockpits.
- `observer` writes nothing

## Hello payload (JSON after header)

```json
{
  "displayName": "Alex",
  "packId": "asobo-c172",
  "aircraftTitle": "Cessna Skyhawk G1000",
  "simBuild": "1.37.x",
  "simProduct": "MSFS2020" | "MSFS2024",
  "liveryHash": "",
  "seat": "left" | "right" | "jumpLeft" | "jumpRight"
}
```

Join is accepted only if `packId` matches and `aircraftTitle` matches the pack’s `titleMatchers`. Livery hash is optional.

## Snapshot / Delta var record

Each var:

- `id` uint16 (index into the loaded pack)
- `value` float64 LE

Do **not** transmit derived engine/output vars (N1, RPM from throttle). Packs mark those `"sync": false`.

## Presence pose (48 bytes after header)

float32 LE: `headYaw, headPitch, headRoll, bodyYaw, bodyX, bodyY, bodyZ, stampMs`, then 1 byte seat (`0` left, `1` right, `2` jump left, `3` jump right).

A room holds up to four people. Jump seats are observers: they see the same throttle, yoke, flaps, lights and radios as the two flying seats, and they appear behind those seats. They do not write flying, MCP or ATC.

Seat attachment offsets live in the pack; each client applies `presence.seats[seat]` for that crew member.
