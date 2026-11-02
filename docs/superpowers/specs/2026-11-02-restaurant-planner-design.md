# Restaurant Planner — Design

- Date: 2026-11-02
- Status: Draft, awaiting approval
- Scope: Web (`C:\Users\nanda\All\Sites\Web`)

## Intent

Replace the restaurant panel inside Retail Mechanics with a dedicated restaurant
planner. The page models the real SimCompanies restaurant loop: 12-hour cycles,
seating capacity, category-based menus, per-cycle food consumption, spoilage,
wages, meal price, occupancy, and the Economy/Luxury seating split. It shows an
auto-computed "best menu" for the selected mode and lets the user switch modes
without losing their work.

The user asked for a "real one which shows the menu for best" and "people need
to be able to switch to economy and luxury".

## Why now

- The existing restaurant panel uses the wrong menu categories
  (`food` / `beverage` / `dessert`), includes an item that is not a restaurant
  menu item (pumpkin soup), and models price as `contractPrice × rating`, which
  is not a game mechanic.
- It does not model seats, per-cycle consumption, spoilage, or the fact that
  Luxury restaurants have half the seats, half the wages, and roughly half the
  food requirement of Economy.
- The restaurant data snapshot now exists, but the Web reader crashes with
  `snapshot.data.sort` when the snapshot is missing or malformed.
- The user wants an actionable menu/cost tool, not a warning panel bolted onto
  a different calculator.

## Current state

- `src/pages/RetailMechanics.tsx` contains a restaurant mode inside a generic
  retail calculator. The restaurant branch adds a warning card, a rating card,
  an API-data card, a static item list, and a synthetic "menu calculator".
- It imports `getRestaurantRetailInfo`, `calculateRestaurantMenu`, and
  `RESTAURANT_MENU_ITEMS` from `src/services/restaurantRetailInfo.ts`.
- `src/services/restaurantRetailInfo.ts` fetches the latest snapshot from
  `SimcoIntel/Data` and calls `snapshot.data.sort(...)` without a guard.
- `src/services/dataRepo.ts` already exposes `fetchProfitMargins(realm)`, which
  returns each resource's `name` and `outputVwap` (VWAP). This is the live
  ingredient price source for the new page.
- The backend `restaurantRetailInfo.ts` job collects
  `/api/v4/1/resources-retail-info/`; its values are not used by this planner.
  No backend change is required.

## Goals

1. Dedicated `/restaurant` page with a prominent Economy/Luxury switch.
2. Real menu model: 3 categories, 15 items, per-cycle consumption ratios,
   count multipliers, luxury food factor, and spoilage.
3. Auto-computed best menu first, with manual editing still possible.
4. Economy vs Luxury differences applied everywhere: seats, wages, food units,
   rating multiplier.
5. Profit per cycle and per day, cost breakdown, and break-even occupancy.
6. Ingredient costs from live Data repo VWAP, with manual override.
7. Remove restaurant from Retail Mechanics and link to the new page.
8. No new dependencies, no backend changes, works when market data is missing.

## Non-goals

- Predicting exact rating or occupancy. The game does not publish those formulas
  and they include randomness. The page estimates, labels the estimate, and lets
  the user override it with their in-game rating.
- Simulating other players' restaurants or city-level competition.
- Multi-restaurant portfolio comparison in v1.
- Seasonal menu items (Ramadan sweets, Easter Bunny).
- Changing the backend sync job or the Data repo schema.

## Anti-goals

- Promising guaranteed profit. Restaurants are PvP; the page must say profit is
  only realized when the restaurant out-competes others.
- Fabricated precision. Every derived number is either a game rule, a live data
  value, or an explicitly labeled estimate.
- Another restaurant panel hidden inside a different calculator.

## Constraints

- Static Web app deployed to GitHub Pages. No server-side rendering.
- Data comes from `raw.githubusercontent.com/SimcoIntel/Data/main` via
  `fetchProfitMargins(0)`.
- Menu price is limited to $60–$350 per meal.
- Must reuse existing UI conventions: `card`, `PageHeader`, `NumberInput`
  patterns, lucide icons, Tailwind theme tokens.
- Must not crash when `margins.json` or restaurant snapshots are missing.

## Approaches considered

### Structure

- **A. Dedicated page + Economy/Luxury switch (chosen).** New `/restaurant`
  route, sidebar entry, and a mode switch inside the page. Retail Mechanics
  drops restaurant and links here.
- **B. Rebuild inside Retail Mechanics.** Less routing work, but the page stays
  a hybrid and becomes long.
- **C. Two separate pages (`/restaurant/economy`, `/restaurant/luxury`).**
  Explicit split, but duplicates layout and state for no benefit.

### Best-menu behavior

