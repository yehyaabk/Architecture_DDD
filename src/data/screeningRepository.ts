// Couche données : accès aux séances
import { readDb, Screening } from "./jsonDatabase";

export class ScreeningRepository {
  findAll(): Screening[] {
    return readDb().screenings;
  }

  findById(id: string): Screening | undefined {
    return readDb().screenings.find((x) => x.id === id);
  }
}
