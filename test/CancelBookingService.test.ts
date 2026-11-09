import { describe, expect, it } from "vitest";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { BookingView } from "../src/application/ports/in/BookingView";
import { CancelBookingService } from "../src/application/usecases/CancelBookingService";
import { BookingCancelled } from "../src/domain/booking/events";
import { Screening } from "../src/domain/booking/Screening";
import { SeatCount } from "../src/domain/booking/SeatCount";
import { Email } from "../src/domain/shared/Email";
import { Money } from "../src/domain/shared/Money";
import { busNotifying, FrozenClock, SpyNotifier } from "./support/testAdapters";

const NOW = new Date("2026-06-01T12:00:00.000Z");
const CREATED_AT = new Date("2026-05-01T10:00:00.000Z");
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const BOOKING: BookingView = {
  id: "b1",
  screeningId: "s1",
  email: "client@example.com",
  seats: 2,
  tariff: "NORMAL",
  total: 2000,
  status: "CONFIRMED",
  createdAt: CREATED_AT,
};

/** Séance qui commence `ms` millisecondes après NOW, avec la réservation b1 (déjà annulée si demandé). */
function screeningIn(ms: number, options: { cancelledAt?: Date } = {}): Screening {
  const s = Screening.schedule({
    id: "s1",
    movie: "Dune",
    room: "Salle 1",
    startsAt: new Date(NOW.getTime() + ms),
    capacity: 10,
    unitPrice: Money.euros(10),
  });
  s.book({ bookingId: "b1", email: new Email("client@example.com"), seats: new SeatCount(2), tariff: "NORMAL", now: CREATED_AT });
  if (options.cancelledAt) s.cancel("b1", options.cancelledAt);
  return s;
}

function setup(screening: Screening) {
  const screenings = new InMemoryScreeningRepository([screening]);
  const notifier = new SpyNotifier();
  const bus = busNotifying(notifier);
  const service = new CancelBookingService(screenings, bus, new FrozenClock(NOW));
  const stored = async () => (await screenings.findById("s1"))!;
  return { service, stored, bus, notifier };
}

describe("CancelBookingService", () => {
  it("annule la réservation, libère les places et sauvegarde", async () => {
    const { service, stored } = setup(screeningIn(24 * 60 * 60 * 1000));

    const cancelled = await service.execute("b1");

    const expected: BookingView = { ...BOOKING, status: "CANCELLED", cancelledAt: NOW };
    expect(cancelled).toEqual(expected);
    expect((await stored()).findBooking("b1")?.toSnapshot()).toEqual(expected);
    expect((await stored()).remainingSeats()).toBe(10);
  });

  it("publie BookingCancelled, qui déclenche le mail de remboursement", async () => {
    const { service, bus, notifier } = setup(screeningIn(24 * 60 * 60 * 1000));

    await service.execute("b1");

    expect(bus.published).toHaveLength(1);
    const event = bus.published[0] as BookingCancelled;
    expect(event).toBeInstanceOf(BookingCancelled);
    expect(event.occurredAt).toEqual(NOW);
    const data = { bookingId: "b1", screeningId: "s1", movie: "Dune", email: "client@example.com", seats: 2, total: 2000 };
    expect(event.booking).toEqual(data);
    expect(notifier.cancellations).toEqual([data]);
  });

  it("accepte l'annulation à exactement 2h de la séance", async () => {
    const { service, stored } = setup(screeningIn(TWO_HOURS_MS));

    await service.execute("b1");

    expect((await stored()).findBooking("b1")?.status).toBe("CANCELLED");
  });

  it("refuse l'annulation à 2h moins 1 milliseconde de la séance (code CONFLICT)", async () => {
    const { service, stored, bus, notifier } = setup(screeningIn(TWO_HOURS_MS - 1));

    await expect(service.execute("b1")).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Annulation impossible moins de 2h avant la séance",
    });

    expect((await stored()).findBooking("b1")?.toSnapshot()).toEqual(BOOKING);
    expect(bus.published).toEqual([]);
    expect(notifier.cancellations).toEqual([]);
  });

  it("refuse une réservation déjà annulée (code CONFLICT), même à moins de 2h", async () => {
    const firstCancel = new Date("2026-05-02T10:00:00.000Z");
    const { service, stored, bus, notifier } = setup(screeningIn(TWO_HOURS_MS - 1, { cancelledAt: firstCancel }));

    await expect(service.execute("b1")).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Déjà annulée",
    });

    expect((await stored()).findBooking("b1")?.toSnapshot()).toEqual({ ...BOOKING, status: "CANCELLED", cancelledAt: firstCancel });
    expect(bus.published).toEqual([]);
    expect(notifier.cancellations).toEqual([]);
  });

  it("refuse une réservation inconnue (code NOT_FOUND)", async () => {
    const { service, bus, notifier } = setup(screeningIn(24 * 60 * 60 * 1000));

    await expect(service.execute("inconnue")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Réservation introuvable",
    });

    expect(bus.published).toEqual([]);
    expect(notifier.cancellations).toEqual([]);
  });
});
