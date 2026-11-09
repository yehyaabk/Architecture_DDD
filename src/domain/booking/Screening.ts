// Racine d'agrégat : une séance et ses réservations.
// Seule porte d'entrée pour réserver et annuler : elle protège la capacité, le début de séance et la limite des 2h.
import { DomainError } from "../shared/DomainError";
import { DomainEvent } from "../shared/DomainEvent";
import { Email } from "../shared/Email";
import { Money } from "../shared/Money";
import { Booking, BookingSnapshot } from "./Booking";
import { BookingCancelled, BookingConfirmed, BookingEventData } from "./events";
import { PricingPolicy } from "./PricingPolicy";
import { SeatCount } from "./SeatCount";
import { Tariff } from "./Tariff";

/** Copie à plat d'une séance et de ses réservations, pour la persistance. */
export interface ScreeningSnapshot {
  id: string;
  movie: string;
  room: string;
  startsAt: Date;
  capacity: number;
  /** En centimes. */
  unitPrice: number;
  bookings: BookingSnapshot[];
}

export interface BookingRequest {
  bookingId: string;
  email: Email;
  seats: SeatCount;
  tariff: Tariff;
  now: Date;
}

export class Screening {
  /** Annulation possible jusqu'à 2h avant la séance. */
  static readonly CANCELLATION_DEADLINE_HOURS = 2;
  private static readonly CANCELLATION_DEADLINE_MS = Screening.CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000;

  private events: DomainEvent[] = [];

  private constructor(
    readonly id: string,
    readonly movie: string,
    readonly room: string,
    readonly startsAt: Date,
    readonly capacity: number,
    readonly unitPrice: Money,
    private readonly bookings: Booking[]
  ) {}

  /** Programme une nouvelle séance, sans réservation. */
  static schedule(props: {
    id: string;
    movie: string;
    room: string;
    startsAt: Date;
    capacity: number;
    unitPrice: Money;
  }): Screening {
    const { id, movie, room, startsAt, capacity, unitPrice } = props;
    return new Screening(id, movie, room, startsAt, capacity, unitPrice, []);
  }

  /** Seules les réservations confirmées occupent des places. */
  remainingSeats(): number {
    const taken = this.bookings.filter((b) => b.isConfirmed()).reduce((sum, b) => sum + b.seats.value, 0);
    return this.capacity - taken;
  }

  hasStarted(now: Date): boolean {
    return this.startsAt.getTime() <= now.getTime();
  }

  book(request: BookingRequest): Booking {
    const { bookingId, email, seats, tariff, now } = request;
    if (this.hasStarted(now)) throw new DomainError("CONFLICT", "La séance a déjà commencé");
    if (seats.value > this.remainingSeats()) throw new DomainError("CONFLICT", "Plus assez de places");

    const booking = Booking.create({
      id: bookingId,
      screeningId: this.id,
      email,
      seats,
      tariff,
      total: PricingPolicy.total(this.unitPrice, seats, tariff),
      createdAt: now,
    });
    this.bookings.push(booking);
    this.events.push(new BookingConfirmed(now, this.eventData(booking)));
    return booking;
  }

  cancel(bookingId: string, now: Date): Booking {
    const booking = this.findBooking(bookingId);
    if (!booking) throw new DomainError("NOT_FOUND", "Réservation introuvable");

    // même ordre que le legacy : "Déjà annulée" (vérifié par Booking.cancel) passe avant la limite des 2h
    if (booking.isConfirmed() && this.startsAt.getTime() - now.getTime() < Screening.CANCELLATION_DEADLINE_MS) {
      throw new DomainError(
        "CONFLICT",
        `Annulation impossible moins de ${Screening.CANCELLATION_DEADLINE_HOURS}h avant la séance`
      );
    }
    booking.cancel(now);
    this.events.push(new BookingCancelled(now, this.eventData(booking)));
    return booking;
  }

  findBooking(bookingId: string): Booking | undefined {
    return this.bookings.find((b) => b.id === bookingId);
  }

  bookingsOf(email: Email): Booking[] {
    return this.bookings.filter((b) => b.email.equals(email));
  }

  /** Renvoie les événements émis depuis le dernier appel, puis vide la liste. */
  pullEvents(): DomainEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  toSnapshot(): ScreeningSnapshot {
    return {
      id: this.id,
      movie: this.movie,
      room: this.room,
      startsAt: this.startsAt,
      capacity: this.capacity,
      unitPrice: this.unitPrice.cents,
      bookings: this.bookings.map((b) => b.toSnapshot()),
    };
  }

  static fromSnapshot(s: ScreeningSnapshot): Screening {
    return new Screening(
      s.id,
      s.movie,
      s.room,
      s.startsAt,
      s.capacity,
      Money.cents(s.unitPrice),
      s.bookings.map((b) => Booking.fromSnapshot(b))
    );
  }

  private eventData(booking: Booking): BookingEventData {
    return {
      bookingId: booking.id,
      screeningId: this.id,
      movie: this.movie,
      email: booking.email.value,
      seats: booking.seats.value,
      total: booking.total.cents,
    };
  }
}
