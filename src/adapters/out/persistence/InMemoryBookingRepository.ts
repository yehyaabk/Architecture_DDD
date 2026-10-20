// Adapter sortant : réservations stockées en mémoire
import { BookingRepository } from "../../../application/ports/out/BookingRepository";
import { Booking } from "../../../domain/Booking";

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings: Booking[];

  constructor(initial: Booking[] = []) {
    this.bookings = [...initial];
  }

  async findByScreeningId(screeningId: string): Promise<Booking[]> {
    return this.bookings.filter((b) => b.screeningId === screeningId);
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.push(booking);
  }

  /** Pour les tests : toutes les réservations enregistrées. */
  all(): Booking[] {
    return [...this.bookings];
  }
}
