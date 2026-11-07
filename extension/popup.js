const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';

let currentRealm = 0;
let currentTab = 'dashboard';
let syncInProgress = false;

const logEntries = [];
const MAX_LOG_ENTRIES = 100;

// DOM Elements
const elements = {
  // Tabs
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.panel'),

  // Realm
  realmBtns: document.querySelectorAll('.realm-btn'),

  // Dashboard
  dashboardContent: document.getElementById('dashboardContent'),
  quickStats: {
    topMargin: document.getElementById('topMargin'),
    retailAlert: document.getElementById('retailAlert'),
    econHealth: document.getElementById('econHealth'),
    marketSize: document.getElementById('marketSize'),
  },

  // Sync
  syncMainStatus: document.getElementById('syncMainStatus'),
  syncCompanyStatus: document.getElementById('syncCompanyStatus'),
  syncCompanyDetail: document.getElementById('syncCompanyDetail'),
  syncAuthStatus: document.getElementById('syncAuthStatus'),
  syncAuthDetail: document.getElementById('syncAuthDetail'),
  syncPairingStatus: document.getElementById('syncPairingStatus'),
  syncPairingDetail: document.getElementById('syncPairingDetail'),
  syncCompanyBtn: document.getElementById('syncCompanyBtn'),
  syncAuthBtn: document.getElementById('syncAuthBtn'),
  syncProgress: document.getElementById('syncProgress'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  progressSteps: document.querySelectorAll('.progress-step'),

  // Pairing
  pairingCodeInput: document.getElementById('pairingCodeInput'),
  pairingSaveBtn: document.getElementById('pairingSaveBtn'),
  pairingHint: document.getElementById('pairingHint'),

  // Account
  accountStatus: document.getElementById('accountStatus'),
  authDataGrid: {
    company: document.getElementById('authCompany'),
    level: document.getElementById('authLevel'),
    rank: document.getElementById('authRank'),
    money: document.getElementById('authMoney'),
    slots: document.getElementById('authSlots'),
    prodMod: document.getElementById('authProdMod'),
    salesMod: document.getElementById('authSalesMod'),
    lastSync: document.getElementById('authLastSync'),
  },
  userInfo: {
    emailRow: document.getElementById('userEmailRow'),
    levelInfoRow: document.getElementById('userLevelInfoRow'),
    temporalsRow: document.getElementById('userTemporalsRow'),
  },

  // Logs
  logEntries: document.getElementById('logEntries'),
  clearLogBtn: document.getElementById('clearLogBtn'),

  // Footer
  lastUpdate: document.getElementById('lastUpdate'),
  extensionVersion: document.getElementById('extensionVersion'),

  // Settings
  settingsBtn: document.getElementById('settingsBtn'),
};

// Utility Functions
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

function setStatusIndicator(el, state) {
  el.className = 'status-indicator ' + state;
}

function addLog(message, type = 'info') {
  const entry = {
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    message,
    type,
  };
  logEntries.push(entry);
  if (logEntries.length > MAX_LOG_ENTRIES) logEntries.shift();
  renderLog();
  console.log(`[SimcoIntel] ${message}`);
}

function renderLog() {
  if (!elements.logEntries) return;
  elements.logEntries.innerHTML = logEntries.map(e =>
    `<div class="log-entry ${e.type}"><span class="log-time">${e.time}</span><span class="log-msg">${e.message}</span></div>`
  ).join('');
  elements.logEntries.scrollTop = elements.logEntries.scrollHeight;
}

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}/${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Tab Management
function switchTab(tabName) {
  currentTab = tabName;
  elements.tabs.forEach(tab => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });
  elements.panels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabName}`);
  });
  addLog(`Switched to ${tabName} tab`, 'info');
}

// Realm Management
function setRealm(realm) {
  currentRealm = realm;
  elements.realmBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.realm, 10) === realm);
  });
  chrome.storage.local.set({ realm });
  addLog(`Switched to Realm ${realm}`, 'info');
  loadDashboard();
  loadSyncStatus();
  loadAccountData();
}

// Dashboard Loading
async function loadDashboard() {
  if (!elements.dashboardContent) return;
  elements.dashboardContent.innerHTML = '<div class="loading">Loading market data...</div>';

  try {
    const [margins, retail, dashboard] = await Promise.allSettled([
      fetchJSON(`public/realm-${currentRealm}/margins.json`),
      fetchJSON(`public/realm-${currentRealm}/retail.json`),
      fetchJSON(`public/realm-${currentRealm}/dashboard.json`),
    ]);

    let html = '';

    // Top 5 Most Profitable
    if (margins.status === 'fulfilled' && margins.value?.length) {
      const top = margins.value
        .filter(r => r.outputVwap > 0)
        .sort((a, b) => b.marginPct - a.marginPct)
        .slice(0, 5);

      html += '<div class="card"><div class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Top 5 Most Profitable</div>';
      top.forEach(r => {
        const type = r.marginPct >= 0 ? 'positive' : 'negative';
        html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">${r.name}</div></span><span class="metric-row-value ${type}">${fmtCurrency(r.outputVwap)} · ${fmtPct(r.marginPct)}</span></div>`;
      });
      html += '</div>';

      const losers = margins.value
        .filter(r => r.outputVwap > 0)
        .sort((a, b) => a.marginPct - b.marginPct)
        .slice(0, 3);

      html += '<div class="card"><div class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Biggest Losses</div>';
      losers.forEach(r => {
        html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">${r.name}</div></span><span class="metric-row-value negative">${fmtCurrency(r.outputVwap)} · ${fmtPct(r.marginPct)}</span></div>`;
      });
      html += '</div>';

      // Update quick stats
      if (elements.quickStats.topMargin) {
        elements.quickStats.topMargin.textContent = `${top[0]?.name || '—'} (${fmtPct(top[0]?.marginPct)})`;
        elements.quickStats.topMargin.className = 'metric-value ' + (top[0]?.marginPct >= 0 ? 'positive' : 'negative');
      }
    }

    // Retail Saturation
    if (retail.status === 'fulfilled' && retail.value?.retail) {
      const entries = Object.entries(retail.value.retail)
        .filter(([, v]) => v.saturation != null)
        .sort((a, b) => b[1].saturation - a[1].saturation);

      if (entries.length > 0) {
        html += '<div class="card"><div class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Retail Saturation</div>';
        entries.slice(0, 5).forEach(([id, v]) => {
          const pct = (v.saturation * 100).toFixed(1);
          const type = v.saturation > 0.7 ? 'negative' : v.saturation > 0.4 ? 'warning' : 'positive';
          html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">Product #${id}</div></span><span class="metric-row-value ${type}">${pct}%</span></div>`;
        });
        html += '</div>';

        if (elements.quickStats.retailAlert) {
          const topRetail = entries[0];
          if (topRetail) {
            const pct = (topRetail[1].saturation * 100).toFixed(1);
            const type = topRetail[1].saturation > 0.7 ? 'negative' : topRetail[1].saturation > 0.4 ? 'warning' : 'positive';
            elements.quickStats.retailAlert.textContent = `#${topRetail[0]}: ${pct}%`;
            elements.quickStats.retailAlert.className = 'metric-value ' + type;
          }
        }
      }
    }

    // Dashboard Scores
    if (dashboard.status === 'fulfilled' && dashboard.value?.scores) {
      const s = dashboard.value.scores;
      const regime = dashboard.value.regime?.na || 'Normal';

      html += '<div class="card"><div class="card-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Economic Dashboard</div>';
      html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">Regime</div></span><span class="metric-row-value neutral">${regime}</span></div>`;
      if (s.eh != null) html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">Economic Health</div></span><span class="metric-row-value">${fmtNumber(s.eh)}</span></div>`;
      if (s.ms != null) html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">Market Size</div></span><span class="metric-row-value">${fmtNumber(s.ms)}</span></div>`;
      if (s.st != null) html += `<div class="metric-row"><span class="metric-row-info"><div class="metric-row-label">Sentiment</div></span><span class="metric-row-value">${fmtNumber(s.st)}</span></div>`;
      html += '</div>';

      if (elements.quickStats.econHealth) {
        elements.quickStats.econHealth.textContent = s.eh != null ? fmtNumber(s.eh) : '—';
      }
      if (elements.quickStats.marketSize) {
        elements.quickStats.marketSize.textContent = s.ms != null ? fmtNumber(s.ms) : '—';
      }
    }

    if (!html) {
      html = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg><h4>No Data Available</h4><p>Market data for this realm could not be loaded.</p></div>';
    }

    elements.dashboardContent.innerHTML = html;
    elements.lastUpdate.textContent = 'Updated ' + new Date().toLocaleTimeString();
    addLog('Dashboard loaded', 'success');
  } catch (err) {
    elements.dashboardContent.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><h4>Failed to Load</h4><p>${err.message}</p></div>`;
    addLog('Failed to load dashboard: ' + err.message, 'error');
  }
}

// Sync Status Loading
async function loadSyncStatus() {
  addLog('Checking sync status...');
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get([
        'simcointel-company-data',
        'simcointel-pairing-code',
        'simcointel-auth-data'
      ], resolve);
    });

    const companyData = result['simcointel-company-data'];
    const pairingCode = result['simcointel-pairing-code'];
    const authData = result['simcointel-auth-data'];

    // Company Data Sync Status
    if (companyData) {
      setStatusIndicator(elements.syncCompanyStatus, 'connected');
      elements.syncCompanyDetail.textContent = `Last sync: ${companyData.syncedAt ? new Date(companyData.syncedAt).toLocaleString() : 'unknown'}`;
    } else {
      setStatusIndicator(elements.syncCompanyStatus, 'pending');
      elements.syncCompanyDetail.textContent = 'No company data synced';
    }

    // Auth Data Sync Status
    if (authData?.authCompany) {
      setStatusIndicator(elements.syncAuthStatus, 'connected');
      const c = authData.authCompany;
      elements.syncAuthDetail.textContent = `${c.company || 'Company'} · Lv${c.level || '?'} · Rank ${c.rank || '?'}`;
    } else {
      setStatusIndicator(elements.syncAuthStatus, 'pending');
      elements.syncAuthDetail.textContent = 'Sign in on SimCompanies to sync';
    }

    // Pairing Status
    if (pairingCode) {
      setStatusIndicator(elements.syncPairingStatus, 'connected');
      elements.syncPairingDetail.textContent = `Code: ${pairingCode.slice(0, 8)}...`;
    } else {
      setStatusIndicator(elements.syncPairingStatus, 'pending');
      elements.syncPairingDetail.textContent = 'Not configured';
    }

    // Overall sync status
    if (companyData || authData?.authCompany) {
      setStatusIndicator(elements.syncMainStatus, 'connected');
    } else {
      setStatusIndicator(elements.syncMainStatus, 'pending');
    }

    // Update last sync time display
    const lastSyncEl = document.getElementById('lastSyncTime');
    if (lastSyncEl && companyData?.syncedAt) {
      lastSyncEl.textContent = 'Last synced: ' + new Date(companyData.syncedAt).toLocaleString();
    }

    addLog('Sync status updated', 'success');
  } catch (err) {
    console.error('Failed to load sync status:', err);
    addLog('Sync status check failed', 'error');
  }
}

// Account Data Loading
async function loadAccountData() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['simcointel-auth-data'], resolve);
    });
    const authData = result['simcointel-auth-data'];

    if (authData?.authCompany) {
      setStatusIndicator(elements.accountStatus, 'connected');
      const c = authData.authCompany;
      elements.authDataGrid.company.classList.remove('empty');
      elements.authDataGrid.company.querySelector('.auth-value').textContent = c.company || '—';
      elements.authDataGrid.level.classList.remove('empty');
      elements.authDataGrid.level.querySelector('.auth-value').textContent = c.level != null ? `Lv ${c.level}` : '—';
      elements.authDataGrid.rank.classList.remove('empty');
      elements.authDataGrid.rank.querySelector('.auth-value').textContent = c.rank != null ? `#${c.rank.toLocaleString()}` : '—';
      elements.authDataGrid.money.classList.remove('empty');
      elements.authDataGrid.money.querySelector('.auth-value').textContent = c.money != null ? fmtCurrency(c.money) : '—';
      elements.authDataGrid.slots.classList.remove('empty');
      elements.authDataGrid.slots.querySelector('.auth-value').textContent = c.extraBuildingSlots != null ? `+${c.extraBuildingSlots}` : '—';
      elements.authDataGrid.prodMod.classList.remove('empty');
      elements.authDataGrid.prodMod.querySelector('.auth-value').textContent = c.productionModifier != null ? `${c.productionModifier >= 0 ? '+' : ''}${c.productionModifier}%` : '—';
      elements.authDataGrid.salesMod.classList.remove('empty');
      elements.authDataGrid.salesMod.querySelector('.auth-value').textContent = c.salesModifier != null ? `${c.salesModifier >= 0 ? '+' : ''}${c.salesModifier}%` : '—';
      elements.authDataGrid.lastSync.classList.remove('empty');
      elements.authDataGrid.lastSync.querySelector('.auth-value').textContent = authData.syncedAt ? new Date(authData.syncedAt).toLocaleString() : '—';

      // User info
      if (authData.authUser?.email) {
        elements.userInfo.emailRow.classList.remove('empty-row');
        elements.userInfo.emailRow.querySelector('.metric-row-label').textContent = 'Email';
        elements.userInfo.emailRow.querySelector('.metric-row-sub').textContent = authData.authUser.email;
      }
      if (authData.levelInfo) {
        elements.userInfo.levelInfoRow.classList.remove('empty-row');
        elements.userInfo.levelInfoRow.querySelector('.metric-row-label').textContent = 'Level Info';
        const li = authData.levelInfo;
        let parts = [];
        if (li.experience != null) parts.push(`XP: ${fmtNumber(li.experience)}`);
        if (li.experienceToNextLevel != null) parts.push(`To next: ${fmtNumber(li.experienceToNextLevel)}`);
        if (li.maxBuildings != null) parts.push(`Max buildings: ${li.maxBuildings}`);
        if (li.capabilities && Object.keys(li.capabilities).length) {
          const caps = Object.entries(li.capabilities).filter(([,v]) => v).map(([k]) => k);
          if (caps.length) parts.push('Capabilities: ' + caps.join(', '));
        }
        elements.userInfo.levelInfoRow.querySelector('.metric-row-sub').textContent = parts.join(' · ') || 'Available';
      }
      if (authData.temporals?.contest) {
        elements.userInfo.temporalsRow.classList.remove('empty-row');
        elements.userInfo.temporalsRow.querySelector('.metric-row-label').textContent = 'Active Contest';
        const ct = authData.temporals.contest;
        elements.userInfo.temporalsRow.querySelector('.metric-row-sub').textContent = ct.name ? `${ct.name} (ID: ${ct.id})` : `Contest #${ct.id}`;
      }
    } else {
      setStatusIndicator(elements.accountStatus, 'pending');
      addLog('No auth data available - sign in on SimCompanies', 'info');
    }
  } catch (err) {
    console.error('Failed to load account data:', err);
    addLog('Account data load failed', 'error');
  }
}

