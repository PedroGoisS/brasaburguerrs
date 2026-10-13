import { describe, expect, it } from "vitest";
import { calculateDelivery, defaultDelivery, validateDelivery, type DeliverySettings } from "@/lib/delivery";

const km: DeliverySettings = { ...defaultDelivery, perKm: 2, maxKm: 10 };
const ranges: DeliverySettings = { ...km, model: "ranges", ranges: [{ id: "a", from: 0, to: 3, price: 5 }, { id: "b", from: 3, to: 6, price: 8 }] };
describe("Delivery pricing", () => {
  it("multiplies the full km distance and rounds only the final fee", () => {
    expect(calculateDelivery(km, 5, "").fee).toBe(10);
    expect(calculateDelivery(km, 5.123, "").fee).toBe(10.25);
  });
  it("never charges pickup, even outside the service area", () => {
    expect(calculateDelivery(km, 100, "", true)).toMatchObject({ allowed: true, fee: 0 });
  });
  it("checks maximum distance without rounding away out-of-area addresses", () => {
    expect(calculateDelivery(km, 10, "").allowed).toBe(true);
    expect(calculateDelivery(km, 10.001, "").allowed).toBe(false);
  });
  it("matches normalized neighborhoods and rejects unsupported ones", () => {
    const config: DeliverySettings = { ...km, model: "neighborhood", neighborhoods: [{ id: "n", name: "Jardim América", price: 7 }] };
    expect(calculateDelivery(config, 2, " jardim america ").fee).toBe(7);
    expect(calculateDelivery(config, 2, "Centro").allowed).toBe(false);
    expect(calculateDelivery(config, 2, "").allowed).toBe(false);
  });
  it("handles adjacent ranges deterministically and includes final upper boundary", () => {
    expect(calculateDelivery(ranges, 2.999, "").fee).toBe(5);
    expect(calculateDelivery(ranges, 3, "").fee).toBe(8);
    expect(calculateDelivery(ranges, 6, "").fee).toBe(8);
    expect(calculateDelivery(ranges, 6.001, "").allowed).toBe(false);
  });
  it("rejects uncovered gaps, invalid distances and overlapping ranges", () => {
    expect(calculateDelivery({ ...ranges, ranges: [{ id: "a", from: 2, to: 3, price: 5 }] }, 1, "").allowed).toBe(false);
    expect(calculateDelivery(km, NaN, "").allowed).toBe(false);
    expect(calculateDelivery(km, -1, "").allowed).toBe(false);
    expect(validateDelivery({ ...ranges, ranges: [...ranges.ranges, { id: "c", from: 2, to: 4, price: 10 }] })).toBeTruthy();
  });
  it("requires active model entries and rejects duplicate districts and invalid values", () => {
    expect(validateDelivery({ ...km, model: "ranges" })).toBeTruthy();
    expect(validateDelivery({ ...km, model: "neighborhood" })).toBeTruthy();
    expect(validateDelivery({ ...km, perKm: -1 })).toBeTruthy();
    expect(validateDelivery({ ...km, neighborhoods: [{ id: "a", name: "América", price: 5 }, { id: "b", name: "america", price: 6 }] })).toBeTruthy();
  });
});