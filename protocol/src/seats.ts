import type { Role, Seat } from "./codec.js";

export const MAX_CREW = 4;

export const SEAT_ORDER: Seat[] = ["left", "right", "jumpLeft", "jumpRight"];

export const SEAT_INDEX: Record<Seat, number> = {
  left: 0,
  right: 1,
  jumpLeft: 2,
  jumpRight: 3,
};

export function seatFromIndex(index: number): Seat {
  return SEAT_ORDER[index] ?? "right";
}

export function roleForSeat(seat: Seat): Role {
  if (seat === "left") return "pf";
  if (seat === "right") return "pm";
  return "observer";
}

export function seatLabel(seat: Seat): string {
  if (seat === "left") return "Captain";
  if (seat === "right") return "First officer";
  if (seat === "jumpLeft") return "Jump seat L";
  return "Jump seat R";
}

export function assignSeat(occupied: Seat[], preferJump: boolean, want?: Seat | null): Seat | null {
  if (want && !occupied.includes(want)) return want;
  const order: Seat[] = preferJump
    ? want === "jumpRight"
      ? ["jumpRight", "jumpLeft"]
      : ["jumpLeft", "jumpRight"]
    : ["left", "right", "jumpLeft", "jumpRight"];
  return order.find((seat) => !occupied.includes(seat)) ?? null;
}
