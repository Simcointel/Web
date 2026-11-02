/**
 * Restaurant Planner Calculations
 * Pure functions — no React, no fetching
 */

import type { RestaurantMenuItem, RestaurantMenuItemId, RestaurantMode } from "./restaurantMenu";

export interface RestaurantMarketInputs {
  restaurantCount: number;
  avgMarketRating: number;
  avgMarketPrice: number;
  restaurantsOwned: number;
  phase: string | null;
}

export interface RestaurantPlannerInput {
  mode: RestaurantMode;
  level: number;
  quality: number;
  staff: "rookie" | "professional";
  salesSpeedBonus: number;
  cmoCommSkill: number;
  mealPrice: number;
  occupancyMode: "estimate" | "actual";
  actualOccupancy: number;
  targetRating: number;
  adminOverheadPct: number;
  selectedItemIds: RestaurantMenuItemId[];
  unitCosts: Record<string, number>;
  qualityPremiumPct: number;
  actualRating: number | null;
  market: RestaurantMarketInputs;
}

export interface MenuUnitRow {
  item: RestaurantMenuItem;
  units: number;
  unitCost: number;
  lineCost: number;
}

export interface OccupancyBreakdown {
  occupancy: number;
  baseOccupancy: number;
  competition: number;
  phaseFactor: number;
  ownShare: number;
  supplyFactor: number;
  marketMealsPerDay: number;
  ownMealsPerDay: number;
}

export function seatsForMode(mode: RestaurantMode, level: number): number {
  const seatsPerLevel = mode === "economy" ? 1000 : 500;
  const safeLevel = Math.max(0, Number.isFinite(level) ? Math.floor(level) : 0);
  return seatsPerLevel * safeLevel;
}

export function computeUnits(
  item: RestaurantMenuItem,
  mode: RestaurantMode,
  level: number,
  categoryCount: number
): number {
  const safeLevel = Math.max(1, Number.isFinite(level) ? Math.floor(level) : 1);
  const foodFactor = mode === "luxury" ? 0.5 : 1.0;
  const mult = countMultiplier(categoryCount);
  const raw = item.baseRatio * safeLevel * mult * foodFactor;
  // Use Math.round for exact game behavior; ceil was off by 1 for some combos
  return Math.round(raw);
}

// countMultiplier is imported from restaurantMenu; re-export not needed here

