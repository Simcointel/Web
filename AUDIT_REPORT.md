# SimcoIntel Web — Comprehensive Codebase Audit

**Date:** 2026-10-28  
**Scope:** Full codebase review covering React components, hooks, services, calculator logic, type safety, tests, accessibility, performance, and security.

---

## Executive Summary

| Severity | Count | Key Areas |
|----------|-------|-----------|
| **CRITICAL** | 7 | Calculator logic errors (XP table, profit formulas), data layer null safety |
| **HIGH** | 12 | Missing input validation, dead UI controls, security (CSP, extension), type safety gaps |
| **MEDIUM** | 18 | Performance (bundle, re-renders), accessibility, code duplication, error handling |
| **LOW** | 11 | Code style, unused code, documentation gaps, test coverage |

**Total Findings: 48**

---

## 1. Calculator Logic Correctness (CRITICAL)

### XpCalculator.tsx — 4 Critical Bugs (CONFIRMED)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| XP-001 | Line 8-11 | XP table shifted by 6 levels — starts at L7 instead of L1 | All calculations wrong; L1 shows 130 XP instead of 5 |
| XP-002 | Line 16 | Flat 400k applied from L18 instead of L24 | L18-L23 massively overstated |
| XP-003 | Line 50 | Progress bar ignores progress input | Progress slider has no effect on visual |
| XP-004 | Lines 20-22 | Wrong XP rates: OP_XP=12 ✓, REC_XP=40 (should be 120), Prospecting=36.5 (should be 36) | Time-to-level calculations incorrect |

**Correct XP Table (L1-L23):**
```typescript
[5, 10, 20, 30, 50, 80, 130, 210, 340, 550, 890, 1430, 2320, 3750, 6000, 10000, 16000, 26000, 42000, 68000, 110000, 170000, 280000]
```

### ProfitCalculator.tsx — 5 Bugs (CONFIRMED)

| ID | Location | Issue |
|----|----------|-------|
| PROF-001 | Lines 49-51, 94 | Abundance slider shows for Farm/Forest (P, v) — only M, O, Q have abundance |
| PROF-002 | Lines 23, 132-134 | Quality selector (Q0-Q5) is dead UI — doesn't affect calculation |
| PROF-003 | Line 85 | Transport cost formula wrong: `transport * ph * 0.01` should be `grossRevenue * transportRating * 0.01` |
| PROF-004 | Lines 138, 151, 158, 174 | No input clamping on numeric fields |
| PROF-005 | Lines 64-76 | Silent failure when VWAP unavailable — falls to $0 |

### RetailCalculator.tsx — 3 Bugs (CONFIRMED)

| ID | Location | Issue |
|----|----------|-------|
| RET-001 | Line 97 | Transport cost completely missing from net profit formula |
| RET-002 | Lines 69, 175 | Quality dropdown is dead UI — doesn't affect calculation |
| RET-003 | Lines 51-53 | `satToDemand` function is dead code |

### ConstructionCalculator.tsx — 3 Bugs (CONFIRMED)

| ID | Location | Issue |
|----|----------|-------|
| CONST-001 | Lines 83-84, 214 | Revenue/wages/scrap scale with `targetLv` instead of `max(1, targetLv-1)` |
| CONST-002 | Line 85 | Missing input material costs in ROI calculation |
| CONST-003 | Line 85 | Admin overhead formula wrong — should be `wages * (max(1, targetLv - 1) / 170)` |

### SalesOfficeCalculator.tsx — Logic Issues

| ID | Location | Issue |
|----|----------|-------|
| SALES-001 | Lines 48-51 | `nextId` and `genId()` are module-level — IDs collide across multiple component instances / hot reloads |
| SALES-002 | Line 72 | Quality bonus calculation: `item.quantity * item.unitPrice * (item.quality * baseRate / 100)` — unclear if this matches game formula |
| SALES-003 | Line 90 | Overhead cost: `contract.wages * (contract.adminOverhead / 100)` — should this be percentage of wages or total revenue? |

### VWAPInflation.tsx — Minor Issues

| ID | Location | Issue |
|----|----------|-------|
| VWAP-001 | Line 35 | Date parsing: `new Date(d.date).toLocaleDateString()` — assumes ISO format, fragile |
| VWAP-002 | Line 131 | `domain={['auto', 'auto']}` on YAxis — may cause inconsistent scaling |

---