- **Presets + rankings.** Show known community presets and rank items. Simple,
  but the user explicitly wanted computation.
- **Auto-compute (chosen).** Enumerate all valid menus and rank by estimated
  profit subject to a target rating. 29,295 candidates is trivial to compute
  in the browser and is transparent.
- **Full menu with metrics only.** Manual only; no recommendation.

## Game model

### Menu items

Categories and base consumption ratios are from the official restaurant guide
and Sim Companies Times #176. Names match the Data repo resource names.

| Category | Item | Base ratio | Data repo name |
|---|---|---:|---|
| Salad bar | Milk | 288 | Milk |
| Salad bar | Bread | 24.89 | Bread |
| Salad bar | Butter | 92.6 | Butter |
| Salad bar | Cheese | 38.196 | Cheese |
| Salad bar | Coffee powder | 96.312 | Coffee powder |
| Main course | Apple pie | 16.667 | Apple pie |
| Main course | Hamburger | 3.608 | Hamburger |
| Main course | Lasagna | 4.073 | Lasagna |
| Main course | Meat balls | 3.505 | Meat balls |
| Main course | Salad | 9.402 | Salad |
| Main course | Samosa | 10.093 | Samosa |
| Drinks | Cocktails | 4.04 | Cocktails |
| Drinks | Orange juice | 144 | Orange juice |
| Drinks | Apple cider | 128.955 | Apple cider |
| Drinks | Ginger beer | 113.984 | Ginger beer |

At least one item from each category is required.

### Seating modes

| | Economy | Luxury |
|---|---|---|
| Seats per level | 1000 | 500 |
| Wage factor | 1.0 | 0.5 |
| Food requirement factor | 1.0 | 0.5 |
| Rating effect | ×1.0 | ×1.5 (multiplies, does not add) |
| Style | fast food / throughput | upscale / fewer tables |

Seats and food units scale linearly with restaurant level.

### Cycle

12 hours per cycle, 2 cycles per day. Food placed on the menu is consumed or
spoiled during the cycle whether or not customers buy it.

### Consumption

Per-category item-count multiplier:

| Items selected in category | Multiplier |
|---:|---:|
| 1 | 2.1 |
| 2 | 1.0 |
| 3 | 0.7 |
| 4 or more | 0.55 |

`units(item) = ceil(baseRatio × level × categoryMultiplier × (luxury ? 0.5 : 1))`

### Price, revenue, cost

- Menu price `P` is $60–$350 per meal.
- Meals served per cycle = `seats × occupancy` (occupancy is user input, 0–100%).
- Revenue per cycle = `mealsServed × P`.
- Food COGS = `Σ(units × unitCost)`.
- `unitCost = VWAP × (1 + qualityPremiumPct / 100) ^ quality`.
  Default quality premium is 1% per quality point, editable. VWAP is the live
  Data repo value; every unit cost is editable in the menu table.
- Wages per cycle = `655.5 × 12 × level × (luxury ? 0.5 : 1) × (professional ? 5 : 1)`.
- Admin overhead = `wages × adminOverheadPct / 100` (default 0).
- Profit per cycle = `revenue − COGS − wages − overhead`.
- Break-even occupancy = `(COGS + wages + overhead) / (seats × P)`.

Sales speed bonus does **not** reduce restaurant wages. In the official guide it
adds `0.02` to the rating; it is used only in the rating estimate.

### Rating estimate

The exact rating formula is not public. The page shows an estimate and lets the
user replace it with their actual in-game rating.

```
qualityScore   = 0.45 × quality
varietyBonus   = min(1.0, 0.1 × (totalItems − 3))
costScore      = min(1.0, 0.5 × log2(1 + foodCostPerSeat / 100))
salesScore     = 0.02 × salesSpeedBonus
cmoScore       = 0.01 × cmoCommSkill
staffBonus     = staff === "professional" ? 1.0 : 0
ratingEstimate = qualityScore + varietyBonus + costScore + salesScore + cmoScore + staffBonus
if luxury: ratingEstimate ×= 1.5
```

The professional-staff bonus is an explicit estimate: the official guide says
professional staff raise the rating and cost 5× wages, but does not publish the
magnitude. The page labels it "estimate". Calibration anchors assume rookie
staff.

**Actual-rating calibration.** If the user enters their in-game rating, the
page computes `offset = actualRating − ratingEstimate(currentMenu)` and applies
that offset to every candidate's estimate. The hero shows both the raw estimate
and the calibrated estimate. This lets the optimizer respect the user's real
environment without pretending the formula is known. With no override, offset
is 0. The current menu's calibrated rating is also shown in the menu footer.

The coefficients live in one constants object in `restaurantPlanner.ts` and are
calibrated against three reference points:

