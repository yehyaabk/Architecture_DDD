// Couche métier : erreurs métier, sans aucune notion de HTTP.
// Leur traduction en codes de statut est faite dans presentation/errorHandler.ts.

export class BusinessError extends Error {}

/** L'élément demandé (séance, réservation) n'existe pas. */
export class NotFoundError extends BusinessError {}

/** La demande est mal formée (e-mail, nombre de places). */
export class ValidationError extends BusinessError {}

/** La demande est bien formée mais enfreint une règle métier. */
export class BusinessRuleError extends BusinessError {}

/** Le prestataire de paiement a refusé la transaction. */
export class PaymentRefusedError extends BusinessError {}
