const STORAGE_KEY = 'simcointel-company-data';
const PAIRING_KEY = 'simcointel-pairing-code';
const REQUEST_EVENT = 'simcointel:data-request';
const RESPONSE_EVENT = 'simcointel:data-response';
const PING_EVENT = 'simcointel:ping';
const PONG_EVENT = 'simcointel:pong';
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

function dispatchCustomEvent(name: string, detail?: unknown): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function waitForResponse<T>(eventName: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener(eventName, handler);
      reject(new Error(`Timeout waiting for ${eventName}`));
    }, timeoutMs);

    function handler(e: Event) {
      clearTimeout(timer);
      window.removeEventListener(eventName, handler);
      resolve((e as CustomEvent<T>).detail);
    }

    window.addEventListener(eventName, handler);
  });
}

export async function requestExtensionData(): Promise<ExtensionCompanyData> {
  const responsePromise = waitForResponse<ExtensionCompanyData>(RESPONSE_EVENT, TIMEOUT_MS);
  dispatchCustomEvent(REQUEST_EVENT);
  return responsePromise;
}

export async function isExtensionAvailable(): Promise<boolean> {
  try {
    const pongPromise = waitForResponse<unknown>(PONG_EVENT, 500);
    dispatchCustomEvent(PING_EVENT);
    await pongPromise;
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