1. Economy 223, Q4, 3 recreation buildings, CMO 30 → roughly 5–6.
2. Luxury 544, Q6, 2 recreation buildings, CMO 50 → roughly 7.5–8.5.
3. Economy all-15, Q2 → roughly 4–5.

These are sanity anchors, not claims of accuracy. The page displays
"Estimated rating" with an info tooltip explaining the unknown formula and an
"Use my actual rating" override.

### Optimizer

1. Enumerate every valid menu: non-empty subset of each of the 3 categories
   (`(2^5−1) × (2^6−1) × (2^4−1) = 29,295`).
2. Compute units, COGS, and estimated rating for each.
3. Keep candidates whose estimated rating is at least the user's target rating
   (default 7.5, editable).
4. Rank by profit per cycle at the current price and occupancy.
5. Return the top 5. The first is the "Best menu"; the rest are alternatives.
6. If no candidate meets the target, return the highest-rated candidates and
   show a warning that the target is not reachable with the current inputs.

**Missing prices.** If any selected/menu item has no VWAP and no manual cost,
the optimizer excludes every candidate that contains that item. If every item
is unpriced, the optimizer is disabled and only the presets/manual builder are
shown. A $0 cost must never make an unpriced menu look artificially profitable.
Manual selection of unpriced items remains allowed; their rows show a warning
and the results treat their cost as 0 only with a visible "incomplete cost"
label.

Preset chips are also shown as benchmarks and one-click applies:

- Economy 223: Milk, Coffee powder / Samosa, Salad / Orange juice, Apple cider,
  Ginger beer.
- Luxury 544: Milk, Coffee powder, Butter, Cheese, Bread / Samosa, Salad,
  Apple pie, Hamburger / Apple cider, Orange juice, Ginger beer, Cocktails.

Community names are mapped: curry puffs → Samosa, apple juice → Apple cider,
ginger ale → Ginger beer.

The optimizer runs in a `useMemo` and is cheap enough for a static page. If
input dragging ever feels slow, debounce the inputs; do not move it to a worker.

## Page and UI

Route: `/restaurant`. Sidebar label: "Restaurant". Page title: "Restaurant
Planner".

Layout, top to bottom:

1. **Header + mode switch.** A segmented Economy | Luxury control. Next to it:
   seats, meals per cycle, and wage factor for the selected mode.
2. **Best Menu card (hero).** Estimated rating vs target, food cost, profit per
   cycle, "Apply" button, and top alternatives. If the target is unreachable,
   the warning is inside this card.
3. **Setup card.** Level, food quality 0–12, staff (Rookies/Professionals),
   sales speed bonus, CMO communication skill, menu price, expected occupancy,
   target rating, admin overhead. Under the quality control, one line of helper
   text: "Low pulls the lowest quality from your warehouse; High pulls the
   highest. This planner uses the quality you actually serve." There is no
   separate Low/High state because the planner has no inventory model.
4. **Results strip.** Seats, meals served, revenue, food cost, wages, profit per
   cycle, profit per day, break-even occupancy.
5. **Menu builder.** Three columns (Salad bar, Main courses, Drinks). Each row:
   checkbox, name, units/cycle, unit cost (editable), line cost. Category header
   shows the count multiplier and total units. Footer shows total food cost and
   the spoilage warning.
6. **Assumptions and data panel.** 12h cycle, food spoils, VWAP timestamp,
   quality premium, rating-estimate disclaimer, official guide link, PvP
   warning.

Mobile: the mode switch and results stay at the top; setup and menu builder
stack in one column. The menu builder columns become stacked sections.

State:

```
mode: "economy" | "luxury"
level: number
quality: number
staff: "rookie" | "professional"
salesSpeedBonus: number
cmoCommSkill: number
mealPrice: number
occupancy: number
targetRating: number
adminOverhead: number
selectedItemIds: Set<string>
manualUnitCosts: Record<string, number>
qualityPremiumPct: number
actualRating: number | null
```

Switching mode keeps the menu selection and inputs, and recomputes seats, units,
wages, rating estimate, and the optimizer. Switching never silently changes the
user's menu.

## Data and services

### New: `src/services/restaurantMenu.ts`

- `RestaurantCategory = "salad" | "main" | "drink"`.
- `RestaurantMenuItem` type: id, name, category, baseRatio, dataRepoName.
- `RESTAURANT_MENU_ITEMS` (15 items).
- `CATEGORY_LABELS`, `CATEGORY_ORDER`.
- `COUNT_MULTIPLIERS`.
- Preset definitions.
- No React, no fetching.

### New: `src/services/restaurantPlanner.ts`

- Input/result types.
- `computeSeats`, `computeUnits`, `computeMenuCosts`, `estimateRating`,
  `computeProfit`, `optimizeMenu`.
- Pure functions; no React, no fetching. This is the primary unit-test target.

