# src/data/

## Responsibility
Bundled static game reference data and pure derivations. This is the offline knowledge base the calculators run on when no network data is available.

## Design
- **Compile-time constants**, not fetched data: buildings, construction materials, resource catalog, retail product map, reference prices, phase multipliers.
- **Pure helper functions**: `buildResourceTree` derives a production bill-of-materials tree from resource inputs/outputs.
- **Methodology copy** is data-driven (`methodology` object) so the About page renders explanations without hard-coded JSX prose.

## Flow
`simco_static.ts` exports `RESOURCES` (with input/output ids, wages, phase data) → `buildResourceTree(id, depth)` recursively resolves inputs → calculator pages (Construction, Retail, Profit, ProductionFlow, Encyclopedia) consume the tree plus live margins from the data layer.

## Files
- `simco_static.ts` — `BUILDINGS`, `CONSTRUCTION_MATERIALS`, `RETAIL_PRODUCT_MAP`, `MAT_REF_PRICES`, `PHASE_MULTIPLIERS`, `ResourceData`, `RESOURCES`.
- `buildTree.ts` — `TreeNode`, `buildResourceTree(id, depth)`.
- `methodology.ts` — `methodology` (sections of explanatory copy for the About page).

## Integration
- Consumers: `src/pages/ConstructionCalculator.tsx`, `RetailCalculator.tsx`, `ProfitCalculator.tsx`, `ProductionFlow.tsx`, `Encyclopedia.tsx`, `MarketIntel.tsx`, `CorporateSuite.tsx`, `pages/corporate-suite/{OperationsView,LogisticsView,RetailView,RiskView}.tsx`, `About.tsx`.
- Depends on: nothing (leaf module; no network).
