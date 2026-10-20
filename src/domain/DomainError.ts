// Domaine : erreur métier. Le code est traduit en statut HTTP par l'adapter entrant.
export type DomainErrorCode = "NOT_FOUND" | "INVALID" | "CONFLICT" | "PAYMENT_REFUSED";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string
  ) {
    super(message);
  }
}