### Data fetching

Use `fetchProfitMargins(0)` from `dataRepo.ts`:

- Build a `Map<name, outputVwap>`; match by `dataRepoName`.
- `margins.json` has no source timestamp; the service's `ts` field is the fetch
  time. Label it "Prices loaded at <local time>", never "Prices as of".
- If a name is missing, leave unit cost at 0, mark the row, and let the user
  edit it. Never block the page. The optimizer excludes unpriced items as
  described above.
- No dependency on `restaurantRetailInfo.ts` in the new page. Keep that service
  for other consumers, but fix the `snapshot.data?.sort` guard so it cannot
  crash again.

### New: `src/pages/RestaurantPlanner.tsx`

- Page shell, state, memoized calculations, UI.
- Uses `PageHeader`, `NumberInput`-style controls, and existing card classes.
- Does not import anything from `RetailMechanics.tsx`.

### Edited files

- `src/App.tsx`: lazy import + `/restaurant` route.
- `src/components/Sidebar.tsx`: add "Restaurant" under TOOLS.
- `src/hooks/usePageTitle.ts`: add `restaurantPlanner` title key.
- `src/pages/RetailMechanics.tsx`: remove the restaurant building option and
  restaurant-only panel/imports; add a short link card to `/restaurant`.
- `src/services/restaurantRetailInfo.ts`: optional-chain the sort and validate
  `Array.isArray(snapshot.data)`.

## Error and empty states

- Margins fetch fails: show a banner "Live ingredient prices unavailable — edit
  unit costs manually"; all calculations still work with manual costs.
- Some item prices missing: highlight those rows and show a count in the
  assumptions panel.
- No valid menu (should be impossible because of defaults): the optimizer
  returns the preset for the current mode.
- Target rating unreachable: warning card, best achievable rating shown.
- Occupancy 0: profit is negative by COGS + wages; break-even occupancy still
  shown.
- Menu price outside $60–$350: clamp with an inline note.

## Testing and verification

Unit tests (`vitest`) for `restaurantPlanner.ts`:

1. Category count multipliers: 1 → 2.1, 2 → 1.0, 3 → 0.7, 4+ → 0.55.
2. Units scale with level; luxury halves units; results are integers.
3. Seats: Economy 1000 × level; Luxury 500 × level.
4. Wages: Luxury is half Economy; professional staff is 5×.
5. Break-even occupancy formula.
6. Optimizer returns a valid menu with at least one item per category.
7. Optimizer respects the target rating when a candidate exists.
8. Optimizer returns the highest-rated fallback when the target is impossible.
9. Missing VWAP does not produce `NaN`, and the optimizer excludes unpriced
   candidates when priced alternatives exist.
10. Preset menus apply exactly.
11. Professional staff adds the documented rating bonus and multiplies wages
    by 5.
12. Actual-rating calibration applies the same offset to every candidate and
    leaves the raw estimate visible.

Build verification: `npm run lint` and `npm run build`. Manual UI check:
`/restaurant` loads, mode switch recalculates, Apply best menu updates the
builder, and `/retail-mechanics` no longer offers restaurant.

## What is left to the builder

- Exact visual composition (spacing, card arrangement, mobile breakpoints)
  within the described sections. UI design decisions are delegated.
- The exact rating coefficients after calibrating against the three anchors.
- Whether to add the page to `MobileNav`; the sidebar entry is required.
- Whether to delete the now-unused restaurant code from
  `restaurantRetailInfo.ts` or keep it for other consumers. Keep it and guard it.
- Whether to add a "copy menu" or "share" affordance. Not required for v1.

## Builder-check calls (settled in this revision)

- Professional staff: +1.0 estimated rating, 5× wages, labeled as an estimate.
- Low/High quality: no state; explanatory text only, because there is no
  inventory model and the planner uses the quality actually served.
- Missing prices: optimizer excludes unpriced candidates; manual selection is
  still allowed with a warning.
- Price timestamp: show fetch time ("Prices loaded at"), not a market timestamp.
- Actual rating: calibration offset applied to all estimates; raw estimate stays
  visible.

## Risks and limits

- **Rating/occupancy are estimates.** The game does not publish the formulas.
  The page must label them and offer an override.
- **VWAP is an aggregate price, not a quality-specific price.** The quality
  premium input is an approximation; users can edit unit costs.
- **Luxury food factor of 0.5 is inferred** from half the seats and the official
  statement that fewer tables reduce food requirements proportionally. It is a
  documented assumption, not a confirmed constant.
- **Food spoilage is modeled as fixed consumption**, which matches the official
  warning that all menu food is lost whether sold or not.
- **Competitor behavior is not modeled.** Profits are theoretical until the
  restaurant out-rates competitors.
