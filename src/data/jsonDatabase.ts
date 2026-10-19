// Couche données : lecture / écriture du fichier data/db.json
import fs from "fs";
import path from "path";

export interface Screening {
  id: string;
  movie: string;
  room: string;
  startsAt: string;
  capacity: number;
  price: number;
}

export interface Booking {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: string;
  total: number;
  status: string;
  createdAt: string;
  cancelledAt?: string;
}

interface Database {
  screenings: Screening[];
  bookings: Booking[];
}

const DB_FILE = path.join(__dirname, "..", "..", "data", "db.json");

export function readDb(): Database {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

export function writeDb(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
