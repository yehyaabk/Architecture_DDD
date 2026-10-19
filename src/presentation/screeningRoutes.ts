// Couche présentation : routes HTTP des séances
import { Router } from "express";
import { ScreeningService } from "../business/screeningService";

export const screeningRouter = Router();
const screeningService = new ScreeningService();

// GET /screenings : liste des séances à venir avec le nombre de places restantes
screeningRouter.get("/screenings", (req, res) => {
  res.json(screeningService.listUpcoming());
});
