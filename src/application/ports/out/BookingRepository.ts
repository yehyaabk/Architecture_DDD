// Port sortant : lire les réservations d'une séance, enregistrer une réservation
import { Booking } from "../../../domain/Booking";

export interface BookingRepository {
  findByScreeningId(screeningId: string): Promise<Booking[]>;
  save(booking: Booking): Promise<void>;
}
