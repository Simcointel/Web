# src/utils/

## Responsibility
Cross-cutting client helpers: number/currency/percent formatting and a versioned, safe `localStorage` wrapper.

## Design
- **Pure formatter functions** (`formatters.ts`): no i18n framework, fixed `en-US`-style formatting, graceful handling of nullish values (`fmtSafe`).
- **Storage abstraction with migration hooks** (`storage.ts`): keys are namespaced with `simco_`, a `simco_storage_version` marker enables sequential migrations (`migrations[]`, currently empty), and all access is wrapped in try/catch so private-mode/quota errors never crash a page.
- **Convenience object** `storage` bundles get/set/remove for ergonomic call sites.

## Flow
Page computes a value → `fmtCurrency(n)` / `fmtPct(n)` / `fmtNumber(n)` → string rendered in a table/card.
Page needs persistence → `getStorage(key, fallback)` / `setStorage(key, value)` → `localStorage["simco_<key>"]`, with `migrateLegacyStorage()` run once at startup if needed.

## Files
- `formatters.ts` — `fmtNumber`, `fmtCurrency`, `fmtLocale`, `fmtInteger`, `fmtPct`, `fmtDuration`, `fmtHours`, `fmtSafe`, `fmtVWAP`, `fmtProfit`.
- `storage.ts` — `getStorage`, `setStorage`, `removeStorage`, `clearAllStorage`, `storage`, `migrateLegacyStorage`; version/migration internals.

## Integration
- Consumers: all pages that display money/percentages; `useSharedRealm` and theme/preferences persistence use the same `localStorage` conventions.
- Depends on: browser `localStorage` only.
