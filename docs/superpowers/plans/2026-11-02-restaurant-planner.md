# Restaurant Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dedicated `/restaurant` planner with a market-driven occupancy estimate, an auto-computed best menu, and an Economy/Luxury switch.

**Architecture:** Pure calculation modules (`restaurantMenu.ts`, `restaurantPlanner.ts`) hold every game rule and formula; a small loader (`restaurantMarketData.ts`) joins Data-repo sources; `RestaurantPlanner.tsx` is presentation and state only. The optimizer enumerates the 29,295 valid menus and ranks by per-cycle profit.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-02-restaurant-planner-design.md`

## Global Constraints

- Economy: 1000 seats/level, wage ×1.0, food ×1.0. Luxury: 500 seats/level, wage ×0.5, food ×0.5, rating ×1.5.
- 12-hour cycle, 2 cycles/day. Menu food is consumed or spoiled per cycle; COGS does not scale with occupancy.
- Menu price clamps to $60–$350. Occupancy clamps to 3%–95%.
- At least one item from each category (`salad`, `main`, `drink`) in every valid menu.
- `demand = clamp(1 − saturation / 2, 0, 1)`.
- Occupancy uses the **current** rating (actual override or current-menu estimate), not each candidate's rating.
- Never crash on missing/malformed market data; every source has a neutral fallback.
- No backend change is required for the planner, but the snapshot job fix is in scope because the user asked for it.
- Tests live in `src/__tests__/services/`; run with `npm test`. Type check with `npm run lint`. Build with `npm run build`.
- Copy says "estimated" wherever the game formula is unknown; never present estimates as exact.

## Review Focus

- A missing `retail.json`, phase, or snapshot must leave the page usable with neutral occupancy and no fake volume.
- The snapshot may contain only `dbLetter 150`; the loader must ignore it, not treat it as menu data.
- `Actual` occupancy must bypass the model entirely (one source of truth for revenue).
- Unpriced ingredients must never make a menu look profitable; the optimizer excludes them.
- Mode switches and market-input edits must not silently replace the user's selected menu.
- An unreachable target must still return the highest-rated menus with a warning.
- Zero market volume must produce `ownShare = 0`, never `NaN` or `Infinity`.
- Menu edits must recompute food cost, rating, and the optimizer without changing occupancy.

---

### Task 1: Menu model

**Files:**
- Create: `src/services/restaurantMenu.ts`
- Test: `src/__tests__/services/restaurantMenu.test.ts`

**Interfaces:**
- Produces:
  - `type RestaurantCategory = "salad" | "main" | "drink"`
  - `type RestaurantMode = "economy" | "luxury"`
  - `type RestaurantMenuItemId` — union of the 15 ids below.
  - `interface RestaurantMenuItem { id: RestaurantMenuItemId; name: string; category: RestaurantCategory; baseRatio: number; resourceId: number; dataRepoName: string }`
  - `CATEGORY_ORDER: RestaurantCategory[]`, `CATEGORY_LABELS: Record<RestaurantCategory, string>`
  - `countMultiplier(count: number): number`
  - `RESTAURANT_MENU_ITEMS: RestaurantMenuItem[]`
  - `PRESETS: Record<RestaurantMode, { label: string; itemIds: RestaurantMenuItemId[] }>`

- [ ] **Step 1: Write the failing test**

`src/__tests__/services/restaurantMenu.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  RESTAURANT_MENU_ITEMS, CATEGORY_ORDER, countMultiplier, PRESETS,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- restaurantMenu`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/services/restaurantMenu.ts`**

Items with exact `{ id, name, category, baseRatio, resourceId, dataRepoName }`:

| id | name | category | baseRatio | resourceId |
|---|---|---|---|---:|
| milk | Milk | salad | 288 | 117 |
| bread | Bread | salad | 24.89 | 121 |
| butter | Butter | salad | 92.6 | 134 |
| cheese | Cheese | salad | 38.196 | 122 |
| coffee_powder | Coffee powder | salad | 96.312 | 119 |
| apple_pie | Apple pie | main | 16.667 | 123 |
| hamburger | Hamburger | main | 3.608 | 129 |
| lasagna | Lasagna | main | 4.073 | 130 |
| meat_balls | Meat balls | main | 3.505 | 131 |
| salad | Salad | main | 9.402 | 142 |
| samosa | Samosa | main | 10.093 | 143 |
| cocktails | Cocktails | drink | 4.04 | 132 |
| orange_juice | Orange juice | drink | 144 | 124 |
| apple_cider | Apple cider | drink | 128.955 | 125 |
| ginger_beer | Ginger beer | drink | 113.984 | 126 |

