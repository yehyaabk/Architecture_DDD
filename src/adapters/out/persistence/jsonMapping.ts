// Adapter sortant : conversion entre le format du fichier db.json et les objets du domaine
// (dates ISO <-> Date, price <-> unitPrice)
import { Booking } from "../../../domain/Booking";
import { Screening } from "../../../domain/Screening";
import { BookingRecord, ScreeningRecord } from "./JsonFile";

export function toScreening(record: ScreeningRecord): Screening {
  return {
    id: record.id,
    movie: record.movie,
    room: record.room,
    startsAt: new Date(record.startsAt),
    capacity: record.capacity,
    unitPrice: record.price,
  };
}

export function toBooking(record: BookingRecord): Booking {
  return {
    id: record.id,
    screeningId: record.screeningId,
    email: record.email,
    seats: record.seats,
    tariff: record.tariff,
    total: record.total,
    status: record.status,
    createdAt: new Date(record.createdAt),
    ...(record.cancelledAt ? { cancelledAt: new Date(record.cancelledAt) } : {}),
  };
}

export function toBookingRecord(booking: Booking): BookingRecord {
  return {
    id: booking.id,
    screeningId: booking.screeningId,
    email: booking.email,
    seats: booking.seats,
    tariff: booking.tariff,
    total: booking.total,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    ...(booking.cancelledAt ? { cancelledAt: booking.cancelledAt.toISOString() } : {}),
  };
}
