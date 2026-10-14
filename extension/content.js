/* SimcoIntel content script — injects market data overlay into SimCompanies pages */
/* Also extracts company data and stores it in chrome.storage.local for the web dashboard */

(function() {
  'use strict';

  function log(message, type = 'info') {
    const prefix = '[SimcoIntel]';
    if (type === 'error') console.error(prefix, message);
    else if (type === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }

  const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';
  const STORAGE_KEY = 'simcointel-company-data';

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

  // --- Company data extraction for web dashboard sync ---

  function extractCompanyId() {
    const match = window.location.pathname.match(/\/company\/(\d+)/);
    return match ? match[1] : null;
  }

  function extractCompanyName() {
    const heading = document.querySelector('h1, h2, .company-name, .company-title');
    if (heading) return heading.textContent.trim();
    const title = document.querySelector('title');
    if (title) {
      const m = title.textContent.match(/^(.*?)(?:\s*-\s*SimCompanies|$)/i);
      return m ? m[1].trim() : title.textContent.trim();
    }
    return 'Unknown Company';
  }

  function extractNumber(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.\-]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  function extractStats() {
    const stats = {};
    const allText = document.body.innerText;

    const statElements = document.querySelectorAll('.stat, .stat-value, .company-stat, .company-level, .company-rank, .company-value, [class*="level"], [class*="rank"], [class*="value"]');
    statElements.forEach(el => {
      const text = el.textContent.trim();
      const parent = el.parentElement;
      const parentText = parent ? parent.textContent.trim() : text;

      let m = parentText.match(/Level\s*[:#]?\s*(\d+)/i);
      if (m) stats.level = parseInt(m[1], 10);

      m = parentText.match(/Rank\s*[:#]?\s*([\d,]+)/i);
      if (m) stats.rank = parseInt(m[1].replace(/,/g, ''), 10);

      m = parentText.match(/Value\s*[:#]?\s*\$?\s*([\d,.]+[KMB]?)/i);
      if (m) stats.value = extractNumber(m[1]);
    });

    if (!stats.level) {
      let m = allText.match(/Level\s*[:#]?\s*(\d+)/i);
      if (m) stats.level = parseInt(m[1], 10);
    }
    if (!stats.rank) {
      let m = allText.match(/Rank\s*[:#]?\s*([\d,]+)/i);
      if (m) stats.rank = parseInt(m[1].replace(/,/g, ''), 10);
    }
    if (!stats.value) {
      let m = allText.match(/Value\s*[:#]?\s*\$?\s*([\d,.]+[KMB]?)/i);
      if (m) stats.value = extractNumber(m[1]);
    }

    return stats;
  }

  function extractBuildings() {
    const buildings = [];
    const buildingElements = document.querySelectorAll('.building, .building-item, [class*="building"], .company-building');

    buildingElements.forEach(el => {
      const nameEl = el.querySelector('.building-name, .name, h3, h4, strong, b');
      const levelEl = el.querySelector('.building-level, .level, [class*="level"]');
      const typeEl = el.querySelector('.building-type, .type, [class*="type"]');

      if (nameEl) {
        buildings.push({
          name: nameEl.textContent.trim(),
          level: levelEl ? extractNumber(levelEl.textContent) : null,
          type: typeEl ? typeEl.textContent.trim() : null,
        });
      }
    });

    return buildings;
  }

  function extractWorkers() {
    const allText = document.body.innerText;
    let m = allText.match(/Workers?\s*[:#]?\s*([\d,]+)/i);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
    return null;
  }

  function extractAO() {
    const allText = document.body.innerText;
    let m = allText.match(/(?:Admin\s*Overhead|AO)\s*[:#]?\s*([\d.]+%?)/i);
    if (m) {
      const val = m[1];
      return val.endsWith('%') ? val : val + '%';
    }
    return null;
  }

  function isCompanyPage() {
    return window.location.pathname.includes('/company/');
  }

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
      syncCompanyData();
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

  async function syncCompanyData() {
    log('Starting company data sync...');
    updateSyncButton('syncing', 'Syncing...');

    try {
      const companyData = {
        companyId: extractCompanyId(),
        companyName: extractCompanyName(),
        ...extractStats(),
        buildings: extractBuildings(),
        workers: extractWorkers(),
        adminOverhead: extractAO(),
        url: window.location.href,
        realm: null,
        extractedAt: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      };

      const allText = document.body.innerText;
      const realmMatch = allText.match(/Realm\s*(\d+)/i);
      if (realmMatch) companyData.realm = parseInt(realmMatch[1], 10);

      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: companyData }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });

      updateSyncButton('success', 'Synced!');
      log('Company data synced successfully', 'success');
      setTimeout(() => updateSyncButton('default', 'Sync to Dashboard'), 2000);
    } catch (err) {
      console.error('[SimcoIntel] Sync failed:', err);
      log('Sync failed: ' + err.message, 'error');
      updateSyncButton('error', 'Sync failed');
      setTimeout(() => updateSyncButton('default', 'Sync to Dashboard'), 3000);
    }
  }

  function init() {
    log('Extension initialized');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(loadData, 3000));
    } else {
      setTimeout(loadData, 3000);
    }

    if (isCompanyPage()) {
      log('Company page detected, auto-syncing...');
      const addSyncUI = () => {
        if (!document.getElementById('simcointel-sync-btn')) {
          createSyncButton();
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            addSyncUI();
            syncCompanyData();
          }, 2000);
        });
      } else {
        setTimeout(() => {
          addSyncUI();
          syncCompanyData();
        }, 2000);
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'simcointel:trigger-sync') {
      if (isCompanyPage()) {
        syncCompanyData().then(() => {
          sendResponse({ success: true });
        }).catch(err => {
          sendResponse({ success: false, error: err.message });
        });
        return true;
      } else {
        sendResponse({ success: false, error: 'Not on a company page' });
        return false;
      }
    }
    return false;
  });

  init();
})();
