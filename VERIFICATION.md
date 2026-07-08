# Verification Checklist

## Architecture

- **Web repo** (`Sites/Web`): React SPA with lazy-loaded pages, polling data layer (`dataRepo.ts`), Tailwind CSS, Recharts.
- **Orchestrator** (separate backend): SimCo game state server — Web repo polls its REST endpoints via `corsproxy.io` (or self-hosted proxy).
- **Data flow**: Each page calls `useDataRepoPoll(fetchFn, interval)` which polls the orchestrator endpoint, caches, and re-renders on new data.

## Web App Pages

| Route | Page Component | Data Source |
|-------|---------------|-------------|
| `/` | HomePage | `fetchDashboardState`, `fetchDashboardEvents`, `fetchMacro`, `fetchMarketSentiment` |
| `/macro` | MacroPage | `fetchMacro`, `fetchMarketSentiment` |
| `/alerts` | AlertsPage | `fetchDashboardEvents` |
| `/corporate-suite` | CorporateSuitePage | `fetchDashboardState`, `fetchProfitMargins`, `fetchRetailData`, `fetchCycles` |
| `/vwap-inflation` | VWAPInflationPage | `fetchVWAPInflation` |
| `/profit-margins` | ProfitMarginsPage | `fetchProfitMargins` |
| `/encyclopedia` | EncyclopediaPage | `fetchProfitMargins` |
| `/production-flow` | ProductionFlowPage | Static `RESOURCES` data (no backend call) |
| `/about` | AboutPage | Static `methodology` data (no backend call) |
| `/widgets?type=...` | WidgetPage | Widget sub-components each call their own data |
| `*` | NotFoundPage | Static |

## Completed Improvements

1. Removed dead API code (`api.ts`, `useApi.ts`)
2. Fixed `macro.json` format mismatch
3. Handled `vwap-inflation.json` (no change needed)
4. Replaced fake SSE with honest polling
5. Typed the data layer (`dataRepo.ts` returns typed Promises)
6. Eliminated `any` casts across all pages
7. Split `CorporateSuite.tsx` (1151→380 lines, 9 extracted files)
8. Lazy-loaded all pages via `React.lazy`
9. Split `dataRepo.ts` into cache + transport modules
10. Removed `framer-motion` (replaced with CSS animations)
11. Cleaned up dead `useSseEvent` calls
12. Fixed widget dark mode (inline styles → Tailwind)
13. Fixed widget stub placeholders
14. Fixed `corsproxy.io` with retry + docs
15. Added `PageErrorBoundary` per page (`src/components/PageErrorBoundary.tsx`)
16. Fixed missing `document.title` on pages (About, CorporateSuite, WidgetRenderer, NotFound)
17. Fixed `MobileNav` hardcoded shadow (`rgba(0,0,0,0.05)` → Tailwind `shadow`)
18. Updated `States.tsx` with dark mode classes (`dark:` variants, `text-surface-400`)
19. Created this `VERIFICATION.md`

## How to Verify

- `npx tsc --noEmit` — should compile clean with zero errors
- `npm test` — all 36 tests pass
- `npm run dev` — app should load in browser
- Check each page renders correctly
- Toggle dark/light theme
- Test widget system at `/widgets?type=health`
- Switch realms (0 vs 1)

## Known Remaining Issues

1. `corsproxy.io` is fragile (self-hosted proxy recommended)
2. Widget signals/cycles/dependencies types show "Not yet available"
3. No real-time SSE (uses polling, which is fine)
4. No page-level tests for most pages
