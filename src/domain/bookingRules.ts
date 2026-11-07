// Domaine : règles de réservation (fonctions pures)
import { Booking, Tariff } from "./Booking";
import { DomainError } from "./DomainError";
import { Screening } from "./Screening";

export const MIN_SEATS_PER_BOOKING = 1;
export const MAX_SEATS_PER_BOOKING = 6;
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(email: string): boolean {
  return !!email && EMAIL_PATTERN.test(email);
}

export function isValidSeatCount(seats: number): boolean {
  return Number.isInteger(seats) && seats >= MIN_SEATS_PER_BOOKING && seats <= MAX_SEATS_PER_BOOKING;
}

/** Seul endroit qui définit les places prises sur une séance : seules les réservations confirmées comptent. */
export function confirmedSeats(bookings: Booking[], screeningId: string): number {
  let taken = 0;
  for (const b of bookings) {
    if (b.screeningId === screeningId && b.status === "CONFIRMED") taken += b.seats;
  }
  return taken;
}

/** Seul endroit où sont calculées les places restantes d'une séance. */
export function remainingSeats(screening: Screening, takenSeats: number): number {
  return screening.capacity - takenSeats;
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
export function assertBookable(screening: Screening, takenSeats: number, seats: number, now: Date) {
  if (hasStarted(screening, now)) throw new DomainError("CONFLICT", "La séance a déjà commencé");
  if (seats > remainingSeats(screening, takenSeats)) throw new DomainError("CONFLICT", "Plus assez de places");
}
