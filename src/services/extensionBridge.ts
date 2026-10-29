const PAIRING_KEY = 'simcointel-pairing-code';
const TIMEOUT_MS = 2000;
const ALLOWED_ORIGINS = [
  'https://simcointel.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

export interface ExtensionCompanyData {
  companyId?: string | number;
  companyName?: string;
  companyLevel?: number;
  companyRank?: number;
  companyValue?: number;
  apiAO?: number;
  governmentOrderTierIndex?: number;
  governmentTier?: number;
  extraSlots?: number;
  onlineStatus?: string;
  workers?: number;
  buildings?: Array<{ id?: string; name?: string; level?: number; instanceId?: number; [key: string]: unknown }>;
  // Legacy keys written by extension <= 1.2.1
  level?: number;
  rank?: number;
  value?: number;
  adminOverhead?: number | string;
  [key: string]: unknown;
}

function waitForExtensionResponse(timeoutMs: number): Promise<{ companyData: ExtensionCompanyData | null; pairingCode: string | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Timeout waiting for extension response'));
    }, timeoutMs);

    function handler(e: MessageEvent) {
      if (!isAllowedOrigin(e.origin)) return;
      if (e.data?.type !== 'simcointel:data-response') return;
      if (e.data?.detail?.source !== 'simcointel-extension') return;
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

function getTargetOrigin(): string {
  return window.location.origin;
}

export async function requestExtensionData(): Promise<ExtensionCompanyData | null> {
  const responsePromise = waitForExtensionResponse(TIMEOUT_MS);
  window.postMessage({ type: 'simcointel:data-request', source: 'simcointel-web' }, getTargetOrigin());
  const response = await responsePromise;
  return response.companyData;
}

export async function isExtensionAvailable(): Promise<boolean> {
  try {
    const responsePromise = waitForExtensionResponse(500);
    window.postMessage({ type: 'simcointel:data-request', source: 'simcointel-web' }, getTargetOrigin());
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
