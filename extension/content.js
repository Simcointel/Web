/* SimcoIntel content script — injects market data overlay into SimCompanies pages */
/* Also extracts company data on EVERY SimCompanies page and merges it into chrome.storage.local,
   because different stats live on different pages (profile, buildings, market, ...). */

(function() {
  'use strict';

  function log(message, type = 'info') {
    const prefix = '[SimcoIntel]';
    if (type === 'error') console.error(prefix, message);
    else if (type === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }

  const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';
  const API_V3 = 'https://www.simcompanies.com/api/v3';
  const STORAGE_KEY = 'simcointel-company-data';
  const SYNC_THROTTLE_MS = 15000;
  const API_THROTTLE_MS = 60000;
  let lastApiAt = 0;

  function createOverlay() {
    const div = document.createElement('div');
    div.id = 'simcointel-overlay';
    div.style.cssText = `
      position: fixed; bottom: 16px; right: 16px; z-index: 999999;
      background: rgba(15, 23, 42, 0.95); border: 1px solid #334155;
      border-radius: 8px; padding: 12px; font-size: 11px;
      color: #e2e8f0; font-family: -apple-system, sans-serif;
      max-width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: none;
    `;
    div.innerHTML = `
      <div style="font-weight:700;font-size:12px;margin-bottom:6px;color:#f8fafc">SimcoIntel <span style="color:#3b82f6">Market Data</span></div>
      <div id="simcointel-data">Loading...</div>
      <div style="margin-top:6px;font-size:10px;color:#64748b;text-align:right">Click to open dashboard</div>
    `;
    div.addEventListener('click', () => {
      window.open('https://simcointel.github.io/Web', '_blank');
    });
    document.body.appendChild(div);
    return div;
  }

  async function loadData() {
    log('Loading market data overlay...');
    const overlay = document.getElementById('simcointel-overlay') || createOverlay();
    const dataDiv = document.getElementById('simcointel-data');
    try {
      const margins = await fetch(`${API_BASE}/public/realm-0/margins.json`).then(r => r.json());
      if (margins?.length) {
        const top = margins
          .filter(r => r.outputVwap > 0)
          .sort((a, b) => b.marginPct - a.marginPct)
          .slice(0, 3);
        dataDiv.innerHTML = top.map(r =>
          `<div style="display:flex;justify-content:space-between;padding:2px 0">
            <span style="color:#94a3b8">${r.name}</span>
            <span style="font-weight:600;color:${r.marginPct >= 0 ? '#22c55e' : '#ef4444'}">${r.marginPct.toFixed(1)}%</span>
          </div>`
        ).join('');
        overlay.style.display = 'block';
      }
    } catch (err) {
      dataDiv.textContent = 'Data unavailable';
    }
  }

  // --- Storage helpers -------------------------------------------------------

  function storageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result?.[key] ?? null));
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  }

  // --- Company data extraction ----------------------------------------------

  // Handles "1,234", "4.5%", "$1.2M", "12K", ...
  function parseNumber(raw) {
    if (raw == null) return null;
    const m = String(raw).match(/(\d[\d,\s]*(?:\.\d+)?|\.\d+)\s*([KMB])?/i);
    if (!m) return null;
    const num = parseFloat(m[1].replace(/[,\s]/g, ''));
    if (!isFinite(num)) return null;
    const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1;
    return num * mult;
  }

  function isCompanyPage() {
    return /\/company\//.test(window.location.pathname);
  }

  function findCompanyIdFromLinks(companyName) {
    const links = document.querySelectorAll('a[href*="/company/"]');
    for (const a of links) {
      const text = a.textContent.trim();
      if (companyName && text.toLowerCase() === companyName.toLowerCase()) {
        const m = (a.getAttribute('href') || '').match(/\/company\/(\d+)/);
        if (m) return m[1];
      }
    }
    const headerLink = document.querySelector('header a[href*="/company/"], nav a[href*="/company/"]');
    const m = headerLink && (headerLink.getAttribute('href') || '').match(/\/company\/(\d+)/);
    return m ? m[1] : null;
  }

  function extractCompanyId(existing) {
    const fromLink = findCompanyIdFromLinks(existing?.companyName);
    if (fromLink) return fromLink;
    if (existing?.companyId) return String(existing.companyId);
    const m = window.location.pathname.match(/\/company\/(\d+)/);
    return m ? m[1] : null;
  }

  function extractCompanyName() {
    if (isCompanyPage()) {
      const named = document.querySelector('[class*="company-name"], [class*="companyName"]');
      if (named && named.textContent.trim()) return named.textContent.trim();
      const h = document.querySelector('h1, h2');
      if (h && h.textContent.trim()) return h.textContent.trim();
    }
    const headerLink = document.querySelector('header a[href*="/company/"], nav a[href*="/company/"]');
    const linkText = headerLink ? headerLink.textContent.trim() : '';
    return linkText && linkText.length < 60 ? linkText : null;
  }

  // Header/nav first: those hold the logged-in player's summary on every page.
  function headerText() {
    const header = document.querySelector('header, nav');
    return header ? header.innerText : '';
  }

  function pageText() {
    const header = headerText();
    return (header ? header + '\n' : '') + document.body.innerText;
  }

  function grab(patterns, text = pageText()) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m) return m[1];
    }
    return null;
  }

  function extractLevel() {
    return parseNumber(
      grab([/\bCompany\s+level\s*[:#]?\s*(\d+)/i]) ||
      grab([/\bLv\.?\s*[:#]?\s*(\d+)/i, /\bLevel\s*[:#]?\s*(\d+)/i], headerText()) ||
      (isCompanyPage() ? grab([/\bLevel\s*[:#]?\s*(\d+)/i]) : null)
    );
  }

  function extractRank() {
    return parseNumber(
      grab([/\bCompany\s+rank(?:ing)?\s*[:#]?\s*([\d,]+)/i]) ||
      grab([/\bRank(?:ing)?\s*[:#]?\s*([\d,]+)/i], headerText()) ||
      (isCompanyPage() ? grab([/\bRank(?:ing)?\s*[:#]?\s*([\d,]+)/i]) : null)
    );
  }

  function extractCompanyValue() {
    return parseNumber(
      grab([
        /\bCompany\s+value\s*[:#]?\s*\$?\s*([\d,.]+\s*[KMB]?)/i,
        /\bNet\s+worth\s*[:#]?\s*\$?\s*([\d,.]+\s*[KMB]?)/i,
      ]) ||
      (isCompanyPage() ? grab([/\bValue\s*[:#]?\s*\$?\s*([\d,.]+\s*[KMB]?)/i]) : null)
    );
  }

  function extractWorkers() {
    return parseNumber(grab([
      /\bWorkers?\s*[:#]?\s*([\d,]+)/i,
      /([\d,]+)\s+workers\b/i,
    ]));
  }

  // Stored as a fraction (0.045) — the dashboard renders apiAO * 100.
  function extractAO() {
    const raw = grab([
      /\b(?:Administration\s+overhead|Admin\s+overhead)\s*[:#]?\s*([\d.,]+)\s*%/i,
      /\bAO\s*[:#]?\s*([\d.,]+)\s*%/i,
    ]);
    const num = parseNumber(raw);
    if (num == null) return null;
    return num > 1 ? num / 100 : num;
  }

  function extractGovernmentTier() {
    return parseNumber(grab([
      /\bGovernment(?:\s+orders?)?\s*tier\s*[:#]?\s*(\d+)/i,
      /\bGov\.?\s*tier\s*[:#]?\s*(\d+)/i,
      /\bGO\s*tier\s*[:#]?\s*(\d+)/i,
    ]));
  }

  function extractBuildings() {
    if (!isCompanyPage() && !/buildings/i.test(window.location.pathname)) return [];
    const buildings = [];
    const seen = new Set();
    const candidates = document.querySelectorAll('[class*="building"], .card');

    candidates.forEach((el) => {
      const nameEl = el.querySelector('[class*="building-name"], .name, h3, h4, strong, b');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();
      if (!name || name.length > 40) return;

      const kind =
        el.getAttribute('data-building-kind') ||
        el.getAttribute('data-kind') ||
        el.getAttribute('data-building') ||
        ((el.querySelector('a[href*="/buildings/"]')?.getAttribute('href') || '').match(/\/buildings\/([A-Za-z0-9]+)/) || [])[1] ||
        null;

      const levelEl = el.querySelector('[class*="level"]');
      const level = levelEl ? parseNumber(levelEl.textContent) : null;
      const key = kind || `${name}:${level}`;
      if (seen.has(key)) return;
      seen.add(key);
      buildings.push({ id: kind || undefined, name, level, type: null });
    });

    return buildings;
  }

  function isViewingOtherCompany(companyId) {
    const m = window.location.pathname.match(/\/company\/(\d+)/);
    return !!(m && companyId && m[1] !== String(companyId));
  }

  function extractDomData() {
    return {
      companyName: extractCompanyName() || undefined,
      companyLevel: extractLevel() ?? undefined,
      companyRank: extractRank() ?? undefined,
      companyValue: extractCompanyValue() ?? undefined,
      workers: extractWorkers() ?? undefined,
      apiAO: extractAO() ?? undefined,
      governmentOrderTierIndex: extractGovernmentTier() ?? undefined,
      buildings: extractBuildings(),
      provider: 'dom',
    };
  }

  // --- Official API (same origin, uses the logged-in session) ---------------

  function mapApiProfile(data) {
    if (!data || typeof data !== 'object') return null;
    const pub = data.companyPublicInfo || {};
    const inf = data.infrastructure || {};
    const hist = data.history || {};
    const buildings = Array.isArray(inf.buildings)
      ? inf.buildings.map((b) => ({
          id: b.kind,
          level: (b.size > 0 ? b.size : b.level) || 1,
          instanceId: b.id,
        })).filter((b) => b.id)
      : [];

    return {
      companyId: data.id != null ? String(data.id) : undefined,
      companyName: pub.company || data.name || undefined,
      companyLevel: pub.level ?? data.level ?? undefined,
      companyRank: pub.rank ?? data.rank ?? undefined,
      companyValue: hist.value ?? undefined,
      workers: inf.workers ?? undefined,
      apiAO: inf.administrationOverhead ?? undefined,
      governmentOrderTierIndex: data.governmentOrderTierIndex ?? undefined,
      extraSlots: pub.extraBuildingSlots ?? undefined,
      onlineStatus: pub.online ?? undefined,
      buildings,
      provider: 'api',
    };
  }

  async function fetchApiProfile(companyId, realm) {
    if (!companyId) return null;
    const base = realm === 1 ? `${API_V3}/entrepreneurs/companies` : `${API_V3}/companies`;
    try {
      const res = await fetch(`${base}/${companyId}/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      return mapApiProfile(await res.json());
    } catch (err) {
      log(`API profile unavailable: ${err.message}`, 'warn');
      return null;
    }
  }

  function extractRealm() {
    const m = pageText().match(/Realm\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
  }

  // --- Merge + sync ----------------------------------------------------------

  function mergeData(existing, incoming) {
    const merged = { ...(existing || {}) };
    for (const [key, value] of Object.entries(incoming)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (typeof value === 'number' && value === 0 && merged[key]) continue;
      merged[key] = value;
    }
    merged.companyId = merged.companyId ? String(merged.companyId) : '';
    merged.extractedAt = merged.extractedAt || new Date().toISOString();
    merged.syncedAt = new Date().toISOString();
    return merged;
  }

  let syncing = false;
  let syncingPromise = null;
  let lastSyncAt = 0;

  async function syncCompanyData(reason = 'auto') {
    if (syncing) return syncingPromise;
    const now = Date.now();
    if (reason !== 'manual' && now - lastSyncAt < SYNC_THROTTLE_MS) return null;
    lastSyncAt = now;
    syncing = true;

    syncingPromise = (async () => {
      try {
        const existing = await storageGet(STORAGE_KEY);
        const companyId = extractCompanyId(existing) || null;
        const realm = extractRealm();

        const dom = isViewingOtherCompany(companyId)
          ? { realm }
          : {
              ...extractDomData(),
              companyId: companyId || undefined,
              companyName: extractCompanyName() || undefined,
              realm,
            };
        const apiProfile = (reason === 'manual' || now - lastApiAt > API_THROTTLE_MS)
          ? await fetchApiProfile(companyId, realm)
          : null;
        if (apiProfile) lastApiAt = Date.now();
        const apiClean = apiProfile
          ? Object.fromEntries(Object.entries(apiProfile).filter(([, v]) => v !== undefined && v !== null))
          : null;
        const incoming = apiClean ? { ...dom, ...apiClean } : dom;

        const merged = mergeData(existing, {
          ...incoming,
          companyId: incoming.companyId || companyId || undefined,
          realm,
        });

        const changed = JSON.stringify({ ...merged, syncedAt: null }) !==
          JSON.stringify({ ...(existing || {}), syncedAt: null });
        if (changed) {
          await storageSet(STORAGE_KEY, merged);
          log(`Company data synced (${merged.provider || 'dom'}, ${reason})`, 'success');
        }

        if (reason === 'manual' && document.getElementById('simcointel-sync-btn')) {
          updateSyncButton('success', 'Synced!');
          setTimeout(() => updateSyncButton('default', 'Sync to Dashboard'), 2000);
        }
        return merged;
      } catch (err) {
        log('Sync failed: ' + err.message, 'error');
        if (reason === 'manual' && document.getElementById('simcointel-sync-btn')) {
          updateSyncButton('error', 'Sync failed');
          setTimeout(() => updateSyncButton('default', 'Sync to Dashboard'), 3000);
        }
        throw err;
      } finally {
        syncing = false;
        syncingPromise = null;
      }
    })();

    return syncingPromise;
  }

  // --- In-page sync button (shown on every SimCompanies page) ---------------

  function createSyncButton() {
    const btn = document.createElement('div');
    btn.id = 'simcointel-sync-btn';
    btn.style.cssText = `
      position: fixed; bottom: 16px; left: 16px; z-index: 999999;
      background: rgba(15, 23, 42, 0.95); border: 1px solid #3b82f6;
      border-radius: 8px; padding: 10px 14px; font-size: 12px;
      color: #e2e8f0; font-family: -apple-system, sans-serif;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex; align-items: center; gap: 6px;
      transition: all 0.2s;
    `;
    btn.innerHTML = `
      <span style="color:#3b82f6;font-size:14px;">&#x21bb;</span>
      <span id="simcointel-sync-text">Sync to Dashboard</span>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateSyncButton('syncing', 'Syncing...');
      syncCompanyData('manual').catch(() => {});
    });
    document.body.appendChild(btn);
    return btn;
  }

  function updateSyncButton(status, message) {
    const btn = document.getElementById('simcointel-sync-btn');
    if (!btn) return;
    const text = document.getElementById('simcointel-sync-text');
    if (text) text.textContent = message;
    if (status === 'syncing') {
      btn.style.borderColor = '#f59e0b';
      btn.style.opacity = '0.7';
    } else if (status === 'success') {
      btn.style.borderColor = '#22c55e';
    } else if (status === 'error') {
      btn.style.borderColor = '#ef4444';
    }
  }

  // --- Init ------------------------------------------------------------------

  let syncTimer = null;
  function scheduleSync(delay = 2500) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncCompanyData('dom-change').catch(() => {}), delay);
  }

  let lastUrl = window.location.href;
  function watchUrlChanges() {
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        scheduleSync(1500);
      }
    }, 2000);
  }

  function onReady() {
    setTimeout(loadData, 3000);

    if (!document.getElementById('simcointel-sync-btn') && document.body) {
      createSyncButton();
    }

    setTimeout(() => syncCompanyData('load').catch(() => {}), 1200);
    setTimeout(() => syncCompanyData('settle').catch(() => {}), 6000);

    const observer = new MutationObserver(() => scheduleSync(2500));
    observer.observe(document.body, { childList: true, subtree: true });

    watchUrlChanges();
    window.addEventListener('popstate', () => scheduleSync(1500));
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'simcointel:trigger-sync') {
      syncCompanyData('manual')
        .then((data) => sendResponse({ success: true, company: data?.companyName || null }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
    return false;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
