const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';

let currentRealm = 0;

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}/${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function fmtNumber(n) {
  if (n == null || isNaN(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + fmtNumber(n);
}

function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toFixed(1) + '%';
}

function metricRow(label, value, type = 'neutral') {
  return `<div class="metric-row"><span class="metric-label">${label}</span><span class="metric-value ${type}">${value}</span></div>`;
}

async function loadDashboard() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">Loading data</div>';

  try {
    const [margins, retail, dashboard] = await Promise.allSettled([
      fetchJSON(`public/realm-${currentRealm}/margins.json`),
      fetchJSON(`public/realm-${currentRealm}/retail.json`),
      fetchJSON(`public/realm-${currentRealm}/dashboard.json`),
    ]);

    let html = '';

    // Top movers from margins
    if (margins.status === 'fulfilled' && margins.value?.length) {
      const top = margins.value
        .filter(r => r.outputVwap > 0)
        .sort((a, b) => b.marginPct - a.marginPct)
        .slice(0, 5);

      html += '<div class="card"><div class="card-title">Top 5 Most Profitable</div>';
      top.forEach(r => {
        const type = r.marginPct >= 0 ? 'positive' : 'negative';
        html += metricRow(r.name, `${fmtCurrency(r.outputVwap)} · ${fmtPct(r.marginPct)}`, type);
      });
      html += '</div>';

      // Biggest losers
      const losers = margins.value
        .filter(r => r.outputVwap > 0)
        .sort((a, b) => a.marginPct - b.marginPct)
        .slice(0, 3);

      html += '<div class="card"><div class="card-title">Biggest Losses</div>';
      losers.forEach(r => {
        html += metricRow(r.name, `${fmtCurrency(r.outputVwap)} · ${fmtPct(r.marginPct)}`, 'negative');
      });
      html += '</div>';
    }

    // Retail saturation
    if (retail.status === 'fulfilled' && retail.value?.retail) {
      const entries = Object.entries(retail.value.retail)
        .filter(([, v]) => v.saturation != null)
        .sort((a, b) => b[1].saturation - a[1].saturation);

      if (entries.length > 0) {
        html += '<div class="card"><div class="card-title">Retail Saturation</div>';
        entries.slice(0, 5).forEach(([id, v]) => {
          const pct = (v.saturation * 100).toFixed(1);
          const type = v.saturation > 0.7 ? 'negative' : v.saturation > 0.4 ? 'neutral' : 'positive';
          html += metricRow(`Product #${id}`, `${pct}%`, type);
        });
        html += '</div>';
      }
    }

    // Dashboard scores
    if (dashboard.status === 'fulfilled' && dashboard.value?.scores) {
      const s = dashboard.value.scimes;
      const regime = dashboard.value.regime?.na || 'Normal';
      html += '<div class="card"><div class="card-title">Dashboard</div>';
      html += metricRow('Economy', regime, 'neutral');
      if (s.eh != null) html += metricRow('Economic Health', fmtNumber(s.eh), 'neutral');
      if (s.ms != null) html += metricRow('Market Size', fmtNumber(s.ms), 'neutral');
      if (s.st != null) html += metricRow('Sentiment', fmtNumber(s.st), 'neutral');
      html += '</div>';
    }

    if (!html) {
      html = '<div class="error">No data available for this realm</div>';
    }

    content.innerHTML = html;
    document.getElementById('lastUpdate').textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    content.innerHTML = `<div class="error">Failed to load data: ${err.message}</div>`;
  }
}

document.querySelectorAll('.realm-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.realm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRealm = parseInt(btn.dataset.realm, 10);
    loadDashboard();
  });
});

document.getElementById('refreshBtn').addEventListener('click', loadDashboard);

chrome.storage.local.get(['realm'], (result) => {
  if (result.realm != null) {
    currentRealm = result.realm;
    document.querySelectorAll('.realm-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.realm === String(currentRealm));
    });
  }
  loadDashboard();
});
