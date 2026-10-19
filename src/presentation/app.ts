// Couche présentation : assemblage de l'application Express
import express from "express";
import { bookingRouter } from "./bookingRoutes";
import { errorHandler } from "./errorHandler";
import { screeningRouter } from "./screeningRoutes";

const app = express();
app.use(express.json());
app.use(screeningRouter);
app.use(bookingRouter);
app.use(errorHandler);

export default app;
