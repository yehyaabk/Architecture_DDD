// Composition root : seul fichier qui connaît les classes concrètes.
// Il instancie les adapters, les injecte dans les use cases et monte les routes.
import express from "express";
import fs from "fs";
import path from "path";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { createRouter } from "./adapters/in/http/router";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { CancelBookingService } from "./application/usecases/CancelBookingService";
import { ListMyBookingsService } from "./application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "./application/usecases/ListUpcomingScreeningsService";
import { Booking } from "./domain/Booking";
import { Screening } from "./domain/Screening";

// Données initiales lues dans data/db.json. La persistance reste en mémoire :
// le fichier n'est jamais réécrit.
const DB_FILE = path.join(__dirname, "..", "data", "db.json");
const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
const initialScreenings: Screening[] = db.screenings.map((s: any) => ({
  id: s.id,
  movie: s.movie,
  room: s.room,
  startsAt: new Date(s.startsAt),
  capacity: s.capacity,
  unitPrice: s.price,
}));
const initialBookings: Booking[] = db.bookings.map((b: any) => ({
  ...b,
  createdAt: new Date(b.createdAt),
  ...(b.cancelledAt ? { cancelledAt: new Date(b.cancelledAt) } : {}),
}));

const screenings = new InMemoryScreeningRepository(initialScreenings);
const bookings = new InMemoryBookingRepository(initialBookings);
const notifier = new ConsoleNotifier();
const clock = new SystemClock();

const app = express();
app.use(express.json());
app.use(
  createRouter({
    bookSeats: new BookSeatsService(screenings, bookings, new FakePaymentGateway(), notifier, clock, new UuidGenerator()),
    cancelBooking: new CancelBookingService(bookings, screenings, notifier, clock),
    listUpcomingScreenings: new ListUpcomingScreeningsService(screenings, bookings, clock),
    listMyBookings: new ListMyBookingsService(bookings, screenings),
  })
);
app.use(domainErrorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));
}

export default app;