`countMultiplier`: 1→2.1, 2→1, 3→0.7, ≥4→0.55 (0→0).

Presets:
- economy label `"Economy 223"`: milk, coffee_powder / samosa, salad / orange_juice, apple_cider, ginger_beer.
- luxury label `"Luxury 544"`: milk, coffee_powder, butter, cheese, bread / samosa, salad, apple_pie, hamburger / apple_cider, orange_juice, ginger_beer, cocktails.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- restaurantMenu`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/restaurantMenu.ts src/__tests__/services/restaurantMenu.test.ts
git commit -m "feat(restaurant): add menu model"
```

---

### Task 2: Core planner math

**Files:**
- Create: `src/services/restaurantPlanner.ts`
- Test: `src/__tests__/services/restaurantPlanner.test.ts`

**Interfaces:**
- Consumes: `RestaurantMenuItem`, `RestaurantMenuItemId`, `RestaurantMode`.
- Produces:
  - `interface RestaurantMarketInputs { restaurantCount: number; avgMarketRating: number; avgMarketPrice: number; restaurantsOwned: number; phase: string | null }`
  - `interface RestaurantPlannerInput` — `mode`, `level`, `quality`, `staff: "rookie" | "professional"`, `salesSpeedBonus`, `cmoCommSkill`, `mealPrice`, `occupancyMode: "estimate" | "actual"`, `actualOccupancy`, `targetRating`, `adminOverheadPct`, `selectedItemIds: RestaurantMenuItemId[]`, `unitCosts: Record<string, number>`, `qualityPremiumPct`, `actualRating: number | null`, `market: RestaurantMarketInputs`.
  - `interface MenuUnitRow { item: RestaurantMenuItem; units: number; unitCost: number; lineCost: number }`
  - `seatsForMode(mode: RestaurantMode, level: number): number`
  - `computeUnits(item: RestaurantMenuItem, mode: RestaurantMode, level: number, categoryCount: number): number`
  - `computeMenuRows(input: RestaurantPlannerInput): MenuUnitRow[]`
  - `demandFromSaturation(saturation: number): number`
  - `phaseWeights(phase: string | null): { priceWeight: number; ratingWeight: number; phaseFactor: number }`
  - `interface OccupancyInput { rating: number; mealPrice: number; seats: number; market: RestaurantMarketInputs }`
  - `interface OccupancyBreakdown { occupancy: number; baseOccupancy: number; competition: number; phaseFactor: number; ownShare: number; supplyFactor: number; marketMealsPerDay: number; ownMealsPerDay: number }`
  - `estimateOccupancy(input: OccupancyInput): OccupancyBreakdown`
  - `estimateRating(input: RestaurantPlannerInput, foodCost?: number): number` (raw, uncalibrated)
  - `resolveOccupancy(input: RestaurantPlannerInput, currentRating: number): { occupancy: number; breakdown: OccupancyBreakdown }` — returns `actualOccupancy` in Actual mode, otherwise the estimate.
  - `interface ProfitResult { seats: number; occupancy: number; mealsServed: number; revenue: number; foodCost: number; wages: number; overhead: number; profitPerCycle: number; profitPerDay: number; breakEvenOccupancy: number; belowBreakEven: boolean }`
  - `computeProfit(input: RestaurantPlannerInput, rows: MenuUnitRow[], occupancy: number): ProfitResult`

- [ ] **Step 1: Write the failing tests**

`src/__tests__/services/restaurantPlanner.test.ts` — helpers `baseInput(overrides)` with `mode: "economy"`, `level: 10`, `quality: 4`, rookie, sales 0, cmo 0, price 150, estimate mode, actualOccupancy 0.6, target 7.5, overhead 0, all 15 selected, all costs 10, premium 1, actualRating null, market `{ restaurantCount: 743, avgMarketRating: 7.49, avgMarketPrice: 150, restaurantsOwned: 0, phase: "recovery" }`.

Tests and exact assertions:

