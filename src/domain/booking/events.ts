// Domain events émis par l'agrégat Screening : des faits passés, immuables
import { DomainEvent } from "../shared/DomainEvent";

/** Ce qu'il faut savoir d'une réservation pour réagir à l'événement (ex. envoyer un mail). */
export interface BookingEventData {
  readonly bookingId: string;
  readonly screeningId: string;
  readonly movie: string;
  readonly email: string;
  readonly seats: number;
  /** En centimes. */
  readonly total: number;
}

export class BookingConfirmed implements DomainEvent {
  static readonly TYPE = "BookingConfirmed";
  readonly type = BookingConfirmed.TYPE;

  constructor(
    readonly occurredAt: Date,
    readonly booking: BookingEventData
  ) {
    Object.freeze(booking);
    Object.freeze(this);
  }
}

export class BookingCancelled implements DomainEvent {
  static readonly TYPE = "BookingCancelled";
  readonly type = BookingCancelled.TYPE;

  constructor(
    readonly occurredAt: Date,
    readonly booking: BookingEventData
  ) {
    Object.freeze(booking);
    Object.freeze(this);
  }
}
