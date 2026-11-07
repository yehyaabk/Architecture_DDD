// Adapter sortant : séances lues dans le fichier db.json
import { ScreeningRepository } from "../../../application/ports/out/ScreeningRepository";
import { Screening } from "../../../domain/Screening";
import { JsonFile } from "./JsonFile";
import { toScreening } from "./jsonMapping";

export class JsonScreeningRepository implements ScreeningRepository {
  constructor(private readonly file: JsonFile) {}

  async findById(id: string): Promise<Screening | null> {
    const record = this.file.read().screenings.find((s) => s.id === id);
    return record ? toScreening(record) : null;
  }

  async findStartingAfter(date: Date): Promise<Screening[]> {
    return this.file
      .read()
      .screenings.map(toScreening)
      .filter((s) => s.startsAt.getTime() >= date.getTime());
  }
}
