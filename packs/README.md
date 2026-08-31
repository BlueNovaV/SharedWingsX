# SharedWingsX aircraft packs

Original SharedWingsX JSON. Do **not** import GPL definition files.

G1000 / GNS mappings for matching titles come from MIT YAML under `third_party/avionics-yaml` (see that folder’s `NOTICE.md` and `LICENSE`). Those files are not converted into this JSON.

| Pack | Support | Notes |
|------|--------|--------|
| `generic-msfs` | `offset` | Fallback for every MSFS aircraft (PMDG, Fenix, stock). SimConnect core. Jump-seat offsets behind the two flying seats. |
| `asobo-c172` | `offset` | Dedicated Skyhawk. Rear cabin used as jump offsets (no real observer node). |
| `asobo-787-10` | `offset` | Stock 787-10. Jump seats behind the MCP. FMS not fully synced. |

`generic-msfs` is selected when no dedicated matcher hits. Custom CDU/FMS Lvars are not guaranteed.

`support` levels:

- `full`: first-officer node + avatar mesh with no clip in interior
- `offset`: calibrated XYZ/PBH relative to user aircraft (2020 + payware without nodes)
- `overlay`: in-sim attach failed; app draws the fallback silhouette

