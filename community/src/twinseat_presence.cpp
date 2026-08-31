// SharedWingsX in-sim command pump. Original code.
// Reads a 64-byte SimConnect client-data packet from the desktop bridge and
// applies public SDK K: events with execute_calculator_code so titles that
// ignore transmitClientEvent still move throttles, freeze, and lights.

#include <cstring>
#include <cstdio>

#if defined(_MSFS_WASM) && !defined(__MSFS_WASM)
#define __MSFS_WASM 1
#endif

#ifdef __MSFS_WASM
#include <MSFS/MSFS.h>
#include <SimConnect.h>
#if __has_include(<MSFS/legacy/gauges.h>)
#include <MSFS/legacy/gauges.h>
#define TWINSEAT_HAS_CALC 1
#elif __has_include(<gauges.h>)
#include <gauges.h>
#define TWINSEAT_HAS_CALC 1
#endif
#endif

#pragma pack(push, 1)
struct TwinSeatCmd {
  unsigned int seq;
  int data;
  char name[56];
};
struct TwinSeatCalc {
  unsigned int seq;
  char rpn[252];
};
#pragma pack(pop)

static unsigned int g_lastSeq = 0;
static unsigned int g_lastCalc = 0;

#ifdef __MSFS_WASM
static HANDLE g_sim = nullptr;

static int rpn_ok(const char *s) {
  if (!s || !s[0]) return 0;
  for (const char *p = s; *p; p++) {
    const unsigned char c = static_cast<unsigned char>(*p);
    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) continue;
    if (c == ' ' || c == ':' || c == '_' || c == '(' || c == ')' || c == '>' || c == ',' || c == '.' ||
        c == '+' || c == '-' || c == '*' || c == '/')
      continue;
    return 0;
  }
  return 1;
}

static void apply_calc(const TwinSeatCalc *cmd) {
  if (!cmd || cmd->seq == g_lastCalc) return;
  g_lastCalc = cmd->seq;
  char rpn[252];
  std::memset(rpn, 0, sizeof(rpn));
  std::memcpy(rpn, cmd->rpn, sizeof(cmd->rpn) - 1);
  if (!rpn_ok(rpn)) return;
#ifdef TWINSEAT_HAS_CALC
  execute_calculator_code(rpn, nullptr, nullptr, nullptr);
#endif
}

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
  char rpn[128];
  const unsigned v = static_cast<unsigned int>(cmd->data);
  auto run = [&](const char *code) {
#ifdef TWINSEAT_HAS_CALC
    execute_calculator_code(code, nullptr, nullptr, nullptr);
#else
    (void)code;
#endif
  };
  std::snprintf(rpn, sizeof(rpn), "%u (>K:%s)", v, safe);
  run(rpn);
  if (std::strstr(safe, "_SET")) {
    std::snprintf(rpn, sizeof(rpn), "%u 0 (>K:%s)", v, safe);
    run(rpn);
    std::snprintf(rpn, sizeof(rpn), "%u 1 (>K:%s)", v, safe);
    run(rpn);
    std::snprintf(rpn, sizeof(rpn), "0 %u (>K:2:%s)", v, safe);
    run(rpn);
    std::snprintf(rpn, sizeof(rpn), "1 %u (>K:2:%s)", v, safe);
    run(rpn);
  }
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
    SimConnect_MapClientDataNameToID(g_sim, "SharedWingsX.Calc", 2);
    SimConnect_CreateClientData(g_sim, 2, sizeof(TwinSeatCalc), SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT);
    SimConnect_AddToClientDataDefinition(g_sim, 2, 0, sizeof(TwinSeatCalc), 0, 0);
    SimConnect_RequestClientData(
        g_sim, 2, 3, 2, SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT, 0, 0, 0);
    SimConnect_RequestClientData(
        g_sim, 2, 4, 2, SIMCONNECT_CLIENT_DATA_PERIOD_VISUAL_FRAME, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_CHANGED, 0, 0,
        0);
    SimConnect_SubscribeToSystemEvent(g_sim, 99, "Frame");
    return;
  }
  if (recv->dwID == SIMCONNECT_RECV_ID_CLIENT_DATA) {
    auto *data = reinterpret_cast<SIMCONNECT_RECV_CLIENT_DATA *>(recv);
    if (data->dwDefineID == 2) {
      TwinSeatCalc calc{};
      std::memcpy(&calc, &data->dwData, sizeof(calc));
      calc.rpn[251] = 0;
      apply_calc(&calc);
      return;
    }
    TwinSeatCmd cmd{};
    std::memcpy(&cmd, &data->dwData, sizeof(cmd));
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
