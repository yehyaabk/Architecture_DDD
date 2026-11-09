// Value object : une adresse e-mail normalisée (minuscules, sans espaces) et valide
import { DomainError } from "./DomainError";

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export class Email {
  readonly value: string;

  constructor(raw: string) {
    const normalized = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!EMAIL_PATTERN.test(normalized)) throw new DomainError("INVALID", "Email invalide");
    this.value = normalized;
    Object.freeze(this);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
