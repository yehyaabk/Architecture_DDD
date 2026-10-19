// Couche présentation : seul endroit où les erreurs métier deviennent des codes HTTP
import { ErrorRequestHandler } from "express";
import {
  BusinessError,
  BusinessRuleError,
  NotFoundError,
  PaymentRefusedError,
  ValidationError,
} from "../business/errors";

function statusOf(err: BusinessError): number {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ValidationError) return 400;
  if (err instanceof BusinessRuleError) return 409;
  if (err instanceof PaymentRefusedError) return 402;
  return 500;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!(err instanceof BusinessError)) {
    // erreur technique (JSON invalide, bug...) : gestionnaire par défaut d'Express
    return next(err);
  }
  res.status(statusOf(err)).json({ error: err.message });
};
