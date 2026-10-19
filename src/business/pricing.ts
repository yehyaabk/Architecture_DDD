// Couche métier : calcul du prix d'une réservation (fonction pure, en centimes)

export type Tariff = "NORMAL" | "STUDENT";

/** Tarif étudiant : -30 %, appliqué au prix unitaire. */
export const STUDENT_PRICE_FACTOR = 0.7;
/** Remise groupe : -10 % sur le total à partir de GROUP_DISCOUNT_MIN_SEATS places. */
export const GROUP_PRICE_FACTOR = 0.9;
export const GROUP_DISCOUNT_MIN_SEATS = 4;

export function computeTotalPrice(unitPrice: number, seats: number, tariff: Tariff): number {
  let unit = unitPrice;
  if (tariff === "STUDENT") unit = Math.round(unit * STUDENT_PRICE_FACTOR);
  let total = unit * seats;
  if (seats >= GROUP_DISCOUNT_MIN_SEATS) total = Math.round(total * GROUP_PRICE_FACTOR);
  return total;
}
