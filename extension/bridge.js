/* Bridge content script — injected into simcointel.github.io/Web */
/* Reads chrome.storage.local and exposes data to the web page via DOM + CustomEvents */

(function() {
  'use strict';

  function log(message, type = 'info') {
    const prefix = '[SimcoIntel Bridge]';
    if (type === 'error') console.error(prefix, message);
    else console.log(prefix, message);
  }

  const STORAGE_KEY_BASE = 'simcointel-company-data';
  const PAIRING_KEY = 'simcointel-pairing-code';
  const AUTH_KEY = 'simcointel-auth-data';

  let lastData = null;
  let lastPairingCode = null;

  function getStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([
        'simcointel-company-data-realm-0',
        'simcointel-company-data-realm-1',
        PAIRING_KEY,
        AUTH_KEY
      ], (result) => {
        log('Storage read complete', 'info');
        const realm0Data = result['simcointel-company-data-realm-0'] || null;
        const realm1Data = result['simcointel-company-data-realm-1'] || null;
        // Determine which realm has more recent data or default to realm 0
        const preferredRealm = (realm0Data?.syncedAt && realm1Data?.syncedAt)
          ? (new Date(realm1Data.syncedAt) > new Date(realm0Data.syncedAt) ? 1 : 0)
          : (realm1Data ? 1 : 0);
        resolve({
          companyData: result[`simcointel-company-data-realm-${preferredRealm}`] || null,
          companyDataByRealm: {
            0: realm0Data,
            1: realm1Data,
          },
          pairingCode: result[PAIRING_KEY] || null,
          authData: result[AUTH_KEY] || null,
          preferredRealm,
        });
      });
    });
  }

  function createDataElement(data) {
    let el = document.getElementById('simcointel-extension-data');
    if (!el) {
      el = document.createElement('div');
      el.id = 'simcointel-extension-data';
      el.style.display = 'none';
      el.setAttribute('data-extension-id', chrome.runtime.id);
      document.documentElement.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return el;
  }

  function notifyPage(data) {
    log('Posting data-response to page', 'info');
    window.postMessage({
      type: 'simcointel:data-response',
      detail: { ...data, source: 'simcointel-extension', extensionId: chrome.runtime.id },
    }, window.location.origin);
  }

  async function refreshAndPublish() {
    log('Refreshing storage data...');
    try {
      const { companyData, companyDataByRealm, pairingCode, authData, preferredRealm } = await getStorageData();
      lastData = companyData;
      lastPairingCode = pairingCode;

      createDataElement({
        companyData,
        companyDataByRealm,
        pairingCode,
        authData,
        extensionId: chrome.runtime.id,
        timestamp: Date.now(),
        preferredRealm,
      });
    } catch (err) {
      console.error('[SimcoIntel Bridge] Failed to read storage:', err);
    }
  }

  const ALLOWED_ORIGINS = [
    'https://simcointel.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  function isAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
  }

  function handleDataRequest(event) {
    if (!isAllowedOrigin(event.origin)) return;
    if (event.data?.type !== 'simcointel:data-request') return;
    if (event.data?.source !== 'simcointel-web') return;
    log('Data request received from web page via postMessage');
    getStorageData().then(({ companyData, companyDataByRealm, pairingCode, authData, preferredRealm }) => {
      notifyPage({
        companyData,
        companyDataByRealm,
        pairingCode,
        authData,
        extensionId: chrome.runtime.id,
        timestamp: Date.now(),
        preferredRealm,
      });
    });
  }

  function handleAuthRequest(event) {
    if (!isAllowedOrigin(event.origin)) return;
    if (event.data?.type !== 'simcointel:auth-data-request') return;
    if (event.data?.source !== 'simcointel-web') return;
    log('Auth request received, sending to background worker', 'info');
    chrome.runtime.sendMessage({ type: 'simcointel:fetch-auth-data' }, (res) => {
      if (chrome.runtime.lastError) {
        log('Background worker error: ' + chrome.runtime.lastError.message, 'error');
      }
      log('Background worker responded: ' + JSON.stringify({ ok: res?.ok, error: res?.error, hasData: !!res?.data }), 'info');
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

  window.addEventListener('message', handleDataRequest);
  window.addEventListener('message', handleAuthRequest);

  refreshAndPublish();
})();
