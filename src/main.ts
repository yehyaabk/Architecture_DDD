// Composition root : seul fichier qui connaît les classes concrètes.
// Il instancie les adapters, les injecte dans le use case et monte les routes.
import express from "express";
import fs from "fs";
import path from "path";
import { createBookingRouter } from "./adapters/in/http/bookingRouter";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { Booking } from "./domain/Booking";
import { Screening } from "./domain/Screening";
import { bookingRouter as legacyBookingRouter } from "./presentation/bookingRoutes";
import { errorHandler as legacyErrorHandler } from "./presentation/errorHandler";
import { screeningRouter as legacyScreeningRouter } from "./presentation/screeningRoutes";

// Chargement initial depuis data/db.json (la persistance JSON reviendra au TP3).
// Les réservations existantes sont chargées aussi : sinon le contrôle de capacité
// ignorerait les places déjà prises.
const DB_FILE = path.join(__dirname, "..", "data", "db.json");
const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
const screenings: Screening[] = db.screenings.map((s: any) => ({ ...s, startsAt: new Date(s.startsAt) }));
const bookings: Booking[] = db.bookings.map((b: any) => ({ ...b, createdAt: new Date(b.createdAt) }));

const bookSeats = new BookSeatsService(
  new InMemoryScreeningRepository(screenings),
  new InMemoryBookingRepository(bookings),
  new FakePaymentGateway(),
  new ConsoleNotifier(),
  new SystemClock(),
  new UuidGenerator()
);

const app = express();
app.use(express.json());
app.use(createBookingRouter(bookSeats));
// routes du TP1 (lister, annuler, mes réservations), migrées au TP3
app.use(legacyScreeningRouter);
app.use(legacyBookingRouter);
app.use(domainErrorHandler);
app.use(legacyErrorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));
}

export default app;
