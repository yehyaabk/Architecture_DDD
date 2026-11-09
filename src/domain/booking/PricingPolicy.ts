// Domain service : calcule le prix d'une réservation (règle qui n'appartient à aucun objet en particulier)
import { Money } from "../shared/Money";
import { SeatCount } from "./SeatCount";
import { Tariff } from "./Tariff";

export class PricingPolicy {
  /** Tarif étudiant : -30 % sur le prix unitaire. */
  static readonly STUDENT_DISCOUNT = 0.3;
  /** Remise groupe : -10 % sur le total. */
  static readonly GROUP_DISCOUNT = 0.1;

  static total(unitPrice: Money, seats: SeatCount, tariff: Tariff): Money {
    // le prix unitaire étudiant est arrondi au centime avant la multiplication (comme le legacy)
    const unit = tariff === "STUDENT" ? unitPrice.discount(PricingPolicy.STUDENT_DISCOUNT) : unitPrice;
    const total = unit.times(seats.value);
    return seats.isGroup() ? total.discount(PricingPolicy.GROUP_DISCOUNT) : total;
  }
}
