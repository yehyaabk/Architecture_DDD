// Port entrant : lister les réservations d'un client, avec le film et la date de la séance
import { BookingView } from "./BookingView";

export interface BookingWithScreening extends BookingView {
  movie: string;
  startsAt: Date;
}

export interface ListMyBookings {
  execute(email: string): Promise<BookingWithScreening[]>;
}
