# TwinSeat bridge

Local session engine:

- Loads original packs from `packs/`
- Enforces PF / PM / shared locks (see `@twinseat/protocol`)
- Speaks TwinSeat UDP to a peer (hole punch) or the relay
- Exposes `ws://127.0.0.1:17321` for the desktop UI
- Uses `MockSim` when SimConnect is not attached; otherwise `node-simconnect` writes pack vars so the 3D cockpit follows the other seat.

`simconnect-host/` is a C# stub for the official Windows SimConnect SDK.
