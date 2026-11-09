// Domaine : règles de réservation (fonctions pures)
import { Booking } from "./Booking";
import { DomainError } from "./shared/DomainError";
import { EMAIL_PATTERN } from "./shared/Email";
import { Screening } from "./Screening";

/**
 * Contrôle legacy sur l'email brut (sans normalisation) : " a@b.fr" reste refusé.
 * Le value object Email (qui normalise) prendra le relais quand Screening.book() le recevra (question 7).
 */
export function isValidEmail(email: string): boolean {
  return !!email && EMAIL_PATTERN.test(email);
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

export function assertValidEmail(email: string) {
  if (!isValidEmail(email)) throw new DomainError("INVALID", "Email invalide");
}

/** Séance réservable : pas encore commencée et capacité suffisante. */
export function assertBookable(screening: Screening, takenSeats: number, seats: number, now: Date) {
  if (hasStarted(screening, now)) throw new DomainError("CONFLICT", "La séance a déjà commencé");
  if (seats > remainingSeats(screening, takenSeats)) throw new DomainError("CONFLICT", "Plus assez de places");
}
