const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';

const ALARM_NAME = 'simcointel-refresh';

async function refreshData() {
  try {
    const realm = await chrome.storage.local.get(['realm']).then(r => r.realm ?? 0);
    const margins = await fetch(`${API_BASE}/public/realm-${realm}/margins.json`).then(r => r.json());

    if (margins?.length) {
      const top = margins
        .filter(r => r.outputVwap > 0)
        .sort((a, b) => b.marginPct - a.marginPct)
        .slice(0, 3)
        .map(r => `${r.name}: ${r.marginPct.toFixed(1)}%`)
        .join(', ');

      chrome.action.setBadgeText({ text: String(margins.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    }
  } catch (err) {
    console.error('SimcoIntel refresh failed:', err);
  }
}

chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshData();
});

chrome.runtime.onInstalled.addListener(() => {
  refreshData();
});

chrome.runtime.onStartup.addListener(() => {
  refreshData();
});
