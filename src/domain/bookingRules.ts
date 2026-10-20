// Domaine : règles de réservation (fonctions pures)
import { Tariff } from "./Booking";
import { DomainError } from "./DomainError";
import { Screening } from "./Screening";

export const MIN_SEATS_PER_BOOKING = 1;
export const MAX_SEATS_PER_BOOKING = 6;
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Ce dont le calcul des places a besoin d'une réservation (accepte aussi les réservations du TP1). */
interface SeatHolder {
  screeningId: string;
  status: string;
  seats: number;
}

export function isValidEmail(email: string): boolean {
  return !!email && EMAIL_PATTERN.test(email);
}

export function isValidSeatCount(seats: number): boolean {
  return Number.isInteger(seats) && seats >= MIN_SEATS_PER_BOOKING && seats <= MAX_SEATS_PER_BOOKING;
}

/** Seul endroit où sont calculées les places restantes d'une séance. */
export function remainingSeats(screening: { id: string; capacity: number }, bookings: SeatHolder[]): number {
  let taken = 0;
  for (const b of bookings) {
    if (b.screeningId === screening.id && b.status === "CONFIRMED") taken += b.seats;
  }
  return screening.capacity - taken;
}

export function hasStarted(screening: Screening, now: Date): boolean {
  return screening.startsAt.getTime() <= now.getTime();
}

/** Tout tarif autre que STUDENT est traité comme NORMAL (comportement legacy). */
export function toTariff(value: unknown): Tariff {
  return value === "STUDENT" ? "STUDENT" : "NORMAL";
}

export function assertValidEmail(email: string) {
  if (!isValidEmail(email)) throw new DomainError("INVALID", "Email invalide");
}

export function assertValidSeatCount(seats: number) {
  if (!isValidSeatCount(seats)) {
    throw new DomainError(
      "INVALID",
      `Entre ${MIN_SEATS_PER_BOOKING} et ${MAX_SEATS_PER_BOOKING} places par réservation`
    );
  }
}

/** Séance réservable : pas encore commencée et capacité suffisante. */
export function assertBookable(screening: Screening, bookings: SeatHolder[], seats: number, now: Date) {
  if (hasStarted(screening, now)) throw new DomainError("CONFLICT", "La séance a déjà commencé");
  if (seats > remainingSeats(screening, bookings)) throw new DomainError("CONFLICT", "Plus assez de places");
}
