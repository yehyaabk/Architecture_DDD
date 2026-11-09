import { describe, expect, it } from "vitest";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { BookSeatsCommand } from "../src/application/ports/in/BookSeats";
import { BookingView } from "../src/application/ports/in/BookingView";
import { BookSeatsService } from "../src/application/usecases/BookSeatsService";
import { BookingConfirmed } from "../src/domain/booking/events";
import { Screening } from "../src/domain/booking/Screening";
import { SeatCount } from "../src/domain/booking/SeatCount";
import { Email } from "../src/domain/shared/Email";
import { Money } from "../src/domain/shared/Money";
import { busNotifying, ForcedPaymentGateway, FrozenClock, SequentialIdGenerator, SpyNotifier } from "./support/testAdapters";

const NOW = new Date("2026-06-01T12:00:00.000Z");
const CAPACITY = 10;

/** Séance s1 (10 places à 10 €), avec éventuellement des réservations déjà faites par un autre client. */
function screening(startsAt = new Date("2026-06-02T20:00:00.000Z"), alreadyBooked: number[] = []): Screening {
  const s = Screening.schedule({ id: "s1", movie: "Dune", room: "Salle 1", startsAt, capacity: CAPACITY, unitPrice: Money.euros(10) });
  alreadyBooked.forEach((seats, i) =>
    s.book({
      bookingId: `existing-${i}`,
      email: new Email("autre@example.com"),
      seats: new SeatCount(seats),
      tariff: "NORMAL",
      now: new Date("2026-05-01T10:00:00.000Z"),
    })
  );
  return s;
}

const COMMAND: BookSeatsCommand = {
  screeningId: "s1",
  email: "client@example.com",
  seats: 2,
  tariff: "NORMAL",
};

function setup(options: { screening?: Screening; paymentAccepted?: boolean } = {}) {
  const screenings = new InMemoryScreeningRepository([options.screening ?? screening()]);
  const payment = new ForcedPaymentGateway(options.paymentAccepted ?? true);
  const notifier = new SpyNotifier();
  const bus = busNotifying(notifier);
  const service = new BookSeatsService(screenings, payment, bus, new FrozenClock(NOW), new SequentialIdGenerator());
  return { service, screenings, payment, bus, notifier };
}

type Context = ReturnType<typeof setup>;

/** Une demande refusée ne doit laisser aucune trace : ni réservation, ni paiement, ni événement, ni e-mail. */
async function expectNoEffect({ screenings, payment, bus, notifier }: Context, takenSeats = 0) {
  const stored = (await screenings.findById("s1"))!;
  expect(stored.findBooking("b1")).toBeUndefined();
  expect(stored.remainingSeats()).toBe(CAPACITY - takenSeats);
  expect(payment.charges).toEqual([]);
  expect(bus.published).toEqual([]);
  expect(notifier.confirmations).toEqual([]);
}

describe("BookSeatsService", () => {
  it("réserve des places, calcule le prix (4 places étudiant = 2 520 centimes pour 10 €) et sauvegarde", async () => {
    const context = setup();

    const booking = await context.service.execute({ ...COMMAND, seats: 4, tariff: "STUDENT" });

    const expected: BookingView = {
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
    const stored = (await context.screenings.findById("s1"))!;
    expect(stored.findBooking("b1")?.toSnapshot()).toEqual(expected);
    expect(stored.remainingSeats()).toBe(6);
    expect(context.payment.charges).toEqual([{ email: "client@example.com", amount: 2520 }]);
  });

  it("publie BookingConfirmed, qui déclenche le mail de confirmation", async () => {
    const context = setup();

    await context.service.execute({ ...COMMAND, seats: 4, tariff: "STUDENT" });

    expect(context.bus.published).toHaveLength(1);
    const event = context.bus.published[0] as BookingConfirmed;
    expect(event).toBeInstanceOf(BookingConfirmed);
    expect(event.occurredAt).toEqual(NOW);
    const data = { bookingId: "b1", screeningId: "s1", movie: "Dune", email: "client@example.com", seats: 4, total: 2520 };
    expect(event.booking).toEqual(data);
    expect(context.notifier.confirmations).toEqual([data]);
  });

  it("publie les événements après la sauvegarde", async () => {
    const context = setup();
    let storedWhenPublished: boolean | undefined;
    context.bus.subscribe(BookingConfirmed.TYPE, async () => {
      storedWhenPublished = !!(await context.screenings.findById("s1"))!.findBooking("b1");
    });

    await context.service.execute(COMMAND);

    expect(storedWhenPublished).toBe(true);
  });

  it("refuse si la capacité de la salle est dépassée", async () => {
    const context = setup({ screening: screening(undefined, [6, 3]) });

    await expect(context.service.execute(COMMAND)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Plus assez de places",
    });

    await expectNoEffect(context, 9);
  });

  it("refuse une séance déjà commencée (code CONFLICT)", async () => {
    // cas limite : la séance commence à l'instant exact de la demande
    const context = setup({ screening: screening(NOW) });

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

  it("paiement refusé : rien n'est sauvegardé ni publié, aucun mail (code PAYMENT_REFUSED)", async () => {
    const context = setup({ paymentAccepted: false });

    await expect(context.service.execute(COMMAND)).rejects.toMatchObject({
      code: "PAYMENT_REFUSED",
      message: "Paiement refusé",
    });

    // le paiement a bien été demandé, avec le bon montant, mais l'agrégat modifié n'a pas été sauvegardé
    expect(context.payment.charges).toEqual([{ email: "client@example.com", amount: 2000 }]);
    const stored = (await context.screenings.findById("s1"))!;
    expect(stored.findBooking("b1")).toBeUndefined();
    expect(stored.remainingSeats()).toBe(CAPACITY);
    expect(context.bus.published).toEqual([]);
    expect(context.notifier.confirmations).toEqual([]);
  });
});