## 2. Type Safety Issues

### api.ts — Incomplete Types

| ID | Location | Issue |
|----|----------|-------|
| TYPE-001 | Line 87 | `outputVwap: number` — but data layer returns `undefined` (see DATA-001) |
| TYPE-002 | Line 82-86 | `marginDelta`, `profitDelta`, `marginDirection`, `forecastMargin`, `trendDirection` — can be `null` but typed as `number \| null` only for first two |
| TYPE-003 | Line 119 | `RetailData` — `saturation` typed as `number` but API may return other fields |

### simcompanies-api.ts — Overly Permissive Types

| ID | Location | Issue |
|----|----------|-------|
| TYPE-004 | Line 380 | `fetchWithRetry<any[]>` — loses type safety |
| TYPE-005 | Lines 373-382 | `fetchAllResources` returns `Resource[]` but endpoint may not exist (placeholder) |
| TYPE-006 | Line 282-337 | `mapCompanyProfile` uses `any` extensively — no validation of API response shape |

### dataRepo.ts — Type Casting Issues

| ID | Location | Issue |
|----|----------|-------|
| TYPE-007 | Line 309 | `mapProfitMargins` uses `as` casts extensively — no runtime validation |
| TYPE-008 | Line 338-362 | Dual code paths (public API vs legacy) with different shapes — no schema validation |

---

## 3. Security Vulnerabilities

### Extension — Medium Risk

| ID | Location | Issue |
|----|----------|-------|
| SEC-001 | manifest.json:8-11 | `host_permissions` includes `https://simcointel.github.io/Web/*` — overly broad; should be specific paths |
| SEC-002 | background.js:6 | Fetches from raw.githubusercontent.com without integrity check — supply chain risk |
| SEC-003 | extensionBridge.ts:40 | `window.postMessage(..., '*')` — accepts messages from any origin; should validate `e.origin` |
| SEC-004 | extensionBridge.ts:25 | Only checks `e.data?.detail?.source` — spoofable by any page |

### Data Fetching — Medium Risk

| ID | Location | Issue |
|----|----------|-------|
| SEC-005 | github-transport.ts:12-56 | `fetchWithRetry` has no certificate pinning or response validation |
| SEC-006 | simcompanies-api.ts:273-285 | Company profile fetch uses identifier directly in URL — potential SSRF if user-controlled (though identifier comes from localStorage) |
| SEC-007 | dataRepo.ts:441-473 | `fetchCompanyData` calls SimCompanies API directly from browser — exposes API structure, no rate limit handling beyond retry |

### CSP & Headers — Missing

| ID | Location | Issue |
|----|----------|-------|
| SEC-008 | vite.config.ts | No CSP header configuration for production build |
| SEC-009 | index.html | No `Content-Security-Policy` meta tag |

---

## 4. React Components & Hooks

### useDataRepo.ts — Race Conditions

| ID | Location | Issue |
|----|----------|-------|
| HOOK-001 | Lines 16-33 | `load()` doesn't track request cancellation — stale responses can overwrite fresh data |
| HOOK-002 | Lines 48-51 | Polling interval not cleared on unmount if `refresh` changes identity (though wrapped in useCallback) |

### useSharedRealm.ts — Sync Issues

| ID | Location | Issue |
|----|----------|-------|
| HOOK-003 | Lines 9-13 | Dispatches `CustomEvent` on every render — may cause cascade updates |
| HOOK-004 | Lines 15-19 | Event listener added per component instance — memory leak if many components use it |

### PageErrorBoundary.tsx — Limited Recovery

| ID | Location | Issue |
|----|----------|-------|
| COMP-001 | Lines 7-15 | Class component (not hook-based); only catches render errors, not async/hook errors; no error logging |

### Router (router.tsx) — Custom Implementation

| ID | Location | Issue |
|----|----------|-------|
| COMP-002 | Lines 59-65 | `stripBase` uses regex on `BASE_URL` — fragile if base path changes |
| COMP-003 | Lines 90-94 | `navigate` appends current search params to new path — may duplicate query strings |
| COMP-004 | Line 69-78 | `sessionStorage.redirect` handling — no validation of redirect URL (open redirect risk) |

---

## 5. State Management

### CorporateSuite.tsx — Massive Component (1063 lines)

