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
  "AXIS_ELEVATOR_SET",
  "AXIS_AILERONS_SET",
  "AXIS_RUDDER_SET",
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
  "PITOT_HEAT_TOGGLE",
  "PITOT_HEAT_SET",
  "ANTI_ICE_TOGGLE",
  "ANTI_ICE_SET",
  "TOGGLE_PUSHBACK",
  "TOGGLE_JETWAY",
  "TOGGLE_RAMPTRUCK",
  "TOGGLE_EXTERNAL_POWER",
  "APU_STARTER",
  "APU_OFF_SWITCH",
  "ENGINE_AUTO_START",
  "ENGINE_AUTO_SHUTDOWN",
  "TOGGLE_STARTER1",
  "TOGGLE_STARTER2",
  "TOGGLE_STARTER3",
  "TOGGLE_STARTER4",
  "MAGNETO1_BOTH",
  "MAGNETO2_BOTH",
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

export function discreteEventForVar(
  sim: string,
  value: number,
): { name: string; data: number } | null {
  const on = value > 0.5;
  switch (sim) {
    case "ELECTRICAL MASTER BATTERY":
      return { name: "BATTERY1_SET", data: on ? SET_TRUE : 0 };
    case "AVIONICS MASTER SWITCH":
      return { name: "AVIONICS_MASTER_SET", data: on ? SET_TRUE : 0 };
    case "BRAKE PARKING POSITION":
      return { name: "PARKING_BRAKE_SET", data: on ? SET_TRUE : 0 };
    case "GEAR HANDLE POSITION":
      return { name: on ? "GEAR_DOWN" : "GEAR_UP", data: 0 };
    case "FLAPS HANDLE INDEX":
      return { name: "FLAPS_SET", data: AXIS((value / 8) * 16383) };
    case "SPOILERS HANDLE POSITION":
      return { name: "SPOILERS_SET", data: AXIS((value / 100) * 16383) };
    case "LIGHT LANDING":
      return { name: "LANDING_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT BEACON":
      return { name: "BEACON_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT NAV":
      return { name: "NAV_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT TAXI":
      return { name: "TAXI_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT STROBE":
      return { name: "STROBES_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT CABIN":
      return { name: "CABIN_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT PANEL":
      return { name: "PANEL_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "LIGHT LOGO":
      return { name: "LOGO_LIGHTS_SET", data: on ? SET_TRUE : 0 };
    case "PITOT HEAT":
      return { name: "PITOT_HEAT_SET", data: on ? SET_TRUE : 0 };
    case "STRUCTURAL DEICE SWITCH":
    case "ENG ANTI ICE:1":
      return { name: "ANTI_ICE_SET", data: on ? SET_TRUE : 0 };
    default:
      return null;
  }
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
