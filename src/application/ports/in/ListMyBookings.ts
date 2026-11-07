// Port entrant : lister les réservations d'un client, avec le film et la date de la séance
import { Booking } from "../../../domain/Booking";

export interface BookingWithScreening extends Booking {
  movie: string;
  startsAt: Date | null;
}

export interface ListMyBookings {
  execute(email: string): Promise<BookingWithScreening[]>;
}