// Sync Progress UI
function showSyncProgress(show) {
  elements.syncProgress.classList.toggle('visible', show);
  elements.syncCompanyBtn.disabled = show;
  elements.syncAuthBtn.disabled = show;
}

function updateProgress(step, text) {
  elements.progressText.textContent = text;
  elements.progressSteps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i < step - 1) s.classList.add('done');
    else if (i === step - 1) s.classList.add('active');
  });
  elements.progressFill.style.width = `${(step / 4) * 100}%`;
}

// Sync Actions
async function triggerCompanySync() {
  if (syncInProgress) return;
  syncInProgress = true;
  showSyncProgress(true);
  updateProgress(1, 'Detecting extension...');
  addLog('Starting company data sync...');

  try {
    updateProgress(2, 'Requesting data from extension...');
    const response = await chrome.runtime.sendMessage({ type: 'simcointel:trigger-sync' });

    updateProgress(3, 'Processing response...');
    if (response?.success) {
      updateProgress(4, 'Sync complete!');
      addLog('Company data synced successfully', 'success');
      await loadSyncStatus();
      await loadDashboard();
    } else {
      throw new Error(response?.error || 'Sync failed - no response from content script');
    }
  } catch (err) {
    addLog('Company sync failed: ' + err.message, 'error');
    updateProgress(4, 'Sync failed: ' + err.message);
    setStatusIndicator(elements.syncCompanyStatus, 'error');
    elements.syncCompanyDetail.textContent = err.message;
  } finally {
    syncInProgress = false;
    setTimeout(() => showSyncProgress(false), 2000);
  }
}

