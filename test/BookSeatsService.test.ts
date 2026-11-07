import { describe, expect, it } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { BookSeatsCommand } from "../src/application/ports/in/BookSeats";
import { BookSeatsService } from "../src/application/usecases/BookSeatsService";
import { Booking } from "../src/domain/Booking";
import { Screening } from "../src/domain/Screening";
import { ForcedPaymentGateway, FrozenClock, SequentialIdGenerator, SpyNotifier } from "./support/testAdapters";

const NOW = new Date("2026-06-01T12:00:00.000Z");

const SCREENING: Screening = {
  id: "s1",
  movie: "Dune",
  room: "Salle 1",
  startsAt: new Date("2026-06-02T20:00:00.000Z"),
  capacity: 10,
  unitPrice: 1000,
};

const COMMAND: BookSeatsCommand = {
  screeningId: "s1",
  email: "client@example.com",
  seats: 2,
  tariff: "NORMAL",
};

function existingBooking(seats: number): Booking {
  return {
    id: "existing",
    screeningId: "s1",
    email: "autre@example.com",
    seats,
    tariff: "NORMAL",
    total: seats * 1000,
    status: "CONFIRMED",
    createdAt: new Date("2026-05-01T10:00:00.000Z"),
  };
}

function setup(options: { screening?: Screening; bookings?: Booking[]; paymentAccepted?: boolean } = {}) {
  const bookings = new InMemoryBookingRepository(options.bookings ?? []);
  const payment = new ForcedPaymentGateway(options.paymentAccepted ?? true);
  const notifier = new SpyNotifier();
  const service = new BookSeatsService(
    new InMemoryScreeningRepository([options.screening ?? SCREENING]),
    bookings,
    payment,
    notifier,
    new FrozenClock(NOW),
    new SequentialIdGenerator()
  );
  return { service, bookings, payment, notifier };
}

type Context = ReturnType<typeof setup>;

/** Une demande refusée ne doit laisser aucune trace : ni réservation, ni paiement, ni notification. */
async function expectNoEffect({ bookings, payment, notifier }: Context, alreadyBooked: Booking[] = []) {
  expect(await bookings.findByScreeningId("s1")).toEqual(alreadyBooked);
  expect(payment.charges).toEqual([]);
  expect(notifier.confirmations).toEqual([]);
}

describe("BookSeatsService", () => {
  it("réserve des places, calcule le prix (4 places étudiant = 2 520 centimes pour 10 €) et notifie le client", async () => {
    const context = setup();

    const booking = await context.service.execute({ ...COMMAND, seats: 4, tariff: "STUDENT" });

    const expected: Booking = {
      id: "b1",
      screeningId: "s1",
      email: "client@example.com",
      seats: 4,
      tariff: "STUDENT",
      total: 2520,
      status: "CONFIRMED",
      createdAt: NOW,
    };
    expect(booking).toEqual(expected);
    expect(await context.bookings.findByScreeningId("s1")).toEqual([expected]);
    expect(context.payment.charges).toEqual([{ email: "client@example.com", amount: 2520 }]);
    expect(context.notifier.confirmations).toEqual([{ booking: expected, screening: SCREENING }]);
  });

  it("refuse si la capacité de la salle est dépassée", async () => {
    const alreadyBooked = [existingBooking(9)];
    const context = setup({ bookings: alreadyBooked });

    await expect(context.service.execute(COMMAND)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Plus assez de places",
    });

    await expectNoEffect(context, alreadyBooked);
  });

  it("refuse une séance déjà commencée (code CONFLICT)", async () => {
    // cas limite : la séance commence à l'instant exact de la demande
    const context = setup({ screening: { ...SCREENING, startsAt: NOW } });

    await expect(context.service.execute(COMMAND)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "La séance a déjà commencé",
    });

    await expectNoEffect(context);
  });

  it("refuse plus de 6 places (code INVALID)", async () => {
    const context = setup();

    await expect(context.service.execute({ ...COMMAND, seats: 7 })).rejects.toMatchObject({
      code: "INVALID",
      message: "Entre 1 et 6 places par réservation",
    });

    await expectNoEffect(context);
  });

  it("refuse un email invalide (code INVALID)", async () => {
    const context = setup();

    await expect(context.service.execute({ ...COMMAND, email: "pas-un-email" })).rejects.toMatchObject({
      code: "INVALID",
      message: "Email invalide",
    });

    await expectNoEffect(context);
  });

  it("refuse une séance inconnue (code NOT_FOUND)", async () => {
    const context = setup();

    await expect(context.service.execute({ ...COMMAND, screeningId: "inconnue" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Séance introuvable",
    });

    await expectNoEffect(context);
  });

  it("n'enregistre rien et ne notifie pas si le paiement est refusé (code PAYMENT_REFUSED)", async () => {
    const context = setup({ paymentAccepted: false });

    await expect(context.service.execute(COMMAND)).rejects.toMatchObject({
      code: "PAYMENT_REFUSED",
      message: "Paiement refusé",
    });

    // le paiement a bien été demandé, avec le bon montant, mais rien d'autre n'a suivi
    expect(context.payment.charges).toEqual([{ email: "client@example.com", amount: 2000 }]);
    expect(await context.bookings.findByScreeningId("s1")).toEqual([]);
    expect(context.notifier.confirmations).toEqual([]);
  });
});
