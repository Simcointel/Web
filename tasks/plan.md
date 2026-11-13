# Implementation Plan: Firebase Remote Config Maintenance Mode

## Overview
Add a global kill switch / maintenance mode to the frontend using Firebase Remote Config. Admin toggles a boolean in Firebase Console → all users see a full-screen maintenance overlay within seconds. No code changes, no deploys, no git workflow.

## Architecture Decisions
- **Firebase Remote Config** — unlimited free reads/writes, instant propagation, web console UI
- **Fetch on app init** — check config before rendering any page; if maintenance enabled, show overlay and block all API calls
- **Minimal dependencies** — only `firebase/app` and `firebase/remote-config` (~15kb gzipped)
- **Fail-open** — if Firebase fails to load, app works normally (never block users due to config failure)

## Task List

### Phase 1: Setup & Config
- [ ] Task 1: Install Firebase SDK packages
- [ ] Task 2: Create Firebase config module with Remote Config initialization
- [ ] Task 3: Add Vite env vars for Firebase credentials (user provides)

### Phase 2: Core Hook & Component
- [ ] Task 4: Create `useMaintenanceMode` hook — fetches & subscribes to Remote Config
- [ ] Task 5: Create `MaintenanceOverlay` component — full-screen, accessible, branded
- [ ] Task 6: Integrate into `AppShell` — early check, render overlay instead of app

### Phase 3: Polish & Verify
- [ ] Task 7: Add loading state while fetching config (show spinner briefly)
- [ ] Task 8: Test locally with mock config
- [ ] Task 9: Document Firebase Console setup steps for admin

### Checkpoint: Complete
- [ ] Build passes (`npm run build`)
- [ ] TypeScript clean (`npm run lint`)
- [ ] Manual test: toggle in Firebase Console → overlay appears/disappears

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase SDK adds bundle size | Low | ~15kb gzipped; code-split if needed |
| Remote Config fetch fails | Medium | Fail-open: default `enabled: false`, log error, continue |
| Stale cache on user device | Low | `minimumFetchIntervalMillis: 0` for dev, 60s for prod |
| Admin forgets to disable | Medium | Add `retryAfter` param; overlay shows countdown |

## Open Questions
- User needs to create Firebase project and provide config values (will provide .env.example)
- Default fetch interval: 60s prod, 0s dev — acceptable?