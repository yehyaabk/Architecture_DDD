// Couche métier : constantes des règles d'annulation
// (les règles de réservation sont dans domain/bookingRules.ts)

/** Annulation possible jusqu'à CANCELLATION_DEADLINE_HOURS heures avant la séance. */
export const CANCELLATION_DEADLINE_HOURS = 2;
export const CANCELLATION_DEADLINE_MS = CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000;
