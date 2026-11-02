import { describe, it, expect } from "vitest";
import {
  RESTAURANT_MENU_ITEMS,
  CATEGORY_ORDER,
  countMultiplier,
  PRESETS,
  type RestaurantMenuItemId,
} from "../../services/restaurantMenu";

describe("restaurantMenu", () => {
  it("has 15 items across 3 categories", () => {
    expect(RESTAURANT_MENU_ITEMS).toHaveLength(15);
    for (const c of CATEGORY_ORDER) {
      expect(RESTAURANT_MENU_ITEMS.filter(i => i.category === c).length).toBeGreaterThan(0);
    }
  });

  it("pins the documented base ratios", () => {
    const ratio = (id: string) => RESTAURANT_MENU_ITEMS.find(i => i.id === id)!.baseRatio;
    expect(ratio("milk")).toBe(288);
    expect(ratio("hamburger")).toBe(3.608);
    expect(ratio("cocktails")).toBe(4.04);
    expect(ratio("orange_juice")).toBe(144);
  });

  it("applies category count multipliers", () => {
    expect(countMultiplier(1)).toBe(2.1);
    expect(countMultiplier(2)).toBe(1);
    expect(countMultiplier(3)).toBe(0.7);
    expect(countMultiplier(4)).toBe(0.55);
    expect(countMultiplier(5)).toBe(0.55);
    expect(countMultiplier(0)).toBe(0);
  });

  it("presets are valid and include every category", () => {
    for (const mode of ["economy", "luxury"] as const) {
      const ids = PRESETS[mode].itemIds;
      for (const c of CATEGORY_ORDER) {
        expect(ids.some(id => RESTAURANT_MENU_ITEMS.find(i => i.id === id)?.category === c)).toBe(true);
      }
    }
  });
});