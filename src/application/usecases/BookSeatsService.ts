// Use case : réserver des places. Charger l'agrégat → méthode métier → payer → sauvegarder.
import { SeatCount } from "../../domain/booking/SeatCount";
import { toTariff } from "../../domain/booking/Tariff";
import { DomainError } from "../../domain/shared/DomainError";
import { Email } from "../../domain/shared/Email";
import { BookSeats, BookSeatsCommand } from "../ports/in/BookSeats";
import { BookingView, toBookingView } from "../ports/in/BookingView";
import { Clock } from "../ports/out/Clock";
import { IdGenerator } from "../ports/out/IdGenerator";
import { Notifier } from "../ports/out/Notifier";
import { PaymentGateway } from "../ports/out/PaymentGateway";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class BookSeatsService implements BookSeats {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly payment: PaymentGateway,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: BookSeatsCommand): Promise<BookingView> {
    // les contrôles sont faits dans le même ordre que le legacy : séance, email, places, puis règles de l'agrégat
    const screening = await this.screenings.findById(command.screeningId);
    if (!screening) throw new DomainError("NOT_FOUND", "Séance introuvable");

    const booking = screening.book({
      email: new Email(command.email),
      seats: new SeatCount(command.seats),
      tariff: toTariff(command.tariff),
      bookingId: this.ids.next(),
      now: this.clock.now(),
    });

    // paiement refusé : l'agrégat modifié n'est pas sauvegardé, le stockage reste intact
    if (!(await this.payment.charge(booking.email.value, booking.total.cents))) {
      throw new DomainError("PAYMENT_REFUSED", "Paiement refusé");
    }

    await this.screenings.save(screening);
    const view = toBookingView(booking);
    await this.notifier.bookingConfirmed(view, screening.movie);
    return view;
  }
}
