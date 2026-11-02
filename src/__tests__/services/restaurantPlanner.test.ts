import { describe, it, expect } from "vitest";
import {
  seatsForMode,
  computeUnits,
  demandFromSaturation,
  phaseWeights,
  estimateOccupancy,
  resolveOccupancy,
  estimateRating,
  computeProfit,
  computeMenuMarket,
  optimizeMenu,
  type RestaurantPlannerInput,
  type RestaurantMarketInputs,
  type MenuUnitRow,
} from "../../services/restaurantPlanner";
import { RESTAURANT_MENU_ITEMS } from "../../services/restaurantMenu";

const baseMarket: RestaurantMarketInputs = {
  restaurantCount: 743,
  avgMarketRating: 7.49,
  avgMarketPrice: 150,
  restaurantsOwned: 0,
  phase: "recovery",
};

function baseInput(overrides: Partial<RestaurantPlannerInput> = {}): RestaurantPlannerInput {
  return {
    mode: "economy",
    level: 10,
    quality: 4,
    staff: "rookie",
    salesSpeedBonus: 0,
    cmoCommSkill: 0,
    mealPrice: 150,
    occupancyMode: "estimate",
    actualOccupancy: 0.6,
    targetRating: 7.5,
    adminOverheadPct: 0,
    selectedItemIds: [...RESTAURANT_MENU_ITEMS.map(i => i.id)],
    unitCosts: Object.fromEntries(RESTAURANT_MENU_ITEMS.map(i => [i.id, 10])),
    qualityPremiumPct: 1,
    actualRating: null,
    market: { ...baseMarket },
    ...overrides,
  };
}