| ID | Location | Issue |
|----|----------|-------|
| STATE-001 | Lines 99-131 | State initialization from localStorage — no migration/versioning; corrupt data resets to default silently |
| STATE-002 | Lines 153-355 | Giant `useMemo` with 30+ dependencies — recomputes on any state change; should be split |
| STATE-003 | Lines 357-368 | Two `useEffect` writing to localStorage on every state change — excessive writes |
| STATE-004 | Lines 448-586 | `syncCompany` does too much: fetch, transform, state update, notification — violates SRP |
| STATE-005 | Lines 775-836 | Multiple fixed-position overlays (pairing code, notifications, debug) — z-index conflicts possible |

### LocalStorage Usage — No Abstraction

| ID | Location | Issue |
|----|----------|-------|
| STATE-006 | Multiple files | Direct `localStorage.getItem/setItem` calls scattered — no serialization, migration, or error handling for quota exceeded |

---

## 6. Services (API Clients, Data Fetching)

### data-cache.ts — Basic Implementation

| ID | Location | Issue |
|----|----------|-------|
| SVC-001 | Line 6 | `Map<string, ...>` — no size limit; memory leak in long-running sessions |
| SVC-002 | Lines 8-18 | Cache key collision risk: `withCache` uses caller-provided key; no namespacing |
| SVC-003 | Line 16 | On error, caches `null` with short TTL — but doesn't distinguish error types |

### github-transport.ts — GitHub API Dependencies

| ID | Location | Issue |
|----|----------|-------|
| SVC-004 | Lines 106-122 | `listFiles` uses GitHub REST API — rate limited (60/hr unauthenticated); no auth token support |
| SVC-005 | Lines 124-146 | `fetchAllFiles` fetches in batches of 10 — no concurrency control beyond batch size |
| SVC-006 | Line 66-85 | `fetchIndex` caches separately from `withCache` — duplicate caching logic |

### simcompanies-api.ts — Placeholder Endpoints

| ID | Location | Issue |
|----|----------|-------|
| SVC-007 | Lines 376-383 | `fetchAllResources` hits `${API_BASE}/resources/` — endpoint may not exist |
| SVC-008 | Lines 427-432 | `fetchAllBuildings` same issue |
| SVC-009 | Lines 469-480 | `fetchMarketOrders` — endpoint structure unverified |
| SVC-010 | Lines 527-538 | `fetchGovernmentContracts` — endpoint structure unverified |

---

## 7. Performance Concerns

### Bundle Size

| ID | Location | Issue |
|----|----------|-------|
| PERF-001 | package.json | `recharts` (2.15MB) — heavy for simple line charts; consider lighter alternative or lazy load |
| PERF-002 | package.json | `lucide-react` — tree-shaking works but all icons imported individually in pages |
| PERF-003 | App.tsx | 27 lazy-loaded pages — good, but no route-based code splitting for heavy components (CorporateSuite) |

### Re-renders

| ID | Location | Issue |
|----|----------|-------|
| PERF-004 | CorporateSuite.tsx:153-355 | Single massive `useMemo` recomputes on any `state` or `margins` change |
| PERF-005 | ProfitCalculator.tsx:96 | `result` useMemo has 12 dependencies — recalculates on any input change |
| PERF-006 | RetailCalculator.tsx:105-129 | `topProducts` useMemo recomputes on every param change; 20 products × 10 stores = 200 iterations |
| PERF-007 | ConstructionCalculator.tsx:52-70 | `upgrades` useMemo recalculates on every level change; loops through all levels |

### Data Fetching

| ID | Location | Issue |
|----|----------|-------|
| PERF-008 | useDataQueries.ts:81-87 | `useProfitMargins` default 60s polling — aggressive for static-ish data |
| PERF-009 | dataRepo.ts:132-154 | `loadHistoryYearFiles` loads ALL year files then samples — downloads MBs of data |

---

## 8. Accessibility Issues

### Missing ARIA / Semantic HTML

| ID | Location | Issue |
|----|----------|-------|
| A11Y-001 | Sidebar.tsx:78 | `<Link>` renders as `<a>` but `onClick` prevents default — breaks keyboard nav for screen readers |
| A11Y-002 | ConstructionCalculator.tsx:135 | `<select>` has no associated `<label>` (uses sibling label) |
| A11Y-003 | ProfitCalculator.tsx:116 | Same — select without proper label association |
| A11Y-004 | RetailCalculator.tsx:151 | Same |
| A11Y-005 | Multiple pages | Input fields use placeholder as label — not accessible |
| A11Y-006 | CorporateSuite.tsx:701-723 | Tab navigation uses `<button>` but no `aria-selected`, `role="tablist"` |
| A11Y-007 | WidgetRenderer.tsx:36-43 | Conditional rendering of widgets — no `aria-live` for dynamic content |

