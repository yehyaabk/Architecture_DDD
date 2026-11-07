// Adapter entrant HTTP : traduit les codes de DomainError en statuts HTTP
import { ErrorRequestHandler } from "express";
import { DomainError, DomainErrorCode } from "../../../domain/DomainError";

const HTTP_STATUS: Record<DomainErrorCode, number> = {
  NOT_FOUND: 404,
  INVALID: 400,
  CONFLICT: 409,
  PAYMENT_REFUSED: 402,
};

export const domainErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!(err instanceof DomainError)) {
    // erreur technique (JSON invalide, bug...) : gestionnaire par défaut d'Express
    return next(err);
  }
  res.status(HTTP_STATUS[err.code]).json({ error: err.message });
};
