// Port sortant : prévenir le client que sa réservation est confirmée
import { Booking } from "../../../domain/Booking";
import { Screening } from "../../../domain/Screening";

export interface Notifier {
  bookingConfirmed(booking: Booking, screening: Screening): Promise<void>;
}
