# src/pages/

## Responsibility
Route-level screens. Each file exports exactly one `XxxPage` component and is lazy-loaded by `src/App.tsx`; pages compose `components/ui` primitives with hooks from `src/hooks` and static data from `src/data`.

## Design
- **Manual route table, not React Router.** `src/App.tsx#AppShell` is a `path === "…" ? <Page/>` chain over the path produced by `src/router.tsx#createRouter()`. Every page is `React.lazy(() => import("./pages/X").then(m => ({ default: m.XxxPage })))`.
- **Two page archetypes:**
  1. **Data dashboards** (Home, Macro, ProfitMargins, MarketIntel, Government, VWAPInflation, Encyclopedia) — poll the Data repo via `useDataQueries`/`useDataRepoPoll`, render charts (Recharts) and tables.
  2. **Calculators** (Profit, Construction, Retail, Sales Office, XP, Restaurant, Retail Mechanics, BoardRoom) — client-side economics over `src/data/simco_static.ts` plus optional live margins; no server round-trip for the math.
- **Async state convention**: `LoadingState` / `ErrorState(message, onRetry)` / `EmptyState` from `components/States.tsx`; title via `usePageTitleKey`.
- **Shell exceptions**: `/corporate-suite` renders without Sidebar/Footer/MobileNav; `/widgets*` renders with transparent background and no shell.

## Flow
`main.tsx` → `createRouter()` (base-aware `BASE_URL`, history `pushState`, `popstate` sync) → `AppShell(path)` → exact-match page → `useEffect` fetch → `loading | error | data` render.

## Files (route → page → data source)
- `/` — `Home.tsx` · `HomePage` — `useDashboardState()` (dashboard scores/regime), KPI + tool grid.
- `/macro` — `Macro.tsx` · `MacroPage` — `useMacroLatest`, `useMacroHistory`, `useMacroIndexes`, `useMacroPhases`; Recharts area/line.
- `/alerts` — `Alerts.tsx` · `AlertsPage` — static placeholder (`EmptyState`, "pending backend integration").
- `/corporate-suite` and `/executive-optimizer` — `CorporateSuite.tsx` · `CorporateSuitePage` — tabbed suite: `useDashboardState`, `useProfitMargins`, `useRetailData`, `dataRepo.*`, `extensionBridge.*`, local persistence in `SuiteStateV6`.
- `/vwap-inflation` — `VWAPInflation.tsx` · `VWAPInflationPage` — `useProfitMargins` + `fetchResourcePriceHistory`.
- `/profit-margins` — `ProfitMargins.tsx` · `ProfitMarginsPage` — `useProfitMargins` + `RESOURCES`; sortable matrix.
- `/encyclopedia` — `Encyclopedia.tsx` · `EncyclopediaPage` — `fetchProfitMargins`, `fetchResourcePriceHistory`, `buildResourceTree`, search over `RESOURCES`/`BUILDINGS`.
- `/profit-calculator` — `ProfitCalculator.tsx` · `ProfitCalculatorPage` — static `RESOURCES`, `BUILDINGS`, `PHASE_MULTIPLIERS`, `MAT_REF_PRICES` + live margins.
- `/construction-calculator` — `ConstructionCalculator.tsx` · `ConstructionCalculatorPage` — `BUILDINGS`, `CONSTRUCTION_MATERIALS`, `MAT_REF_PRICES` + `useProfitMargins`.
- `/retail-calculator` — `RetailCalculator.tsx` · `RetailCalculatorPage` — `RETAIL_PRODUCT_MAP`, `BUILDINGS`, phase multipliers + margins.
- `/market-intel` — `MarketIntel.tsx` · `MarketIntelPage` — `useProfitMargins`, `RETAIL_PRODUCT_MAP`; per-resource retail/production view.
- `/market-orders` — `MarketOrders.tsx` · `MarketOrdersPage` — live `services/simcompanies-api` (`fetchMarketOrders`, `fetchAllResources`).
- `/government` — `Government.tsx` · `GovernmentPage` — `dataRepo` + realm switcher; government order tables.
- `/about` — `About.tsx` · `AboutPage` — `data/methodology` copy only.
- `/extension` — `Extension.tsx` · `ExtensionPage` — `extensionBridge` availability + pairing code.
- `/sales-office` — `SalesOfficeCalculator.tsx` · `SalesOfficeCalculatorPage` — local state calculator (orders, contracts, wages); no data fetches.
- `/retail-mechanics` — `RetailMechanics.tsx` · `RetailMechanicsPage` — local retail math model (building definitions embedded in the file).
- `/restaurant` — `RestaurantPlanner.tsx` · `RestaurantPlannerPage` — `services/restaurantPlanner`, `restaurantMenu`, `restaurantMarketData`; optimizer UI.
- `/widgets?type=…` — `WidgetRenderer.tsx` · `WidgetPage` — switches `type` over `components/widgets/*`; `type`, `realm` from query params.
- `*` — `NotFound.tsx` · `NotFoundPage`.
- **Not routed by `App.tsx` (dead/orphaned until wired):** `BoardRoom.tsx` (`BoardRoomPage`), `ProductionFlow.tsx` (`ProductionFlowPage`, linked only from Encyclopedia), `XpCalculator.tsx` (`XpCalculatorPage` — Sidebar links to `/xp-calculator`, which has no route). Sidebar also has no entry for `/about`.

## Integration
- Mounted by: `src/App.tsx` (`AppShell`).
- Depends on: `src/components/ui/Common.tsx`, `src/components/States.tsx`, `src/hooks/*`, `src/services/*`, `src/data/*`, `src/utils/formatters.ts`, `src/router.tsx`.
- Sub-map: `corporate-suite/codemap.md`.
