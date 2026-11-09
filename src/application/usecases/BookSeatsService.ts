// Use case : réserver des places. Ne connaît que le domaine et les ports.
import { Booking } from "../../domain/Booking";
import { PricingPolicy } from "../../domain/booking/PricingPolicy";
import { SeatCount } from "../../domain/booking/SeatCount";
import { toTariff } from "../../domain/booking/Tariff";
import { assertBookable, assertValidEmail } from "../../domain/bookingRules";
import { DomainError } from "../../domain/shared/DomainError";
import { Money } from "../../domain/shared/Money";
import { BookSeats, BookSeatsCommand } from "../ports/in/BookSeats";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { IdGenerator } from "../ports/out/IdGenerator";
import { Notifier } from "../ports/out/Notifier";
import { PaymentGateway } from "../ports/out/PaymentGateway";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class BookSeatsService implements BookSeats {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly bookings: BookingRepository,
    private readonly payment: PaymentGateway,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: BookSeatsCommand): Promise<Booking> {
    // les contrôles sont faits dans le même ordre que le legacy
    const screening = await this.screenings.findById(command.screeningId);
    if (!screening) throw new DomainError("NOT_FOUND", "Séance introuvable");

    assertValidEmail(command.email);
    const seats = new SeatCount(command.seats);
    assertBookable(
      screening,
      await this.bookings.countConfirmedSeats(screening.id),
      seats.value,
      this.clock.now()
    );

    const tariff = toTariff(command.tariff);
    const total = PricingPolicy.total(Money.cents(screening.unitPrice), seats, tariff).cents;

    if (!(await this.payment.charge(command.email, total))) {
      throw new DomainError("PAYMENT_REFUSED", "Paiement refusé");
    }

    const booking: Booking = {
      id: this.ids.next(),
      screeningId: screening.id,
      email: command.email,
      seats: seats.value,
      tariff,
      total,
      status: "CONFIRMED",
      createdAt: this.clock.now(),
    };
    await this.bookings.save(booking);
    await this.notifier.bookingConfirmed(booking, screening);
    return booking;
  }
}
