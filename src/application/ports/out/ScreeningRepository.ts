// Port sortant : retrouver une séance
import { Screening } from "../../../domain/Screening";

export interface ScreeningRepository {
  findById(id: string): Promise<Screening | null>;
}
