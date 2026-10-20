// Adapter sortant : prestataire de paiement simulé
import { PaymentGateway } from "../../../application/ports/out/PaymentGateway";

/** Probabilité de refus par défaut (1 fois sur 20, comme le legacy). */
export const PAYMENT_FAILURE_RATE = 0.05;

export class FakePaymentGateway implements PaymentGateway {
  /** `decide` permet de forcer la réponse, ex. new FakePaymentGateway(() => false). */
  constructor(private readonly decide: () => boolean = () => Math.random() > PAYMENT_FAILURE_RATE) {}

  async charge(email: string, amount: number): Promise<boolean> {
    return this.decide();
  }
}
