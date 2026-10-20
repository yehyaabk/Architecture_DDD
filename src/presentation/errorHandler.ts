// Couche présentation : seul endroit où les erreurs métier du TP1 deviennent des codes HTTP
// (les DomainError du cœur hexagonal sont traduites par adapters/in/http/domainErrorHandler.ts)
import { ErrorRequestHandler } from "express";
import { BusinessError, BusinessRuleError, NotFoundError } from "../business/errors";

function statusOf(err: BusinessError): number {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof BusinessRuleError) return 409;
  return 500;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!(err instanceof BusinessError)) {
    // erreur technique (JSON invalide, bug...) : gestionnaire par défaut d'Express
    return next(err);
  }
  res.status(statusOf(err)).json({ error: err.message });
};
