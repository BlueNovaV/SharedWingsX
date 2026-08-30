import type { Domain, Role } from "./codec.js";

export type AuthorityVar = {
  id: number;
  name: string;
  domain: Domain;
  sync: boolean;
  epsilon: number;
};

export type PanelLock = {
  varId: number;
  lockedBy: string;
  untilMs: number;
};

export function canWrite(
  localName: string,
  role: Role,
  domain: Domain,
  varId: number,
  now: number,
  locks: PanelLock[],
): boolean {
  if (role === "observer") return false;
  if (domain === "flying") {
    if (role !== "pf") return false;
  } else if (domain === "monitoring" || domain === "atc" || domain === "shared") {
    if (role !== "pf" && role !== "pm") return false;
  } else {
    return false;
  }
  const lock = locks.find((l) => l.varId === varId && l.untilMs > now);
  if (!lock) return true;
  return lock.lockedBy === localName;
}

export function nextSharedLock(
  localName: string,
  varId: number,
  now: number,
  lockMs: number,
): PanelLock {
  return { varId, lockedBy: localName, untilMs: now + lockMs };
}

export function shouldEmitDelta(
  prev: number,
  next: number,
  epsilon: number,
  lastEmitMs: number,
  now: number,
  minIntervalMs: number,
): boolean {
  if (Math.abs(prev - next) < epsilon) return false;
  if (now - lastEmitMs < minIntervalMs) return false;
  return true;
}

export function desynced(
  localValue: number,
  networkValue: number,
  epsilon: number,
): boolean {
  return Math.abs(localValue - networkValue) > epsilon;
}
