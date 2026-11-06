# Extension auth-data sync — Design

- Date: 2026-11-06
- Status: Draft, awaiting approval
- Scope: `Web` only (`extension/`, `src/services/extensionBridge.ts`, `src/pages/CorporateSuite.tsx`, `src/pages/corporate-suite/`)

## Intent

Let the Corporate tab pull the logged-in player's account data through the browser
extension, because `https://www.simcompanies.com/api/v3/companies/auth-data/` is
session-bound: only the signed-in browser can fetch it, and no server can.

The data is fetched by the extension, stored in `chrome.storage.local`, and read by
the page through the existing bridge. One new button in Corporate → Command starts
the sync. Every sync button inside the extension is removed.

## Why now

- The Corporate tab can only sync a company through the public API, which has no
  access to account-only fields (money, experience, capabilities, contest).
- The existing "Import from Extension" button reads scraped DOM data, which is
  guesswork. Auth-data is exact and comes from SimCompanies itself.
- The extension currently has two sync buttons (popup "Sync Now" and the in-page
  "Sync to Dashboard"), and neither fetches auth-data.

## Goals

- Fetch auth-data from the extension on demand and merge it into `SuiteStateV6`.
- One trigger: "Sync Account" in the Corporate tab's Extension Bridge card.
- Keep the payload in the browser only. No backend endpoint, no GitHub data repo
  write, nothing public.

## Non-goals

- No server-side user store (rejected in favour of a browser-only design).
- No new UI beyond the one button. Extra auth-data fields that no existing view
  renders (`experience`, `capabilities`, `contest`, `email`, `encKey`) are stored
  in `chrome.storage` but not surfaced yet.
- Realm 1 uses the same realm-0 endpoint path. If it turns out to need a realm
  segment, that is a follow-up.
- The pairing code stays as-is (it is unused plumbing today, not a sync button).

## Cross-browser (Firefox first, Chrome/Edge/Brave too)

- `manifest.json` keeps `"scripts": ["background.js"]` for Firefox and adds
  `"service_worker": "background.js"` for Chromium ≥ 121, which ignores `scripts`
  on MV3. Both browsers read their own key; `browser_specific_settings.gecko`
  stays. Version bumps to `1.2.3`.
- Every message handler uses the plain-listener pattern
  `(msg, sender, sendResponse) => { …; return true; }`. Firefox honours `return true`
  and Chromium ignores promises returned by `onMessage` listeners, so this is the
  one shape that works in both. No `async` listeners.
- New extension code uses callback-style `chrome.storage` / `chrome.tabs` calls
  (Firefox's promise support is on `browser.*`; the existing code's promise usage
  is left alone).
- The tab-relay path is the reliable cookie path on Firefox: the content script's
  fetch is same-origin to SimCompanies and always carries the session. The
  service-worker fetch is attempted first only as a shortcut.
- No Firefox-incompatible APIs are introduced (`chrome.scripting`, `offscreen`,
  `declarativeNetRequest` are not used). Host permission for `simcompanies.com`
  must be granted in Firefox's extension permissions; that is already true for a
  working install, since `content.js` injects there today.

## Current state

- `extension/content.js` runs on simcompanies.com: scrapes the DOM, fetches
  `/api/v3/companies/{id}/`, merges into `chrome.storage.local['simcointel-company-data']`,
  and injects a floating **Sync to Dashboard** button.
- `extension/bridge.js` is a content script injected **only** on
  `https://simcointel.github.io/Web*`. It reads storage and answers
  `postMessage` from the page.
- `extension/popup.js` has **Sync Now**, which messages the SimCompanies tab to
  run the same sync.
- `src/services/extensionBridge.ts` requests company data over `postMessage` with
  a 2 s timeout.
- `CorporateSuite.tsx` merges that into state via `importFromExtension`.
- `extension/manifest.json` declares `background.scripts` without `service_worker`.
  Chrome ≥ 121 ignores `scripts` on MV3, so the background script does not run in
  Chrome today. The relay below needs it, so the manifest is fixed.

## Approaches considered

1. **Bridge-only (chosen).** Extension fetches, `chrome.storage.local` holds the
   payload, page reads it via the existing bridge. No backend, nothing to deploy,
   email never leaves the browser. Cost: data is lost if extension storage is
   cleared, and it is per-browser.
2. **Backend-persisted.** POST to a new authenticated per-user endpoint keyed by
   pairing code, so it survives and syncs across devices. Rejected: needs a user
   data store, auth, and a privacy decision for account email, all to feed one
   panel.
3. **Auto-capture, no button.** Extension fetches on every SimCompanies visit.
   Rejected: the request is for a button in the Corporate tab.

## How it works

