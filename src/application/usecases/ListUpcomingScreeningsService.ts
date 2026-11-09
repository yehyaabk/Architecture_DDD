// Use case : lister les séances à venir avec le nombre de places restantes
import { ListUpcomingScreenings, UpcomingScreening } from "../ports/in/ListUpcomingScreenings";
import { Clock } from "../ports/out/Clock";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListUpcomingScreeningsService implements ListUpcomingScreenings {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly clock: Clock
  ) {}

  async execute(): Promise<UpcomingScreening[]> {
    return (await this.screenings.findStartingAfter(this.clock.now())).map((s) => ({
      id: s.id,
      movie: s.movie,
      room: s.room,
      startsAt: s.startsAt,
      unitPrice: s.unitPrice.cents,
      remaining: s.remainingSeats(),
    }));
  }
}
