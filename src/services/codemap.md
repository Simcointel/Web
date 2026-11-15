# src/services/

## Responsibility
The entire data-access layer. No page talks to the network directly (except `MarketOrders` via `simcompanies-api`); everything goes through these modules.

## Design
- **Layered transport**: `github-transport.ts` = raw HTTP + retry/backoff + `index.json` resolution; `data-cache.ts` = TTL cache; `dataRepo.ts` = typed domain facade re-exporting both and adding dataset-specific mappers with fallbacks.
- **Two data origins**:
  1. **Static Data repo** (`raw.githubusercontent.com/SimcoIntel/Data/main`) — primary, CDN-served, no backend cost. `fetchLatest(dir, prefix)` reads `<dir>/index.json` and loads `latest`.
  2. **Backend API** (`API_BASE` from `src/config.ts`) — used by `widgetClient.ts` and as fallback.
- **Graceful degradation**: `dataRepo.fetchMacroLatest` tries the new `public/realm-N/macro.json`, then falls back to the legacy `aggregates/*` snapshots; `useDataRepo` surfaces a fallback fetcher as well.
- **Static domain services**: restaurant pricing/optimizer (`restaurantPlanner.ts`, `restaurantMenu.ts`, `restaurantMarketData.ts`, `restaurantRetailInfo.ts`) are pure calculation modules plus fetchers.
- **Extension bridge**: `extensionBridge.ts` uses `window.postMessage`/custom events to talk to the companion browser extension.

## Flow
`page → hook (useDataQueries) → dataRepo.fetchX()` → `withCache(key, ttl)` → `fetchLatest/fetchAllFiles/rawFetch` → `fetchWithRetry(url)` → GitHub raw.
Failure → cache a negative entry for 30 s → hook's `fallback()` (if provided) → otherwise `error` state rendered by `ErrorState`.

## Files
- `dataRepo.ts` — typed facade: `fetchDashboardState`, `fetchMacroLatest`, `fetchMacroHistory`, `fetchMacroPhases`, `fetchMacroIndexes`, `fetchMacroInflation`, `fetchRetailData`, `fetchProfitMargins`, `fetchResourcePriceHistory`, `fetchCompanyData`; re-exports transport + cache + `simcompanies-api`.
- `github-transport.ts` — `rawFetch`, `fetchIndex`, `fetchLatest`, `listFiles`, `fetchAllFiles`; retry with exponential backoff, 8–15 s timeouts, per-index/list TTL caches.
- `data-cache.ts` — `DATA_CACHE`, `withCache(key, fn, ttl)`, `CACHE_TTL` (5 min), `CACHE_FAIL_TTL` (30 s), `CACHE_LONG_TTL` (15 min).
- `simcompanies-api.ts` — direct Sim Companies API v3 client: company profile/buildings/storage, resources, market orders; finance helpers `calculateProductionEfficiency`, `estimateWACC`, `calculateROIC`, `calculateEVA`.
- `widgetClient.ts` — `fetchWidget(type, realm, compact)`, `createWidgetUrl`; falls back from data repo to backend widget endpoint.
- `extensionBridge.ts` — `requestExtensionData`, `isExtensionAvailable`, `getPairingCode`.
- `restaurantMenu.ts` — menu catalog, categories, presets, `countMultiplier`.
- `restaurantPlanner.ts` — pure economics engine: `seatsForMode`, `computeUnits`, `computeMenuRows`, `demandFromSaturation`, `phaseWeights`, `estimateOccupancy`, `resolveOccupancy`, `estimateRating`, `computeProfit`, `computeMenuMarket`, `optimizeMenu`.
- `restaurantMarketData.ts` — `loadRestaurantMarketData`, `qualityPremiumCost`, `normalizeMarketData`.
- `restaurantRetailInfo.ts` — `getRestaurantRetailInfo`, `getQualityData`, quality/price/saturation helpers and `calculateRestaurantMenu`.

## Integration
- Consumers: `src/hooks/*` (all data hooks), `src/pages/*`, `src/components/widgets/*`.
- Depends on: `src/config.ts` (`API_BASE`, `apiUrl`), `src/types/api.ts`.
- Upstream: `raw.githubusercontent.com/SimcoIntel/Data@main`, backend `/api/public/*`, `api.simcompanies.com`.
