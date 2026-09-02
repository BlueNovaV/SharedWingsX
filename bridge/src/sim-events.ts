/** Stock MSFS SimConnect event names from the public SDK. Original mapping. */
export const COCKPIT_SIM_EVENTS = [
  "AXIS_THROTTLE1_SET",
  "AXIS_THROTTLE2_SET",
  "AXIS_THROTTLE3_SET",
  "AXIS_THROTTLE4_SET",
  "AXIS_THROTTLE_SET",
  "THROTTLE1_SET",
  "THROTTLE2_SET",
  "THROTTLE3_SET",
  "THROTTLE4_SET",
  "AXIS_MIXTURE1_SET",
  "AXIS_MIXTURE2_SET",
  "AXIS_MIXTURE3_SET",
  "AXIS_MIXTURE4_SET",
  "MIXTURE1_SET",
  "MIXTURE2_SET",
  "MIXTURE3_SET",
  "MIXTURE4_SET",
  "AXIS_PROPELLER1_SET",
  "AXIS_PROPELLER2_SET",
  "AXIS_PROPELLER3_SET",
  "AXIS_PROPELLER4_SET",
  "PROP_PITCH1_SET",
  "PROP_PITCH2_SET",
  "PROP_PITCH3_SET",
  "PROP_PITCH4_SET",
  "AXIS_ELEVATOR_SET",
  "AXIS_AILERONS_SET",
  "AXIS_RUDDER_SET",
  "HEADING_BUG_SET",
  "AP_ALT_VAR_SET_ENGLISH",
  "AP_SPD_VAR_SET",
  "AP_VS_VAR_SET_ENGLISH",
  "KOHLSMAN_SET",
  "TOGGLE_MASTER_BATTERY",
  "BATTERY1_SET",
  "BATTERY2_SET",
  "AVIONICS_MASTER_SET",
  "AVIONICS_MASTER_1_ON",
  "AVIONICS_MASTER_1_OFF",
  "AVIONICS_MASTER_2_ON",
  "AVIONICS_MASTER_2_OFF",
  "PARKING_BRAKE_SET",
  "PARKING_BRAKES",
  "GEAR_TOGGLE",
  "GEAR_SET",
  "GEAR_UP",
  "GEAR_DOWN",
  "FLAPS_INCR",
  "FLAPS_DECR",
  "FLAPS_UP",
  "FLAPS_DOWN",
  "FLAPS_SET",
  "SPOILERS_TOGGLE",
  "SPOILERS_SET",
  "SPOILERS_ARM_TOGGLE",
  "SPOILERS_ARM_SET",
  "LANDING_LIGHTS_TOGGLE",
  "LANDING_LIGHTS_SET",
  "TOGGLE_BEACON_LIGHTS",
  "BEACON_LIGHTS_SET",
  "TOGGLE_NAV_LIGHTS",
  "NAV_LIGHTS_SET",
  "TOGGLE_TAXI_LIGHTS",
  "TAXI_LIGHTS_SET",
  "STROBES_TOGGLE",
  "STROBES_SET",
  "TOGGLE_CABIN_LIGHTS",
  "CABIN_LIGHTS_SET",
  "PANEL_LIGHTS_TOGGLE",
  "PANEL_LIGHTS_SET",
  "TOGGLE_LOGO_LIGHTS",
  "LOGO_LIGHTS_SET",
  "TOGGLE_RECOGNITION_LIGHTS",
  "TOGGLE_WING_LIGHTS",
  "WING_LIGHTS_SET",
  "TOGGLE_RECOGNITION_LIGHTS",
  "RECOGNITION_LIGHTS_SET",
  "PITOT_HEAT_TOGGLE",
  "PITOT_HEAT_SET",
  "ANTI_ICE_TOGGLE",
  "ANTI_ICE_SET",
  "ANTI_ICE_ON",
  "ANTI_ICE_OFF",
  "TOGGLE_PUSHBACK",
  "TOGGLE_JETWAY",
  "TOGGLE_RAMPTRUCK",
  "TOGGLE_EXTERNAL_POWER",
  "SET_EXTERNAL_POWER",
  "APU_STARTER",
  "APU_OFF_SWITCH",
  "APU_GENERATOR_SWITCH_SET",
  "ENGINE_AUTO_START",
  "ENGINE_AUTO_SHUTDOWN",
  "TOGGLE_STARTER1",
  "TOGGLE_STARTER2",
  "TOGGLE_STARTER3",
  "TOGGLE_STARTER4",
  "STARTER1_SET",
  "STARTER2_SET",
  "STARTER3_SET",
  "STARTER4_SET",
  "TOGGLE_ALTERNATOR1",
  "TOGGLE_ALTERNATOR2",
  "MAGNETO1_BOTH",
  "MAGNETO2_BOTH",
  "AXIS_LEFT_BRAKE_SET",
  "AXIS_RIGHT_BRAKE_SET",
  "AXIS_ELEV_TRIM_SET",
  "ELEVATOR_TRIM_SET",
  "RUDDER_TRIM_SET",
  "AILERON_TRIM_SET",
  "WATER_RUDDER_SET",
  "CANOPY_SET",
  "COWLFLAP1_SET",
  "COWLFLAP2_SET",
  "SET_AUTOBRAKE_CONTROL",
  "AP_MACH_VAR_SET",
  "YAW_DAMPER_ON",
  "YAW_DAMPER_OFF",
  "YAW_DAMPER_TOGGLE",
  "YAW_DAMPER_SET",
  "AP_PANEL_HEADING_ON",
  "AP_PANEL_HEADING_OFF",
  "AP_PANEL_ALTITUDE_ON",
  "AP_PANEL_ALTITUDE_OFF",
  "AP_PANEL_VS_ON",
  "AP_PANEL_VS_OFF",
  "AP_MACH_HOLD_ON",
  "AP_MACH_HOLD_OFF",
  "AP_BC_HOLD_ON",
  "AP_BC_HOLD_OFF",
  "AP_LOC_HOLD",
  "AP_ATT_HOLD_ON",
  "AP_ATT_HOLD_OFF",
  "AP_WING_LEVELER_ON",
  "AP_WING_LEVELER_OFF",
  "AP_FLIGHT_LEVEL_CHANGE_ON",
  "AP_FLIGHT_LEVEL_CHANGE_OFF",
  "AP_GPWS_HOLD",
  "AP_MAX_BANK_SET",
  "FLIGHT_DIRECTOR_ON",
  "FLIGHT_DIRECTOR_OFF",
  "TOGGLE_FLIGHT_DIRECTOR",
  "SPOILERS_ARM_ON",
  "SPOILERS_ARM_OFF",
  "FUEL_PUMP",
  "TOGGLE_ELECT_FUEL_PUMP1",
  "TOGGLE_ELECT_FUEL_PUMP2",
  "DECISION_HEIGHT_SET",
  "NAV1_OBI_DEC",
  "NAV1_OBI_INC",
  "VOR1_SET",
  "VOR2_SET",
  "ADF_CARD_SET",
  "XPNDR_SET",
  "COM_RADIO_SET_HZ",
  "COM_STBY_RADIO_SET_HZ",
  "NAV1_RADIO_SET_HZ",
  "NAV2_RADIO_SET_HZ",
  "AP_MASTER",
  "AUTOPILOT_ON",
  "AUTOPILOT_OFF",
  "AP_HDG_HOLD",
  "AP_ALT_HOLD",
  "AP_APR_HOLD",
  "AP_NAV1_HOLD",
  "AP_VS_HOLD",
  "AP_MACH_HOLD",
  "AP_FLIGHT_DIRECTOR_TOGGLE",
  "KOHLSMAN_INC",
  "KOHLSMAN_DEC",
  "BAROMETRIC",
  "ELEV_TRIM_UP",
  "ELEV_TRIM_DN",
  "AILERON_TRIM_LEFT",
  "AILERON_TRIM_RIGHT",
  "RUDDER_TRIM_LEFT",
  "RUDDER_TRIM_RIGHT",
  "CABIN_SEATBELTS_ALERT_SWITCH_TOGGLE",
] as const;

