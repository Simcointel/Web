# Todo: Gist-based Maintenance Mode (Kill Switch)

## Phase 1: Setup & Config
- [x] Create `src/services/maintenance-config.ts` — Gist fetch + shared-bucket cache
- [x] Create `.env.example` with `VITE_MAINTENANCE_CONFIG_URL`

## Phase 2: Core Hook & Component
- [x] Create `src/hooks/useMaintenanceMode.ts` — fetches/polls the flag
- [x] Create `src/components/MaintenanceOverlay.tsx` — full-screen overlay component
- [x] Modify `src/App.tsx` — integrate maintenance check in AppShell

## Phase 3: Polish & Verify
- [x] Add loading skeleton while fetching config
- [x] Test build (`npm run build`) and lint (`npm run lint`)
- [x] Create `MAINTENANCE_MODE.md` with Gist setup steps
- [x] All tests pass (88)

## Checkpoint: Complete
- [x] Build passes (`npm run build`)
- [x] Lint passes (`npm run lint`)
- [x] 88 tests pass (`npm test`)
- [ ] **USER ACTION**: Create public GitHub Gist with `maintenance.json` + copy raw URL to `.env`
- [ ] **USER ACTION**: Deploy and verify toggle in Gist edit page

## Why Gist over Firebase
- Firebase free tier: 100,000 fetch requests/day → throttles silently after grace period
- 60s poll × 1,000 users = 1.4M requests/day → 14× over quota
- Gist: zero quota, ~30s propagation via shared time-bucket cache-buster, free forever