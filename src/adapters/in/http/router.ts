// Adapter entrant HTTP : traduit les requêtes en appels aux 4 use cases
import { Router } from "express";
import { BookSeats } from "../../../application/ports/in/BookSeats";
import { CancelBooking } from "../../../application/ports/in/CancelBooking";
import { ListMyBookings } from "../../../application/ports/in/ListMyBookings";
import { ListUpcomingScreenings } from "../../../application/ports/in/ListUpcomingScreenings";
import { asyncHandler } from "./asyncHandler";

export interface UseCases {
  bookSeats: BookSeats;
  cancelBooking: CancelBooking;
  listUpcomingScreenings: ListUpcomingScreenings;
  listMyBookings: ListMyBookings;
}

export function createRouter(useCases: UseCases): Router {
  const router = Router();

  // GET /screenings : liste des séances à venir avec le nombre de places restantes
  router.get(
    "/screenings",
    asyncHandler(async (req, res) => {
      const screenings = await useCases.listUpcomingScreenings.execute();
      // l'API expose le prix unitaire sous le nom "price", comme le legacy
      res.json(
        screenings.map((s) => ({
          id: s.id,
          movie: s.movie,
          room: s.room,
          startsAt: s.startsAt,
          price: s.unitPrice,
          remaining: s.remaining,
        }))
      );
    })
  );

  // POST /screenings/:id/bookings : réserver des places
  // body : { email, seats, tariff: "NORMAL" | "STUDENT" }
  router.post(
    "/screenings/:id/bookings",
    asyncHandler(async (req, res) => {
      const booking = await useCases.bookSeats.execute({
        screeningId: req.params.id,
        email: req.body.email,
        seats: Number(req.body.seats),
        tariff: req.body.tariff,
      });
      res.status(201).json(booking);
    })
  );

  // DELETE /bookings/:id : annuler (possible jusqu'à 2h avant la séance)
  router.delete(
    "/bookings/:id",
    asyncHandler(async (req, res) => {
      res.json(await useCases.cancelBooking.execute(req.params.id));
    })
  );

  // GET /bookings?email=... : mes réservations
  router.get(
    "/bookings",
    asyncHandler(async (req, res) => {
      res.json(await useCases.listMyBookings.execute(req.query.email as string));
    })
  );

  return router;
}
