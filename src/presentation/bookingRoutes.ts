// Couche présentation : routes HTTP des réservations
// (POST /screenings/:id/bookings est passé en hexagonal : adapters/in/http/bookingRouter.ts)
import { Router } from "express";
import { BookingService } from "../business/bookingService";

export const bookingRouter = Router();
const bookingService = new BookingService();

// DELETE /bookings/:id : annuler (possible jusqu'à 2h avant la séance)
bookingRouter.delete("/bookings/:id", (req, res) => {
  res.json(bookingService.cancel(req.params.id));
});

// GET /bookings?email=... : mes réservations
bookingRouter.get("/bookings", (req, res) => {
  res.json(bookingService.listByEmail(req.query.email));
});
