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

  let lastData = null;
  let lastPairingCode = null;

  function getStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY, PAIRING_KEY], (result) => {
        resolve({
          companyData: result[STORAGE_KEY] || null,
          pairingCode: result[PAIRING_KEY] || null,
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
      const { companyData, pairingCode } = await getStorageData();
      lastData = companyData;
      lastPairingCode = pairingCode;

      createDataElement({
        companyData,
        pairingCode,
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
    getStorageData().then(({ companyData, pairingCode }) => {
      notifyPage({
        companyData,
        pairingCode,
        extensionId: chrome.runtime.id,
        timestamp: Date.now(),
      });
    });
  }

  window.addEventListener('message', handleDataRequest);

  refreshAndPublish();
})();
