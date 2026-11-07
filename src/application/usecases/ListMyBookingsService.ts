// Use case : lister les réservations d'un client. Ne connaît que les ports.
import { BookingWithScreening, ListMyBookings } from "../ports/in/ListMyBookings";
import { BookingRepository } from "../ports/out/BookingRepository";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListMyBookingsService implements ListMyBookings {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly screenings: ScreeningRepository
  ) {}

  async execute(email: string): Promise<BookingWithScreening[]> {
    const result: BookingWithScreening[] = [];
    for (const b of await this.bookings.findByEmail(email)) {
      const s = await this.screenings.findById(b.screeningId);
      result.push({ ...b, movie: s ? s.movie : "?", startsAt: s ? s.startsAt : null });
    }
    return result;
  }
}
