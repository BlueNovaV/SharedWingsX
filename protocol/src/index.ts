export type {
  HelloPayload,
  JoinRejectPayload,
  RoleTransferPayload,
  PanelLockPayload,
  PresencePose,
  DesyncReportPayload,
  WeatherTimePolicy,
  VarRecord,
  Role,
  Domain,
  Seat,
  SimProduct,
  PresenceSupport,
  MessageTypeId,
  SimEventPayload,
  InputEventPayload,
  WorldPose,
} from "./codec.js";

export {
  MAGIC,
  PROTOCOL_VERSION,
  HEADER_SIZE,
  MAX_UDP_PAYLOAD,
  MessageType,
  decodeHeader,
  encodeHeartbeat,
  decodeHeartbeat,
  encodeHello,
  decodeHello,
  encodeJoinReject,
  decodeJoinReject,
  encodeSnapshot,
  encodeDelta,
  decodeVars,
  encodeRoleTransfer,
  decodeRoleTransfer,
  encodePanelLock,
  decodePanelLock,
  encodePresencePose,
  decodePresencePose,
  encodeDesyncReport,
  decodeDesyncReport,
  encodeWeatherTimePolicy,
  decodeWeatherTimePolicy,
  encodePunchPing,
  encodeSimEvent,
  decodeSimEvent,
  encodeInputEvent,
  decodeInputEvent,
  encodeWorldPose,
  decodeWorldPose,
} from "./codec.js";

export {
  canWrite,
  nextSharedLock,
  shouldEmitDelta,
  desynced,
} from "./authority.js";
export type { AuthorityVar, PanelLock } from "./authority.js";

export {
  MAX_CREW,
  SEAT_ORDER,
  SEAT_INDEX,
  seatFromIndex,
  roleForSeat,
  seatLabel,
  assignSeat,
} from "./seats.js";

export { normalizeRoomCode } from "./rooms.js";

