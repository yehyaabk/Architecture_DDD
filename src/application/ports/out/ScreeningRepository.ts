import { Screening } from "../../../domain/booking/Screening";
import { Email } from "../../../domain/shared/Email";

// Un repository PAR AGRÉGAT : on charge et on sauvegarde l'agrégat entier
export interface ScreeningRepository {
  findById(id: string): Promise<Screening | null>;
  findByBookingId(bookingId: string): Promise<Screening | null>;
  findStartingAfter(date: Date): Promise<Screening[]>;
  findWithBookingsOf(email: Email): Promise<Screening[]>;
  save(screening: Screening): Promise<void>;
}
