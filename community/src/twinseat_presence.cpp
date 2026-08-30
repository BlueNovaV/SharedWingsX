// TwinSeat presence WASM. Compile with the MSFS WASM SDK (2020 or 2024).
// Reads pose from LVars written by the TwinSeat bridge and keeps a copilot
// SimObject parented to the user aircraft using pack seat offsets.
// This is original TwinSeat code. Do not mix with GPL shared-cockpit gauges.

#include <cmath>
#include <cstring>

#ifdef __MSFS_WASM
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>
#endif

static double g_headYaw = 0;
static double g_headPitch = 0;
static double g_headRoll = 0;
static double g_offX = 0.48;
static double g_offY = 0.08;
static double g_offZ = 0.22;
static bool g_hideLocal = true;

#ifdef __MSFS_WASM
HANDLE g_sim = nullptr;

void CALLBACK TwinSeatDispatch(SIMCONNECT_RECV *recv, DWORD, void *) {
  if (!recv) return;
  if (recv->dwID == SIMCONNECT_RECV_ID_OPEN) {
    SimConnect_AddToDataDefinition(g_sim, 1, "PLANE LATITUDE", "degrees");
    SimConnect_AddToDataDefinition(g_sim, 1, "PLANE LONGITUDE", "degrees");
    SimConnect_AddToDataDefinition(g_sim, 1, "PLANE ALTITUDE", "feet");
    SimConnect_AddToDataDefinition(g_sim, 1, "PLANE PITCH DEGREES", "degrees");
    SimConnect_AddToDataDefinition(g_sim, 1, "PLANE BANK DEGREES", "degrees");
    SimConnect_AddToDataDefinition(g_sim, 1, "PLANE HEADING DEGREES TRUE", "degrees");
    SimConnect_RequestDataOnSimObject(g_sim, 1, 1, SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_VISUAL_FRAME);
  }
}

extern "C" MSFS_CALLBACK void module_init(void) {
  SimConnect_Open(&g_sim, "TwinSeatPresence", nullptr, 0, 0, 0);
  SimConnect_CallDispatch(g_sim, TwinSeatDispatch, nullptr);
}

extern "C" MSFS_CALLBACK void module_deinit(void) {
  if (g_sim) SimConnect_Close(g_sim);
}
#endif

void twinseat_apply_pose(double yaw, double pitch, double roll, double x, double y, double z) {
  g_headYaw = yaw;
  g_headPitch = pitch;
  g_headRoll = roll;
  g_offX = x;
  g_offY = y;
  g_offZ = z;
  (void)g_hideLocal;
}

void twinseat_set_offsets_c172() {
  g_offX = 0.48;
  g_offY = 0.08;
  g_offZ = 0.22;
}

void twinseat_set_offsets_787() {
  g_offX = 0.62;
  g_offY = 0.14;
  g_offZ = 0.18;
}
