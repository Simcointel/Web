# Restaurant Planner — Design

- Date: 2026-11-02
- Status: Draft, revised for market dynamics, awaiting approval
- Scope: Web (`C:\Users\nanda\All\Sites\Web`), plus an optional backend data fix

## Intent

Replace the restaurant panel inside Retail Mechanics with a dedicated restaurant
planner. The page models the real SimCompanies restaurant loop: 12-hour cycles,
seating capacity, category-based menus, per-cycle food consumption, spoilage,
wages, meal price, occupancy, and the Economy/Luxury seating split.

Occupancy is market-driven, not a fixed input: it responds to price, rating, the
number and strength of other restaurants, the economic phase, and the player's
own supply. The page shows an auto-computed "best menu" for the selected mode
and lets the user switch modes without losing their work.

The user asked for a "real one which shows the menu for best" and "people need
to be able to switch to economy and luxury", then corrected the first draft:
selling an item increases its market availability, which lowers demand. The
planner must model that instead of assuming a fixed occupancy.

### What changed in this revision

- Occupancy is computed from a market model instead of being a fixed input.
  Price, rating, restaurant count, average market offer, economic phase, and
  own supply all move it.
- "Actual occupancy" mode lets the player use the in-game number; the model is
  shown as a reference and is not double-applied.
- The menu market panel shows per-item saturation/demand and the player's own
  volume impact, using the live `demand = 1 - saturation/2` relationship.
