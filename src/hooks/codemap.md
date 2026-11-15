# src/hooks/

## Responsibility
React adapters that turn service calls into fetch lifecycle state (`data`, `loading`, `error`, `refresh`) and own cross-page UI state (theme, realm, document title).

## Design
- **Generic primitives**: `useDataRepo(fetcher, deps, fallback?)` runs once per dep change; `useDataRepoPoll(fetcher, intervalMs, deps, fallback?)` adds `setInterval(refresh)`. Both keep fetchers in refs so consumers can pass inline closures without re-trigger loops.
- **Domain wrappers**: `useDataQueries.ts` binds one hook per dataset and standardizes polling intervals (60 s dashboard/latest/margins, 120 s history/indexes/inflation/retail).
- **Shared realm**: `useSharedRealm()` persists realm to `localStorage["simco_realm"]` and broadcasts a `realm_change` CustomEvent so every mounted hook follows the same realm.
- **Theme + titles**: `useTheme()` persists `light|dark` and flips the `dark` class; `usePageTitle`/`usePageTitleKey` set `document.title` from the `PAGE_TITLES` map.

## Flow
`useProfitMargins()` → `useSharedRealm()` → `useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm])` → initial load + 60 s refresh → page renders `loading | error | data`.

## Files
- `useDataRepo.ts` — `useDataRepo`, `useDataRepoPoll`.
- `useDataQueries.ts` — `useDashboardState`, `useMacroLatest`, `useMacroHistory`, `useMacroIndexes`, `useMacroInflation`, `useMacroPhases`, `useProfitMargins`, `useRetailData`, `useCompanyData`, `useResourcePriceHistory`.
- `useSharedRealm.ts` — `useSharedRealm()` → `[realm, setRealm]`, localStorage + `realm_change` event.
- `useTheme.ts` — `useTheme()` → `{ theme, toggleTheme }` (or equivalent), `Theme` type.
- `usePageTitle.ts` — `usePageTitle(title, suffix)`, `PAGE_TITLES`, `PageTitleKey`, `usePageTitleKey`.

## Integration
- Consumers: essentially every page and several components (`Sidebar`, `Sidebar`'s theme toggle).
- Depends on: `src/services/dataRepo.ts`, `src/services/simcompanies-api.ts` types, browser `localStorage`/`window`.