async function triggerAuthSync() {
  if (syncInProgress) return;
  syncInProgress = true;
  showSyncProgress(true);
  updateProgress(1, 'Checking extension...');
  addLog('Starting account auth-data sync...');

  try {
    updateProgress(2, 'Fetching auth data from background...');
    const response = await chrome.runtime.sendMessage({ type: 'simcointel:fetch-auth-data' });

    updateProgress(3, 'Processing auth data...');
    if (response?.ok && response.data) {
      updateProgress(4, 'Auth data synced!');
      addLog('Account auth-data synced successfully', 'success');
      await loadSyncStatus();
      await loadAccountData();
    } else {
      const error = response?.error || 'not-signed-in';
      throw new Error(error === 'not-signed-in'
        ? 'Not signed in on SimCompanies. Open simcompanies.com, sign in, then retry.'
        : 'Auth sync failed: ' + error);
    }
  } catch (err) {
    addLog('Auth sync failed: ' + err.message, 'error');
    updateProgress(4, 'Sync failed: ' + err.message);
    setStatusIndicator(elements.syncAuthStatus, 'error');
    elements.syncAuthDetail.textContent = err.message;
  } finally {
    syncInProgress = false;
    setTimeout(() => showSyncProgress(false), 2000);
  }
}

// Pairing Code
async function savePairingCode() {
  const code = elements.pairingCodeInput.value.trim();
  if (!code) return;

  await new Promise((resolve) => {
    chrome.storage.local.set({ 'simcointel-pairing-code': code }, resolve);
  });

  addLog('Pairing code saved', 'success');
  elements.pairingCodeInput.value = '';
  elements.pairingCodeInput.placeholder = 'Code saved!';
  setTimeout(() => { elements.pairingCodeInput.placeholder = 'Enter pairing code'; }, 2000);
  await loadSyncStatus();
}

