// Couche données (ressource externe) : appel au prestataire de paiement (simulé)
export class PaymentGateway {
  charge(amount: number): boolean {
    return Math.random() > 0.05;
  }
}
