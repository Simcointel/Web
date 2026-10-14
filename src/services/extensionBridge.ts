const PAIRING_KEY = 'simcointel-pairing-code';
const TIMEOUT_MS = 2000;

export interface ExtensionCompanyData {
  companyId?: string;
  companyName?: string;
  companyLevel?: number;
  companyRank?: number;
  companyValue?: number;
  apiAO?: number;
  workers?: number;
  buildings?: Array<{ id?: string; level?: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

function waitForPostMessage(timeoutMs: number): Promise<{ companyData: ExtensionCompanyData | null; pairingCode: string | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Timeout waiting for extension response'));
    }, timeoutMs);

    function handler(e: MessageEvent) {
      if (e.data?.type !== 'simcointel:data-response') return;
      if (e.data?.source !== 'simcointel-extension') return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      resolve({
        companyData: e.data?.detail?.companyData ?? null,
        pairingCode: e.data?.detail?.pairingCode ?? null,
      });
    }

    window.addEventListener('message', handler);
  });
}

export async function requestExtensionData(): Promise<ExtensionCompanyData | null> {
  const responsePromise = waitForPostMessage(TIMEOUT_MS);
  window.postMessage({ type: 'simcointel:data-request', source: 'simcointel-web' }, '*');
  const response = await responsePromise;
  return response.companyData;
}

export async function isExtensionAvailable(): Promise<boolean> {
  try {
    const responsePromise = waitForPostMessage(500);
    window.postMessage({ type: 'simcointel:data-request', source: 'simcointel-web' }, '*');
    await responsePromise;
    return true;
  } catch {
    return false;
  }
}

export function getPairingCode(): string {
  let code = localStorage.getItem(PAIRING_KEY);
  if (!code) {
    code = crypto.randomUUID();
    localStorage.setItem(PAIRING_KEY, code);
  }
  return code;
}
