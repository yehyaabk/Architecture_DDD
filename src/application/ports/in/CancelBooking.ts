// Port entrant : annuler une réservation
import { BookingView } from "./BookingView";

export interface CancelBooking {
  execute(bookingId: string): Promise<BookingView>;
}
