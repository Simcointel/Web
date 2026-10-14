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

function waitForExtensionResponse(timeoutMs: number): Promise<{ companyData: ExtensionCompanyData | null; pairingCode: string | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      document.removeEventListener('simcointel:data-response', handler as EventListener);
      reject(new Error('Timeout waiting for extension response'));
    }, timeoutMs);

    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.source !== 'simcointel-extension') return;
      clearTimeout(timer);
      document.removeEventListener('simcointel:data-response', handler as EventListener);
      resolve({
        companyData: detail.companyData ?? null,
        pairingCode: detail.pairingCode ?? null,
      });
    }

    document.addEventListener('simcointel:data-response', handler as EventListener);
  });
}

export async function requestExtensionData(): Promise<ExtensionCompanyData | null> {
  const responsePromise = waitForExtensionResponse(TIMEOUT_MS);
  document.dispatchEvent(new CustomEvent('simcointel:data-request', { detail: { type: 'simcointel:data-request' }, bubbles: true, composed: true }));
  const response = await responsePromise;
  return response.companyData;
}

export async function isExtensionAvailable(): Promise<boolean> {
  try {
    const responsePromise = waitForExtensionResponse(500);
    document.dispatchEvent(new CustomEvent('simcointel:data-request', { detail: { type: 'simcointel:data-request' }, bubbles: true, composed: true }));
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
