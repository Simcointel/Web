import type { AuthDataPayload } from '../types/api';

const PAIRING_KEY = 'simcointel-pairing-code';
const TIMEOUT_MS = 2000;
const AUTH_TIMEOUT_MS = 15000;
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
  // Realm info
  realm?: number;
  syncedAt?: string;
  [key: string]: unknown;
}

export interface ExtensionDataResponse {
  companyData: ExtensionCompanyData | null;
  companyDataByRealm: { 0: ExtensionCompanyData | null; 1: ExtensionCompanyData | null };
  pairingCode: string | null;
  authData: AuthDataPayload | null;
  preferredRealm: number;
}

function waitForExtensionResponse(timeoutMs: number): Promise<ExtensionDataResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Timeout waiting for extension response'));
    }, timeoutMs);

    function handler(e: MessageEvent) {
      if (!isAllowedOrigin(e.origin)) return;
      if (e.data?.type !== 'simcointel:data-response') return;
      if (e.data?.detail?.source !== 'simcointel-extension') return;
      console.log('[SimcoIntel Page] Received data-response from bridge');
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      const d = e.data?.detail ?? {};
      resolve({
        companyData: d.companyData ?? null,
        companyDataByRealm: d.companyDataByRealm ?? { 0: null, 1: null },
        pairingCode: d.pairingCode ?? null,
        authData: d.authData ?? null,
        preferredRealm: d.preferredRealm ?? 0,
      });
    }

    window.addEventListener('message', handler);
  });
}

function waitForAuthDataResponse(timeoutMs: number): Promise<{ authData: AuthDataPayload | null; error?: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Timeout waiting for extension response'));
    }, timeoutMs);

    function handler(e: MessageEvent) {
      if (!isAllowedOrigin(e.origin)) return;
      if (e.data?.type !== 'simcointel:auth-data-response') return;
      if (e.data?.detail?.source !== 'simcointel-extension') return;
      console.log('[SimcoIntel Page] Received auth-data-response from bridge');
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      resolve({
        authData: e.data?.detail?.authData ?? null,
        error: e.data?.detail?.error,
      });
    }

    window.addEventListener('message', handler);
  });
}

function getTargetOrigin(): string {
  return window.location.origin;
}

export async function requestExtensionData(): Promise<ExtensionDataResponse> {
  const responsePromise = waitForExtensionResponse(TIMEOUT_MS);
  window.postMessage({ type: 'simcointel:data-request', source: 'simcointel-web' }, getTargetOrigin());
  return responsePromise;
}

export async function requestAuthData(): Promise<{ authData: AuthDataPayload | null; error?: string }> {
  const responsePromise = waitForAuthDataResponse(AUTH_TIMEOUT_MS);
  window.postMessage({ type: 'simcointel:auth-data-request', source: 'simcointel-web' }, getTargetOrigin());
  return responsePromise;
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
