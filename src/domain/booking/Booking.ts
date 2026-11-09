// Entité : une réservation, identifiée par son id. Son état ne change que par cancel().
import { DomainError } from "../shared/DomainError";
import { Email } from "../shared/Email";
import { Money } from "../shared/Money";
import { SeatCount } from "./SeatCount";
import { Tariff } from "./Tariff";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

/** Copie à plat d'une réservation, pour la persistance. */
export interface BookingSnapshot {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: Tariff;
  total: number;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
}

export class Booking {
  private constructor(
    readonly id: string,
    readonly screeningId: string,
    readonly email: Email,
    readonly seats: SeatCount,
    readonly tariff: Tariff,
    readonly total: Money,
    readonly createdAt: Date,
    private _status: BookingStatus,
    private _cancelledAt?: Date
  ) {}

  /** Une réservation naît confirmée. Seule la racine Screening en crée (Screening.book). */
  static create(props: {
    id: string;
    screeningId: string;
    email: Email;
    seats: SeatCount;
    tariff: Tariff;
    total: Money;
    createdAt: Date;
  }): Booking {
    const { id, screeningId, email, seats, tariff, total, createdAt } = props;
    return new Booking(id, screeningId, email, seats, tariff, total, createdAt, "CONFIRMED");
  }

  get status(): BookingStatus {
    return this._status;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  isConfirmed(): boolean {
    return this._status === "CONFIRMED";
  }

  /** Appelée par la racine Screening, qui vérifie d'abord la limite des 2h. */
  cancel(now: Date): void {
    if (this._status === "CANCELLED") throw new DomainError("CONFLICT", "Déjà annulée");
    this._status = "CANCELLED";
    this._cancelledAt = now;
  }

  /** Égalité d'entité : par identité, pas par valeur. */
  equals(other: Booking): boolean {
    return this.id === other.id;
  }

  toSnapshot(): BookingSnapshot {
    const snapshot: BookingSnapshot = {
      id: this.id,
      screeningId: this.screeningId,
      email: this.email.value,
      seats: this.seats.value,
      tariff: this.tariff,
      total: this.total.cents,
      status: this._status,
      createdAt: this.createdAt,
    };
    if (this._cancelledAt) snapshot.cancelledAt = this._cancelledAt;
    return snapshot;
  }

  static fromSnapshot(s: BookingSnapshot): Booking {
    return new Booking(
      s.id,
      s.screeningId,
      new Email(s.email),
      new SeatCount(s.seats),
      s.tariff,
      Money.cents(s.total),
      s.createdAt,
      s.status,
      s.cancelledAt
    );
  }
}
