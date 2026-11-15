# src/

## Responsibility
Application source root: bootstrap (`main.tsx`), shell + route table (`App.tsx`), base-aware history router (`router.tsx`), runtime config (`config.ts`), and the feature folders `components/`, `pages/`, `hooks/`, `services/`, `data/`, `types/`, `utils/`.

## Design
- **No routing library.** `router.tsx` implements `createRouter` over `history.pushState`/`popstate`, strips the Vite `BASE_URL` (`/Web/`) so deep links work on GitHub Pages, and renders pages from an exact-match chain in `App.tsx`.
- **Route-level code splitting** via `React.lazy` for every page; shared shell stays eager.
- **Unidirectional data flow**: page → hook → service → transport. Pages never call `fetch` (the sole exception is `simcompanies-api.ts` used by MarketOrders).
- **Runtime config** is a single env-derived constant (`VITE_API_BASE`, default `/api`) exposed through `apiUrl(path)`.
- **Theme** is class-based (`dark` on the shell), realm is a shared localStorage value.

## Flow
`index.html` → `src/main.tsx` → `createRouter()` → `<RouterProvider>` → `<AppShell path>` → lazy page → hook → service → GitHub raw/backend API → render.

## Files
- `main.tsx` — `createRoot(...).render(<StrictMode><Main/></StrictMode>)`; wires router provider.
- `App.tsx` — `AppShell({path})`: lazy page table (all 4 fixed routes present), widget/corporate-suite shell exceptions, `Suspense` fallback, `PageErrorBoundary`.
- `router.tsx` — `RouterProvider`, `useLocation`, `useNavigate`, `useSearchParams`, `Link`, `createRouter`, `SearchParams`; base-stripping and `sessionStorage.redirect` handling for GitHub Pages 404 redirects.
- `config.ts` — `API_BASE`, `apiUrl(path)`.
- `vite-env.d.ts` — Vite client type reference.
- `index.css` — Tailwind entry (outside the codemap include pattern, but loaded by `main.tsx`).

## Integration
- Entry: `index.html` → `main.tsx`.
- Sub-maps: `components/`, `pages/`, `hooks/`, `services/`, `data/`, `types/`, `utils/`.
- Build: Vite (`vite.config.ts`, base `/Web/`), TS project refs (`tsconfig.json`), Tailwind (`tailwind.config.js`), tests via Vitest + Testing Library.
- **Vite config updated**: `host: true` for container network access, proxy to `http://localhost:3001`.

## Key Fixes (Phase 3)
- ✅ `/xp-calculator` route present in `App.tsx`
- ✅ `BoardRoom.tsx` deleted (duplicate of `corporate-suite/BoardRoomView.tsx`)
- ✅ `/about` link present in Sidebar
- ✅ `Alerts.tsx` rewritten to call `/api/public/alerts` (returns `[]` initially)
- ✅ README fixed: React 19, no Framer Motion
- ✅ `CorporateSuite.tsx` split → thin container (`CorporateSuiteContainer.tsx` ~650 lines) + `BoardRoomView.tsx` extracted
- ✅ All 4 calculators use owned data sources (zero `cooperinc.xyz` calls)
- ✅ `types/api.ts` - `CalculatorLiveData`, `PhaseCoefficients`, `Alert`, `AlertsResponse` added
- ✅ `dataRepo.ts` - `fetchCalculatorLive()`, `fetchPhaseCoefficients()` added

## Verification Status (as of 2026-11-15)
- ✅ Build: `npm run build` passes
- ✅ Tests: `npm test` - 88 tests pass
- ✅ Vite dev server starts on port 5175 with `host: true`
- ✅ API proxy to backend on port 3001 configured
- ⏳ DevTools Network tab verification: zero `cooperinc.xyz` calls (Task 3.13) — **manual step required**
- ⏳ Corporate Suite 11 tabs load <2s measurement — **manual step required**
- ⏳ Lighthouse CI >90 scores — **manual step required** (run GitHub Actions or local)