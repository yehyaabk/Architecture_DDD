// Domaine : une réservation (total en centimes)
import { Tariff } from "./booking/Tariff";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export interface Booking {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: Tariff;
  total: number;
  status: BookingStatus;
  createdAt: Date;
  cancelledAt?: Date;
}
