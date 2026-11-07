// Port sortant : retrouver des séances
import { Screening } from "../../../domain/Screening";

export interface ScreeningRepository {
  findById(id: string): Promise<Screening | null>;
  /** Séances qui commencent à `date` ou plus tard. */
  findStartingAfter(date: Date): Promise<Screening[]>;
}
