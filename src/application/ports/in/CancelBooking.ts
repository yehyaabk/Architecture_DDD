// Port entrant : annuler une réservation
import { Booking } from "../../../domain/Booking";

export interface CancelBooking {
  execute(bookingId: string): Promise<Booking>;
}
