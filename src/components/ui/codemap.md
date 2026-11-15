# src/components/ui/

## Responsibility
The page-level primitive kit: header/metric box/chart panel/section/card/badge/loading overlay/confirm dialog. Every page builds its layout from these so typography and spacing stay consistent.

## Design
- **One file, one barrel-free primitive set** (`Common.tsx`). Each component exports its own props interface alongside the implementation.
- **Slot-based composition**: `Section`, `Card`, `ChartPanel` take `children`; `Badge` takes a `variant`; `ConfirmDialog` takes handlers.
- **Tailwind-only styling** with a `className` escape hatch on every component for local overrides.

## Flow
Page renders `<PageHeader title subtitle icon />` → `<MetricBox>`/`<Section>`/`<ChartPanel>` grid → each accepts children (charts, tables, forms). `LoadingOverlay` and `ConfirmDialog` mount conditionally on async/modal state.

## Files
- `Common.tsx` — `PageHeader`, `MetricBox`, `ChartPanel`, `Section`, `Card`, `Badge`, `LoadingOverlay`, `ConfirmDialog` plus their prop interfaces.

## Integration
- Consumers: nearly every page (`Home`, `Macro`, `ProfitMargins`, `MarketIntel`, `Government`, `Alerts`, `BoardRoom`, `XpCalculator`, `RestaurantPlanner`, `SalesOfficeCalculator`, `WidgetRenderer`, `About`, `ProductionFlow`).
- Depends on: `lucide-react` icons only; no data access.
