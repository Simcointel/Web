const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';

async function refreshData() {
  try {
    const realm = await chrome.storage.local.get(['realm']).then(r => r.realm ?? 0);
    const response = await fetch(`${API_BASE}/public/realm-${realm}/margins.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const margins = await response.json();

    // Validate response structure: expect array of objects with required fields
    if (Array.isArray(margins) && margins.every(m => m && typeof m.i === 'number' && typeof m.n === 'string')) {
      chrome.action.setBadgeText({ text: String(margins.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    } else {
      console.warn('SimcoIntel: Invalid margins data structure');
    }
  } catch (err) {
    console.error('SimcoIntel refresh failed:', err);
  }
}

chrome.alarms.create('simcointel-refresh', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'simcointel-refresh') refreshData();
});

chrome.runtime.onInstalled.addListener(() => {
  refreshData();
});

chrome.runtime.onStartup.addListener(() => {
  refreshData();
});

refreshData();
