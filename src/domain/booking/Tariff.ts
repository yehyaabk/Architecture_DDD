// Domaine : les tarifs proposés
export type Tariff = "NORMAL" | "STUDENT";

/** Tout tarif autre que STUDENT est traité comme NORMAL (comportement legacy). */
export function toTariff(value: unknown): Tariff {
  return value === "STUDENT" ? "STUDENT" : "NORMAL";
}
