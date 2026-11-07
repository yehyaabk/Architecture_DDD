// Use case : lister les séances à venir. Ne connaît que le domaine et les ports.
import { remainingSeats } from "../../domain/bookingRules";
import { ListUpcomingScreenings, UpcomingScreening } from "../ports/in/ListUpcomingScreenings";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListUpcomingScreeningsService implements ListUpcomingScreenings {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly bookings: BookingRepository,
    private readonly clock: Clock
  ) {}

  async execute(): Promise<UpcomingScreening[]> {
    const result: UpcomingScreening[] = [];
    for (const s of await this.screenings.findStartingAfter(this.clock.now())) {
      result.push({
        id: s.id,
        movie: s.movie,
        room: s.room,
        startsAt: s.startsAt,
        unitPrice: s.unitPrice,
        remaining: remainingSeats(s, await this.bookings.findByScreeningId(s.id)),
      });
    }
    return result;
  }
}
