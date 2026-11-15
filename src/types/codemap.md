# src/types/

## Responsibility
The shared TypeScript contract for every dataset the app consumes, including the abbreviated wire formats produced by the backend.

## Design
- **Single ambient domain module** (`api.ts`, ~270 lines) with no runtime code — pure `interface`/`type` declarations, erased at build.
- **Mirrors the backend's compact keys**: e.g. `MacroHistoryPoint` (`t`, `cv`, `ac`, `bs`, `tb`), `MacroIndexEntry` (`ix`), inflation (`in`, `ch`), margins resources. Keep in sync with `Backend/src/api/routes/publicData.ts`.
- **Response envelopes** (`ApiEnvelope<T>`) for backend calls, plus intelligence/analytics shapes (`IntelligenceMomentum`, `IntelligenceVolatility`, `IntelligenceRegime`, `SectorView`, `CorrelationData`, `AnomalyData`, `DivergenceData`, `ContagionData`, `ForecastSeries`, `SignalData`, `CycleData`, `SectorRisk`, `BottleneckChain`, `DependencyData`) that are largely aspirational/partially served.
- **Dashboard types** describe the composite `RealmDashboard` (scores/regime/alerts/sectors) used by the overview and widgets.

## Flow
Services annotate return types with these interfaces → hooks infer generics → pages get autocomplete; no runtime validation is performed, so malformed payloads surface as `undefined` reads rather than type errors.

## Files
- `api.ts` — all request/response and domain interfaces listed above.

## Integration
- Consumers: `src/services/dataRepo.ts`, `src/services/simcompanies-api.ts`, `src/services/widgetClient.ts`, `src/hooks/*`, `src/pages/*`.
- Authoritative producer: the Backend's public export + `/api/public/*` handlers.
