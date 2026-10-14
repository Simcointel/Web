/* SimcoIntel content script — injects market data overlay into SimCompanies pages */

(function() {
  'use strict';

  const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';

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
      window.open('https://simcointel.github.io', '_blank');
    });
    document.body.appendChild(div);
    return div;
  }

  async function loadData() {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loadData, 3000));
  } else {
    setTimeout(loadData, 3000);
  }
})();
