// Adapter entrant HTTP : traduit la requête en BookSeatsCommand et appelle le port BookSeats
import { Router } from "express";
import { BookSeats } from "../../../application/ports/in/BookSeats";

export function createBookingRouter(bookSeats: BookSeats): Router {
  const router = Router();

  // POST /screenings/:id/bookings : réserver des places
  // body : { email, seats, tariff: "NORMAL" | "STUDENT" }
  router.post("/screenings/:id/bookings", async (req, res, next) => {
    try {
      const booking = await bookSeats.execute({
        screeningId: req.params.id,
        email: req.body.email,
        seats: Number(req.body.seats),
        tariff: req.body.tariff,
      });
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
