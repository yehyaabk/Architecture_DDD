// Couche données (ressource externe) : appel au prestataire de paiement (simulé)

/** Probabilité de refus du paiement simulé (1 fois sur 20). */
export const PAYMENT_FAILURE_RATE = 0.05;

export class PaymentGateway {
  charge(amount: number): boolean {
    return Math.random() > PAYMENT_FAILURE_RATE;
  }
}
