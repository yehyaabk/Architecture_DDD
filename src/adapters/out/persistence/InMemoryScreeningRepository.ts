import { ScreeningRepository } from "../../../application/ports/out/ScreeningRepository";
import { Screening, ScreeningSnapshot } from "../../../domain/booking/Screening";
import { Email } from "../../../domain/shared/Email";

// On stocke des snapshots (copies) et non les objets eux-mêmes :
// un agrégat modifié mais non sauvegardé ne doit JAMAIS impacter le stockage (comme une vraie BDD).
export class InMemoryScreeningRepository implements ScreeningRepository {
  private readonly rows = new Map<string, ScreeningSnapshot>();

  constructor(initial: Screening[] = []) {
    initial.forEach((s) => this.rows.set(s.id, structuredClone(s.toSnapshot())));
  }

  private all(): Screening[] {
    return [...this.rows.values()].map((r) => Screening.fromSnapshot(structuredClone(r)));
  }

  async findById(id: string) {
    const r = this.rows.get(id);
    return r ? Screening.fromSnapshot(structuredClone(r)) : null;
  }

  async findByBookingId(bookingId: string) {
    return this.all().find((s) => s.findBooking(bookingId)) ?? null;
  }

  async findStartingAfter(date: Date) {
    return this.all().filter((s) => s.startsAt >= date);
  }

  async findWithBookingsOf(email: Email) {
    return this.all().filter((s) => s.bookingsOf(email).length > 0);
  }

  async save(screening: Screening) {
    this.rows.set(screening.id, structuredClone(screening.toSnapshot()));
  }
}
