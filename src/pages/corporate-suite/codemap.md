# src/pages/corporate-suite/

## Responsibility
Tabbed sub-views of the Corporate Suite (`/corporate-suite`). The parent page owns state, persistence and data fetching; each view is a presentational panel receiving `SuiteViewProps`.

## Design
- **Container/presenter split**: `CorporateSuite.tsx` (one level up) owns `SuiteStateV6`, tabs, sync and notifications; views here are pure-ish components that receive `{ state, setState, core, phase, margins, retail, … }` and mutate through `setState`.
- **Single shared prop contract** in `types.ts` (`SuiteViewProps`, `SuiteStateV6`, `CoreMetrics`), plus `n()` numeric coercion helper and `DEFAULT_STATE`/`EMPTY_EXEC`.
- **Shared suite primitives** in `components.tsx` (`WorkstationTab`, `GlobalMetric`, `KPICard`, `SkillNode`, `ExecCard`, `ForecastLine`, `CheckItem`, `LedgerView`) — used across views so the suite looks uniform.
- **Static game data**: views read `RESOURCES`, `BUILDINGS`, `CONSTRUCTION_MATERIALS` from `src/data/simco_static.ts`; live values come from props (`core`, `margins`, `retail`).

## Flow
`CorporateSuitePage` → tab state → renders one view (`ExecutiveView`, `OperationsView`, `FinanceView`, `LogisticsView`, `RetailView`, `BondsView`, `RiskView`, `RankingsView`, `CommandView`) → user edits `setState(prev => …)` → parent persists `SuiteStateV6` (localStorage/extension sync) → recomputed `core` metrics flow back down.

## Files
- `types.ts` — `Executive`, `MapItem`, `InventoryItem`, `SuiteStateV6`, `EMPTY_EXEC`, `DEFAULT_STATE`, `n()`, `CoreMetrics`, `SuiteViewProps`.
- `components.tsx` — shared suite UI primitives (`WorkstationTab`, `GlobalMetric`, `KPICard`, `SkillNode`, `ExecCard`, `ForecastLine`, `CheckItem`, `LedgerView`).
- `CommandView.tsx` — `CommandView`: company link/import, warehouse value, sync controls, pairing code.
- `ExecutiveView.tsx` — `ExecutiveView`: executive skill allocation/effects.
- `OperationsView.tsx` — `OperationsView`: facility/map editing, capital requirements.
- `FinanceView.tsx` — `FinanceView`: tax engine, thresholds, daily ceiling.
- `LogisticsView.tsx` — `LogisticsView`: logistics/fleet planning using `RESOURCES`.
- `RetailView.tsx` — `RetailView`: retail planning with live `retail` data.
- `BondsView.tsx` — `BondsView`: bond issue parameters, cost-of-capital comparison, total return.
- `RiskView.tsx` — `RiskView`: market sentiment/risk matrix (uses `RESOURCES`).
- `RankingsView.tsx` — `RankingsView`: small ranking panel (currently minimal).

## Integration
- Mounted by: `src/pages/CorporateSuite.tsx`.
- Depends on: `src/data/simco_static.ts`, `src/utils/formatters.ts`, `src/components/ui/Common.tsx`, `src/services/extensionBridge.ts` (via parent props).
