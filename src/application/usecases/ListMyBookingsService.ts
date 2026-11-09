// Use case : lister les réservations d'un client, avec le film et la date de la séance
import { Email } from "../../domain/shared/Email";
import { toBookingView } from "../ports/in/BookingView";
import { BookingWithScreening, ListMyBookings } from "../ports/in/ListMyBookings";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListMyBookingsService implements ListMyBookings {
  constructor(private readonly screenings: ScreeningRepository) {}

  async execute(rawEmail: string): Promise<BookingWithScreening[]> {
    // comme le legacy : un email absent ou invalide ne correspond à aucune réservation
    let email: Email;
    try {
      email = new Email(rawEmail);
    } catch {
      return [];
    }

    const result: BookingWithScreening[] = [];
    for (const s of await this.screenings.findWithBookingsOf(email)) {
      for (const b of s.bookingsOf(email)) {
        result.push({ ...toBookingView(b), movie: s.movie, startsAt: s.startsAt });
      }
    }
    // le legacy rendait les réservations dans l'ordre de création ; à date égale, par id
    return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
  }
}
