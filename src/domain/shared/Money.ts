// Value object : un montant en centimes, immuable et jamais négatif
import { DomainError } from "./DomainError";

export class Money {
  private constructor(readonly cents: number) {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new DomainError("INVALID", `Montant invalide : ${cents}`);
    }
    Object.freeze(this);
  }

  static cents(cents: number): Money {
    return new Money(cents);
  }

  static euros(euros: number): Money {
    return new Money(Math.round(euros * 100));
  }

  times(quantity: number): Money {
    return new Money(this.cents * quantity);
  }

  /** Applique une remise (0.3 = -30 %), arrondie au centime le plus proche. */
  discount(rate: number): Money {
    return new Money(Math.round(this.cents * (1 - rate)));
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  toString(): string {
    return `${(this.cents / 100).toFixed(2)} €`;
  }
}
