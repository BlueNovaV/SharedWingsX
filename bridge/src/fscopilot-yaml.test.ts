import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evalFsSet, loadFsModuleFile, parseFsYaml, parseGet, sanitizeRpn } from "./fscopilot-yaml.js";
import { findPack, loadPacks } from "./pack.js";

describe("fscopilot yaml", () => {
  it("evaluates documented set expressions", () => {
    assert.equal(
      evalFsSet({ get: "A:NAV VOLUME:1, Percent", set: "(>K:NAV1_VOLUME_SET_EX1)" }, 40, 0),
      "40 (>K:NAV1_VOLUME_SET_EX1)",
    );
    assert.equal(
      sanitizeRpn(evalFsSet({ get: "A:KOHLSMAN SETTING MB:0, Millibars", set: "`${value * 16} 0 (>K:KOHLSMAN_SET)`" }, 1013.25, 0)),
      "16212 0 (>K:KOHLSMAN_SET)",
    );
    assert.equal(
      evalFsSet(
        { get: "A:TRANSPONDER IDENT:1, Bool", set: "value ? '1 (>K:XPNDR_IDENT_ON)' : '1 (>K:XPNDR_IDENT_OFF)'" },
        1,
        0,
      ),
      "1 (>K:XPNDR_IDENT_ON)",
    );
    assert.equal(
      evalFsSet({ get: "L:XMLVAR_VNAVButtonValue" }, 1, 0),
      "1 (>L:XMLVAR_VNAVButtonValue, Number)",
    );
  });

  it("rejects calculator code with disallowed characters", () => {
    assert.equal(sanitizeRpn("1 (>K:FOO); system('x')"), "");
    assert.equal(sanitizeRpn("40 (>K:NAV1_VOLUME_SET_EX1)"), "40 (>K:NAV1_VOLUME_SET_EX1)");
  });

  it("loads the MIT G1000 module into the Skyhawk pack", () => {
    const links = loadFsModuleFile("modules/AS_G1000_NXi.yaml");
    assert.ok(links.some((l) => l.get.includes("KOHLSMAN")));
    const parsed = parseGet("A:KOHLSMAN SETTING MB:0, Millibars # BARO");
    assert.equal(parsed?.sim, "KOHLSMAN SETTING MB:0");
    const yaml = parseFsYaml("shared:\n  - get: L:PFD_CDI_Source # CDI\n    set: (>K:AP_NAV_SELECT_SET)\n");
    assert.equal(yaml.shared[0]?.get, "L:PFD_CDI_Source");
    const sky = findPack(loadPacks(), "Cessna Skyhawk G1000")!;
    assert.ok(sky.variables.some((v) => v.sim === "KOHLSMAN SETTING MB:0"));
    assert.ok(sky.variables.some((v) => v.calc?.set?.includes("KOHLSMAN")));
    const pmdg = findPack(loadPacks(), "PMDG 737-800")!;
    assert.equal(pmdg.variables.some((v) => v.sim === "KOHLSMAN SETTING MB:0"), false);
  });
});
