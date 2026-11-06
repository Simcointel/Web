# Extension auth-data sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Corporate tab pull the signed-in player's SimCompanies auth-data through the browser extension, with no server storage.

**Architecture:** The extension's background worker fetches `auth-data/` (falling back to a relay through an open SimCompanies tab), stores it in `chrome.storage.local`, and the web page reads it through the existing `bridge.js` postMessage channel. A pure mapper merges the payload into `SuiteStateV6`.

**Tech Stack:** React 19 + TypeScript + Vitest (Web), vanilla MV3 extension scripts (Firefox `background.scripts` + Chromium `service_worker`).

**Spec:** `docs/superpowers/specs/2026-11-06-extension-auth-data-sync-design.md`

## Global Constraints

- Target Firefox first; Chrome/Edge/Brave must also load. Manifest keeps `"scripts": ["background.js"]` and adds `"service_worker": "background.js"`. Version `1.2.3`.
- Extension message handlers: plain (non-`async`) listener, `return true`, call `sendResponse` later. Never an `async` listener.
- New extension code uses callback-style `chrome.storage` / `chrome.tabs` calls.
- No new extension permissions.
- Payload stays in the browser. No backend call, no GitHub write.
- Page-side auth request timeout: 15 s. Existing company-data request stays 2 s.
- The working tree already holds unrelated uncommitted changes: stage only the files named in each task.
- No Firefox-incompatible APIs (`chrome.scripting`, `offscreen`, `declarativeNetRequest`).

## Review Focus

- Fetched while signed out or with no SimCompanies tab: button must show an error and leave state untouched, never silently do nothing.
- Extension storage cleared / never synced: `applyAuthData` must not blank fields the public-API sync already filled.
- `productionModifier` / `money` at `0` or missing: must not corrupt `prodBonus` or `cash` with `NaN`.
- Firefox background asleep when the button is clicked: `sendMessage` must wake it and still respond.
- Bridge on `localhost:5173` (dev) vs deployed origin: both must be served by the content script.

---

### Task 1: Payload type + pure mapper

**Files:**
- Modify: `src/types/api.ts` (append interface)
- Create: `src/pages/corporate-suite/authData.ts`
- Test: `src/__tests__/pages/authData.test.ts`

**Interfaces:**
- Consumes: `SuiteStateV6` from `src/pages/corporate-suite/types.ts`, `DEFAULT_STATE` for test fixtures.
- Produces:
  - `export interface AuthDataPayload { authCompany?: {...}; authUser?: { email?: string }; levelInfo?: {...}; temporals?: { contest?: { id?: number; name?: string } | null }; syncedAt?: string }`
  - `export function applyAuthData(prev: SuiteStateV6, payload: AuthDataPayload, now?: Date): SuiteStateV6`

- [ ] **Step 1: Add the payload type to `src/types/api.ts`**

Append:

```ts
export interface AuthDataPayload {
  authCompany?: {
    companyId?: number;
    company?: string;
    logo?: string;
    level?: number;
    rank?: number;
    money?: number;
    extraBuildingSlots?: number;
    productionModifier?: number;
    salesModifier?: number;
  };
  authUser?: { email?: string };
  levelInfo?: {
    level?: number;
    levelName?: string;
    experience?: number;
    experienceToNextLevel?: number;
    maxBuildings?: number;
    capabilities?: Record<string, boolean>;
  };
  temporals?: { contest?: { id?: number; name?: string } | null };
  syncedAt?: string;
}
```

- [ ] **Step 2: Write the failing test**

