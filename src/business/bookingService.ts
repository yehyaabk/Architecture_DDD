// Couche métier : annulation et consultation des réservations
// (la réservation est passée en hexagonal : application/usecases/BookSeatsService.ts)
import { BookingRepository } from "../data/bookingRepository";
import { Booking } from "../data/jsonDatabase";
import { Mailer } from "../data/mailer";
import { ScreeningRepository } from "../data/screeningRepository";
import { CANCELLATION_DEADLINE_HOURS, CANCELLATION_DEADLINE_MS } from "./bookingRules";
import { BusinessRuleError, NotFoundError } from "./errors";

export interface BookingWithScreening extends Booking {
  movie: string;
  startsAt: string | null;
}

export class BookingService {
  private screeningRepository = new ScreeningRepository();
  private bookingRepository = new BookingRepository();
  private mailer = new Mailer();

  cancel(bookingId: string): Booking {
    const b = this.bookingRepository.findById(bookingId);
    if (!b) throw new NotFoundError("Réservation introuvable");
    if (b.status === "CANCELLED") throw new BusinessRuleError("Déjà annulée");

    // bug legacy conservé (cf. AUDIT.md) : si la séance n'existe plus, la ligne
    // suivante lève une TypeError, ce qui donne une erreur 500
    const s = this.screeningRepository.findById(b.screeningId)!;
    const diff = new Date(s.startsAt).getTime() - new Date().getTime();
    if (diff < CANCELLATION_DEADLINE_MS) {
      throw new BusinessRuleError(
        `Annulation impossible moins de ${CANCELLATION_DEADLINE_HOURS}h avant la séance`
      );
    }

    b.status = "CANCELLED";
    b.cancelledAt = new Date().toISOString();
    this.bookingRepository.update(b);

    this.mailer.sendCancellationConfirmation(b.email, b.id, b.total);
    return b;
  }

  listByEmail(email: unknown): BookingWithScreening[] {
    const screenings = this.screeningRepository.findAll();
    return this.bookingRepository.findByEmail(email).map((b) => {
      const s = screenings.find((x) => x.id === b.screeningId);
      return { ...b, movie: s ? s.movie : "?", startsAt: s ? s.startsAt : null };
    });
  }
}