1. `seatsForMode`: economy 10 → 10,000; luxury 10 → 5,000; level 0 → 0.
2. `computeUnits` Milk (288): level 10, categoryCount 2 → 2880 economy, 1440 luxury. categoryCount 1 → 6048. categoryCount 3 → 2016. categoryCount 5 → 1584.
3. `demandFromSaturation`: 0.1→0.95, 1→0.5, 1.5→0.25, 2→0, 3→0.
4. `phaseWeights`: `"recession"` → 1.40/0.70/0.85; `"EXPANSION"` → 0.90/1.10/1.05; `null`/`"unknown"` → 1/1/1.
5. `estimateOccupancy` neutral market (`rating 7.49`, `price 150`, market 7.49/150, count 743, owned 0, recovery): `occupancy` ≈ 0.6, `competition` 1, `ownShare` 0, `supplyFactor` 1.
6. Own supply: `restaurantsOwned: 1`, seats 5000 → `ownMealsPerDay` 6000, `marketMealsPerDay` 6,687,000, occupancy < 0.6 and > 0.59.
7. Competition: `restaurantCount: 100` → `competition` 1.5; `restaurantCount: 4000` → < 1.
8. Phase: recession occupancy < expansion occupancy at identical inputs.
9. Recession price sensitivity: lowering price 10% raises occupancy more than raising rating 10%.
10. `estimateRating`: quality 4, 6 items, zero food cost, sales 30, cmo 30, rookie, economy → 3.0; luxury → 4.5; professional adds 1.0 before the luxury multiplier.
11. `computeProfit`: economy level 1, occupancy 0.6, price 100, one milk row at $10 (2880 units, $28,800 cost): seats 1000, meals 600, revenue 60,000, wages 7,866, profit 23,334, break-even (28800+7866)/100000 = 0.36666. `belowBreakEven` false at 0.6.
12. Luxury wages: level 10, luxury, professional → 196,650; rookie luxury → 39,330.
13. `resolveOccupancy`: Actual mode returns the entered occupancy and the estimate breakdown; Estimate mode returns the model occupancy. Entered 0.8 with a 0.6 model → `occupancy === 0.8`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- restaurantPlanner`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the functions**

Formulas (copy values from the spec):

```
units = ceil(baseRatio × level × countMultiplier(categoryCount) × (luxury ? 0.5 : 1))
unitCost = costMap[item.id] ?? 0   // already includes quality premium upstream
wages = 655.5 × 12 × level × (luxury ? 0.5 : 1) × (professional ? 5 : 1)
overhead = wages × adminOverheadPct / 100
breakEven = (foodCost + wages + overhead) / (seats × price)
occupancy = clamp(base × competition × phaseFactor × supplyFactor, 0.03, 0.95)
base = 0.60 × ((rating^ratingWeight / price^priceWeight) /
               (avgRating^ratingWeight / avgPrice^priceWeight))^0.8
competition = clamp(sqrt(743 / restaurantCount), 0.5, 1.5)
marketMealsPerDay = restaurantCount × 7500 × 0.60 × 2
ownMealsPerDay = restaurantsOwned × seats × baseOccupancy × 2
ownShare = ownMealsPerDay / (marketMealsPerDay + ownMealsPerDay)
supplyFactor = 1 / (1 + ownShare)
rating = 0.45×quality + min(1, 0.1×(itemCount−3)) + min(1, 0.5×log2(1+foodCostPerSeat/100))
         + 0.02×salesSpeedBonus + 0.01×cmoCommSkill + (professional ? 1 : 0)
