// Use case : annuler une réservation. Charger l'agrégat → méthode métier → sauvegarder → publier.
import { DomainError } from "../../domain/shared/DomainError";
import { BookingView, toBookingView } from "../ports/in/BookingView";
import { CancelBooking } from "../ports/in/CancelBooking";
import { Clock } from "../ports/out/Clock";
import { EventPublisher } from "../ports/out/EventPublisher";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class CancelBookingService implements CancelBooking {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly events: EventPublisher,
    private readonly clock: Clock
  ) {}

  async execute(bookingId: string): Promise<BookingView> {
    const screening = await this.screenings.findByBookingId(bookingId);
    if (!screening) throw new DomainError("NOT_FOUND", "Réservation introuvable");

    const booking = screening.cancel(bookingId, this.clock.now());

    await this.screenings.save(screening);
    await this.events.publish(screening.pullEvents());
    return toBookingView(booking);
  }
}
