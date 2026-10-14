/* Bridge content script — injected into simcointel.github.io */
/* Reads chrome.storage.local and exposes data to the web page via DOM + CustomEvents */

(function() {
  'use strict';

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
      el.setAttribute('data-simcointel-extension', chrome.runtime.id);
      document.documentElement.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return el;
  }

  async function refreshAndPublish() {
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

  async function handleDataRequest(event) {
    const { companyData, pairingCode } = await getStorageData();
    const response = {
      companyData,
      pairingCode,
      extensionId: chrome.runtime.id,
      timestamp: Date.now(),
    };

    const responseEvent = new CustomEvent('simcointel:data-response', {
      detail: response,
      bubbles: true,
      composed: true,
    });
    event.target.dispatchEvent(responseEvent);
  }

  // Web page can verify extension is installed via runtime.sendMessage
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message?.type === 'simcointel:ping') {
      sendResponse({ installed: true, id: chrome.runtime.id });
      return false;
    }
    if (message?.type === 'simcointel:get-company-data') {
      getStorageData().then(({ companyData, pairingCode }) => {
        sendResponse({
          companyData,
          pairingCode,
          extensionId: chrome.runtime.id,
          timestamp: Date.now(),
        });
      });
      return true; // async response
    }
    return false;
  });

  document.addEventListener('simcointel:data-request', handleDataRequest);

  // Initial publish and periodic refresh
  refreshAndPublish();
  setInterval(refreshAndPublish, 5000);
})();
