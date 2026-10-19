// Couche données : accès aux réservations
import { Booking, readDb, writeDb } from "./jsonDatabase";

export class BookingRepository {
  findAll(): Booking[] {
    return readDb().bookings;
  }

  findById(id: string): Booking | undefined {
    return readDb().bookings.find((x) => x.id === id);
  }

  findByEmail(email: unknown): Booking[] {
    return readDb().bookings.filter((b) => b.email === email);
  }

  insert(booking: Booking) {
    const db = readDb();
    db.bookings.push(booking);
    writeDb(db);
  }

  update(booking: Booking) {
    const db = readDb();
    const index = db.bookings.findIndex((x) => x.id === booking.id);
    db.bookings[index] = booking;
    writeDb(db);
  }
}
