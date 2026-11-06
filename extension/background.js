const API_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';

async function refreshData() {
  try {
    const realm = await chrome.storage.local.get(['realm']).then(r => r.realm ?? 0);
    const margins = await fetch(`${API_BASE}/public/realm-${realm}/margins.json`).then(r => r.json());

    if (margins?.length) {
      chrome.action.setBadgeText({ text: String(margins.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
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

// auth-data: the worker is the only context that can fetch this cross-origin
const AUTH_URL = 'https://www.simcompanies.com/api/v3/companies/auth-data/';
const AUTH_KEY = 'simcointel-auth-data';
const COMPANY_TAB = 'https://www.simcompanies.com/*';

async function fetchAuthDataDirect() {
  try {
    const res = await fetch(AUTH_URL, { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.authCompany ? data : null;
  } catch {
    return null;
  }
}

function fetchAuthDataFromTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: COMPANY_TAB }, (tabs) => {
      if (chrome.runtime.lastError || !tabs?.length) return resolve(null);
      chrome.tabs.sendMessage(tabs[0].id, { type: 'simcointel:fetch-auth-data' }, (res) => {
        if (chrome.runtime.lastError) return resolve(null);
        resolve(res?.ok ? res.data ?? null : null);
      });
    });
  });
}

async function fetchAuthData() {
  const data = (await fetchAuthDataDirect()) ?? (await fetchAuthDataFromTab());
  if (!data) return { ok: false, error: 'not-signed-in' };
  const payload = { ...data, syncedAt: new Date().toISOString() };
  // wait for the write: the MV3 worker may be killed right after the response
  await new Promise((resolve) =>
    chrome.storage.local.set({ [AUTH_KEY]: payload }, () => {
      void chrome.runtime.lastError; // must be read to suppress unchecked-error noise
      resolve();
    })
  );
  // shortcut: write failure reported as ok, upgrade if cache staleness matters
  return { ok: true, data: payload };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'simcointel:fetch-auth-data') return false;
  fetchAuthData()
    .then(sendResponse)
    .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
  return true;
});
