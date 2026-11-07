// Adapter sortant : notification simulée par console.log (même message que le legacy)
import { Notifier } from "../../../application/ports/out/Notifier";
import { Booking } from "../../../domain/Booking";
import { Screening } from "../../../domain/Screening";

export class ConsoleNotifier implements Notifier {
  async bookingConfirmed(booking: Booking, screening: Screening): Promise<void> {
    console.log(
      `[SMTP] To: ${booking.email} — Votre réservation ${booking.id} pour "${screening.movie}" ` +
        `(${booking.seats} place(s), ${(booking.total / 100).toFixed(2)} €) est confirmée.`
    );
  }

  async bookingCancelled(booking: Booking): Promise<void> {
    console.log(`[SMTP] To: ${booking.email} — Votre réservation ${booking.id} a été annulée. Remboursement : ${(booking.total / 100).toFixed(2)} €`);
  }
}
