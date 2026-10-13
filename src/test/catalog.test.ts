import { describe, expect, it } from "vitest";
import { extrasFor, itemPrice, normalizeState, removeCategory, renameCategory, storeStatus, variantKey, type State, type Product, type Extra } from "@/lib/store";

const product: Product = { id: "p", name: "Burger", price: 20, category: "Hambúrgueres", description: "", available: true, images: [] };
const cheese: Extra = { id: "e", name: "Queijo", price: 2.5, categories: ["Hambúrgueres"], productIds: ["p"] };
const state: State = { categories: ["Hambúrgueres", "Bebidas"], extras: [cheese], products: [product], orders: [], settings: { name: "Test", logo: "", whatsapp: "", deliveryFee: 0, deliveryTime: "", minOrder: 0, areas: "", pickup: true, address: "", instagram: "", override: "open", specials: [], hours: Array.from({ length: 7 }, () => ({ closed: false, shifts: [{ open: "18:00", close: "23:00" }] })) } };

describe("Catalog and extras", () => {
  it("migrates old saved catalogs without dropping products", () => {
    const { categories: _categories, extras: _extras, ...old } = state;
    const migrated = normalizeState(old as State);
    expect(migrated.products).toEqual(state.products);
    expect(migrated.categories).toContain("Hambúrgueres");
    expect(migrated.extras).toEqual([]);
  });
  it("renames categories and preserves product and extra links", () => {
    const next = renameCategory(state, "Hambúrgueres", "Lanches");
    expect(next.products[0].category).toBe("Lanches");
    expect(next.extras[0].categories).toEqual(["Lanches"]);
  });
  it("moves products and removes category bindings on deletion", () => {
    const next = removeCategory(state, "Hambúrgueres", "Bebidas");
    expect(next.products[0].category).toBe("Bebidas");
    expect(next.extras[0].categories).toEqual([]);
  });
  it("applies product OR category scope without duplicating extras", () => {
    expect(extrasFor(product, [cheese])).toHaveLength(1);
    expect(extrasFor({ ...product, id: "other", category: "Bebidas" }, [cheese])).toEqual([]);
  });
  it("prices quantities and keeps distinct customizations separate", () => {
    const chosen = [{ ...cheese, qty: 2 }];
    expect(itemPrice(20, chosen) * 3).toBe(75);
    expect(variantKey("p", chosen)).not.toBe(variantKey("p", []));
    expect(variantKey("p", chosen)).toBe(variantKey("p", [{ ...cheese, qty: 2 }]));
  });
  it("follows Brasília hours at exact boundaries, ignoring old overrides", () => {
    expect(storeStatus(state.settings, new Date("2026-10-13T20:59:00Z")).open).toBe(false);
    expect(storeStatus({ ...state.settings, override: "closed" }, new Date("2026-10-13T21:00:00Z")).open).toBe(true);
    expect(storeStatus(state.settings, new Date("2026-10-14T02:00:00Z")).open).toBe(false);
    expect(storeStatus({ ...state.settings, specials: [{ id: "s", date: "2026-10-13", closed: true, shifts: [], note: "" }] }, new Date("2026-10-13T21:00:00Z")).open).toBe(false);
  });
});