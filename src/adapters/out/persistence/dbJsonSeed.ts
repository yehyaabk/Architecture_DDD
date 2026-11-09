// Adapter : lit data/db.json (format legacy inchangé) et le traduit en agrégats Screening.
// Une réservation dont la séance n'existe pas ne peut appartenir à aucun agrégat : elle est ignorée.
import fs from "fs";
import { Screening } from "../../../domain/booking/Screening";

interface ScreeningRecord {
  id: string;
  movie: string;
  room: string;
  startsAt: string;
  capacity: number;
  price: number;
}

interface BookingRecord {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: "NORMAL" | "STUDENT";
  total: number;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  cancelledAt?: string;
}

export function loadScreenings(file: string): Screening[] {
  const db: { screenings: ScreeningRecord[]; bookings: BookingRecord[] } = JSON.parse(fs.readFileSync(file, "utf-8"));
  return db.screenings.map((s) =>
    Screening.fromSnapshot({
      id: s.id,
      movie: s.movie,
      room: s.room,
      startsAt: new Date(s.startsAt),
      capacity: s.capacity,
      unitPrice: s.price,
      bookings: db.bookings
        .filter((b) => b.screeningId === s.id)
        .map(({ createdAt, cancelledAt, ...b }) => ({
          ...b,
          createdAt: new Date(createdAt),
          ...(cancelledAt ? { cancelledAt: new Date(cancelledAt) } : {}),
        })),
    })
  );
}
