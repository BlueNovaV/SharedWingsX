FsCopilot aircraft definition modules
====================================

The YAML files under `Definitions/` and the copy of `LICENSE` in this folder
are from https://github.com/yury-sch/FsCopilot (MIT License).

Copyright (c) 2026 Yury Scherbakov.

SharedWingsX does not include FsCopilot’s C#, WASM, protocol, or installer.
Only the MIT YAML modules are vendored. A SharedWingsX TypeScript loader
turns `get` / `set` / `skp` into SimConnect vars and calculator RPN.

Aircraft-specific profiles that FsCopilot downloads from their cloud are not
in this tree. Do not add YourControls (GPL) YAML here.
