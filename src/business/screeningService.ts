// Couche métier : séances et places disponibles
import { BookingRepository } from "../data/bookingRepository";
import { ScreeningRepository } from "../data/screeningRepository";
import { remainingSeats } from "../domain/bookingRules";

export interface AvailableScreening {
  id: string;
  movie: string;
  room: string;
  startsAt: string;
  price: number;
  remaining: number;
}

export class ScreeningService {
  private screeningRepository = new ScreeningRepository();
  private bookingRepository = new BookingRepository();

  listUpcoming(): AvailableScreening[] {
    const screenings = this.screeningRepository.findAll();
    const bookings = this.bookingRepository.findAll();
    const now = new Date();
    const result = [];
    for (const s of screenings) {
      if (new Date(s.startsAt) < now) continue;
      result.push({
        id: s.id,
        movie: s.movie,
        room: s.room,
        startsAt: s.startsAt,
        price: s.price,
        remaining: remainingSeats(s, bookings),
      });
    }
    return result;
  }
}
