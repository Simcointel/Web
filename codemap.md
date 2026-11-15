# Repository Atlas: SimcoIntel Web

## Project Responsibility
React + TypeScript single-page application that visualises Sim Companies economic data and provides client-side calculators. It is a **static consumer**: it reads pre-computed JSON from the external `SimcoIntel/Data` GitHub repo (raw/CDN) or the backend's `/api/public/*` endpoints, and performs heavy math locally so no database or per-request backend is required. Deployed under the `/Web/` base path (GitHub Pages/Vercel).

## System Entry Points
- `index.html` → `src/main.tsx` → `createRouter()` → `src/App.tsx#AppShell`.
- `src/router.tsx` — hand-rolled history router (strips Vite `BASE_URL`, handles GitHub Pages `404.html` redirect via `sessionStorage.redirect`).
- `vite.config.ts` — `base: "/Web/"`, aliases (`@`, `@hooks`, `@services`, …), dev proxy `/api → http://localhost:3001`.
- `public/404.html` + `public/widget.js` — GitHub Pages SPA fallback and embeddable widget loader.

## Architecture At a Glance
```
page ──► hooks (useDataRepo / useDataQueries) ──► services/dataRepo ──► services/github-transport
                        │                              │                       │
                        │                              └── data-cache (TTL)     └── raw.githubusercontent.com/SimcoIntel/Data@main
                        └── fallback ──► services/widgetClient ──► backend /api/public/*
```
- Two page archetypes: **data dashboards** (poll via hooks) and **calculators** (pure functions over `src/data/simco_static.ts`).
- No routing/state/data libraries: only React, Recharts, Lucide icons, Tailwind.
- Realm and theme are shared via `localStorage` (`simco_realm`, `dark` class).
- Companion browser extension (`extension/`) talks to the app through `services/extensionBridge.ts`.

## Directory Map (Aggregated)
| Directory | Responsibility Summary | Detailed Map |
|-----------|------------------------|--------------|
| `src/` | Bootstrap, shell, route table, router, API base config | [View](src/codemap.md) |
| `src/components/` | App shell chrome (sidebar, mobile nav, footer, error boundary) and primitives | [View](src/components/codemap.md) |
| `src/components/ui/` | Page-level primitive kit (PageHeader, MetricBox, ChartPanel, Card…) | [View](src/components/ui/codemap.md) |
| `src/components/widgets/` | Self-fetching embeddable widget cards | [View](src/components/widgets/codemap.md) |
| `src/pages/` | Route-level screens and the route table mapping | [View](src/pages/codemap.md) |
| `src/pages/corporate-suite/` | Tabbed Corporate Suite sub-views sharing `SuiteStateV6` | [View](src/pages/corporate-suite/codemap.md) |
| `src/services/` | Data-access layer: transport, cache, typed facade, API clients, restaurant engines, extension bridge | [View](src/services/codemap.md) |
| `src/hooks/` | Fetch lifecycle hooks, shared realm, theme, page titles | [View](src/hooks/codemap.md) |
| `src/data/` | Static game data (resources, buildings, retail maps) + tree builder + methodology copy | [View](src/data/codemap.md) |
| `src/types/` | Ambient API/domain TypeScript contracts | [View](src/types/codemap.md) |
| `src/utils/` | Formatters and versioned localStorage wrapper | [View](src/utils/codemap.md) |

## Other Top-Level Folders
- `extension/` — Manifest V3 browser extension (content/background/bridge scripts, popup, icons, zipped build). Bridges live Sim Companies pages into the Corporate Suite.
- `public/` — static assets (`404.html` SPA redirect, `favicon.ico`, `widget.js` embed script).
- `scripts/validate-csv-data.ts` — data validation utility (run manually).
- `docs/superpowers/{plans,specs}/` — restaurant planner plan and design spec.
- Top-level notes: `API_INTEGRATION.md`, `VERIFICATION.md`, `calculator-validation-issues.md`.

## Build / Run
- `npm run dev` (Vite, port 5174, proxies `/api`) · `npm run build` (`tsc -b && vite build`) · `npm run preview` · `npm run lint` (`tsc --noEmit`).
- Tests: Vitest + Testing Library + jsdom (`npm test`); coverage via `npm run test:coverage`.
- Env: `VITE_API_BASE` (default `/api`), `VITE_API_PROXY` (dev proxy target).
- CI: `.github/workflows/ci.yml`.

## Known Drift / Watch-outs
- `src/pages/XpCalculator.tsx` exists and the Sidebar links to `/xp-calculator`, but `App.tsx` has **no matching route** → falls through to `NotFound`.
- `src/pages/BoardRoom.tsx` and `src/pages/ProductionFlow.tsx` exist but are **not routed** from `App.tsx` (ProductionFlow is linked from Encyclopedia only).
- Sidebar has no link to `/about`; `/executive-optimizer` is an alias that renders `CorporateSuitePage`.
- `src/pages/Alerts.tsx` is a placeholder ("pending backend integration").
- `src/types/api.ts` includes analytics/intelligence shapes that are not yet produced by any endpoint.
- README claims React 18 / Framer Motion; `package.json` is React 19 and has no Framer Motion dependency.
