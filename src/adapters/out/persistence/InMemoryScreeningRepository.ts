// Adapter sortant : séances stockées en mémoire
import { ScreeningRepository } from "../../../application/ports/out/ScreeningRepository";
import { Screening } from "../../../domain/Screening";

export class InMemoryScreeningRepository implements ScreeningRepository {
  private readonly screenings = new Map<string, Screening>();

  constructor(initial: Screening[] = []) {
    for (const s of initial) this.screenings.set(s.id, s);
  }

  async findById(id: string): Promise<Screening | null> {
    return this.screenings.get(id) ?? null;
  }

  async findStartingAfter(date: Date): Promise<Screening[]> {
    return [...this.screenings.values()].filter((s) => s.startsAt.getTime() >= date.getTime());
  }
}
