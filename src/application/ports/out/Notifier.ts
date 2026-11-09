// Port sortant : envoyer un e-mail au client (confirmation ou remboursement)
import { BookingEventData } from "../../../domain/booking/events";

export interface Notifier {
  bookingConfirmed(booking: BookingEventData): Promise<void>;
  bookingCancelled(booking: BookingEventData): Promise<void>;
}
