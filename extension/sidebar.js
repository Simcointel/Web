/**
 * SimcoIntel Sidebar — Persistent icon rail with tool panels
 * Injected into simcompanies.com pages
 * All GET requests, read-only, rate-limited
 */

(function() {
  'use strict';

  const SIDEBAR_ID = 'simcointel-sidebar';
  const TOOLS = [
    { id: 'chat', label: 'Chat Intel', icon: '💬', page: ['*'] },
    { id: 'buildings', label: 'Building Projections', icon: '🏗️', page: ['/buildings', '/company/'] },
    { id: 'production', label: 'Production Calc', icon: '⚙️', page: ['/production', '/company/'] },
    { id: 'finance', label: 'Finance Dashboard', icon: '📊', page: ['*'] },
    { id: 'market', label: 'Market Alerts', icon: '🔔', page: ['*'] },
  ];

  const STORAGE_KEYS = {
    sidebarOpen: 'simcointel-sidebar-open',
    activeTool: 'simcointel-active-tool',
    chatPatterns: 'simcointel-chat-patterns',
    marketAlerts: 'simcointel-market-alerts',
    uiPrefs: 'simcointel-ui-prefs',
  };

  // Rate limiting for GET requests
  // SimCompanies official API: 1 request per 2 minutes (30/hour)
  // simcotools/community APIs: they handle rate limiting on their end
  // Chat parsing: local DOM observation, no API calls
  const RATE_LIMITS = {
    simcompaniesApi: { windowMs: 120000, maxCalls: 1 },  // 1 per 2 min (official limit)
    marketData: { windowMs: 60000, maxCalls: 10 },        // community APIs, generous
    chatParse: { windowMs: 60000, maxCalls: 200 },        // local DOM parsing, generous
  };

  const rateLimitState = new Map();

  function checkRateLimit(key, limit) {
    const now = Date.now();
    const state = rateLimitState.get(key) || { calls: [], count: 0 };
    state.calls = state.calls.filter(t => now - t < limit.windowMs);
    if (state.calls.length >= limit.maxCalls) return false;
    state.calls.push(now);
    rateLimitState.set(key, state);
    return true;
  }

  // Cached GET with ETag/Last-Modified support
  async function cachedGet(url, cacheKey, ttlMs = 60000) {
    const cache = await chrome.storage.local.get([cacheKey]);
    const cached = cache[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < ttlMs) {
      return cached.data;
    }

    const headers = { Accept: 'application/json' };
    if (cached?.etag) headers['If-None-Match'] = cached.etag;
    if (cached?.lastModified) headers['If-Modified-Since'] = cached.lastModified;

    const res = await fetch(url, { credentials: 'include', headers });

    if (res.status === 304) {
      cached.timestamp = now;
      await chrome.storage.local.set({ [cacheKey]: cached });
      return cached.data;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const toStore = {
      data,
      timestamp: now,
      etag: res.headers.get('ETag') || '',
      lastModified: res.headers.get('Last-Modified') || '',
    };
    await chrome.storage.local.set({ [cacheKey]: toStore });
    return data;
  }

  // --- Chat Intelligence ---
  const CHAT_BUY_PATTERNS = [
    /buying\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /buy\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /need\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /looking\s+for\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /wtb\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
  ];

  const CHAT_SELL_PATTERNS = [
    /selling\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /sell\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /offering\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
    /have\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)\s+for\s+sale/i,
    /wts\s+(\d+[\d,]*)\s*x?\s*([a-zA-Z\s]+)/i,
  ];

  function parseChatMessage(text) {
    const lower = text.toLowerCase();
    for (const pattern of CHAT_BUY_PATTERNS) {
      const m = lower.match(pattern);
      if (m) return { type: 'buy', qty: parseInt(m[1].replace(/,/g, ''), 10), item: m[2].trim() };
    }
    for (const pattern of CHAT_SELL_PATTERNS) {
      const m = lower.match(pattern);
      if (m) return { type: 'sell', qty: parseInt(m[1].replace(/,/g, ''), 10), item: m[2].trim() };
    }
    return null;
  }

  // --- Building Upgrade Projections ---
  const BUILDING_COSTS = {
    // Base costs per building type (level 1)
    // These would ideally come from a static data file
    'farm': { baseCost: 1000, costMult: 1.15 },
    'factory': { baseCost: 5000, costMult: 1.2 },
    'mine': { baseCost: 8000, costMult: 1.25 },
    'oil-well': { baseCost: 15000, costMult: 1.3 },
    // ... more can be added
  };

  function calculateUpgradeCost(buildingKind, currentLevel) {
    const config = BUILDING_COSTS[buildingKind] || { baseCost: 5000, costMult: 1.2 };
    let total = 0;
    for (let l = 1; l <= currentLevel; l++) {
      total += config.baseCost * Math.pow(config.costMult, l - 1);
    }
    const nextLevelCost = config.baseCost * Math.pow(config.costMult, currentLevel);
    return { totalInvested: total, nextLevelCost, totalAfterUpgrade: total + nextLevelCost };
  }

  function estimateProduction(buildingKind, level, workers, techLevel) {
    // Simplified production estimation
    const baseOutput = {
      'farm': 10, 'factory': 5, 'mine': 3, 'oil-well': 2,
    }[buildingKind] || 1;
    return baseOutput * level * (1 + (workers || 0) * 0.01) * (1 + (techLevel || 0) * 0.05);
  }

  // --- Finance Dashboard ---
  async function fetchFinanceData(companyId, realm) {
    const base = realm === 1 ? 'https://www.simcompanies.com/api/v3/entrepreneurs/companies' : 'https://www.simcompanies.com/api/v3/companies';
    if (!checkRateLimit('finance-api', RATE_LIMITS.simcompaniesApi)) throw new Error('Rate limited');
    const res = await fetch(`${base}/${companyId}/`, { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function computeFinance(data) {
    const hist = data.history || {};
    const inf = data.infrastructure || {};
    const pub = data.companyPublicInfo || {};

    const dailyRevenue = hist.revenue || 0;
    const dailyCosts = (hist.wages || 0) + (hist.upkeep || 0) + (hist.transport || 0) + (hist.tax || 0);
    const dailyProfit = dailyRevenue - dailyCosts;

    return {
      cash: pub.money || 0,
      dailyRevenue,
      dailyCosts,
      dailyProfit,
      weeklyProfit: dailyProfit * 7,
      monthlyProfit: dailyProfit * 30,
      assets: hist.value || 0,
      workers: inf.workers || 0,
      wages: hist.wages || 0,
      upkeep: hist.upkeep || 0,
      transport: hist.transport || 0,
      tax: hist.tax || 0,
      debt: hist.debt || 0,
      interest: hist.interest || 0,
    };
  }

  // --- Market Alerts ---
  async function checkMarketAlerts(alerts) {
    if (!alerts?.length) return [];
    if (!checkRateLimit('market-alerts', RATE_LIMITS.marketData)) return [];

    try {
      const margins = await cachedGet(
        'https://raw.githubusercontent.com/SimcoIntel/Data/main/public/realm-0/margins.json',
        'simcointel-margins-cache',
        300000
      );

      const triggered = [];
      for (const alert of alerts) {
        const resource = margins.find(m => m.name.toLowerCase() === alert.resource.toLowerCase());
        if (!resource) continue;
        const currentPrice = resource.outputVwap || 0;
        if (alert.type === 'above' && currentPrice >= alert.price) triggered.push({ ...alert, currentPrice });
        if (alert.type === 'below' && currentPrice <= alert.price) triggered.push({ ...alert, currentPrice });
      }
      return triggered;
    } catch {
      return [];
    }
  }

  // --- Sidebar UI ---
  function createSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return document.getElementById(SIDEBAR_ID);

    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;
    sidebar.style.cssText = `
      position: fixed; top: 0; right: 0; bottom: 0; width: 48px; z-index: 999998;
      background: #0f172a; border-left: 1px solid #1e293b;
      display: flex; flex-direction: column; transition: width 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    sidebar.dataset.open = 'false';

    const rail = document.createElement('div');
    rail.style.cssText = `
      display: flex; flex-direction: column; align-items: center; padding: 12px 0; gap: 8px;
      height: 100%; overflow-y: auto;
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'simcointel-toggle';
    toggleBtn.title = 'Toggle SimcoIntel (Alt+H)';
    toggleBtn.style.cssText = `
      width: 32px; height: 32px; border: none; border-radius: 6px;
      background: #1e293b; color: #e2e8f0; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease; flex-shrink: 0;
    `;
    toggleBtn.textContent = '🔬';
    toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.background = '#334155');
    toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.background = '#1e293b');
    toggleBtn.addEventListener('click', toggleSidebar);

    rail.appendChild(toggleBtn);

    TOOLS.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'simcointel-tool-btn';
      btn.dataset.tool = tool.id;
      btn.title = tool.label;
      btn.style.cssText = `
        width: 32px; height: 32px; border: none; border-radius: 6px;
        background: transparent; color: #94a3b8; font-size: 14px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s ease; flex-shrink: 0;
      `;
      btn.textContent = tool.icon;
      btn.addEventListener('mouseenter', () => { if (!btn.classList.contains('active')) btn.style.background = '#1e293b'; btn.style.color = '#e2e8f0'; });
      btn.addEventListener('mouseleave', () => { if (!btn.classList.contains('active')) { btn.style.background = 'transparent'; btn.style.color = '#94a3b8'; } });
      btn.addEventListener('click', () => openTool(tool.id));
      rail.appendChild(btn);
    });

    const panel = document.createElement('div');
    panel.id = 'simcointel-panel';
    panel.style.cssText = `
      position: absolute; top: 0; right: 48px; bottom: 0; width: 360px;
      background: #0f172a; border-left: 1px solid #1e293b;
      transform: translateX(100%); opacity: 0; pointer-events: none;
      transition: transform 0.2s ease, opacity 0.2s ease; z-index: 999999;
      display: flex; flex-direction: column; overflow: hidden;
    `;

    sidebar.appendChild(rail);
    sidebar.appendChild(panel);
    document.body.appendChild(sidebar);

    // Load persisted state
    chrome.storage.local.get([STORAGE_KEYS.sidebarOpen, STORAGE_KEYS.activeTool], (result) => {
      if (result[STORAGE_KEYS.sidebarOpen] === 'true') openSidebar();
      if (result[STORAGE_KEYS.activeTool]) openTool(result[STORAGE_KEYS.activeTool]);
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'h') { e.preventDefault(); toggleSidebar(); }
    });

    return sidebar;
  }

  function toggleSidebar() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) return;
    const isOpen = sidebar.dataset.open === 'true';
    sidebar.dataset.open = (!isOpen).toString();
    chrome.storage.local.set({ [STORAGE_KEYS.sidebarOpen]: (!isOpen).toString() });
  }

  function openSidebar() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) return;
    sidebar.dataset.open = 'true';
    const panel = document.getElementById('simcointel-panel');
    if (panel) { panel.style.transform = 'translateX(0)'; panel.style.opacity = '1'; panel.style.pointerEvents = 'auto'; }
    chrome.storage.local.set({ [STORAGE_KEYS.sidebarOpen]: 'true' });
  }

  function closePanel() {
    const panel = document.getElementById('simcointel-panel');
    if (panel) { panel.style.transform = 'translateX(100%)'; panel.style.opacity = '0'; panel.style.pointerEvents = 'none'; }
  }

  function openTool(toolId) {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) return;

    // Update active button
    sidebar.querySelectorAll('.simcointel-tool-btn').forEach(btn => {
      const active = btn.dataset.tool === toolId;
      btn.classList.toggle('active', active);
      btn.style.background = active ? '#3b82f6' : (btn.classList.contains('active') ? '#3b82f6' : 'transparent');
      btn.style.color = active ? '#fff' : '#94a3b8';
    });

    const panel = document.getElementById('simcointel-panel');
    if (!panel) return;

    openSidebar();

    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    chrome.storage.local.set({ [STORAGE_KEYS.activeTool]: toolId });

    // Render tool panel
    panel.innerHTML = renderToolPanel(tool);
    attachToolListeners(toolId);
  }

  function renderToolPanel(tool) {
    switch (tool.id) {
      case 'chat': return renderChatPanel();
      case 'buildings': return renderBuildingsPanel();
      case 'production': return renderProductionPanel();
      case 'finance': return renderFinancePanel();
      case 'market': return renderMarketPanel();
      default: return '<div class="tool-empty">Select a tool</div>';
    }
  }

  function renderChatPanel() {
    return `
      <div class="tool-header">
        <h3>${TOOLS.find(t=>t.id==='chat').icon} Chat Intelligence</h3>
        <button class="tool-close" title="Close panel">✕</button>
      </div>
      <div class="tool-content" style="overflow-y:auto;flex:1;padding:12px;">
        <div class="chat-stats" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
          <div class="stat-card" style="background:#1e293b;padding:10px;border-radius:8px;border:1px solid #334155;">
            <div class="stat-value" id="chatBuyCount" style="font-size:20px;font-weight:700;color:#22c55e;">0</div>
            <div class="stat-label" style="font-size:11px;color:#94a3b8;">Buy Orders</div>
          </div>
          <div class="stat-card" style="background:#1e293b;padding:10px;border-radius:8px;border:1px solid #334155;">
            <div class="stat-value" id="chatSellCount" style="font-size:20px;font-weight:700;color:#ef4444;">0</div>
            <div class="stat-label" style="font-size:11px;color:#94a3b8;">Sell Orders</div>
          </div>
        </div>
        <div class="chat-filters" style="margin-bottom:12px;">
          <input type="text" id="chatFilter" placeholder="Filter by item..." style="width:100%;padding:8px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
        </div>
        <div id="chatLog" style="max-height:300px;overflow-y:auto;font-size:11px;font-family:monospace;"></div>
      </div>
    `;
  }

  function renderBuildingsPanel() {
    return `
      <div class="tool-header">
        <h3>${TOOLS.find(t=>t.id==='buildings').icon} Building Projections</h3>
        <button class="tool-close" title="Close panel">✕</button>
      </div>
      <div class="tool-content" style="overflow-y:auto;flex:1;padding:12px;">
        <div id="buildingsList" style="display:flex;flex-direction:column;gap:8px;">
          <div class="tool-empty" style="text-align:center;padding:24px;color:#64748b;">Visit a company or buildings page to see projections</div>
        </div>
      </div>
    `;
  }

  function renderProductionPanel() {
    return `
      <div class="tool-header">
        <h3>${TOOLS.find(t=>t.id==='production').icon} Production Calculator</h3>
        <button class="tool-close" title="Close panel">✕</button>
      </div>
      <div class="tool-content" style="overflow-y:auto;flex:1;padding:12px;">
        <div class="input-group" style="display:flex;flex-direction:column;gap:10px;">
          <select id="prodBuilding" style="padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
            <option value="">Select building...</option>
            <option value="farm">Farm</option>
            <option value="factory">Factory</option>
            <option value="mine">Mine</option>
            <option value="oil-well">Oil Well</option>
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <input type="number" id="prodLevel" placeholder="Current Level" min="1" max="100" style="padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
            <input type="number" id="prodWorkers" placeholder="Workers" min="0" style="padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
          </div>
          <input type="number" id="prodTech" placeholder="Tech Level" min="0" max="20" value="0" style="padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
        </div>
        <div id="prodResult" style="margin-top:16px;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;display:none;">
          <div class="result-row" style="display:flex;justify-content:space-between;margin:6px 0;"><span>Daily Output</span><span id="prodOutput" style="font-weight:700;color:#22c55e;">—</span></div>
          <div class="result-row" style="display:flex;justify-content:space-between;margin:6px 0;"><span>Next Upgrade Cost</span><span id="prodUpgradeCost" style="font-weight:700;color:#f59e0b;">—</span></div>
          <div class="result-row" style="display:flex;justify-content:space-between;margin:6px 0;"><span>Total Invested</span><span id="prodTotalInvested" style="font-weight:700;color:#3b82f6;">—</span></div>
          <div class="result-row" style="display:flex;justify-content:space-between;margin:6px 0;"><span>Break-even (days)</span><span id="prodBreakeven" style="font-weight:700;color:#a855f7;">—</span></div>
        </div>
      </div>
    `;
  }

  function renderFinancePanel() {
    return `
      <div class="tool-header">
        <h3>${TOOLS.find(t=>t.id==='finance').icon} Finance Dashboard</h3>
        <button class="tool-close" title="Close panel">✕</button>
      </div>
      <div class="tool-content" style="overflow-y:auto;flex:1;padding:12px;">
        <div id="financeCards" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
          <div class="fin-card" style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;text-align:center;">
            <div class="fin-value" id="finCash" style="font-size:18px;font-weight:700;color:#f59e0b;">—</div>
            <div class="fin-label" style="font-size:10px;color:#94a3b8;">Cash</div>
          </div>
          <div class="fin-card" style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;text-align:center;">
            <div class="fin-value" id="finDaily" style="font-size:18px;font-weight:700;color:#22c55e;">—</div>
            <div class="fin-label" style="font-size:10px;color:#94a3b8;">Daily Profit</div>
          </div>
          <div class="fin-card" style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;text-align:center;">
            <div class="fin-value" id="finWeekly" style="font-size:18px;font-weight:700;color:#3b82f6;">—</div>
            <div class="fin-label" style="font-size:10px;color:#94a3b8;">Weekly Profit</div>
          </div>
          <div class="fin-card" style="background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;text-align:center;">
            <div class="fin-value" id="finAssets" style="font-size:18px;font-weight:700;color:#a855f7;">—</div>
            <div class="fin-label" style="font-size:10px;color:#94a3b8;">Assets</div>
          </div>
        </div>
        <div id="finDetails" style="font-size:11px;color:#94a3b8;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div>Revenue: <span id="finRev" style="color:#e2e8f0;">—</span></div>
          <div>Wages: <span id="finWages" style="color:#ef4444;">—</span></div>
          <div>Upkeep: <span id="finUpkeep" style="color:#ef4444;">—</span></div>
          <div>Transport: <span id="finTrans" style="color:#ef4444;">—</span></div>
          <div>Tax: <span id="finTax" style="color:#ef4444;">—</span></div>
          <div>Workers: <span id="finWorkers" style="color:#e2e8f0;">—</span></div>
        </div>
        <button id="finRefresh" style="margin-top:12px;width:100%;padding:10px;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;">Refresh Data</button>
      </div>
    `;
  }

  function renderMarketPanel() {
    return `
      <div class="tool-header">
        <h3>${TOOLS.find(t=>t.id==='market').icon} Market Alerts</h3>
        <button class="tool-close" title="Close panel">✕</button>
      </div>
      <div class="tool-content" style="overflow-y:auto;flex:1;padding:12px;">
        <div class="input-group" style="display:flex;flex-direction:column;gap:10px;margin-bottom:12px;">
          <select id="alertResource" style="padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
            <option value="">Select resource...</option>
            <option value="Water">Water</option>
            <option value="Food">Food</option>
            <option value="Iron">Iron</option>
            <option value="Oil">Oil</option>
            <option value="Coal">Coal</option>
            <option value="Gold">Gold</option>
            <option value="Diamonds">Diamonds</option>
            <option value="Aluminum">Aluminum</option>
            <option value="Copper">Copper</option>
            <option value="Silicon">Silicon</option>
          </select>
          <div style="display:flex;gap:8px;">
            <select id="alertType" style="flex:1;padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
              <option value="above">Price Above</option>
              <option value="below">Price Below</option>
            </select>
            <input type="number" id="alertPrice" placeholder="Price" step="0.01" min="0" style="flex:1;padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;">
          </div>
        </div>
        <button id="alertAdd" style="width:100%;padding:10px;background:#22c55e;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;margin-bottom:12px;">Add Alert</button>
        <div id="alertsList" style="display:flex;flex-direction:column;gap:6px;"></div>
      </div>
    `;
  }

  function attachToolListeners(toolId) {
    const panel = document.getElementById('simcointel-panel');
    if (!panel) return;

    panel.querySelector('.tool-close')?.addEventListener('click', closePanel);

    switch (toolId) {
      case 'chat': attachChatListeners(); break;
      case 'buildings': attachBuildingsListeners(); break;
      case 'production': attachProductionListeners(); break;
      case 'finance': attachFinanceListeners(); break;
      case 'market': attachMarketListeners(); break;
    }
  }

  // --- Chat Listeners ---
  function attachChatListeners() {
    const log = document.getElementById('chatLog');
    const filter = document.getElementById('chatFilter');
    const buyCount = document.getElementById('chatBuyCount');
    const sellCount = document.getElementById('chatSellCount');

    let messages = [];
    let buy = 0, sell = 0;

    function updateStats() { buyCount.textContent = buy; sellCount.textContent = sell; }

    function render() {
      const term = filter.value.toLowerCase();
      log.innerHTML = messages
        .filter(m => !term || m.item.toLowerCase().includes(term) || m.type.includes(term))
        .map(m => `<div style="padding:4px 8px;margin:2px 0;border-radius:4px;background:${m.type==='buy'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'};border-left:3px solid ${m.type==='buy'?'#22c55e':'#ef4444'};">
          <span style="font-weight:600;color:${m.type==='buy'?'#22c55e':'#ef4444'};">${m.type.toUpperCase()}</span>
          <span style="margin:0 8px;">${m.qty.toLocaleString()}x</span>
          <span>${m.item}</span>
          <span style="float:right;color:#64748b;font-size:10px;">${m.time}</span>
        </div>`).join('');
    }

    // Observe chat container
    const chatContainer = document.querySelector('[class*="chat"], [class*="Chat"], #chat, .messages');
    if (chatContainer) {
      const observer = new MutationObserver(() => {
        if (!checkRateLimit('chat-parse', RATE_LIMITS.chatParse)) return;
        chatContainer.querySelectorAll('[class*="message"], [class*="Message"], li, .msg').forEach(el => {
          const text = el.textContent.trim();
          if (!text || el.dataset.simcointelParsed) return;
          const parsed = parseChatMessage(text);
          if (parsed) {
            parsed.time = new Date().toLocaleTimeString();
            messages.unshift(parsed);
            if (messages.length > 200) messages.pop();
            if (parsed.type === 'buy') buy++; else sell++;
            updateStats();
            render();
          }
          el.dataset.simcointelParsed = 'true';
        });
      });
      observer.observe(chatContainer, { childList: true, subtree: true });
    }

    filter.addEventListener('input', render);
    updateStats();
  }

  // --- Buildings Listeners ---
  async function attachBuildingsListeners() {
    const list = document.getElementById('buildingsList');
    const companyId = await extractCompanyIdFromPage();
    const realm = extractRealmFromPage();

    if (!companyId) { list.innerHTML = '<div class="tool-empty" style="padding:24px;color:#64748b;">No company detected on this page</div>'; return; }

    list.innerHTML = '<div class="tool-empty" style="padding:24px;color:#64748b;">Loading building data...</div>';

    try {
      const base = realm === 1 ? 'https://www.simcompanies.com/api/v3/entrepreneurs/companies' : 'https://www.simcompanies.com/api/v3/companies';
      if (!checkRateLimit('buildings-api', RATE_LIMITS.simcompaniesApi)) throw new Error('Rate limited');
      const res = await fetch(`${base}/${companyId}/`, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderBuildings(list, data);
    } catch (err) {
      list.innerHTML = `<div class="tool-empty" style="padding:24px;color:#ef4444;">Failed: ${err.message}</div>`;
    }
  }

  function renderBuildings(list, data) {
    const inf = data.infrastructure || {};
    const buildings = Array.isArray(inf.buildings) ? inf.buildings : [];
    if (!buildings.length) { list.innerHTML = '<div class="tool-empty" style="padding:24px;color:#64748b;">No buildings found</div>'; return; }

    list.innerHTML = buildings.map(b => {
      const level = b.size > 0 ? b.size : b.level || 1;
      const kind = b.kind || 'unknown';
      const proj = calculateUpgradeCost(kind, level);
      const output = estimateProduction(kind, level, inf.workers || 0, 0);
      return `<div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <strong>${b.kind || 'Unknown'} ${b.name ? `(${b.name})` : ''}</strong>
          <span style="color:#3b82f6;font-weight:600;">Lv ${level}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:11px;color:#94a3b8;">
          <div>Est. Output/day: <span style="color:#e2e8f0;font-weight:600;">${Math.round(output)}</span></div>
          <div>Workers: <span style="color:#e2e8f0;font-weight:600;">${b.workers || 0}</span></div>
          <div>Next Upgrade: <span style="color:#f59e0b;font-weight:600;">$${formatNumber(proj.nextLevelCost)}</span></div>
          <div>Total Invested: <span style="color:#3b82f6;font-weight:600;">$${formatNumber(proj.totalInvested)}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  // --- Production Listeners ---
  function attachProductionListeners() {
    const building = document.getElementById('prodBuilding');
    const level = document.getElementById('prodLevel');
    const workers = document.getElementById('prodWorkers');
    const tech = document.getElementById('prodTech');
    const result = document.getElementById('prodResult');
    const output = document.getElementById('prodOutput');
    const upgradeCost = document.getElementById('prodUpgradeCost');
    const totalInvested = document.getElementById('prodTotalInvested');
    const breakeven = document.getElementById('prodBreakeven');

    function calculate() {
      const b = building.value;
      const l = parseInt(level.value, 10) || 1;
      const w = parseInt(workers.value, 10) || 0;
      const t = parseInt(tech.value, 10) || 0;
      if (!b) { result.style.display = 'none'; return; }

      const proj = calculateUpgradeCost(b, l);
      const out = estimateProduction(b, l, w, t);
      const dailyRevenue = out * 10; // simplified
      const days = dailyRevenue > 0 ? Math.ceil(proj.nextLevelCost / dailyRevenue) : 0;

      output.textContent = Math.round(out) + '/day';
      upgradeCost.textContent = '$' + formatNumber(proj.nextLevelCost);
      totalInvested.textContent = '$' + formatNumber(proj.totalInvested);
      breakeven.textContent = days + ' days';
      result.style.display = 'block';
    }

    [building, level, workers, tech].forEach(el => el.addEventListener('input', calculate));
  }

  // --- Finance Listeners ---
  async function attachFinanceListeners() {
    const refresh = document.getElementById('finRefresh');
    const companyId = await extractCompanyIdFromPage();
    const realm = extractRealmFromPage();

    if (!companyId) { setFinanceError('No company detected'); return; }

    async function load() {
      try {
        const data = await fetchFinanceData(companyId, realm);
        const fin = computeFinance(data);
        document.getElementById('finCash').textContent = '$' + formatNumber(fin.cash);
        document.getElementById('finDaily').textContent = '$' + formatNumber(fin.dailyProfit);
        document.getElementById('finWeekly').textContent = '$' + formatNumber(fin.weeklyProfit);
        document.getElementById('finAssets').textContent = '$' + formatNumber(fin.assets);
        document.getElementById('finRev').textContent = '$' + formatNumber(fin.dailyRevenue);
        document.getElementById('finWages').textContent = '$' + formatNumber(fin.wages);
        document.getElementById('finUpkeep').textContent = '$' + formatNumber(fin.upkeep);
        document.getElementById('finTrans').textContent = '$' + formatNumber(fin.transport);
        document.getElementById('finTax').textContent = '$' + formatNumber(fin.tax);
        document.getElementById('finWorkers').textContent = formatNumber(fin.workers);
      } catch (err) {
        setFinanceError(err.message);
      }
    }

    function setFinanceError(msg) {
      document.querySelectorAll('#finCash, #finDaily, #finWeekly, #finAssets').forEach(el => el.textContent = 'Error');
      console.error('Finance load failed:', msg);
    }

    refresh.addEventListener('click', load);
    await load();
  }

  // --- Market Listeners ---
  function attachMarketListeners() {
    const resource = document.getElementById('alertResource');
    const type = document.getElementById('alertType');
    const price = document.getElementById('alertPrice');
    const addBtn = document.getElementById('alertAdd');
    const list = document.getElementById('alertsList');

    let alerts = [];

    chrome.storage.local.get([STORAGE_KEYS.marketAlerts], (result) => {
      alerts = result[STORAGE_KEYS.marketAlerts] || [];
      renderAlerts();
    });

    function save() {
      chrome.storage.local.set({ [STORAGE_KEYS.marketAlerts]: alerts });
    }

    function renderAlerts() {
      list.innerHTML = alerts.map((a, i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#1e293b;border:1px solid #334155;border-radius:6px;">
          <span style="font-weight:600;color:${a.type==='above'?'#ef4444':'#22c55e'};">${a.type.toUpperCase()}</span>
          <span style="flex:1;text-align:center;font-weight:600;">${a.resource}</span>
          <span style="color:#f59e0b;font-weight:600;">$${a.price}</span>
          <button data-idx="${i}" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;">✕</button>
        </div>
      `).join('');
      list.querySelectorAll('button[data-idx]').forEach(btn => btn.addEventListener('click', () => {
        alerts.splice(parseInt(btn.dataset.idx, 10), 1);
        save(); renderAlerts();
      }));
    }

    addBtn.addEventListener('click', () => {
      const r = resource.value, t = type.value, p = parseFloat(price.value);
      if (!r || !p) return;
      alerts.push({ resource: r, type: t, price: p, created: Date.now() });
      save(); renderAlerts(); price.value = '';
    });

    // Background check
    setInterval(async () => {
      const triggered = await checkMarketAlerts(alerts);
      if (triggered.length) {
        triggered.forEach(t => {
          if (Notification.permission === 'granted') {
            new Notification(`SimcoIntel: ${t.resource} ${t.type} $${t.price}`, { body: `Current price: $${t.currentPrice}` });
          }
          log(`Market alert: ${t.resource} ${t.type} $${t.price} (now $${t.currentPrice})`, 'info');
        });
      }
    }, 5 * 60 * 1000); // 5 min
  }

  // --- Helpers ---
  async function extractCompanyIdFromPage() {
    // Try to get from storage first
    try {
      const storage = await chrome.storage.local.get(['simcointel-company-data-realm-0', 'simcointel-company-data-realm-1']);
      for (const key of ['simcointel-company-data-realm-0', 'simcointel-company-data-realm-1']) {
        const data = storage[key];
        if (data?.companyId) return String(data.companyId);
      }
    } catch {}

    // Fallback to DOM extraction
    const fromLink = findCompanyIdFromLinks(null);
    if (fromLink) return fromLink;
    const m = window.location.pathname.match(/\/company\/(\d+)/);
    return m ? m[1] : null;
  }

  function extractRealmFromPage() {
    const urlMatch = window.location.href.match(/[?&]realm=(\d)/);
    if (urlMatch) return parseInt(urlMatch[1], 10);
    const pathMatch = window.location.pathname.match(/\/(?:realm|entrepreneurs)[-\/]?(\d)/);
    if (pathMatch) return parseInt(pathMatch[1], 10);
    const textMatch = document.body.innerText.match(/Realm\s*(\d+)/i);
    if (textMatch) return parseInt(textMatch[1], 10);
    if (/entrepreneur/i.test(document.body.innerText)) return 1;
    return 0;
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

  function formatNumber(n) {
    if (n == null || isNaN(n)) return '—';
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidebar);
  } else {
    createSidebar();
  }
})();