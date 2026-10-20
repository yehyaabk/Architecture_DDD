// Port sortant : encaisser un montant (en centimes). Renvoie false si le paiement est refusé.
export interface PaymentGateway {
  charge(email: string, amount: number): Promise<boolean>;
}