`src/__tests__/pages/authData.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyAuthData } from "../../pages/corporate-suite/authData";
import { DEFAULT_STATE } from "../../pages/corporate-suite/types";

const now = new Date("2026-11-06T10:00:00Z");

describe("applyAuthData", () => {
  it("maps account fields into suite state", () => {
    const next = applyAuthData(DEFAULT_STATE, {
      authCompany: {
        companyId: 5090204,
        company: "ONE GROUP OF ENTERPRISES",
        logo: "https://example.com/logo.png",
        level: 24,
        rank: 5979,
        money: 1859157,
        extraBuildingSlots: 4,
        productionModifier: 4,
        salesModifier: 1,
      },
    }, now);

    expect(next.companyId).toBe("5090204");
    expect(next.companyName).toBe("ONE GROUP OF ENTERPRISES");
    expect(next.companyLogo).toBe("https://example.com/logo.png");
    expect(next.companyLevel).toBe(24);
    expect(next.companyRank).toBe(5979);
    expect(next.extraSlots).toBe(4);
    expect(next.settings.cash).toBe(1859157);
    expect(next.settings.prodBonus).toBe(16);
    expect(next.settings.profileSalesBonus).toBe(1);
    expect(next.lastSynced).toBe(now.toLocaleTimeString());
  });

  it("keeps fields the payload does not carry", () => {
    const prev = {
      ...DEFAULT_STATE,
      companyName: "OLD",
      workers: 500,
      companyValue: 12345,
      map: [{ id: "b1", level: 2 }],
      settings: { ...DEFAULT_STATE.settings, prodBonus: 12, cash: 99 },
    };
    const next = applyAuthData(prev, { authCompany: { company: "NEW" } }, now);

    expect(next.companyName).toBe("NEW");
    expect(next.workers).toBe(500);
    expect(next.companyValue).toBe(12345);
    expect(next.map).toEqual([{ id: "b1", level: 2 }]);
    expect(next.settings.prodBonus).toBe(12);
    expect(next.settings.cash).toBe(99);
  });

  it("ignores non-finite numbers", () => {
    const next = applyAuthData(DEFAULT_STATE, {
      authCompany: { level: NaN as unknown as number, money: undefined, productionModifier: undefined },
    }, now);
    expect(next.companyLevel).toBe(DEFAULT_STATE.companyLevel);
    expect(next.settings.cash).toBe(DEFAULT_STATE.settings.cash);
    expect(next.settings.prodBonus).toBe(DEFAULT_STATE.settings.prodBonus);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/pages/authData.test.ts`
Expected: FAIL — cannot resolve `../../pages/corporate-suite/authData`.

- [ ] **Step 4: Implement `applyAuthData` in `src/pages/corporate-suite/authData.ts`**

```ts
import type { AuthDataPayload } from "../../types/api";
import type { SuiteStateV6 } from "./types";

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

export function applyAuthData(
  prev: SuiteStateV6,
  payload: AuthDataPayload,
  now: Date = new Date(),
): SuiteStateV6 {
  const c = payload.authCompany ?? {};
  const settings = { ...prev.settings };

  const productionModifier = num(c.productionModifier);
  if (productionModifier !== undefined) settings.prodBonus = 12 + productionModifier;
  const salesModifier = num(c.salesModifier);
  if (salesModifier !== undefined) settings.profileSalesBonus = salesModifier;
  const money = num(c.money);
  if (money !== undefined) settings.cash = money;

  return {
    ...prev,
    companyId: c.companyId != null ? String(c.companyId) : prev.companyId,
    companyName: c.company || prev.companyName,
    companyLogo: c.logo || prev.companyLogo,
    companyLevel: num(c.level) ?? prev.companyLevel,
    companyRank: num(c.rank) ?? prev.companyRank,
    extraSlots: num(c.extraBuildingSlots) ?? prev.extraSlots,
    settings,
    lastSynced: now.toLocaleTimeString(),
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/pages/authData.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/api.ts src/pages/corporate-suite/authData.ts src/__tests__/pages/authData.test.ts
git commit -m "feat(corporate): map extension auth-data into suite state"
```

---

### Task 2: Page bridge request

**Files:**
- Modify: `src/services/extensionBridge.ts`

**Interfaces:**
- Consumes: `AuthDataPayload` from `src/types/api.ts`.
- Produces: `export async function requestAuthData(): Promise<{ authData: AuthDataPayload | null; error?: string }>`

- [ ] **Step 1: Implement `requestAuthData`**

Add alongside `requestExtensionData`. Same origin checks, 15 000 ms timeout, listens for `simcointel:auth-data-response`, posts `{ type: "simcointel:auth-data-request", source: "simcointel-web" }`, and resolves `{ authData, error }` from `e.data.detail`. Reject with `new Error("Timeout waiting for extension response")` on timeout.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/services/extensionBridge.ts
git commit -m "feat(web): request auth-data over the extension bridge"
```

---

### Task 3: Background worker fetch + relay + storage

**Files:**
- Modify: `extension/background.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: runtime message `{ type: "simcointel:fetch-auth-data" }` → response `{ ok: true, data: AuthDataPayload } | { ok: false, error: string }`; writes `chrome.storage.local["simcointel-auth-data"]` = `{ ...payload, syncedAt }`.

- [ ] **Step 1: Add the fetch and handler**

Constants: `AUTH_URL = 'https://www.simcompanies.com/api/v3/companies/auth-data/'`, `AUTH_KEY = 'simcointel-auth-data'`, `COMPANY_TAB = 'https://www.simcompanies.com/*'`.

