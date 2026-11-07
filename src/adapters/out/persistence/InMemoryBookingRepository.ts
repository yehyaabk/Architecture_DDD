// Adapter sortant : réservations stockées en mémoire
import { BookingRepository } from "../../../application/ports/out/BookingRepository";
import { Booking } from "../../../domain/Booking";

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings: Booking[];

  constructor(initial: Booking[] = []) {
    this.bookings = [...initial];
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) ?? null;
  }

  async findByScreeningId(screeningId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.screeningId === screeningId);
  }

  async findByEmail(email: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.email === email);
  }

  async save(booking: Booking): Promise<void> {
    const index = this.bookings.findIndex((b) => b.id === booking.id);
    if (index >= 0) this.bookings[index] = booking;
    else this.bookings.push(booking);
  }
}
