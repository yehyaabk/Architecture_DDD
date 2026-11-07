// Port sortant : prévenir le client que sa réservation est confirmée ou annulée
import { Booking } from "../../../domain/Booking";
import { Screening } from "../../../domain/Screening";

export interface Notifier {
  bookingConfirmed(booking: Booking, screening: Screening): Promise<void>;
  bookingCancelled(booking: Booking): Promise<void>;
}