`fetchAuthDataDirect()`: `fetch(AUTH_URL, { credentials: 'include', headers: { Accept: 'application/json' } })`; return parsed JSON only when `res.ok` and `data.authCompany` exists, else `null`.

`fetchAuthDataFromTab()`: wrap `chrome.tabs.query({ url: COMPANY_TAB }, cb)` and `chrome.tabs.sendMessage(tab.id, { type: 'simcointel:fetch-auth-data' }, cb)` in a Promise; resolve `res?.data` on `res?.ok`, `null` on `chrome.runtime.lastError` or no tab.

`fetchAuthData()`: try direct, then tab; if neither yields data return `{ ok: false, error: 'not-signed-in' }`; otherwise add `syncedAt: new Date().toISOString()`, `chrome.storage.local.set` it, return `{ ok: true, data }`.

Top-level listener (plain, `return true`):

```js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'simcointel:fetch-auth-data') return false;
  fetchAuthData()
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
  return true;
});
```

- [ ] **Step 2: Verify syntax**

Run: `node --check extension/background.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add extension/background.js
git commit -m "feat(extension): fetch auth-data in the background worker"
```

---

### Task 4: Content script — remove sync UI, add auth fetch

**Files:**
- Modify: `extension/content.js`

**Interfaces:**
- Produces: runtime message `{ type: "simcointel:fetch-auth-data" }` → `{ ok: true, data } | { ok: false, error }`.

- [ ] **Step 1: Remove the sync button and manual trigger**

- Delete `createSyncButton`, `updateSyncButton`, their `onReady` call, and every `document.getElementById('simcointel-sync-btn')` branch inside `syncCompanyData`.
- Delete the `simcointel:trigger-sync` branch of `chrome.runtime.onMessage`.
- Drop the `reason` parameter and the `reason === 'manual'` / `reason !== 'manual'` conditions: `syncCompanyData()` now always applies the 15 s throttle. Update the four call sites (`load`, `settle`, `dom-change`, popstate) to pass nothing.

- [ ] **Step 2: Add the auth fetch handler**

```js
async function fetchAuthData() {
  const res = await fetch(`${API_V3}/companies/auth-data/`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'simcointel:fetch-auth-data') return false;
  fetchAuthData()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true;
});
```

- [ ] **Step 3: Verify syntax**

Run: `node --check extension/content.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add extension/content.js
git commit -m "feat(extension): serve auth-data from the SimCompanies content script"
```

---

### Task 5: Bridge relay

**Files:**
- Modify: `extension/bridge.js`

**Interfaces:**
- Consumes: `simcointel:fetch-auth-data` from Task 3.
- Produces: page message `simcointel:auth-data-response` with `detail: { authData, error?, source: 'simcointel-extension' }`.

- [ ] **Step 1: Add `AUTH_KEY` to the storage read**

Include `AUTH_KEY` in `getStorageData`, `createDataElement`, and `notifyPage` (both the published payload and the request response).

- [ ] **Step 2: Add the request handler**

```js
function handleAuthRequest(event) {
  if (!isAllowedOrigin(event.origin)) return;
  if (event.data?.type !== 'simcointel:auth-data-request') return;
  if (event.data?.source !== 'simcointel-web') return;
  chrome.runtime.sendMessage({ type: 'simcointel:fetch-auth-data' }, (res) => {
    const error = chrome.runtime.lastError?.message || (res?.ok ? undefined : res?.error);
    window.postMessage({
      type: 'simcointel:auth-data-response',
      detail: {
        authData: res?.ok ? res.data : null,
        error,
        source: 'simcointel-extension',
      },
    }, window.location.origin);
  });
}
window.addEventListener('message', handleAuthRequest);
```

- [ ] **Step 3: Verify syntax**

Run: `node --check extension/bridge.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add extension/bridge.js
git commit -m "feat(extension): relay auth-data requests through the bridge"
```

---

### Task 6: Popup — remove Sync Now

**Files:**
- Modify: `extension/popup.html`
- Modify: `extension/popup.js`

- [ ] **Step 1: Remove the button and its logic**

Delete `<button class="sync-btn" id="syncNowBtn">Sync Now</button>` and the now-unused `.sync-btn` CSS block. Delete `triggerManualSync`, its `getElementById('syncNowBtn').addEventListener` line, and the `syncNowBtn` references. Keep `updateSyncStatus`, `loadSyncStatus`, the status dot, last-sync line, and pairing input.

- [ ] **Step 2: Verify**

Run: `node --check extension/popup.js`
Expected: no output. Then `Select-String -Path extension/popup.js,extension/popup.html -Pattern "syncNowBtn|triggerManualSync"` returns nothing.

