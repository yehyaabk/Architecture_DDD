// Domaine : règle d'annulation (fonction pure)
import { Booking } from "./Booking";
import { DomainError } from "./shared/DomainError";
import { Screening } from "./Screening";

/** Annulation possible jusqu'à CANCELLATION_DEADLINE_HOURS heures avant la séance. */
export const CANCELLATION_DEADLINE_HOURS = 2;
export const CANCELLATION_DEADLINE_MS = CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000;

/** Renvoie la réservation annulée, sans modifier celle reçue. */
export function cancel(booking: Booking, screening: Screening, now: Date): Booking {
  if (booking.status === "CANCELLED") throw new DomainError("CONFLICT", "Déjà annulée");
  if (screening.startsAt.getTime() - now.getTime() < CANCELLATION_DEADLINE_MS) {
    throw new DomainError(
      "CONFLICT",
      `Annulation impossible moins de ${CANCELLATION_DEADLINE_HOURS}h avant la séance`
    );
  }
  return { ...booking, status: "CANCELLED", cancelledAt: now };
}