const SET_TRUE = 1;
const AXIS = (n: number) => Math.max(0, Math.min(16383, Math.round(n)));

export function discreteEventsForVar(
  sim: string,
  value: number,
): { name: string; data: number }[] {
  const on = value > 0.5;
  const heading = Math.max(0, Math.round(value) % 360);
  switch (sim) {
    case "ELECTRICAL MASTER BATTERY":
    case "ELECTRICAL MASTER BATTERY:1":
      return [{ name: "BATTERY1_SET", data: on ? SET_TRUE : 0 }];
    case "ELECTRICAL MASTER BATTERY:2":
      return [{ name: "BATTERY2_SET", data: on ? SET_TRUE : 0 }];
    case "AVIONICS MASTER SWITCH":
    case "AVIONICS MASTER SWITCH:1":
      return [{ name: "AVIONICS_MASTER_SET", data: on ? SET_TRUE : 0 }];
    case "BRAKE PARKING POSITION":
      return [{ name: "PARKING_BRAKE_SET", data: on ? SET_TRUE : 0 }];
    case "GEAR HANDLE POSITION":
      return [{ name: on ? "GEAR_DOWN" : "GEAR_UP", data: 0 }];
    case "FLAPS HANDLE INDEX":
      return [{ name: "FLAPS_SET", data: AXIS((value / 8) * 16383) }];
    case "SPOILERS HANDLE POSITION":
      return [{ name: "SPOILERS_SET", data: AXIS((value / 100) * 16383) }];
    case "LIGHT LANDING":
    case "LIGHT LANDING:1":
      return [{ name: "LANDING_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT BEACON":
    case "LIGHT BEACON:1":
      return [{ name: "BEACON_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT NAV":
    case "LIGHT NAV:1":
      return [{ name: "NAV_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT TAXI":
    case "LIGHT TAXI:1":
      return [{ name: "TAXI_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT STROBE":
    case "LIGHT STROBE:1":
      return [{ name: "STROBES_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT CABIN":
      return [{ name: "CABIN_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT PANEL":
      return [{ name: "PANEL_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT LOGO":
    case "LIGHT LOGO:1":
      return [{ name: "LOGO_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT WING":
      return [{ name: "WING_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "LIGHT RECOGNITION":
      return [{ name: "RECOGNITION_LIGHTS_SET", data: on ? SET_TRUE : 0 }];
    case "PITOT HEAT":
      return [{ name: "PITOT_HEAT_SET", data: on ? SET_TRUE : 0 }];
    case "STRUCTURAL DEICE SWITCH":
    case "ENG ANTI ICE:1":
    case "ENG ANTI ICE:2":
    case "ENG ANTI ICE:3":
    case "ENG ANTI ICE:4":
      return [{ name: on ? "ANTI_ICE_ON" : "ANTI_ICE_OFF", data: 0 }];
    case "AUTOPILOT MASTER":
      return [{ name: on ? "AUTOPILOT_ON" : "AUTOPILOT_OFF", data: 0 }];
    case "AUTOPILOT HEADING LOCK":
      return [{ name: on ? "AP_PANEL_HEADING_ON" : "AP_PANEL_HEADING_OFF", data: 0 }];
    case "AUTOPILOT ALTITUDE LOCK":
      return [{ name: on ? "AP_PANEL_ALTITUDE_ON" : "AP_PANEL_ALTITUDE_OFF", data: 0 }];
    case "AUTOPILOT VERTICAL HOLD":
      return [{ name: on ? "AP_PANEL_VS_ON" : "AP_PANEL_VS_OFF", data: 0 }];
    case "AUTOPILOT MACH HOLD":
      return [{ name: on ? "AP_MACH_HOLD_ON" : "AP_MACH_HOLD_OFF", data: 0 }];
    case "AUTOPILOT YAW DAMPER":
      return [{ name: on ? "YAW_DAMPER_ON" : "YAW_DAMPER_OFF", data: 0 }];
    case "AUTOPILOT BACKCOURSE HOLD":
      return [{ name: on ? "AP_BC_HOLD_ON" : "AP_BC_HOLD_OFF", data: 0 }];
    case "AUTOPILOT ATTITUDE HOLD":
      return [{ name: on ? "AP_ATT_HOLD_ON" : "AP_ATT_HOLD_OFF", data: 0 }];
    case "AUTOPILOT WING LEVELER":
      return [{ name: on ? "AP_WING_LEVELER_ON" : "AP_WING_LEVELER_OFF", data: 0 }];
    case "AUTOPILOT FLIGHT LEVEL CHANGE":
      return [{ name: on ? "AP_FLIGHT_LEVEL_CHANGE_ON" : "AP_FLIGHT_LEVEL_CHANGE_OFF", data: 0 }];
    case "AUTOPILOT FLIGHT DIRECTOR ACTIVE":
      return [{ name: on ? "FLIGHT_DIRECTOR_ON" : "FLIGHT_DIRECTOR_OFF", data: 0 }];
    case "SPOILERS ARMED":
      return [{ name: "SPOILERS_ARM_SET", data: on ? SET_TRUE : 0 }];
    case "GENERAL ENG STARTER:1":
      return [{ name: "STARTER1_SET", data: on ? SET_TRUE : 0 }];
    case "GENERAL ENG STARTER:2":
      return [{ name: "STARTER2_SET", data: on ? SET_TRUE : 0 }];
    case "GENERAL ENG STARTER:3":
      return [{ name: "STARTER3_SET", data: on ? SET_TRUE : 0 }];
    case "GENERAL ENG STARTER:4":
      return [{ name: "STARTER4_SET", data: on ? SET_TRUE : 0 }];
    case "APU GENERATOR SWITCH":
      return [{ name: "APU_GENERATOR_SWITCH_SET", data: on ? SET_TRUE : 0 }];
    case "EXTERNAL POWER ON":
      return [{ name: "SET_EXTERNAL_POWER", data: on ? SET_TRUE : 0 }];
    case "WATER RUDDER HANDLE POSITION":
      return [{ name: "WATER_RUDDER_SET", data: AXIS(value * 16383) }];
    case "CANOPY OPEN":
      return [{ name: "CANOPY_SET", data: AXIS(value * 16383) }];
    case "AUTO BRAKE SWITCH CB":
      return [{ name: "SET_AUTOBRAKE_CONTROL", data: Math.max(0, Math.round(value)) }];
    case "AUTOPILOT MACH HOLD VAR":
      return [{ name: "AP_MACH_VAR_SET", data: Math.max(0, Math.round(value * 100)) }];
    case "DECISION HEIGHT":
      return [{ name: "DECISION_HEIGHT_SET", data: Math.max(0, Math.round(value)) }];
    case "NAV OBS:1":
      return [{ name: "VOR1_SET", data: heading }];
    case "NAV OBS:2":
      return [{ name: "VOR2_SET", data: heading }];
    case "ADF CARD":
      return [{ name: "ADF_CARD_SET", data: heading }];
    case "AUTOPILOT HEADING LOCK DIR":
    case "AUTOPILOT HEADING LOCK DIR:1":
      return [{ name: "HEADING_BUG_SET", data: heading }];
    case "AUTOPILOT ALTITUDE LOCK VAR":
    case "AUTOPILOT ALTITUDE LOCK VAR:1":
    case "AUTOPILOT ALTITUDE LOCK VAR:3":
      return [{ name: "AP_ALT_VAR_SET_ENGLISH", data: Math.max(0, Math.round(value)) }];
    case "AUTOPILOT AIRSPEED HOLD VAR":
    case "AUTOPILOT AIRSPEED HOLD VAR:1":
      return [{ name: "AP_SPD_VAR_SET", data: Math.max(0, Math.round(value)) }];
    case "AUTOPILOT VERTICAL HOLD VAR":
    case "AUTOPILOT VERTICAL HOLD VAR:1":
      return [{ name: "AP_VS_VAR_SET_ENGLISH", data: Math.round(value) >>> 0 }];
    case "KOHLSMAN SETTING MB:1":
    case "KOHLSMAN SETTING MB:2":
      return [{ name: "KOHLSMAN_SET", data: Math.max(0, Math.round(value * 16)) }];
    case "APU SWITCH":
      return [{ name: on ? "APU_STARTER" : "APU_OFF_SWITCH", data: 0 }];
    default:
      return [];
  }
}

export function calculatorEvent(name: string, data: number): string {
  const safe = name.replace(/[^A-Z0-9_]/gi, "");
  return `${data >>> 0} (>K:${safe})`;
}

/** Public MSFS RPN for two-parameter K events (index then value). */
export function calculatorEventK2(name: string, data: number, index = 1): string {
  const safe = name.replace(/[^A-Z0-9_]/gi, "");
  return `${index} ${data >>> 0} (>K:2:${safe})`;
}

/** Public RPN: value then index, e.g. millibars*16 0 (>K:KOHLSMAN_SET). */
export function calculatorEventIndexed(name: string, data: number, index: number): string {
  const safe = name.replace(/[^A-Z0-9_]/gi, "");
  return `${data >>> 0} ${index >>> 0} (>K:${safe})`;
}

/** Pull K: events out of calculator RPN so SimConnect can fire them without WASM. */
export function kEventsFromRpn(rpn: string): { name: string; data: number; extra?: number }[] {
  const out: { name: string; data: number; extra?: number }[] = [];
  const re = /(?:((?:\d+\s+)+))?\(>K:(?:2:)?([A-Z0-9_]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rpn))) {
    const nums = (m[1] ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => Number(n) >>> 0);
    const name = m[2];
    if (!name) continue;
    if (nums.length >= 2) out.push({ name, data: nums[0]!, extra: nums[1] });
    else out.push({ name, data: nums[0] ?? 0 });
  }
  return out;
}

export function skipInputEventName(name: string): boolean {
  const n = name.toUpperCase();
  return /CAMERA|PAUSE|MENU|TOOLTIP|DEBUG|KNEEBOARD|MOUSE|WINDOW|VIEW_|ESC\b|ATC_PANEL|SIM_RATE|SAVE|LOAD|QUIT|SCREENSHOT/.test(
    n,
  );
}

export function inputEventPriority(name: string): number {
  const n = name.toUpperCase();
  if (/THROTTLE|ENGINE|N1|STARTER|BATTERY|AVIONIC|MASTER|LIGHT|SWITCH|FUEL|FLAP|GEAR|SPOILER|APU|PARK/.test(n)) {
    return 0;
  }
  return 1;
}
