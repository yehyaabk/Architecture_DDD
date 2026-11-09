// Port sortant : prévenir le client que sa réservation est confirmée ou annulée
import { BookingView } from "../in/BookingView";

export interface Notifier {
  bookingConfirmed(booking: BookingView, movie: string): Promise<void>;
  bookingCancelled(booking: BookingView): Promise<void>;
}