describe("restaurantPlanner", () => {
  it("seatsForMode: economy 10 → 10000; luxury 10 → 5000; level 0 → 0", () => {
    expect(seatsForMode("economy", 10)).toBe(10000);
    expect(seatsForMode("luxury", 10)).toBe(5000);
    expect(seatsForMode("economy", 0)).toBe(0);
  });

  it("computeUnits Milk (288): level 10, catCount 2 → 2880 economy, 1440 luxury; catCount 1 → 6048; catCount 3 → 2016; catCount 5 → 1584", () => {
    const milk = RESTAURANT_MENU_ITEMS.find(i => i.id === "milk")!;
    expect(computeUnits(milk, "economy", 10, 2)).toBe(2880);
    expect(computeUnits(milk, "luxury", 10, 2)).toBe(1440);
    expect(computeUnits(milk, "economy", 10, 1)).toBe(6048);
    expect(computeUnits(milk, "economy", 10, 3)).toBe(2016);
    expect(computeUnits(milk, "economy", 10, 5)).toBe(1584);
  });

  it("demandFromSaturation: 0.1→0.95, 1→0.5, 1.5→0.25, 2→0, 3→0", () => {
    expect(demandFromSaturation(0.1)).toBeCloseTo(0.95, 2);
    expect(demandFromSaturation(1.0)).toBeCloseTo(0.5, 2);
    expect(demandFromSaturation(1.5)).toBeCloseTo(0.25, 2);
    expect(demandFromSaturation(2.0)).toBe(0);
    expect(demandFromSaturation(3.0)).toBe(0);
  });

  it("phaseWeights: recession → 1.40/0.70/0.85; EXPANSION → 0.90/1.10/1.05; null/unknown → 1/1/1", () => {
    expect(phaseWeights("recession")).toEqual({ priceWeight: 1.40, ratingWeight: 0.70, phaseFactor: 0.85 });
    expect(phaseWeights("EXPANSION")).toEqual({ priceWeight: 0.90, ratingWeight: 1.10, phaseFactor: 1.05 });
    expect(phaseWeights(null)).toEqual({ priceWeight: 1.00, ratingWeight: 1.00, phaseFactor: 1.00 });
    expect(phaseWeights("unknown")).toEqual({ priceWeight: 1.00, ratingWeight: 1.00, phaseFactor: 1.00 });
  });

  it("estimateOccupancy neutral market ≈ 0.6, competition 1, ownShare 0, supplyFactor 1", () => {
    const occ = estimateOccupancy({
      rating: 7.49,
      mealPrice: 150,
      seats: 10000,
      market: baseMarket,
    });
    expect(occ.occupancy).toBeCloseTo(0.6, 1);
    expect(occ.competition).toBe(1);
    expect(occ.ownShare).toBe(0);
    expect(occ.supplyFactor).toBe(1);
  });

  it("own supply: restaurantsOwned 1, seats 5000 → ownMealsPerDay 6000, occupancy < 0.6", () => {
    const occ = estimateOccupancy({
      rating: 7.49,
      mealPrice: 150,
      seats: 5000,
      market: { ...baseMarket, restaurantsOwned: 1 },
    });
    expect(occ.ownMealsPerDay).toBeCloseTo(6000, -1);
    expect(occ.occupancy).toBeLessThan(0.6);
    expect(occ.occupancy).toBeGreaterThan(0.59);
  });

  it("competition: restaurantCount 100 → competition 1.5; 4000 → < 1", () => {
    expect(estimateOccupancy({ rating: 7.49, mealPrice: 150, seats: 10000, market: { ...baseMarket, restaurantCount: 100 } }).competition).toBe(1.5);
    expect(estimateOccupancy({ rating: 7.49, mealPrice: 150, seats: 10000, market: { ...baseMarket, restaurantCount: 4000 } }).competition).toBeLessThan(1);
  });

  it("phase: recession occupancy < expansion at identical inputs", () => {
    const rec = estimateOccupancy({ rating: 7.49, mealPrice: 150, seats: 10000, market: { ...baseMarket, phase: "recession" } });
    const exp = estimateOccupancy({ rating: 7.49, mealPrice: 150, seats: 10000, market: { ...baseMarket, phase: "expansion" } });
    expect(rec.occupancy).toBeLessThan(exp.occupancy);
  });

  it("recession price sensitivity: -10% price > +10% rating for occupancy", () => {
    const base = estimateOccupancy({ rating: 7.49, mealPrice: 150, seats: 10000, market: { ...baseMarket, phase: "recession" } });
    const cheaper = estimateOccupancy({ rating: 7.49, mealPrice: 135, seats: 10000, market: { ...baseMarket, phase: "recession" } });
    const better = estimateOccupancy({ rating: 8.24, mealPrice: 150, seats: 10000, market: { ...baseMarket, phase: "recession" } });
    expect(cheaper.occupancy - base.occupancy).toBeGreaterThan(better.occupancy - base.occupancy);
  });

  it("estimateRating: quality 4, 6 items, zero food cost, sales 30, cmo 30, rookie, economy → 3.0; luxury → 4.5; professional adds 1.0 before luxury", () => {
    const input = baseInput({ quality: 4, selectedItemIds: ["milk", "coffee_powder", "samosa", "salad", "orange_juice", "apple_cider"], salesSpeedBonus: 30, cmoCommSkill: 30 });
    const rating = estimateRating(input, 0);
    expect(rating).toBeCloseTo(3.0, 1);
    const luxury = estimateRating({ ...input, mode: "luxury" }, 0);
    expect(luxury).toBeCloseTo(4.5, 1);
    const pro = estimateRating({ ...input, staff: "professional" }, 0);
    expect(pro - rating).toBeCloseTo(1.0, 1);
  });

  it("computeProfit: economy L1, occ 0.6, price 100, one milk at $10 (2880u, $28,800) → seats 1000, meals 600, rev 60000, wages 7866, profit 23334, break-even 0.36666, belowBreakEven false", () => {
    const milk = RESTAURANT_MENU_ITEMS.find(i => i.id === "milk")!;
    const rows: MenuUnitRow[] = [{ item: milk, units: 2880, unitCost: 10, lineCost: 28800 }];
    const input = baseInput({ level: 1, mealPrice: 100, selectedItemIds: ["milk"], unitCosts: { milk: 10 } });
    const profit = computeProfit(input, rows, 0.6);
    expect(profit.seats).toBe(1000);
    expect(profit.mealsServed).toBe(600);
    expect(profit.revenue).toBe(60000);
    expect(profit.wages).toBeCloseTo(7866, 0);
    expect(profit.profitPerCycle).toBeCloseTo(23334, 0);
    expect(profit.breakEvenOccupancy).toBeCloseTo(0.36666, 4);
    expect(profit.belowBreakEven).toBe(false);
  });

  it("luxury wages: level 10, professional → 196650; rookie → 39330", () => {
    const inputPro = baseInput({ mode: "luxury", level: 10, staff: "professional", selectedItemIds: ["milk"] });
    const inputRook = baseInput({ mode: "luxury", level: 10, staff: "rookie", selectedItemIds: ["milk"] });
    const rows: MenuUnitRow[] = [{ item: RESTAURANT_MENU_ITEMS.find(i => i.id === "milk")!, units: 1440, unitCost: 10, lineCost: 14400 }];
    expect(computeProfit(inputPro, rows, 0.6).wages).toBeCloseTo(196650, 0);
    expect(computeProfit(inputRook, rows, 0.6).wages).toBeCloseTo(39330, 0);
  });

  it("resolveOccupancy: Actual mode returns entered occupancy, Estimate returns model; entered 0.8 with 0.6 model → 0.8", () => {
    const input = baseInput({ occupancyMode: "actual", actualOccupancy: 0.8 });
    const { occupancy } = resolveOccupancy(input, 7.49);
    expect(occupancy).toBe(0.8);
    const estInput = baseInput({ occupancyMode: "estimate" });
    const { occupancy: occ2 } = resolveOccupancy(estInput, 7.49);
    expect(occ2).toBeLessThan(0.7);
  });

  it("computeMenuMarket with saturation 1.0, market 1000, own 100/day → ownShare≈0.0909, demand≈0.5, saturationAfter≈1.0909, demandAfter≈0.4545", () => {
    const milk = RESTAURANT_MENU_ITEMS.find(i => i.id === "milk")!;
    const rows: MenuUnitRow[] = [{ item: milk, units: 83, unitCost: 10, lineCost: 830 }]; // 83 * 2 * 1 * 0.6 ≈ 100
    const itemMarket: Record<string, { saturation: number | null; marketUnitsPerDay: number | null }> = {
      milk: { saturation: 1.0, marketUnitsPerDay: 1000 },
    };
    const market: RestaurantMarketInputs = { ...baseMarket, restaurantsOwned: 1 };
    const out = computeMenuMarket(rows, market, itemMarket, 0.6);
    expect(out[0].ownShare).toBeCloseTo(0.0909, 3);
    expect(out[0].demand).toBeCloseTo(0.5, 2);
    expect(out[0].saturationAfter).toBeCloseTo(1.0909, 3);
    expect(out[0].demandAfter).toBeCloseTo(0.4545, 3);
  });

  it("market volume 0/null → ownShare 0, no NaN", () => {
    const milk = RESTAURANT_MENU_ITEMS.find(i => i.id === "milk")!;
    const rows: MenuUnitRow[] = [{ item: milk, units: 2880, unitCost: 10, lineCost: 28800 }];
    const itemMarket = { milk: { saturation: 1.0, marketUnitsPerDay: 0 } };
    const out = computeMenuMarket(rows, { ...baseMarket, restaurantsOwned: 1 }, itemMarket, 0.6);
    expect(out[0].ownShare).toBe(0);
    expect(Number.isNaN(out[0].ownShare)).toBe(false);
  });

  it("missing saturation (null) → demand null, demandAfter null, ownShare based on market volume", () => {
    const milk = RESTAURANT_MENU_ITEMS.find(i => i.id === "milk")!;
    const rows: MenuUnitRow[] = [{ item: milk, units: 83, unitCost: 10, lineCost: 830 }];
    const itemMarket = { milk: { saturation: null, marketUnitsPerDay: 1000 } };
    const out = computeMenuMarket(rows, { ...baseMarket, restaurantsOwned: 1 }, itemMarket, 0.6);
    expect(out[0].demand).toBeNull();
    expect(out[0].demandAfter).toBeNull();
    expect(out[0].ownShare).toBeCloseTo(0.0909, 3);
  });
});