// Settings Modal (simple inline for now)
function openSettings() {
  // Could open a proper settings panel - for now just log
  addLog('Settings: would open settings panel', 'info');
}

// Initialize
function init() {
  // Version
  elements.extensionVersion.textContent = 'v' + chrome.runtime.getManifest().version;

  // Tab switching
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Realm selector
  elements.realmBtns.forEach(btn => {
    btn.addEventListener('click', () => setRealm(parseInt(btn.dataset.realm, 10)));
  });

  // Sync buttons
  elements.syncCompanyBtn.addEventListener('click', triggerCompanySync);
  elements.syncAuthBtn.addEventListener('click', triggerAuthSync);

  // Pairing
  elements.pairingSaveBtn.addEventListener('click', savePairingCode);
  elements.pairingCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') savePairingCode();
  });

  // Logs
  elements.clearLogBtn.addEventListener('click', () => {
    logEntries.length = 0;
    addLog('Log cleared', 'info');
  });

  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);

  // Load saved realm
  chrome.storage.local.get(['realm'], (result) => {
    if (result.realm != null) {
      currentRealm = result.realm;
      setRealm(currentRealm);
    } else {
      loadDashboard();
      loadSyncStatus();
      loadAccountData();
    }
  });

  // Initial log
  addLog('Extension loaded', 'info');

  // Periodic status refresh
  setInterval(() => {
    if (!syncInProgress) {
      loadSyncStatus();
      loadAccountData();
    }
  }, 30000);

  // Listen for storage changes from other contexts
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes['simcointel-company-data'] || changes['simcointel-auth-data'] || changes['simcointel-pairing-code']) {
        loadSyncStatus();
        loadAccountData();
      }
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);