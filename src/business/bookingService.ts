// Couche métier : réservation, annulation et consultation des réservations
import { BookingRepository } from "../data/bookingRepository";
import { Booking } from "../data/jsonDatabase";
import { Mailer } from "../data/mailer";
import { PaymentGateway } from "../data/paymentGateway";
import { ScreeningRepository } from "../data/screeningRepository";
import {
  CANCELLATION_DEADLINE_HOURS,
  CANCELLATION_DEADLINE_MS,
  EMAIL_PATTERN,
  MAX_SEATS_PER_BOOKING,
  MIN_SEATS_PER_BOOKING,
} from "./bookingRules";
import { BusinessRuleError, NotFoundError, PaymentRefusedError, ValidationError } from "./errors";
import { computeTotalPrice, Tariff } from "./pricing";
import { ScreeningService } from "./screeningService";

export interface BookingRequest {
  email: unknown;
  seats: number;
  tariff: unknown;
}

export interface BookingWithScreening extends Booking {
  movie: string;
  startsAt: string | null;
}

export class BookingService {
  private screeningRepository = new ScreeningRepository();
  private bookingRepository = new BookingRepository();
  private screeningService = new ScreeningService();
  private paymentGateway = new PaymentGateway();
  private mailer = new Mailer();

  book(screeningId: string, request: BookingRequest): Booking {
    const s = this.screeningRepository.findById(screeningId);
    if (!s) throw new NotFoundError("Séance introuvable");

    const { email, seats, tariff } = request;
    if (!email || !EMAIL_PATTERN.test(String(email))) {
      throw new ValidationError("Email invalide");
    }

    if (!Number.isInteger(seats) || seats < MIN_SEATS_PER_BOOKING || seats > MAX_SEATS_PER_BOOKING) {
      throw new ValidationError(
        `Entre ${MIN_SEATS_PER_BOOKING} et ${MAX_SEATS_PER_BOOKING} places par réservation`
      );
    }

    if (new Date(s.startsAt) <= new Date()) {
      throw new BusinessRuleError("La séance a déjà commencé");
    }

    if (seats > this.screeningService.remainingSeats(s, this.bookingRepository.findAll())) {
      throw new BusinessRuleError("Plus assez de places");
    }

    // tout tarif autre que STUDENT est traité comme NORMAL (comportement legacy)
    const normalizedTariff: Tariff = tariff === "STUDENT" ? "STUDENT" : "NORMAL";
    const total = computeTotalPrice(s.price, seats, normalizedTariff);

    if (!this.paymentGateway.charge(total)) throw new PaymentRefusedError("Paiement refusé");

    const booking: Booking = {
      id: "b" + Date.now(),
      screeningId: s.id,
      // l'e-mail est conservé tel que reçu (comportement legacy, cf. AUDIT.md)
      email: email as string,
      seats: seats,
      tariff: normalizedTariff,
      total: total,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
    this.bookingRepository.insert(booking);

    this.mailer.sendBookingConfirmation(booking.email, booking.id, s.movie, seats, total);

    return booking;
  }

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
