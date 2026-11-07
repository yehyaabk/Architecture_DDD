// Port sortant : lire et enregistrer des réservations
import { Booking } from "../../../domain/Booking";

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByScreeningId(screeningId: string): Promise<Booking[]>;
  findByEmail(email: string): Promise<Booking[]>;
  /** Ajoute la réservation, ou remplace celle qui a le même id. */
  save(booking: Booking): Promise<void>;
}
