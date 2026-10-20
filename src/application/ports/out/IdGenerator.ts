// Port sortant : produire un identifiant unique de réservation
export interface IdGenerator {
  next(): string;
}