if luxury: rating ×= 1.5
```

Guard every input with `Number.isFinite` clamps: level ≥ 1, quality 0–12, price 60–350, restaurant count ≥ 1, market rating/price > 0, restaurants owned ≥ 0, target rating 0–10, sales/CMO ≥ 0. Return 0 profit, not `NaN`, when seats or price are 0.

`computeMenuRows` returns one row per selected item (dedupe ids, ignore unknown), using the category count among selected items.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- restaurantPlanner`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/restaurantPlanner.ts src/__tests__/services/restaurantPlanner.test.ts
git commit -m "feat(restaurant): add planner calculations"
```

---

### Task 3: Market panel and optimizer

**Files:**
- Modify: `src/services/restaurantPlanner.ts`
- Test: `src/__tests__/services/restaurantPlanner.test.ts`

**Interfaces:**
- Produces:
  - `interface ItemMarketInput { saturation: number | null; marketUnitsPerDay: number | null }`
  - `interface ItemMarketRow { itemId: RestaurantMenuItemId; name: string; saturation: number | null; demand: number | null; marketUnitsPerDay: number | null; ownUnitsPerDay: number; ownShare: number; saturationAfter: number | null; demandAfter: number | null }`
  - `computeMenuMarket(rows: MenuUnitRow[], market: RestaurantMarketInputs, data: Record<string, ItemMarketInput>, occupancy: number): ItemMarketRow[]`
  - `interface MenuCandidate { itemIds: RestaurantMenuItemId[]; rating: number; foodCost: number; profitPerCycle: number }`
  - `interface OptimizerResult { best: MenuCandidate | null; alternatives: MenuCandidate[]; targetReachable: boolean; excludedItemIds: RestaurantMenuItemId[] }`
  - `optimizeMenu(input: RestaurantPlannerInput, rows: MenuUnitRow[], occupancy: number): OptimizerResult`

- [ ] **Step 1: Write failing tests**

Add to `restaurantPlanner.test.ts`:

1. `computeMenuMarket` with saturation 1.0, market volume 1000, own units 100/day → `ownShare ≈ 0.0909`, `demand ≈ 0.5`, `saturationAfter ≈ 1.0909`, `demandAfter ≈ 0.4545`.
2. Market volume `0`/`null` → `ownShare === 0`, `saturationAfter === saturation`, no `NaN`.
3. Missing saturation (`null`) → `demand === null`, `demandAfter === null`, `ownShare === 0`.
4. `optimizeMenu` with every item costing $10 and target 0 → best contains exactly `bread`, `meat_balls`, `cocktails` (the lowest-units item in each category); `targetReachable === true`; at most 5 candidates; alternatives ranked by non-increasing profit.
5. Unpriced `bread` in the cost map → best never contains `bread`; `excludedItemIds` includes `bread`.
6. Target 100 → `targetReachable === false`, `best !== null`, alternatives non-empty.
7. No usable costs at all → `best === null`, `excludedItemIds` has all 15.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- restaurantPlanner`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement**

- `computeMenuMarket`: `ownUnitsPerDay = units × 2 × restaurantsOwned × occupancy`; market volume > 0 → share; else 0. `saturationAfter = saturation × (1 + ownShare)`; demands via `demandFromSaturation`.
- `optimizeMenu`: enumerate non-empty subsets of each category (5/6/4 items). Build a full input per candidate with `selectedItemIds`, compute rows, foodCost, raw rating; apply `offset = actualRating − estimateRating(currentInput)` when `actualRating !== null`; keep candidates with `rating >= targetRating`; rank by `computeProfit(...).profitPerCycle`; return top 5. If none meet the target, rank by rating and return top 5 with `targetReachable: false`. Exclude any candidate containing an item whose cost is not a positive finite number. Skip the whole enumeration when fewer than 3 priced items exist (one per category) and return `best: null`.
- Keep the enumeration under ~30k iterations: precompute per-item units/cost once per category count, not per candidate.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- restaurantPlanner`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/restaurantPlanner.ts src/__tests__/services/restaurantPlanner.test.ts
git commit -m "feat(restaurant): add market panel and best-menu optimizer"
```

---

### Task 4: Market data loader and old-service guard

**Files:**
- Create: `src/services/restaurantMarketData.ts`
- Modify: `src/services/restaurantRetailInfo.ts:74`
- Test: `src/__tests__/services/restaurantMarketData.test.ts`

**Interfaces:**
- Consumes: `fetchProfitMargins`, `fetchRetailData`, `fetchMacroPhases` from `dataRepo.ts`; `getRestaurantRetailInfo` from `restaurantRetailInfo.ts`; `RESTAURANT_MENU_ITEMS` from `restaurantMenu.ts`.
- Produces:
  - `interface RestaurantMarketData { vwapByName: Map<string, number>; resourceIdByName: Map<string, number>; saturationByResourceId: Map<number, number>; marketVolumeByResourceId: Map<number, number>; phase: string | null; pricesLoadedAt: string | null; retailLoadedAt: string | null; sources: { margins: boolean; retail: boolean; phase: boolean; snapshot: boolean } }`
  - `normalizeMarketData(...): RestaurantMarketData` (pure, testable)
  - `loadRestaurantMarketData(): Promise<RestaurantMarketData>`
  - `qualityPremiumCost(vwap: number, quality: number, premiumPct: number): number`