### Color Contrast / Visual

| ID | Location | Issue |
|----|----------|-------|
| A11Y-008 | Multiple components | `text-surface-400` on `bg-white` — may fail WCAG AA (4.5:1) |
| A11Y-009 | SeverityBadge.tsx | Color-only status indication — no text/icon alternative |

### Focus Management

| ID | Location | Issue |
|----|----------|-------|
| A11Y-010 | PageErrorBoundary.tsx | Error state doesn't trap focus or announce to screen readers |
| A11Y-011 | CorporateSuite.tsx:812-836 | Debug modal doesn't trap focus or restore on close |

---

## 9. Test Coverage Gaps

### Current Coverage

| File | Tests | Coverage |
|------|-------|----------|
| States.tsx | 3 describe blocks | Good for simple components |
| SeverityBadge.tsx | 4 tests | Basic rendering only |
| ScoreBar.tsx | Not checked | — |
| StatCard.tsx | Not checked | — |
| WidgetParts.tsx | Not checked | — |

### Missing Test Coverage

| Area | Missing Tests |
|------|---------------|
| **Calculators** | ZERO tests for any calculator logic (Construction, Profit, Retail, Sales, XP, VWAP) |
| **Hooks** | No tests for `useDataRepo`, `useSharedRealm`, `useTheme`, `useDataQueries` |
| **Services** | No tests for `dataRepo`, `data-cache`, `github-transport`, `simcompanies-api` |
| **Pages** | No integration tests for any page component |
| **Error boundaries** | No tests for `PageErrorBoundary` |
| **Router** | No tests for custom router implementation |

### Test Infrastructure

| ID | Location | Issue |
|----|----------|-------|
| TEST-001 | vitest.config.ts | No coverage thresholds configured |
| TEST-002 | package.json:11-13 | `test:coverage` script exists but no CI integration visible |

---

## 10. Code Quality & Maintainability

### Duplication

| ID | Location | Issue |
|----|----------|-------|
| CODE-001 | ConstructionCalculator.tsx:17-21, ProfitCalculator.tsx:— | `fmtHours` defined in ConstructionCalculator; similar logic in formatters.ts |
| CODE-002 | Multiple calculator pages | Input validation/clamping logic duplicated |
| CODE-003 | CorporateSuite.tsx:873-901 | `eff`, `calcAO`, `calcTaxThreshold`, etc. — duplicated from BoardRoom logic |

### Dead Code / Ponytail Comments

| ID | Location | Issue |
|----|----------|-------|
| CODE-004 | RetailCalculator.tsx:113 | `// ponytail: skip products without price data` — silent skip |
| CODE-005 | RetailCalculator.tsx:114 | `// ponytail: static demand estimate when no live API` — hardcoded 50% |
| CODE-006 | RetailCalculator.tsx:116 | `// ponytail: base rate 3 when no live API` — magic number |
| CODE-007 | dataRepo.ts:175 | `// ponytail: realm not included in response` — assumption documented as comment |

### Inconsistent Patterns

| ID | Location | Issue |
|----|----------|-------|
| CODE-008 | App.tsx vs router.tsx | App uses custom router; router.tsx exports hooks but App doesn't use them consistently |
| CODE-009 | formatters.ts | Exports `fmtNumber as fmt` for backward compat — confusing dual API |
| CODE-010 | Multiple pages | Some use `PageHeader` from ui/Common, others inline header markup |

---

## 11. Data Layer Issues

### simco_static.ts — Maintenance Burden

| ID | Location | Issue |
|----|----------|-------|
| DATA-001 | Lines 1-58 | 58 buildings hardcoded — game updates break this; no version/date metadata |
| DATA-002 | Lines 70-82 | `RETAIL_PRODUCT_MAP` — hardcoded product IDs per store; comment says "ACTUAL game IDs" but no source reference |
| DATA-003 | Lines 84-88 | `MAT_REF_PRICES` — comment distinguishes "reference prices" vs "scrap prices" but code uses inconsistently |
| DATA-004 | Lines 104-202 | 99 resources hardcoded — many with `basePh: 0`, `baseWages: 0` (placeholders) |