```
Corporate "Sync Account"
  → extensionBridge.requestAuthData()        postMessage {simcointel:auth-data-request}
  → bridge.js                                validates origin, forwards
  → background.js                            chrome.runtime.sendMessage
      1. fetch auth-data with credentials:'include'
      2. on failure, relay to an open simcompanies tab
      3. store 'simcointel-auth-data' (+syncedAt)
  → bridge.js                                postMessage {simcointel:auth-data-response}
  → applyAuthData(prevState, payload)
```

- Background is the only place that can fetch cross-origin without page CORS, so it
  owns the fetch. The tab relay covers cookie policies that block service-worker
  requests.
- No tab is opened automatically. If neither path works the button reports
  "Open simcompanies.com and sign in, then retry".
- On success the page also shows the sync time in the existing `lastSynced` slot.

### Mapping into `SuiteStateV6`

| auth-data | state |
|---|---|
| `authCompany.companyId` | `companyId` |
| `authCompany.company` | `companyName` |
| `authCompany.logo` | `companyLogo` |
| `authCompany.level` | `companyLevel` |
| `authCompany.rank` | `companyRank` |
| `authCompany.extraBuildingSlots` | `extraSlots` |
| `authCompany.productionModifier` | `settings.prodBonus` = `12 + modifier` |
| `authCompany.salesModifier` | `settings.profileSalesBonus` |
| `authCompany.money` | `settings.cash` |
| sync time | `lastSynced` |

Fields auth-data does not carry (`workers`, `companyValue`, `map`, `apiAO`,
`governmentTier`) keep their previous values. Mapping lives in a pure module so it
can be unit-tested.

## Removals

- `popup.html` / `popup.js`: **Sync Now** button and `triggerManualSync`.
  Status dot, last-sync line, and pairing input stay.
- `content.js`: the floating **Sync to Dashboard** button (`createSyncButton`,
  `updateSyncButton`), and the now-unused `simcointel:trigger-sync` message
  handler. Automatic DOM/API extraction is unchanged.
- `CommandView.tsx`: "Import from Extension" is replaced by "Sync Account".
  `importFromExtension` is deleted; "CONNECT"/"Re-Sync" (public API) stay.

## Manifest changes

- `background`: add `"service_worker": "background.js"` next to `"scripts"` so
  Chromium runs it and Firefox keeps working (see Cross-browser).
- `bridge.js` content-script matches: add `http://localhost:5173/*` and
  `http://localhost:3000/*`, so the button works against the local dev site.
  `ALLOWED_ORIGINS` already lists both.
- Version `1.2.2` → `1.2.3`, so the reloaded package is distinguishable.

No new extension permissions: `storage` is present, `host_permissions` already
covers `simcompanies.com`, and `tabs.query`/`tabs.sendMessage` work with that host
permission.

The page-side request timeout for auth-data is 15 s (the existing company-data
request keeps 2 s), because the background worker may need to wake and relay
through a tab.

## Files

| File | Change |
|---|---|
| `extension/manifest.json` | service worker key, localhost bridge matches |
| `extension/content.js` | remove sync button + trigger handler, add auth fetch handler |
| `extension/background.js` | auth fetch, tab fallback, storage write, message handler |
| `extension/bridge.js` | relay auth request/response, publish auth data |
| `extension/popup.html`, `extension/popup.js` | remove Sync Now |
| `src/services/extensionBridge.ts` | `requestAuthData()` |
| `src/pages/corporate-suite/authData.ts` | payload type + `applyAuthData` (new) |
| `src/__tests__/pages/authData.test.ts` | mapping test (new) |
| `src/pages/corporate-suite/CommandView.tsx` | "Sync Account" button |
| `src/pages/CorporateSuite.tsx` | handler wiring, drop `importFromExtension` |

## Risks

- Service-worker cookies may be blocked by SameSite policy. Covered by the tab
  relay; if both fail the button says so instead of silently stalling.
- The extension must be reloaded in the browser after the change. Verification is
  manual; the mapping logic is unit-tested.
- Chrome loads `service_worker`, Firefox loads `scripts`. Edge store uploads reject
  a manifest with both keys; unpacked local installs are unaffected.
- Cross-browser messaging is the fragile part: verified against MDN/Chrome docs
  (`return true` + `sendResponse` works in both), but there is no automated test for
  the extension. Manual check on Firefox is the acceptance test; Chrome is checked
  the same way if available.

## Verification

- `npm test` in `Web` (new mapping test plus existing suite) and `npx tsc --noEmit`.
- `node --check` on each changed extension script.
- Manual: reload the temporary add-on in Firefox (`about:debugging`), sign in to
  SimCompanies, open the site, click **Sync Account**, confirm name/level/rank/money
  populate and `chrome.storage.local` holds `simcointel-auth-data`. Repeat with
  Chrome load-unpacked if available.
- Manual negative: signed out or no SimCompanies tab → clear error, no state change.