- [ ] **Step 3: Commit**

```bash
git add extension/popup.html extension/popup.js
git commit -m "feat(extension): remove popup sync button"
```

---

### Task 7: Manifest

**Files:**
- Modify: `extension/manifest.json`

- [ ] **Step 1: Apply the manifest changes**

- `"version": "1.2.3"`.
- `background`: `{ "scripts": ["background.js"], "service_worker": "background.js" }`.
- Second content-script `matches`: add `"http://localhost:5173/*"` and `"http://localhost:3000/*"` next to the existing `simcointel.github.io` entries.

- [ ] **Step 2: Verify JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add extension/manifest.json
git commit -m "chore(extension): cross-browser background + localhost bridge"
```

---

### Task 8: Corporate tab wiring

**Files:**
- Modify: `src/pages/corporate-suite/types.ts`
- Modify: `src/pages/corporate-suite/CommandView.tsx`
- Modify: `src/pages/CorporateSuite.tsx`

**Interfaces:**
- Consumes: `requestAuthData` (Task 2), `applyAuthData` (Task 1).
- Produces: `SuiteViewProps.onSyncAccount?: () => void` (replaces `onImportFromExtension`).

- [ ] **Step 1: Swap the prop type**

In `types.ts`, replace `onImportFromExtension?: () => void;` with `onSyncAccount?: () => void;`.

- [ ] **Step 2: Replace the button**

In `CommandView.tsx`, destructure `onSyncAccount`, change the button's `onClick` to `onSyncAccount`, label to `Sync Account`, and icon from `Upload` to `RefreshCw` (update the `lucide-react` import; drop `Upload` if unused). Update the helper copy under the card to: `Fetches your signed-in account data (money, level, rank, slots, modifiers) through the extension.`

- [ ] **Step 3: Wire the handler**

In `CorporateSuite.tsx`, replace the `requestExtensionData` import with `requestAuthData`, and replace `importFromExtension` with:

```ts
const syncAccount = async () => {
  setShowPairingCode(false);
  try {
    if (!(await isExtensionAvailable())) {
      setNotification({ msg: 'Extension not detected', type: 'error' });
      return;
    }
    setNotification({ msg: 'Fetching account data from extension...', type: 'success' });
    const { authData, error } = await requestAuthData();
    if (!authData) {
      setNotification({ msg: error === 'not-signed-in' ? 'Sign in on simcompanies.com, then retry' : (error || 'No account data received'), type: 'error' });
      return;
    }
    setState((prev) => applyAuthData(prev, authData));
    setNotification({ msg: `Account synced: ${authData.authCompany?.company ?? 'company'}`, type: 'success' });
  } catch (e) {
    setNotification({ msg: 'Extension not detected', type: 'error' });
    setDebugData({ error: e instanceof Error ? e.message : String(e) });
  }
};
```

Replace both `CommandView` `onImportFromExtension={importFromExtension}` props with `onSyncAccount={syncAccount}`. Add `import { applyAuthData } from "./corporate-suite/authData";`. Remove imports only used by the deleted function (check `MapItem`, `BUILDINGS` usage remains elsewhere — keep if still referenced).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run src/__tests__/pages/authData.test.ts`
Expected: clean, tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/corporate-suite/types.ts src/pages/corporate-suite/CommandView.tsx src/pages/CorporateSuite.tsx
git commit -m "feat(corporate): sync account auth-data from the extension"
```

---

### Task 9: Full verification

**Files:** none

- [ ] **Step 1: Run the Web suite**

Run: `npx tsc --noEmit; npm test`
Expected: no type errors; all test files pass.

- [ ] **Step 2: Syntax-check every changed extension script**

Run: `node --check extension/background.js; node --check extension/content.js; node --check extension/bridge.js; node --check extension/popup.js`
Expected: no output.

- [ ] **Step 3: Manual acceptance (Firefox)**

1. Reload the temporary add-on at `about:debugging`.
2. Sign in at simcompanies.com, keep that tab open.
3. Run `npm run dev`, open `http://localhost:5173/corporate-suite`, Command tab.
4. Click **Sync Account** → company name, level, rank, money in the header; `lastSynced` updated.
5. In the extension inspector, `chrome.storage.local.get('simcointel-auth-data')` returns the payload with `syncedAt`.
6. Close the SimCompanies tab, sign out, click again → "Sign in on simcompanies.com, then retry", state unchanged.
7. Reload the add-on in Chrome (load unpacked) and repeat 2–4 if available.

- [ ] **Step 4: Commit any fixes**

Commit only if the manual pass surfaced changes; use the owning task's message style.
