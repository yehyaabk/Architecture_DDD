// Couche métier : constantes des règles de réservation et d'annulation

export const MIN_SEATS_PER_BOOKING = 1;
export const MAX_SEATS_PER_BOOKING = 6;

/** Annulation possible jusqu'à CANCELLATION_DEADLINE_HOURS heures avant la séance. */
export const CANCELLATION_DEADLINE_HOURS = 2;
export const CANCELLATION_DEADLINE_MS = CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000;

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