export function computeMenuRows(input: RestaurantPlannerInput): MenuUnitRow[] {
  const categoryCounts: Record<string, number> = {};
  for (const id of input.selectedItemIds) {
    const item = ITEM_BY_ID.get(id);
    if (item) {
      categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;
    }
  }

  const rows: MenuUnitRow[] = [];
  for (const id of input.selectedItemIds) {
    const item = ITEM_BY_ID.get(id);
    if (!item) continue;
    const catCount = categoryCounts[item.category] ?? 1;
    const units = computeUnits(item, input.mode, input.level, catCount);
    const unitCost = input.unitCosts[id] ?? 0;
    rows.push({ item, units, unitCost, lineCost: units * unitCost });
  }
  return rows;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function demandFromSaturation(saturation: number): number {
  const s = safeNumber(saturation);
  return clamp(1 - s / 2, 0, 1);
}

export function phaseWeights(phase: string | null): { priceWeight: number; ratingWeight: number; phaseFactor: number } {
  const p = (phase ?? "").toLowerCase();
  switch (p) {
    case "expansion":
      return { priceWeight: 0.90, ratingWeight: 1.10, phaseFactor: 1.05 };
    case "recovery":
      return { priceWeight: 1.00, ratingWeight: 1.00, phaseFactor: 1.00 };
    case "stagnation":
      return { priceWeight: 1.10, ratingWeight: 0.90, phaseFactor: 0.95 };
    case "contraction":
      return { priceWeight: 1.25, ratingWeight: 0.80, phaseFactor: 0.90 };
    case "recession":
      return { priceWeight: 1.40, ratingWeight: 0.70, phaseFactor: 0.85 };
    case "overheating":
      return { priceWeight: 0.95, ratingWeight: 1.05, phaseFactor: 1.02 };
    case "speculative":
      return { priceWeight: 1.00, ratingWeight: 1.00, phaseFactor: 1.00 };
    default:
      return { priceWeight: 1.00, ratingWeight: 1.00, phaseFactor: 1.00 };
  }
}

export function estimateOccupancy(input: {
  rating: number;
  mealPrice: number;
  seats: number;
  market: RestaurantMarketInputs;
}): OccupancyBreakdown {
  const { priceWeight, ratingWeight, phaseFactor } = phaseWeights(input.market.phase);

  const rating = Math.max(0, safeNumber(input.rating));
  const price = Math.max(60, Math.min(350, safeNumber(input.mealPrice)));
  const avgRating = Math.max(0.1, safeNumber(input.market.avgMarketRating, 7.49));
  const avgPrice = Math.max(1, safeNumber(input.market.avgMarketPrice, 150));
  const restaurantCount = Math.max(1, Math.floor(safeNumber(input.market.restaurantCount, 743)));
  const restaurantsOwned = Math.max(0, Math.floor(safeNumber(input.market.restaurantsOwned, 0)));
  const seats = Math.max(0, safeNumber(input.seats));

  const offer = Math.pow(rating, ratingWeight) / Math.pow(price, priceWeight);
  const marketOffer = Math.pow(avgRating, ratingWeight) / Math.pow(avgPrice, priceWeight);
  const baseOccupancy = 0.6 * Math.pow(offer / marketOffer, 0.8);

  const competition = clamp(Math.sqrt(743 / restaurantCount), 0.5, 1.5);

  const avgSeats = 7500;
  const marketMealsPerDay = restaurantCount * avgSeats * 0.6 * 2;
  const ownMealsPerDay = restaurantsOwned * seats * baseOccupancy * 2;
  const ownShare = marketMealsPerDay > 0 ? ownMealsPerDay / (marketMealsPerDay + ownMealsPerDay) : 0;
  const supplyFactor = 1 / (1 + ownShare);

  const occupancy = clamp(baseOccupancy * competition * phaseFactor * supplyFactor, 0.03, 0.95);

  return { occupancy, baseOccupancy, competition, phaseFactor, ownShare, supplyFactor, marketMealsPerDay, ownMealsPerDay };
}

export function resolveOccupancy(
  input: RestaurantPlannerInput,
  currentRating: number
): { occupancy: number; breakdown: OccupancyBreakdown } {
  const seats = seatsForMode(input.mode, input.level);
  const breakdown = estimateOccupancy({
    rating: currentRating,
    mealPrice: input.mealPrice,
    seats,
    market: input.market,
  });
  const occupancy = input.occupancyMode === "actual" ? clamp(input.actualOccupancy, 0.03, 0.95) : breakdown.occupancy;
  return { occupancy, breakdown };
}

export function estimateRating(input: RestaurantPlannerInput, foodCost?: number): number {
  const qualityScore = 0.45 * clamp(input.quality, 0, 12);
  const itemCount = input.selectedItemIds.length;
  const varietyBonus = Math.min(1.0, 0.1 * Math.max(0, itemCount - 3));
  const costPerSeat = foodCost && foodCost > 0 ? foodCost / seatsForMode(input.mode, input.level) : 0;
  const costScore = Math.min(1.0, 0.5 * Math.log2(1 + costPerSeat / 100));
  const salesScore = 0.02 * Math.max(0, safeNumber(input.salesSpeedBonus));
  const cmoScore = 0.01 * Math.max(0, safeNumber(input.cmoCommSkill));
  const staffBonus = input.staff === "professional" ? 1.0 : 0;

  let rating = qualityScore + varietyBonus + costScore + salesScore + cmoScore + staffBonus;
  if (input.mode === "luxury") rating *= 1.5;
  return rating;
}

export interface ProfitResult {
  seats: number;
  occupancy: number;
  mealsServed: number;
  revenue: number;
  foodCost: number;
  wages: number;
  overhead: number;
  profitPerCycle: number;
  profitPerDay: number;
  breakEvenOccupancy: number;
  belowBreakEven: boolean;
}

export function computeProfit(input: RestaurantPlannerInput, rows: MenuUnitRow[], occupancy: number): ProfitResult {
  const seats = seatsForMode(input.mode, input.level);
  const mealsServed = seats * occupancy;
  const price = clamp(input.mealPrice, 60, 350);
  const revenue = mealsServed * price;

  const foodCost = rows.reduce((sum, row) => sum + row.lineCost, 0);
  const wageFactor = input.mode === "luxury" ? 0.5 : 1.0;
  const staffFactor = input.staff === "professional" ? 5.0 : 1.0;
  const wages = 655.5 * 12 * input.level * wageFactor * staffFactor;
  const overhead = wages * (input.adminOverheadPct / 100);

  const profitPerCycle = revenue - foodCost - wages - overhead;
  const profitPerDay = profitPerCycle * 2;

  const breakEvenOccupancy = seats > 0 && price > 0 ? (foodCost + wages + overhead) / (seats * price) : 0;
  const belowBreakEven = occupancy < breakEvenOccupancy;

  return {
    seats,
    occupancy,
    mealsServed,
    revenue,
    foodCost,
    wages,
    overhead,
    profitPerCycle,
    profitPerDay,
    breakEvenOccupancy: clamp(breakEvenOccupancy, 0, 1),
    belowBreakEven,
  };
}

export interface ItemMarketInput {
  saturation: number | null;
  marketUnitsPerDay: number | null;
}

export interface ItemMarketRow {
  itemId: RestaurantMenuItemId;
  name: string;
  saturation: number | null;
  demand: number | null;
  marketUnitsPerDay: number | null;
  ownUnitsPerDay: number;
  ownShare: number;
  saturationAfter: number | null;
  demandAfter: number | null;
}

export function computeMenuMarket(
  rows: MenuUnitRow[],
  market: RestaurantMarketInputs,
  data: Record<string, ItemMarketInput>,
  occupancy: number
): ItemMarketRow[] {
  const restaurantsOwned = Math.max(0, Math.floor(safeNumber(market.restaurantsOwned, 0)));
  const out: ItemMarketRow[] = [];

  for (const row of rows) {
    const item = row.item;
    const d = data[item.id] ?? { saturation: null, marketUnitsPerDay: null };
    const saturation = d.saturation;
    const marketUnits = safeNumber(d.marketUnitsPerDay);
    const ownUnitsPerDay = row.units * 2 * restaurantsOwned * occupancy;
    const ownShare = marketUnits > 0 ? ownUnitsPerDay / (marketUnits + ownUnitsPerDay) : 0;

    const demand = saturation !== null ? demandFromSaturation(saturation) : null;
    const saturationAfter = saturation !== null ? saturation * (1 + ownShare) : null;
    const demandAfter = saturationAfter !== null ? demandFromSaturation(saturationAfter) : null;

    out.push({
      itemId: item.id,
      name: item.name,
      saturation,
      demand,
      marketUnitsPerDay: marketUnits > 0 ? marketUnits : null,
      ownUnitsPerDay,
      ownShare,
      saturationAfter,
      demandAfter,
    });
  }
  return out;
}

export interface MenuCandidate {
  itemIds: RestaurantMenuItemId[];
  rating: number;
  foodCost: number;
  profitPerCycle: number;
}

export interface OptimizerResult {
  best: MenuCandidate | null;
  alternatives: MenuCandidate[];
  targetReachable: boolean;
  excludedItemIds: RestaurantMenuItemId[];
}

function subsetsOfCategory(items: RestaurantMenuItem[], category: string): RestaurantMenuItem[][] {
  const catItems = items.filter(i => i.category === category);
  const n = catItems.length;
  const result: RestaurantMenuItem[][] = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset: RestaurantMenuItem[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(catItems[i]);
    }
    result.push(subset);
  }
  return result;
}

