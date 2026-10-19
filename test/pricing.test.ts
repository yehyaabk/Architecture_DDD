import { describe, expect, it } from "vitest";
import { computeTotalPrice } from "../src/business/pricing";

describe("computeTotalPrice", () => {
  it("tarif normal : prix unitaire × nombre de places", () => {
    expect(computeTotalPrice(1150, 1, "NORMAL")).toBe(1150);
    expect(computeTotalPrice(1150, 2, "NORMAL")).toBe(2300);
  });

  it("tarif étudiant : -30 % sur le prix unitaire", () => {
    expect(computeTotalPrice(1000, 1, "STUDENT")).toBe(700);
    expect(computeTotalPrice(1150, 3, "STUDENT")).toBe(2415);
  });

  it("tarif étudiant : le prix unitaire est arrondi au centime avant multiplication", () => {
    // 999 × 0.7 = 699.3 → 699, puis × 3
    expect(computeTotalPrice(999, 3, "STUDENT")).toBe(2097);
  });

  it("pas de remise groupe à 3 places", () => {
    expect(computeTotalPrice(1000, 3, "NORMAL")).toBe(3000);
  });

  it("remise groupe -10 % dès 4 places", () => {
    expect(computeTotalPrice(1150, 4, "NORMAL")).toBe(4140);
    expect(computeTotalPrice(1000, 6, "NORMAL")).toBe(5400);
  });

  it("remise groupe : le total est arrondi au centime", () => {
    // 1001 × 4 = 4004 → × 0.9 = 3603.6 → 3604
    expect(computeTotalPrice(1001, 4, "NORMAL")).toBe(3604);
  });

  it("cumul tarif étudiant et remise groupe", () => {
    // 1050 × 0.7 = 735 ; 735 × 4 = 2940 ; × 0.9 = 2646
    expect(computeTotalPrice(1050, 4, "STUDENT")).toBe(2646);
  });
});
