// Composition root : seul fichier qui connaît les classes concrètes.
// buildApp assemble l'application à partir d'un jeu d'adapters, selectAdapters fournit celui de production.
import express, { Express } from "express";
import path from "path";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { createRouter } from "./adapters/in/http/router";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { loadScreenings } from "./adapters/out/persistence/dbJsonSeed";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { Clock } from "./application/ports/out/Clock";
import { IdGenerator } from "./application/ports/out/IdGenerator";
import { Notifier } from "./application/ports/out/Notifier";
import { PaymentGateway } from "./application/ports/out/PaymentGateway";
import { ScreeningRepository } from "./application/ports/out/ScreeningRepository";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { CancelBookingService } from "./application/usecases/CancelBookingService";
import { ListMyBookingsService } from "./application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "./application/usecases/ListUpcomingScreeningsService";

export interface Adapters {
  screenings: ScreeningRepository;
  payment: PaymentGateway;
  notifier: Notifier;
  clock: Clock;
  /** Par défaut : UuidGenerator. */
  ids?: IdGenerator;
}

export function buildApp(adapters: Adapters): Express {
  const { screenings, payment, notifier, clock, ids = new UuidGenerator() } = adapters;

  const app = express();
  app.use(express.json());
  app.use(
    createRouter({
      bookSeats: new BookSeatsService(screenings, payment, notifier, clock, ids),
      cancelBooking: new CancelBookingService(screenings, notifier, clock),
      listUpcomingScreenings: new ListUpcomingScreeningsService(screenings, clock),
      listMyBookings: new ListMyBookingsService(screenings),
    })
  );
  app.use(domainErrorHandler);
  return app;
}

const DB_FILE = path.join(__dirname, "..", "data", "db.json");

/** Persistance en mémoire, initialisée depuis db.json (le fichier n'est jamais réécrit). */
export function selectAdapters(): Adapters {
  return {
    screenings: new InMemoryScreeningRepository(loadScreenings(DB_FILE)),
    payment: new FakePaymentGateway(),
    notifier: new ConsoleNotifier(),
    clock: new SystemClock(),
  };
}