- Menu composition does not change occupancy, following the official guide
  (Times #180); item market pressure is informational in v1.
- The occupancy and market constants are centralized and calibratable, and
  missing data falls back to neutral instead of crashing or faking a number.
- The backend snapshot is still malformed; fixing it is an optional data
  upgrade, not a v1 blocker.

## Why now

- The existing restaurant panel uses the wrong menu categories
  (`food` / `beverage` / `dessert`), includes an item that is not a restaurant
  menu item (pumpkin soup), and models price as `contractPrice × rating`, which
  is not a game mechanic.
- It does not model seats, per-cycle consumption, spoilage, or the fact that
  Luxury restaurants have half the seats, half the wages, and roughly half the
  food requirement of Economy.
- The first design treated occupancy as a user input. The official guide says
  occupancy is decided by the restaurant's price/rating offer against other
  restaurants; the Economy Model recalculates demand from units sold. A planner
  that ignores supply and demand overstates profit.
- The restaurant market is crowded: 743 restaurants and an average rating of
  7.49 in September 2026. Competitor count and rating cannot be ignored.
- The restaurant data snapshot exists, but the Web reader crashes with
  `snapshot.data.sort` when the snapshot is missing or malformed.

## Current state

- `src/pages/RetailMechanics.tsx` contains a restaurant mode inside a generic
  retail calculator. The restaurant branch adds a warning card, a rating card,
  an API-data card, a static item list, and a synthetic "menu calculator".
- It imports `getRestaurantRetailInfo`, `calculateRestaurantMenu`, and
  `RESTAURANT_MENU_ITEMS` from `src/services/restaurantRetailInfo.ts`.
- `src/services/restaurantRetailInfo.ts` fetches the latest snapshot from
  `SimcoIntel/Data` and calls `snapshot.data.sort(...)` without a guard.
- `src/services/dataRepo.ts` exposes `fetchProfitMargins(realm)` (VWAP per
  resource), `fetchRetailData(realm)` (retail saturation per resource), and
  `fetchMacroPhases(realm)` (current economic phase).
- The backend `restaurantRetailInfo.ts` job currently receives only
  `dbLetter 150` from `/api/v4/1/resources-retail-info/` because it calls the
  endpoint without the resource-list query. Its per-item values are not usable
  in v1. A one-line backend fix is listed as an optional data upgrade.

## Goals

1. Dedicated `/restaurant` page with a prominent Economy/Luxury switch.
2. Real menu model: 3 categories, 15 items, per-cycle consumption ratios,
   count multipliers, luxury food factor, and spoilage.
3. Auto-computed best menu first, with manual editing still possible.
4. Economy vs Luxury differences applied everywhere: seats, wages, food units,
   rating multiplier.
5. Market-driven occupancy: price, rating, restaurant count, average market
   offer, economic phase, and own supply. Manual "actual occupancy" override.
6. Per-item market detail: saturation, demand, total restaurant volume (when
   available), own share, and demand after own volume.
7. Profit per cycle and per day, cost breakdown, and break-even occupancy.
8. Ingredient costs from live Data repo VWAP, with manual override.
9. Remove restaurant from Retail Mechanics and link to the new page.
10. No new dependencies; works when market data is missing.

## Non-goals

- Predicting exact rating or occupancy. The game does not publish those formulas
  and they include randomness. The page estimates, labels the estimate, and lets
  the user override it with their in-game rating and occupancy.
- Simulating every individual competitor. The model uses an average market
  offer and a restaurant count.
- Multi-restaurant portfolio comparison. A "restaurants owned" count is used
  only to estimate own market supply.
- Seasonal menu items (Ramadan sweets, Easter Bunny).
- Reproducing the exact polynomial retail demand curve. The coefficients are
  not exposed for every resource.
- Ingredient purchase price impact / order-book depth. The planner uses VWAP
  and editable unit costs.
- Changing the backend sync job or the Data repo schema in v1. An optional
  backend data fix is noted below.

## Anti-goals

- Promising guaranteed profit. Restaurants are PvP; the page must say profit is
  only realized when the restaurant out-competes others.
- Fabricated precision. Every derived number is either a game rule, a live data
  value, or an explicitly labeled estimate.
- Another restaurant panel hidden inside a different calculator.

## Constraints

- Static Web app deployed to GitHub Pages. No server-side rendering.
- Data comes from `raw.githubusercontent.com/SimcoIntel/Data/main` via
  `fetchProfitMargins(0)`, `fetchRetailData(0)`, and `fetchMacroPhases(0)`.
- Market defaults that are not in the Data repo (restaurant count, average
  rating, average menu price) are editable assumptions with a source note.
- Menu price is limited to $60–$350 per meal.
- Must reuse existing UI conventions: `card`, `PageHeader`, `NumberInput`
  patterns, lucide icons, Tailwind theme tokens.
- Must not crash when `margins.json`, `retail.json`, phase data, or restaurant
  snapshots are missing.

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

### Market model

Two markets matter:

1. **Restaurant meals.** The restaurant sells meals to Simeons. Total demand is
   finite and shared with every other restaurant. Serving more meals adds
   supply, so demand falls. This drives occupancy.
2. **Menu items.** Each menu item is also a resource with its own retail
   saturation, demand, and restaurant sales volume. This drives the menu market
   panel.

The official Economy Model recalculates saturation once a day from units sold
across the economy. High saturation means low demand. The live API data follows
this exact relationship for the 15 menu items:

```
demand(s) = clamp(1 - s / 2, 0, 1)
```

At `s = 0.1` → 0.95; `s = 1.0` → 0.50; `s = 1.5` → 0.25; `s = 2.0` → 0.
Saturation has a minimum of 0.1 and no maximum (Times #137), so raw demand can
go negative above `s = 2`; the planner clamps displayed demand at 0.

Data sources:

| Signal | Source | Fallback |
|---|---|---|
| Ingredient VWAP | `margins.json` via `fetchProfitMargins(0)` | manual unit cost |
| Item retail saturation | `retail.json` via `fetchRetailData(0)` | neutral 1.0 |
| Item restaurant volume / demand | restaurant snapshot `retailData` | neutral, no own-volume impact |
| Economic phase | `fetchMacroPhases(0)` | neutral phase |
| Restaurant count, average rating, average menu price | editable assumptions; defaults 743, 7.49, $150 (Times #207, Sep 2026) | neutral |

The restaurant snapshot is currently malformed (only `dbLetter 150`). The page
must detect that, fall back to `retail.json`, and never crash. A one-line
backend fix that requests the resource-list form of the endpoint would unlock
per-item `amountSoldRestaurant`; v1 does not depend on it.

#### Occupancy estimate

The exact occupancy formula is not public. The planner uses a transparent,
calibratable estimate. The user can switch to "Actual" and enter the occupancy
shown in game; that value bypasses the estimate.

```
phase weights (priceWeight, ratingWeight, phaseFactor):
  expansion    0.90, 1.10, 1.05
  recovery     1.00, 1.00, 1.00
  stagnation   1.10, 0.90, 0.95
  contraction  1.25, 0.80, 0.90
  recession    1.40, 0.70, 0.85
  overheating  0.95, 1.05, 1.02
  speculative  1.00, 1.00, 1.00
  unknown      1.00, 1.00, 1.00

offer         = rating^ratingWeight / price^priceWeight
marketOffer   = avgMarketRating^ratingWeight / avgMarketPrice^priceWeight
baseOccupancy = 0.60 × (offer / marketOffer)^0.8
competition   = clamp(sqrt(743 / restaurantCount), 0.5, 1.5)
ownShare      = ownMealsPerDay / (marketMealsPerDay + ownMealsPerDay)
supplyFactor  = 1 / (1 + ownShare)
occupancy     = clamp(baseOccupancy × competition × phaseFactor × supplyFactor, 0.03, 0.95)
```

`marketMealsPerDay = restaurantCount × avgSeats × 0.60 × 2`, with
`avgSeats = 7,500` (a level-10 mix of Economy and Luxury). `ownMealsPerDay =
restaurantsOwned × seats × baseOccupancy × 2`. The own-supply effect is small
for one restaurant (one of 743) and visible for a chain; the UI always shows
the share and the factor.

The phase weights encode the three customer groups: expansion favors rating,
recession favors price. The phase factor scales total demand. More restaurants
lower `competition`; a stronger average market offer lowers `baseOccupancy`.
Phase names are matched case-insensitively; an unknown phase uses neutral
weights. The `743` reference is the Sep 2026 restaurant count; changing the
restaurant-count input scales competition relative to it.

#### Menu market panel

For each selected item:

```
itemDemand        = demand(saturation)
ownUnitsPerDay    = unitsPerCycle × 2 × restaurantsOwned × occupancy
marketUnitsPerDay = latest amountSoldRestaurant, if present
ownShare          = marketUnitsPerDay > 0
                    ? ownUnitsPerDay / (marketUnitsPerDay + ownUnitsPerDay)
                    : 0
saturationAfter   = saturation × (1 + ownShare)
demandAfter       = demand(saturationAfter)
```

`ownUnitsPerDay` is the estimated volume actually sold, not the food prepared:
unsold menu food spoils. Rows with no market volume (`0`, missing, or
malformed) show "market volume unknown" and no own-volume impact. Rows with no
saturation show "no market data" and neutral 1.0.

This panel is informational in v1. The official guide says occupancy depends on
price and rating, not current menu composition (Times #180), so item demand does
not change the occupancy estimate. It shows which items are crowded, how much
the player's volume adds, and where prices may move. The optimizer uses current
VWAP costs and does not speculate on future item prices.

#### What the model deliberately does not do

- It does not reproduce the game's polynomial demand curve. The occupancy curve
  is a power approximation calibrated by the reference setups and the user's
  actual occupancy.
- It does not model individual competitors or their menu changes.
- It does not model the price impact of buying ingredients. There is no
  order-book depth in the Data repo.
- It does not let menu composition change occupancy, because the official guide
  says it does not.

### Price, revenue, cost

- Menu price `P` is $60–$350 per meal.
- Occupancy comes from the market model above, or from the user's actual
  occupancy in "Actual" mode.
- Meals served per cycle = `seats × occupancy`.
- Revenue per cycle = `mealsServed × P`.
- Food COGS = `Σ(units × unitCost)`. It is a per-cycle cost: menu food is
  consumed or spoiled whether or not customers buy it, so COGS does not scale
  with occupancy.
- `unitCost = VWAP × (1 + qualityPremiumPct / 100) ^ quality`.
  Default quality premium is 1% per quality point, editable. VWAP is the live
  Data repo value; every unit cost is editable in the menu table.
- Wages per cycle = `655.5 × 12 × level × (luxury ? 0.5 : 1) × (professional ? 5 : 1)`.
- Admin overhead = `wages × adminOverheadPct / 100` (default 0).
- Profit per cycle = `revenue − COGS − wages − overhead`.
- Break-even occupancy = `(COGS + wages + overhead) / (seats × P)`.
- If market occupancy is below break-even, the results card shows a warning
  instead of hiding the loss.

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
4. Rank by profit per cycle at the current price and the occupancy used by the
   results (market estimate or actual). Occupancy uses the **current** rating:
   the actual-rating override, or the estimate for the currently selected menu.
5. Return the top 5. The first is the "Best menu"; the rest are alternatives.
6. If no candidate meets the target, return the highest-rated candidates and
   show a warning that the target is not reachable with the current inputs.

A candidate's estimated rating does not grant an immediate occupancy bonus.
The game's rating builds slowly; a menu change does not instantly re-rate the
restaurant (Times #180). Each candidate's rating is shown and used for the
target constraint, while occupancy stays on the current rating. After Apply,
the current rating estimate updates and the page notes that the in-game rating
will converge over cycles.

Because occupancy is the same for every candidate, the ranking is effectively
"the cheapest menu that meets the rating target". Market conditions change the
absolute profit, break-even, and the value of chasing a higher rating; they do
not reorder two menus with the same rating. This is intentional and matches the
documented mechanics.

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
   seats, meals per cycle, wage factor, economic phase, and the occupancy
   estimate for the selected mode.
2. **Best Menu card (hero).** Estimated rating vs target, occupancy used, food
   cost, profit per cycle, "Apply" button, and top alternatives. If the target
   is unreachable or market occupancy is below break-even, the warning is inside
   this card.
3. **Setup card.** Level, food quality 0–12, staff (Rookies/Professionals),
   sales speed bonus, CMO communication skill, menu price, target rating, admin
   overhead. Under the quality control, one line of helper text: "Low pulls the
   lowest quality from your warehouse; High pulls the highest. This planner uses
   the quality you actually serve." There is no separate Low/High state because
   the planner has no inventory model.
4. **Market conditions card.** Occupancy mode (Estimate | Actual), actual
   occupancy input (shown only in Actual mode), restaurant count, average market
   rating, average market menu price, restaurants owned, and the current phase
   (read-only, with source). It also shows the estimate breakdown:
   `base 60% × competition 0.98 × phase 1.00 × supply 0.999 = 58.7%`. A small
   line states which market data loaded and which fell back.
5. **Results strip.** Occupancy used, seats, meals served, revenue, food cost,
   wages, profit per cycle, profit per day, break-even occupancy. If the
   occupancy is below break-even, profit is shown in red with a warning.
6. **Menu builder.** Three columns (Salad bar, Main courses, Drinks). Each row:
   checkbox, name, units/cycle, unit cost (editable), line cost, and a compact
   market badge (demand % and own share). Category header shows the count
   multiplier and total units. Footer shows total food cost and the spoilage
   warning.
7. **Menu market panel.** Collapsible table for the selected items: saturation,
   demand, market units/day, own units/day, own share, demand after own volume.
   Rows without data say "no market data" instead of showing a fake number.
8. **Assumptions and data panel.** 12h cycle, food spoils, VWAP fetch time,
   retail data date, quality premium, rating/occupancy estimate disclaimer,
   market default sources, official guide link, PvP warning.

Mobile: the mode switch, occupancy estimate, and results stay at the top; setup,
market conditions, and menu builder stack in one column. The menu builder
columns become stacked sections. The menu market table scrolls horizontally.

State:

```
mode: "economy" | "luxury"
level: number
quality: number
staff: "rookie" | "professional"
salesSpeedBonus: number
cmoCommSkill: number
mealPrice: number
occupancyMode: "estimate" | "actual"
actualOccupancy: number
targetRating: number
adminOverhead: number
selectedItemIds: Set<string>
manualUnitCosts: Record<string, number>
qualityPremiumPct: number
actualRating: number | null
restaurantCount: number
avgMarketRating: number
avgMarketPrice: number
restaurantsOwned: number
```

Switching mode keeps the menu selection and inputs, and recomputes seats, units,
wages, rating estimate, market occupancy, and the optimizer. Changing market
conditions also recomputes occupancy and profit but never changes the selected
menu; only the Apply action changes the menu. Switching never silently changes
the user's work.

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
  `demandFromSaturation`, `estimateOccupancy`, `computeMarketMeals`,
  `computeMenuMarket`, `computeProfit`, `optimizeMenu`.
- Pure functions; no React, no fetching. This is the primary unit-test target.

### Data fetching

Use the existing `dataRepo.ts` helpers with `Promise.allSettled` so a failed
fetch never blocks the page:

- `fetchProfitMargins(0)` → `Map<name, outputVwap>`, matched by `dataRepoName`.
  The service's `ts` is the fetch time. Label it "Prices loaded at <local
  time>", never "Prices as of". The response also gives each resource's numeric
  id, which is used to look up retail saturation and snapshot `dbLetter`.
- `fetchRetailData(0)` → `Map<resourceId, saturation>`. There is no timestamp in
  `retail.json`; label it "Retail data loaded at <local time>".
- `fetchMacroPhases(0)` → `currentPhase`; unknown/missing means neutral weights.
- `getRestaurantRetailInfo()` → optional per-item `retailData` keyed by
  `dbLetter`. Use it only when `dbLetter` matches a menu item's resource id and
  `retailData` is a non-empty array; otherwise use `retail.json`. This service
  must be guarded before use, and its current malformed snapshot must not crash
  the page or produce fake market volumes.

If an ingredient name is missing, leave unit cost at 0, mark the row, and let
the user edit it. The optimizer excludes unpriced items as described above.
Market data is optional; every calculation has a neutral fallback.

### Optional backend data upgrade

The current job calls `/api/v4/1/resources-retail-info/` with no query and gets
only `dbLetter 150`. Calling the same endpoint with a query (for example
`?dbLetter=117`) returns the resource-list form with `dbLetter`, `saturation`,
`demand`, and `amountSoldRestaurant` for the menu items. A small job change can
request that form, filter to the 15 menu items, and keep the existing snapshot
shape (`quality` may be absent; normalize to 0). This is not required for v1:
the Web page uses `retail.json` when the snapshot is unusable. Include it only
if the user wants live per-item restaurant volumes in the first release.

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
- `src/types/api.ts` only if a market-data type is needed; prefer local types in
  `restaurantPlanner.ts`.

## Error and empty states

- Margins fetch fails: show a banner "Live ingredient prices unavailable — edit
  unit costs manually"; all calculations still work with manual costs.
- Some item prices missing: highlight those rows and show a count in the
  assumptions panel.
- Retail or phase fetch fails: neutral saturation (1.0) and neutral phase; the
  occupancy estimate still works and is labeled "neutral market assumptions".
- Restaurant snapshot missing, malformed, or containing only `dbLetter 150`:
  fall back to `retail.json`; never show a fake market volume and never crash.
- Restaurant count, average rating, average price, or restaurants owned is
  non-positive/NaN: clamp to the documented defaults with an inline note.
- No valid menu (should be impossible because of defaults): the optimizer
  returns the preset for the current mode.
- Target rating unreachable: warning card, best achievable rating shown.
- Occupancy 0 or below break-even: profit is negative by COGS + wages; the
  warning names the break-even occupancy.
- Actual occupancy mode: show the model estimate next to the entered value and
  the delta, but use the entered value for revenue/profit.
- Menu price outside $60–$350: clamp with an inline note.
- Item market data missing: the row says "no market data" and the menu market
  panel excludes it from the weighted summary.

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
13. `demandFromSaturation` matches the live API relationship: 0.1 → 0.95,
    1.0 → 0.50, 1.5 → 0.25, 2.0 → 0, and clamps at 0 above 2.0.
14. Own supply lowers occupancy: increasing `restaurantsOwned` or the meal
    volume decreases `supplyFactor`; one restaurant has a smaller effect than a
    chain.
15. More restaurants lower occupancy; a higher menu price lowers occupancy; a
    higher rating raises occupancy.
16. Phase changes occupancy: recession is lower than expansion at the same
    inputs, and recession makes a price cut worth more than a rating increase.
17. Actual-occupancy mode bypasses the estimate and uses the entered value for
    revenue and profit.
18. Menu market panel computes own share and demand after; missing market
    volume gives `ownShare = 0` and no `NaN`.
19. Missing retail saturation falls back to neutral 1.0; a malformed restaurant
    snapshot falls back without throwing.

Build verification: `npm run lint`, `npm test`, and `npm run build`. Manual UI
check: `/restaurant` loads; mode switch and market-condition changes recompute
occupancy and profit; Apply best menu updates the builder; actual-occupancy mode
changes revenue; and `/retail-mechanics` no longer offers restaurant.

## What is left to the builder

- Exact visual composition (spacing, card arrangement, mobile breakpoints)
  within the described sections. UI design decisions are delegated.
- The exact rating coefficients after calibrating against the three anchors.
- The exact occupancy constants (baseline 0.60, elasticity 0.8, average market
  seats 7,500, phase weights) after calibrating against the user's actual
  occupancy and the reference setups.
- Whether to add the page to `MobileNav`; the sidebar entry is required.
- Whether to delete the now-unused restaurant code from
  `restaurantRetailInfo.ts` or keep it for other consumers. Keep it and guard it.
- Whether to include the optional backend data upgrade in v1. The page must
  work without it either way.
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

- **Occupancy is an estimate.** The game does not publish the formula. The page
  labels it, shows the breakdown, and offers an actual-occupancy override.
- **Market defaults are stale assumptions.** Restaurant count (743) and average
  rating (7.49) are from Times #207 (Sep 2026); the $150 average menu price is a
  neutral default, not a live market statistic. All three are editable and
  labeled with their source.
- **The own-supply effect is small for one restaurant.** One of 743 restaurants
  barely moves demand. The UI shows the share and factor instead of pretending
  otherwise; the effect becomes visible for a chain or a niche item.
- **Item saturation is not a restaurant-specific demand curve.** `retail.json`
  is the resource retail market; many menu items sit at the 0.1 saturation
  floor. The panel is context, not a precise forecast.
- **VWAP is an aggregate price, not a quality-specific price.** The quality
  premium input is an approximation; users can edit unit costs.
- **Luxury food factor of 0.5 is inferred** from half the seats and the official
  statement that fewer tables reduce food requirements proportionally. It is a
  documented assumption, not a confirmed constant.
- **Food spoilage is modeled as fixed consumption**, which matches the official
  warning that all menu food is lost whether sold or not.
- **Competitor behavior is aggregated.** The model uses an average market offer
  and a count; it does not simulate individual restaurants or their menu moves.
  Profits are theoretical until the restaurant out-rates competitors.
- **Ingredient purchase impact is not modeled.** There is no order-book depth
  in the Data repo, so the planner assumes VWAP-sized purchases do not move the
  market. A large buyer should edit unit costs upward.
- **Rating is still an estimate.** The actual-rating override calibrates the
  offset, but the underlying rating formula remains unknown.

## Sources

- Sim Companies, Restaurant guide:
  <https://www.simcompanies.com/pages/restaurant-guide/>
- Sim Companies, Economy Model:
  <https://www.simcompanies.com/pages/economy-model/>
- Sim Companies Times #89 / #303: market demand and saturation; twice the units
  retailed can reach ~200% saturation and near-zero margins.
- Sim Companies Times #137 / #138: retail demand equation; saturation minimum
  0.1; saturation recalculated daily.
- Sim Companies Times #180: occupancy depends on rating and price, not current
  menu composition; rating builds slowly.
- Sim Companies Times #207: 743 restaurants and average rating 7.49 (Sep 2026).
- Sim Companies Times #165: more restaurants erode premium pricing.
- SimcoIntel Data repo: <https://github.com/SimcoIntel/Data>
