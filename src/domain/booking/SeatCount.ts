// Value object : un nombre de places par réservation, entier de 1 à 6
import { DomainError } from "../shared/DomainError";

export class SeatCount {
  static readonly MIN = 1;
  static readonly MAX = 6;
  /** À partir de ce nombre de places, la réservation est un groupe. */
  static readonly GROUP_MIN = 4;

  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value < SeatCount.MIN || value > SeatCount.MAX) {
      throw new DomainError("INVALID", `Entre ${SeatCount.MIN} et ${SeatCount.MAX} places par réservation`);
    }
    Object.freeze(this);
  }

  isGroup(): boolean {
    return this.value >= SeatCount.GROUP_MIN;
  }

  equals(other: SeatCount): boolean {
    return this.value === other.value;
  }
}