export function optimizeMenu(
  input: RestaurantPlannerInput,
  currentRows: MenuUnitRow[],
  currentOccupancy: number
): OptimizerResult {
  const allItems = RESTAURANT_MENU_ITEMS;
  const selectedSet = new Set(input.selectedItemIds);

  // Determine which items have usable costs
  const pricedItemIds = new Set<RestaurantMenuItemId>();
  for (const item of allItems) {
    const cost = input.unitCosts[item.id] ?? 0;
    if (Number.isFinite(cost) && cost > 0) pricedItemIds.add(item.id);
  }
  const excludedItemIds: RestaurantMenuItemId[] = [];
  for (const item of allItems) {
    if (!pricedItemIds.has(item.id)) excludedItemIds.push(item.id);
  }

  // Need at least one priced item per category to run optimizer
  const hasSalad = allItems.some(i => i.category === "salad" && pricedItemIds.has(i.id));
  const hasMain = allItems.some(i => i.category === "main" && pricedItemIds.has(i.id));
  const hasDrink = allItems.some(i => i.category === "drink" && pricedItemIds.has(i.id));

  if (!hasSalad || !hasMain || !hasDrink) {
    return { best: null, alternatives: [], targetReachable: false, excludedItemIds };
  }

  // Build candidate menus
  const saladSubsets = subsetsOfCategory(allItems, "salad");
  const mainSubsets = subsetsOfCategory(allItems, "main");
  const drinkSubsets = subsetsOfCategory(allItems, "drink");

  const candidates: MenuCandidate[] = [];
  const targetRating = safeNumber(input.targetRating, 7.5);

  // Precompute unit costs and category counts for efficiency
  const unitCostMap = new Map(Object.entries(input.unitCosts) as [string, number][]);
  const categoryCounts = new Map<string, number>();
  for (const id of input.selectedItemIds) {
    const item = ITEM_BY_ID.get(id);
    if (item) categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  }

  // For each candidate, we need to know its category counts
  for (const salad of saladSubsets) {
    if (!salad.some(i => pricedItemIds.has(i.id))) continue;
    for (const main of mainSubsets) {
      if (!main.some(i => pricedItemIds.has(i.id))) continue;
      for (const drink of drinkSubsets) {
        if (!drink.some(i => pricedItemIds.has(i.id))) continue;

        const itemIds = [...salad, ...main, ...drink].map(i => i.id) as RestaurantMenuItemId[];
        const catCounts = { salad: salad.length, main: main.length, drink: drink.length };

        // Build rows for this candidate
        const rows: MenuUnitRow[] = [];
        let foodCost = 0;
        for (const item of [...salad, ...main, ...drink]) {
          const units = computeUnits(item, input.mode, input.level, catCounts[item.category] ?? 1);
          const unitCost = (unitCostMap.get(item.id) ?? 0) as number;
          const lineCost = units * unitCost;
          foodCost += lineCost;
          rows.push({ item, units, unitCost, lineCost });
        }

        // Rating with calibration offset
        const rawRating = estimateRating({ ...input, selectedItemIds: itemIds, unitCosts: {} }, foodCost);
        const calibratedRating = input.actualRating !== null
          ? rawRating + (input.actualRating - estimateRating(input, currentRows.reduce((s, r) => s + r.lineCost, 0)))
          : rawRating;

        if (calibratedRating < targetRating) continue;

        const profitResult = computeProfit({ ...input, selectedItemIds: itemIds }, rows, currentOccupancy);
        candidates.push({ itemIds, rating: calibratedRating, foodCost, profitPerCycle: profitResult.profitPerCycle });
      }
    }
  }

  if (candidates.length === 0) {
    // Return highest-rated candidates even if below target
    // Re-run without target filter
    for (const salad of saladSubsets) {
      if (!salad.some(i => pricedItemIds.has(i.id))) continue;
      for (const main of mainSubsets) {
        if (!main.some(i => pricedItemIds.has(i.id))) continue;
        for (const drink of drinkSubsets) {
          if (!drink.some(i => pricedItemIds.has(i.id))) continue;

          const itemIds = [...salad, ...main, ...drink].map(i => i.id) as RestaurantMenuItemId[];
          const catCounts = { salad: salad.length, main: main.length, drink: drink.length };

          const rows: MenuUnitRow[] = [];
          let foodCost = 0;
          for (const item of [...salad, ...main, ...drink]) {
            const units = computeUnits(item, input.mode, input.level, catCounts[item.category] ?? 1);
            const unitCost = (unitCostMap.get(item.id) ?? 0) as number;
            foodCost += units * unitCost;
            rows.push({ item, units, unitCost, lineCost: units * unitCost });
          }

          const rawRating = estimateRating({ ...input, selectedItemIds: itemIds, unitCosts: {} }, foodCost);
          const calibratedRating = input.actualRating !== null
            ? rawRating + (input.actualRating - estimateRating(input, currentRows.reduce((s, r) => s + r.lineCost, 0)))
            : rawRating;

          const profitResult = computeProfit({ ...input, selectedItemIds: itemIds }, rows, currentOccupancy);
          candidates.push({ itemIds, rating: calibratedRating, foodCost, profitPerCycle: profitResult.profitPerCycle });
        }
      }
    }
    candidates.sort((a, b) => b.rating - a.rating);
    return {
      best: candidates[0] ?? null,
      alternatives: candidates.slice(1, 5),
      targetReachable: false,
      excludedItemIds,
    };
  }

  candidates.sort((a, b) => b.profitPerCycle - a.profitPerCycle);
  return {
    best: candidates[0] ?? null,
    alternatives: candidates.slice(1, 5),
    targetReachable: true,
    excludedItemIds,
  };
}

import { RESTAURANT_MENU_ITEMS, countMultiplier } from "./restaurantMenu";
export { countMultiplier };

const ITEM_BY_ID = new Map(RESTAURANT_MENU_ITEMS.map(item => [item.id, item]));