// SharedWingsX in-sim command pump. Original code.
// Reads a 64-byte SimConnect client-data packet from the desktop bridge and
// applies public SDK K: events with execute_calculator_code so titles that
// ignore transmitClientEvent still move throttles, freeze, and lights.
// Do not mix with GPL shared-cockpit gauges or their packet formats.

#include <cstring>
#include <cstdio>

#ifdef __MSFS_WASM
#include <MSFS/MSFS.h>
#include <SimConnect.h>
#ifdef __has_include
#if __has_include(<MSFS/legacy/gauges.h>)
#include <MSFS/legacy/gauges.h>
#define TWINSEAT_HAS_CALC 1
#elif __has_include(<gauges.h>)
#include <gauges.h>
#define TWINSEAT_HAS_CALC 1
#endif
#endif
#endif

#pragma pack(push, 1)
struct TwinSeatCmd {
  unsigned int seq;
  int data;
  char name[56];
};
#pragma pack(pop)

static unsigned int g_lastSeq = 0;

#ifdef __MSFS_WASM
static HANDLE g_sim = nullptr;

static void apply_cmd(const TwinSeatCmd *cmd) {
  if (!cmd || !cmd->name[0]) return;
  if (cmd->seq == g_lastSeq) return;
  g_lastSeq = cmd->seq;
  char safe[56];
  std::memset(safe, 0, sizeof(safe));
  for (int i = 0; i < 55 && cmd->name[i]; i++) {
    const char c = cmd->name[i];
    if ((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_') safe[i] = c;
    else break;
  }
  if (!safe[0]) return;
  char rpn[96];
  std::snprintf(rpn, sizeof(rpn), "%u (>K:%s)", static_cast<unsigned int>(cmd->data), safe);
#ifdef TWINSEAT_HAS_CALC
  execute_calculator_code(rpn, nullptr, nullptr, nullptr);
#else
  (void)rpn;
#endif
}

void CALLBACK TwinSeatDispatch(SIMCONNECT_RECV *recv, DWORD, void *) {
  if (!recv) return;
  if (recv->dwID == SIMCONNECT_RECV_ID_OPEN) {
    SimConnect_MapClientDataNameToID(g_sim, "SharedWingsX.Cmd", 1);
    SimConnect_CreateClientData(g_sim, 1, sizeof(TwinSeatCmd), SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT);
    SimConnect_AddToClientDataDefinition(g_sim, 1, 0, sizeof(TwinSeatCmd), 0, 0);
    SimConnect_RequestClientData(
        g_sim, 1, 1, 1, SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT, 0, 0, 0);
    SimConnect_RequestClientData(
        g_sim, 1, 2, 1, SIMCONNECT_CLIENT_DATA_PERIOD_VISUAL_FRAME, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_CHANGED, 0, 0,
        0);
    return;
  }
  if (recv->dwID == SIMCONNECT_RECV_ID_CLIENT_DATA) {
    auto *data = reinterpret_cast<SIMCONNECT_RECV_CLIENT_DATA *>(recv);
    if (data->dwDefineCount < 1) return;
    TwinSeatCmd cmd{};
    std::memcpy(&cmd, reinterpret_cast<const char *>(data) + sizeof(SIMCONNECT_RECV_CLIENT_DATA), sizeof(cmd));
    cmd.name[55] = 0;
    apply_cmd(&cmd);
  }
}

extern "C" MSFS_CALLBACK void module_init(void) {
  SimConnect_Open(&g_sim, "SharedWingsXPump", nullptr, 0, 0, 0);
  SimConnect_CallDispatch(g_sim, TwinSeatDispatch, nullptr);
}

extern "C" MSFS_CALLBACK void module_update(void) {
  if (g_sim) SimConnect_CallDispatch(g_sim, TwinSeatDispatch, nullptr);
}

extern "C" MSFS_CALLBACK void module_deinit(void) {
  if (g_sim) SimConnect_Close(g_sim);
  g_sim = nullptr;
}
#endif
