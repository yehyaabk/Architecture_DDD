// Composition root : seul fichier qui connaît les classes concrètes.
// buildApp assemble l'application à partir d'un jeu d'adapters,
// selectAdapters choisit ce jeu selon la configuration.
import express, { Express } from "express";
import path from "path";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { createRouter } from "./adapters/in/http/router";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { JsonBookingRepository } from "./adapters/out/persistence/JsonBookingRepository";
import { JsonFile } from "./adapters/out/persistence/JsonFile";
import { toBooking, toScreening } from "./adapters/out/persistence/jsonMapping";
import { JsonScreeningRepository } from "./adapters/out/persistence/JsonScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { BookingRepository } from "./application/ports/out/BookingRepository";
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
  bookings: BookingRepository;
  payment: PaymentGateway;
  notifier: Notifier;
  clock: Clock;
  /** Par défaut : UuidGenerator. */
  ids?: IdGenerator;
}

export function buildApp(adapters: Adapters): Express {
  const { screenings, bookings, payment, notifier, clock, ids = new UuidGenerator() } = adapters;

  const app = express();
  app.use(express.json());
  app.use(
    createRouter({
      bookSeats: new BookSeatsService(screenings, bookings, payment, notifier, clock, ids),
      cancelBooking: new CancelBookingService(bookings, screenings, notifier, clock),
      listUpcomingScreenings: new ListUpcomingScreeningsService(screenings, bookings, clock),
      listMyBookings: new ListMyBookingsService(bookings, screenings),
    })
  );
  app.use(domainErrorHandler);
  return app;
}

const DB_FILE = path.join(__dirname, "..", "data", "db.json");

/** Persistance fichier avec --json ou PERSISTENCE=json, en mémoire sinon. */
export function selectAdapters(args: string[] = process.argv, env: NodeJS.ProcessEnv = process.env): Adapters {
  const file = new JsonFile(DB_FILE);
  const common = { payment: new FakePaymentGateway(), notifier: new ConsoleNotifier(), clock: new SystemClock() };

  if (args.includes("--json") || env.PERSISTENCE === "json") {
    return { ...common, screenings: new JsonScreeningRepository(file), bookings: new JsonBookingRepository(file) };
  }

  // en mémoire : données initiales lues dans db.json, le fichier n'est jamais réécrit
  const db = file.read();
  return {
    ...common,
    screenings: new InMemoryScreeningRepository(db.screenings.map(toScreening)),
    bookings: new InMemoryBookingRepository(db.bookings.map(toBooking)),
  };
}
