// Use case : annuler une réservation. Charger l'agrégat → méthode métier → sauvegarder.
import { DomainError } from "../../domain/shared/DomainError";
import { BookingView, toBookingView } from "../ports/in/BookingView";
import { CancelBooking } from "../ports/in/CancelBooking";
import { Clock } from "../ports/out/Clock";
import { Notifier } from "../ports/out/Notifier";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class CancelBookingService implements CancelBooking {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock
  ) {}

  async execute(bookingId: string): Promise<BookingView> {
    const screening = await this.screenings.findByBookingId(bookingId);
    if (!screening) throw new DomainError("NOT_FOUND", "Réservation introuvable");

    const booking = screening.cancel(bookingId, this.clock.now());

    await this.screenings.save(screening);
    const view = toBookingView(booking);
    await this.notifier.bookingCancelled(view);
    return view;
  }
}