- [ ] **Step 1: Write failing test**

Test `normalizeMarketData` with plain inputs:
1. Margins rows `[{ id: 117, name: "Milk", outputVwap: 7.31 }]` → map entries, `sources.margins true`.
2. Retail `{ retail: { "117": { saturation: 1.2 } } }` → `saturationByResourceId.get(117) === 1.2`.
3. Snapshot rows: one `{ dbLetter: 117, quality: 0, retailData: [{ date: "2026-11-01", amountSoldRestaurant: 1000 }] }` plus one stale `{ dbLetter: 117, retailData: [{ date: "2026-10-01", amountSoldRestaurant: 5 }] }` → latest volume 1000 (not 1005).
4. Snapshot with only `dbLetter 150` → `marketVolumeByResourceId.size === 0`, `sources.snapshot false`.
5. Snapshot `data` missing/not an array → no throw, `sources.snapshot false`.
6. `qualityPremiumCost(10, 4, 1)` ≈ `10.406`.

Mock the dataRepo module with `vi.mock` for `loadRestaurantMarketData`; assert it resolves when all four fetches reject (all sources false, empty maps).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- restaurantMarketData`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

- `loadRestaurantMarketData` uses `Promise.allSettled` for the four calls and never rejects.
- Margins: map `outputVwap` only when `> 0` and finite.
- Retail saturation: key by numeric resource id; ignore non-finite values.
- Snapshot: filter entries whose `dbLetter` is a menu item id; for each, take the latest `retailData` point **per quality row**, then sum across quality rows for that resource. Ignore rows with no non-empty `retailData`. A snapshot with no matching menu ids sets `sources.snapshot = false`.
- Phase: `currentPhase` when non-empty.
- Fix `restaurantRetailInfo.ts`: `const normalizedData = Array.isArray(snapshot?.data) ? [...snapshot.data].sort((a, b) => a.quality - b.quality) : [];`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- restaurantMarketData`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/restaurantMarketData.ts src/services/restaurantRetailInfo.ts src/__tests__/services/restaurantMarketData.test.ts
git commit -m "feat(restaurant): load market data safely"
```

---

### Task 5: Page, route, nav, title

**Files:**
- Create: `src/pages/RestaurantPlanner.tsx`
- Modify: `src/App.tsx`, `src/components/Sidebar.tsx`, `src/hooks/usePageTitle.ts`, `src/components/MobileNav.tsx` (only if it already has a tools list; do not redesign it)

**Interfaces:**
- Consumes every function from Tasks 1–4.
- Produces: `export function RestaurantPlannerPage()`.

- [ ] **Step 1: Build the page**

State: one `RestaurantPlannerInput` object plus `marketData` loaded via `useEffect`/`loadRestaurantMarketData`, `loading`, and `error`. Memoize `rows`, `occupancyBreakdown`, `ratingRaw`, `ratingCalibrated`, `profit`, `marketRows`, `optimizer`.

Required sections in order (design details delegated to the designer; use existing `card`/`PageHeader`/`NumberInput` conventions and lucide icons):

1. Header + Economy/Luxury segmented control and mode summary (seats, meals/cycle, wage factor, phase, occupancy).
2. Best Menu hero: target vs calibrated rating, occupancy used, food cost, profit/cycle, Apply, top alternatives, warnings for unreachable target or below-break-even.
3. Setup card: level, quality 0–12, staff, sales speed bonus, CMO skill, menu price, target rating, admin overhead, actual rating override.
4. Market conditions: Estimate/Actual switch, actual occupancy, restaurant count, average rating, average price, restaurants owned, read-only phase, breakdown line, data-source note.
5. Results strip: occupancy used, seats, meals, revenue, food cost, wages, profit/cycle, profit/day, break-even.
6. Menu builder: 3 category columns; checkbox, units/cycle, editable unit cost, line cost, demand badge; category multiplier/total; spoilage warning.
7. Menu market table (collapsible): saturation, demand, market units/day, own units/day, own share, demand after.
8. Assumptions/data panel: cycle, spoilage, load times, price label "Prices loaded at …", estimate disclaimers, guide link, PvP warning.

Behavior rules:
- Apply is the only action that changes `selectedItemIds` (plus manual checkboxes and preset chips).
- Mode switch keeps item ids and inputs; recomputes everything.
- Actual occupancy mode uses `actualOccupancy` for revenue/profit and shows the estimate as reference.
- Unit-cost edits write to `unitCosts`; "reset to market" clears the override.
- Missing price rows show a warning and $0 with an "incomplete cost" label.
- Clamp displayed inputs but never fight the user while typing; clamp on blur.

- [ ] **Step 2: Wire route/nav/title**

- `App.tsx`: `const RestaurantPlannerPage = lazy(() => import("./pages/RestaurantPlanner").then(m => ({ default: m.RestaurantPlannerPage })));` and `path === "/restaurant" ? <RestaurantPlannerPage />`.
- `Sidebar.tsx`: TOOLS entry `{ to: "/restaurant", label: "Restaurant", icon: <Utensils size={18} /> }` (import `Utensils`).
- `usePageTitle.ts`: `restaurantPlanner: 'Restaurant Planner'`.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`. Open `/restaurant`. Change mode, price, restaurant count, occupancy mode; confirm occupancy/profit update, Apply changes the menu, and no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/RestaurantPlanner.tsx src/App.tsx src/components/Sidebar.tsx src/hooks/usePageTitle.ts
git commit -m "feat(restaurant): add restaurant planner page"
```

---

### Task 6: Remove restaurant from Retail Mechanics

**Files:**
- Modify: `src/pages/RetailMechanics.tsx`

- [ ] **Step 1: Remove**

- Delete the restaurant building option and every restaurant-only branch, state, import, helper, card, and copy block (`RestaurantRatingCard`, `getRestaurantRetailInfo` usage, `calculateRestaurantMenu`, `RESTAURANT_MENU_ITEMS`, restaurant comparison columns).
- Keep the other building types and all non-restaurant behavior unchanged.
- Add a small link card near the top: "Restaurant planning moved to the Restaurant Planner" with a `<Link to="/restaurant">` CTA. Do not duplicate calculations.

- [ ] **Step 2: Verify**

Run: `npm run lint` and `npm test`. Open `/retail-mechanics`: no restaurant option, link works, other modes still calculate.
Expected: no TypeScript errors; existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/RetailMechanics.tsx
git commit -m "refactor(retail): move restaurant planning to its own page"
```

