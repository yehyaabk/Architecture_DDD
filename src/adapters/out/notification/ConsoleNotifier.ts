// Adapter sortant : notification simulée par console.log (même message que le legacy)
import { Notifier } from "../../../application/ports/out/Notifier";
import { BookingEventData } from "../../../domain/booking/events";

export class ConsoleNotifier implements Notifier {
  async bookingConfirmed(booking: BookingEventData): Promise<void> {
    console.log(
      `[SMTP] To: ${booking.email} — Votre réservation ${booking.bookingId} pour "${booking.movie}" ` +
        `(${booking.seats} place(s), ${(booking.total / 100).toFixed(2)} €) est confirmée.`
    );
  }

  async bookingCancelled(booking: BookingEventData): Promise<void> {
    console.log(`[SMTP] To: ${booking.email} — Votre réservation ${booking.bookingId} a été annulée. Remboursement : ${(booking.total / 100).toFixed(2)} €`);
  }
}
