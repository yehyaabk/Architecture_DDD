// Adapter entrant HTTP : transmet les erreurs d'une route asynchrone au gestionnaire d'erreurs,
// pour ne pas répéter le try/catch dans chaque route
import { Request, RequestHandler, Response } from "express";

export function asyncHandler(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}
