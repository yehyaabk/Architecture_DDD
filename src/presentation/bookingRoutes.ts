// Couche présentation : routes HTTP des réservations
import { Router } from "express";
import { BookingService } from "../business/bookingService";

export const bookingRouter = Router();
const bookingService = new BookingService();

// POST /screenings/:id/bookings : réserver des places
// body : { email, seats, tariff: "NORMAL" | "STUDENT" }
bookingRouter.post("/screenings/:id/bookings", (req, res) => {
  const booking = bookingService.book(req.params.id, {
    email: req.body.email,
    seats: Number(req.body.seats),
    tariff: req.body.tariff,
  });
  res.status(201).json(booking);
});

// DELETE /bookings/:id : annuler (possible jusqu'à 2h avant la séance)
bookingRouter.delete("/bookings/:id", (req, res) => {
  res.json(bookingService.cancel(req.params.id));
});

// GET /bookings?email=... : mes réservations
bookingRouter.get("/bookings", (req, res) => {
  res.json(bookingService.listByEmail(req.query.email));
});
