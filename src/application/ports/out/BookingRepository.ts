// Port sortant : lire et enregistrer des réservations
import { Booking } from "../../../domain/Booking";

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByEmail(email: string): Promise<Booking[]>;
  /** Nombre de places des réservations confirmées d'une séance. */
  countConfirmedSeats(screeningId: string): Promise<number>;
  /** Ajoute la réservation, ou remplace celle qui a le même id. */
  save(booking: Booking): Promise<void>;
}
