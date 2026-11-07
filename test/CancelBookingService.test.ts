import { describe, expect, it } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { CancelBookingService } from "../src/application/usecases/CancelBookingService";
import { Booking } from "../src/domain/Booking";
import { Screening } from "../src/domain/Screening";
import { FrozenClock, SpyNotifier } from "./support/testAdapters";

const NOW = new Date("2026-06-01T12:00:00.000Z");
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/** Séance qui commence `ms` millisecondes après NOW. */
function screeningIn(ms: number): Screening {
  return {
    id: "s1",
    movie: "Dune",
    room: "Salle 1",
    startsAt: new Date(NOW.getTime() + ms),
    capacity: 10,
    unitPrice: 1000,
  };
}

const BOOKING: Booking = {
  id: "b1",
  screeningId: "s1",
  email: "client@example.com",
  seats: 2,
  tariff: "NORMAL",
  total: 2000,
  status: "CONFIRMED",
  createdAt: new Date("2026-05-01T10:00:00.000Z"),
};

function setup(screening: Screening, booking: Booking = BOOKING) {
  const bookings = new InMemoryBookingRepository([booking]);
  const notifier = new SpyNotifier();
  const service = new CancelBookingService(
    bookings,
    new InMemoryScreeningRepository([screening]),
    notifier,
    new FrozenClock(NOW)
  );
  return { service, bookings, notifier };
}

describe("CancelBookingService", () => {
  it("annule la réservation, l'enregistre et notifie le client", async () => {
    const { service, bookings, notifier } = setup(screeningIn(24 * 60 * 60 * 1000));

    const cancelled = await service.execute("b1");

    const expected: Booking = { ...BOOKING, status: "CANCELLED", cancelledAt: NOW };
    expect(cancelled).toEqual(expected);
    expect(await bookings.findById("b1")).toEqual(expected);
    expect(notifier.cancellations).toEqual([expected]);
  });

  it("accepte l'annulation à exactement 2h de la séance", async () => {
    const { service, bookings } = setup(screeningIn(TWO_HOURS_MS));

    await service.execute("b1");

    expect((await bookings.findById("b1"))?.status).toBe("CANCELLED");
  });

  it("refuse l'annulation à 2h moins 1 milliseconde de la séance (code CONFLICT)", async () => {
    const { service, bookings, notifier } = setup(screeningIn(TWO_HOURS_MS - 1));

    await expect(service.execute("b1")).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Annulation impossible moins de 2h avant la séance",
    });

    expect(await bookings.findById("b1")).toEqual(BOOKING);
    expect(notifier.cancellations).toEqual([]);
  });

  it("refuse une réservation déjà annulée (code CONFLICT)", async () => {
    const alreadyCancelled: Booking = { ...BOOKING, status: "CANCELLED", cancelledAt: new Date("2026-05-02T10:00:00.000Z") };
    const { service, bookings, notifier } = setup(screeningIn(24 * 60 * 60 * 1000), alreadyCancelled);

    await expect(service.execute("b1")).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Déjà annulée",
    });

    expect(await bookings.findById("b1")).toEqual(alreadyCancelled);
    expect(notifier.cancellations).toEqual([]);
  });

  it("refuse une réservation inconnue (code NOT_FOUND)", async () => {
    const { service, notifier } = setup(screeningIn(24 * 60 * 60 * 1000));

    await expect(service.execute("inconnue")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Réservation introuvable",
    });

    expect(notifier.cancellations).toEqual([]);
  });
});
