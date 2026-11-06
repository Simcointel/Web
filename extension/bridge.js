/* Bridge content script — injected into simcointel.github.io/Web */
/* Reads chrome.storage.local and exposes data to the web page via DOM + CustomEvents */

(function() {
  'use strict';

  function log(message, type = 'info') {
    const prefix = '[SimcoIntel Bridge]';
    if (type === 'error') console.error(prefix, message);
    else console.log(prefix, message);
  }

  const STORAGE_KEY = 'simcointel-company-data';
  const PAIRING_KEY = 'simcointel-pairing-code';
  const AUTH_KEY = 'simcointel-auth-data';

  let lastData = null;
  let lastPairingCode = null;

  function getStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY, PAIRING_KEY, AUTH_KEY], (result) => {
        resolve({
          companyData: result[STORAGE_KEY] || null,
          pairingCode: result[PAIRING_KEY] || null,
          authData: result[AUTH_KEY] || null,
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
    window.postMessage({
      type: 'simcointel:data-response',
      detail: { ...data, source: 'simcointel-extension', extensionId: chrome.runtime.id },
    }, window.location.origin);
  }

  async function refreshAndPublish() {
    log('Refreshing storage data...');
    try {
      const { companyData, pairingCode, authData } = await getStorageData();
      lastData = companyData;
      lastPairingCode = pairingCode;

      createDataElement({
        companyData,
        pairingCode,
        authData,
        extensionId: chrome.runtime.id,
        timestamp: Date.now(),
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
    getStorageData().then(({ companyData, pairingCode, authData }) => {
      notifyPage({
        companyData,
        pairingCode,
        authData,
        extensionId: chrome.runtime.id,
        timestamp: Date.now(),
      });
    });
  }

  function handleAuthRequest(event) {
    if (!isAllowedOrigin(event.origin)) return;
    if (event.data?.type !== 'simcointel:auth-data-request') return;
    if (event.data?.source !== 'simcointel-web') return;
    chrome.runtime.sendMessage({ type: 'simcointel:fetch-auth-data' }, (res) => {
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

  window.addEventListener('message', handleAuthRequest);

  refreshAndPublish();
})();
