// Use case : annuler une réservation. Ne connaît que le domaine et les ports.
import { Booking } from "../../domain/Booking";
import { cancel } from "../../domain/cancellationRules";
import { DomainError } from "../../domain/DomainError";
import { CancelBooking } from "../ports/in/CancelBooking";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { Notifier } from "../ports/out/Notifier";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class CancelBookingService implements CancelBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly screenings: ScreeningRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock
  ) {}

  async execute(bookingId: string): Promise<Booking> {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw new DomainError("NOT_FOUND", "Réservation introuvable");

    // bug legacy conservé (cf. AUDIT.md) : si la séance n'existe plus, cancel()
    // lève une TypeError, ce qui donne une erreur 500
    const screening = await this.screenings.findById(booking.screeningId);
    const cancelled = cancel(booking, screening!, this.clock.now());

    await this.bookings.save(cancelled);
    await this.notifier.bookingCancelled(cancelled);
    return cancelled;
  }
}
