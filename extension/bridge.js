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
    document.dispatchEvent(new CustomEvent('simcointel:data-response', {
      detail: { ...data, source: 'simcointel-extension', extensionId: chrome.runtime.id },
      bubbles: true,
      composed: true,
    }));
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

  function handleDataRequest(event) {
    if (event.detail?.type !== 'simcointel:data-request') return;
    log('Data request received from web page via DOM event');
    getStorageData().then(({ companyData, pairingCode }) => {
      notifyPage({
        companyData,
        pairingCode,
        extensionId: chrome.runtime.id,
        timestamp: Date.now(),
      });
    });
  }

  document.addEventListener('simcointel:data-request', handleDataRequest);

  // Initial publish and periodic refresh
  refreshAndPublish();
  setInterval(refreshAndPublish, 5000);
})();
