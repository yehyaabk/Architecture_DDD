// Handler applicatif : envoie les e-mails en réaction aux événements du domaine.
// Les use cases ne connaissent plus le notifier : ils publient des faits, ce handler y réagit.
import { BookingCancelled, BookingConfirmed } from "../../domain/booking/events";
import { Notifier } from "../ports/out/Notifier";

export class NotifyCustomer {
  constructor(private readonly notifier: Notifier) {}

  async onBookingConfirmed(event: BookingConfirmed): Promise<void> {
    await this.notifier.bookingConfirmed(event.booking);
  }

  async onBookingCancelled(event: BookingCancelled): Promise<void> {
    await this.notifier.bookingCancelled(event.booking);
  }
}
