// Adapter sortant : réservations lues et écrites dans le fichier db.json
import { BookingRepository } from "../../../application/ports/out/BookingRepository";
import { Booking } from "../../../domain/Booking";
import { confirmedSeats } from "../../../domain/bookingRules";
import { JsonFile } from "./JsonFile";
import { toBooking, toBookingRecord } from "./jsonMapping";

export class JsonBookingRepository implements BookingRepository {
  constructor(private readonly file: JsonFile) {}

  async findById(id: string): Promise<Booking | null> {
    const record = this.file.read().bookings.find((b) => b.id === id);
    return record ? toBooking(record) : null;
  }

  async findByEmail(email: string): Promise<Booking[]> {
    return this.file
      .read()
      .bookings.filter((b) => b.email === email)
      .map(toBooking);
  }

  async countConfirmedSeats(screeningId: string): Promise<number> {
    return confirmedSeats(this.file.read().bookings.map(toBooking), screeningId);
  }

  async save(booking: Booking): Promise<void> {
    const data = this.file.read();
    const record = toBookingRecord(booking);
    const index = data.bookings.findIndex((b) => b.id === booking.id);
    if (index >= 0) data.bookings[index] = record;
    else data.bookings.push(record);
    this.file.write(data);
  }
}