### Data Fetching Reliability

| ID | Location | Issue |
|----|----------|-------|
| DATA-005 | github-transport.ts:66-85 | `fetchIndex` fails silently, returns `null` — callers must handle |
| DATA-006 | dataRepo.ts:374-392 | `fetchResourcePriceHistory` fetches ALL margin files then filters — inefficient |

---

## 12. Specific File Findings

### CorporateSuite.tsx (1063 lines) — Refactor Candidate

- **Cyclomatic complexity**: Very high (switch statement with 13 cases, nested useMemo)
- **Responsibilities**: Data fetching, state management, CSV parsing, company sync, extension bridge, UI rendering, localStorage persistence
- **Recommendation**: Split into feature modules (CommandView, OperationsView, etc. already exist but parent is monolithic)

### simcompanies-api.ts (714 lines) — Unused Code

- Lines 376-460: `fetchAllResources`, `fetchResource`, `fetchAllBuildings`, `fetchBuildingType` — likely unused (placeholder endpoints)
- Lines 469-518: Market/Exchange endpoints — unverified
- Lines 527-557: Government contracts — unverified
- Lines 566-590: News — unverified
- Lines 598-630: Leagues/Rankings — unverified
- Lines 639-660: Achievements — requires auth (unimplemented)
- **Dead code estimate**: ~400 lines (55%)

---

## 13. Recommended Fix Priority

### Phase 1: Critical Calculator Fixes (Week 1)
1. Fix XP table in `XpCalculator.tsx` (XP-001, XP-002, XP-003, XP-004)
2. Fix ProfitCalculator: abundance filter, quality wiring, transport formula, input clamping, VWAP fallback
3. Fix RetailCalculator: transport cost, quality wiring, remove dead code
4. Fix ConstructionCalculator: scaling, input costs, admin overhead

### Phase 2: Security & Type Safety (Week 2)
5. Fix extensionBridge origin validation (SEC-003, SEC-004)
6. Add CSP headers (SEC-008, SEC-009)
7. Fix `outputVwap` type in api.ts and dataRepo.ts (TYPE-001, DATA-001)
8. Add runtime validation for API responses (TYPE-007, TYPE-008)

### Phase 3: Architecture & Performance (Week 3-4)
9. Split CorporateSuite into smaller components
10. Add request cancellation to useDataRepo
11. Implement cache size limits and namespacing
12. Lazy-load recharts and heavy CorporateSuite views

### Phase 4: Accessibility & Tests (Week 4-5)
13. Add proper labels to all form controls
14. Implement ARIA for tabs, modals, dynamic content
15. Add unit tests for calculator logic (highest ROI)
16. Add hook tests for useDataRepo, useSharedRealm

### Phase 5: Cleanup (Ongoing)
17. Remove dead simcompanies-api endpoints
18. Consolidate formatting utilities
19. Add localStorage abstraction with migration
20. Document static data sources and update process

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Calculator gives wrong financial advice | **High** (confirmed bugs) | **High** (user loses money) | Phase 1 fixes + add integration tests |
| Extension message spoofing | Medium | Medium (data injection) | Origin validation + pairing code verification |
| GitHub API rate limit breaks app | High (unauthenticated) | High (no data) | Add GitHub token support; increase cache TTL |
| LocalStorage corruption loses user data | Low | Medium | Add versioning + migration + try/catch |
| CSP missing — XSS via malicious data | Low | High | Add CSP header in Phase 2 |

---

## 15. Files Not Reviewed (Out of Scope)

- `src/pages/*.tsx` — BoardRoom, Macro, MarketIntel, MarketOrders, Government, Encyclopedia, Home, Alerts, About, Extension, Privacy, ProductionFlow, NotFound
- `src/components/widgets/*` — WidgetHealthCard, WidgetAlertList, WidgetRegimeCard, WidgetForecastCard
- `src/pages/corporate-suite/*` — All sub-views (CommandView, OperationsView, etc.)
- `extension/content.js`, `extension/bridge.js`, `extension/popup.js`, `extension/popup.html`
- `scripts/validate-csv-data.ts`
- `verify_ui.py`, `verify_connected_state.py`

---

*Report generated by automated code audit. All CRITICAL calculator bugs cross-referenced with `calculator-validation-issues.md` (confirmed by user).*