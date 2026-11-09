// DTO renvoyé par les use cases : les entités du domaine ne sortent pas de l'hexagone
import { Booking } from "../../../domain/booking/Booking";

export interface BookingView {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: "NORMAL" | "STUDENT";
  /** En centimes. */
  total: number;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: Date;
  cancelledAt?: Date;
}

/** Mêmes champs, dans le même ordre, que le JSON du legacy. */
export function toBookingView(booking: Booking): BookingView {
  const view: BookingView = {
    id: booking.id,
    screeningId: booking.screeningId,
    email: booking.email.value,
    seats: booking.seats.value,
    tariff: booking.tariff,
    total: booking.total.cents,
    status: booking.status,
    createdAt: booking.createdAt,
  };
  if (booking.cancelledAt) view.cancelledAt = booking.cancelledAt;
  return view;
}