---

### Task 7: Backend snapshot fix

**Files:**
- Modify: `Backend/src/jobs/restaurantRetailInfo.ts:28-57`

- [ ] **Step 1: Fix the request and normalization**

- Request `https://www.simcompanies.com/api/v4/1/resources-retail-info/?dbLetter=117` (the query unlocks the full resource list; any value works).
- Keep only entries whose `dbLetter` is one of the 15 menu resource ids (`117,119,121,122,123,124,125,126,129,130,131,132,134,142,143`).
- Normalize `quality: typeof item.quality === "number" ? item.quality : 0`; keep `averagePrice`, `saturation`, `retailData`.
- Log the resource count, not "quality levels"; keep the existing snapshot shape and path.
- Do not change the Web fallback; it must still work if this job has not run yet.

- [ ] **Step 2: Verify**

Run: `cd C:\Users\nanda\All\Sites\Backend` then `npm run lint` (or `npx tsc --noEmit` if no lint script) and `npm test` if a restaurant job test exists. If the backend can run locally, trigger the `restaurant-sync` admin action and confirm the snapshot contains the 15 resource ids. Otherwise verify with a direct API call and note it.

- [ ] **Step 3: Commit and push**

```bash
git add src/jobs/restaurantRetailInfo.ts
git commit -m "fix(restaurant): fetch full resource retail snapshot"
git push
```

---

### Task 8: Final verification

- [ ] **Step 1: Run the gate**

Web: `npm run lint`, `npm test`, `npm run build`. Backend: `npx tsc --noEmit`.
Expected: all pass. Fix any failure in the owning task, not by weakening a test.

- [ ] **Step 2: Manual check**

`/restaurant` loads with no console errors. Mode switch, market edits, occupancy mode, Apply, preset chips, and manual menu edits all behave per the behavior rules. `/retail-mechanics` no longer offers restaurant and links out.

- [ ] **Step 3: Commit remaining work**

```bash
git status --short
git add src docs
git commit -m "chore(restaurant): finalize planner"
```

Do not commit `tsconfig.tsbuildinfo` or `node_modules/.vite` artifacts.
