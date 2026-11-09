// Adapter sortant : notification simulée par console.log (même message que le legacy)
import { BookingView } from "../../../application/ports/in/BookingView";
import { Notifier } from "../../../application/ports/out/Notifier";

export class ConsoleNotifier implements Notifier {
  async bookingConfirmed(booking: BookingView, movie: string): Promise<void> {
    console.log(
      `[SMTP] To: ${booking.email} — Votre réservation ${booking.id} pour "${movie}" ` +
        `(${booking.seats} place(s), ${(booking.total / 100).toFixed(2)} €) est confirmée.`
    );
  }

  async bookingCancelled(booking: BookingView): Promise<void> {
    console.log(`[SMTP] To: ${booking.email} — Votre réservation ${booking.id} a été annulée. Remboursement : ${(booking.total / 100).toFixed(2)} €`);
  }
}
