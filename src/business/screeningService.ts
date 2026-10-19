// Couche métier : séances et places disponibles
import { BookingRepository } from "../data/bookingRepository";
import { Booking, Screening } from "../data/jsonDatabase";
import { ScreeningRepository } from "../data/screeningRepository";

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

  /** Seul endroit où sont calculées les places restantes d'une séance. */
  remainingSeats(screening: Screening, bookings: Booking[]): number {
    let taken = 0;
    for (const b of bookings) {
      if (b.screeningId === screening.id && b.status === "CONFIRMED") taken += b.seats;
    }
    return screening.capacity - taken;
  }

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
        remaining: this.remainingSeats(s, bookings),
      });
    }
    return result;
  }
}
