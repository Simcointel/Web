/**
 * LocalStorage abstraction with versioning and migration support
 * Provides safe get/set with quota handling and schema migration
 */

const STORAGE_PREFIX = 'simco_';
const STORAGE_VERSION_KEY = 'simco_storage_version';
const CURRENT_VERSION = 1;

interface Migration {
  version: number;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

const migrations: Migration[] = [
  // Add future migrations here
  // Example:
  // {
  //   version: 2,
  //   migrate: (data) => {
  //     // Migration logic
  //     return data;
  //   }
  // }
];

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function getVersion(): number {
  try {
    const v = localStorage.getItem(STORAGE_VERSION_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

function setVersion(version: number): void {
  try {
    localStorage.setItem(STORAGE_VERSION_KEY, String(version));
  } catch {
    // ignore quota errors
  }
}

function runMigrations(data: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
  let result = { ...data };
  for (const migration of migrations) {
    if (migration.version > fromVersion) {
      try {
        result = migration.migrate(result);
      } catch (err) {
        console.warn(`Migration to v${migration.version} failed:`, err);
      }
    }
  }
  return result;
}

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(getStorageKey(key));
    if (stored === null) return fallback;
    
    const parsed = JSON.parse(stored);
    const storedVersion = parsed.__version ?? 0;
    
    if (storedVersion < CURRENT_VERSION) {
      const migrated = runMigrations(parsed, storedVersion);
      migrated.__version = CURRENT_VERSION;
      try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(migrated));
      } catch {
        // ignore quota errors
      }
      return migrated as T;
    }
    
    return parsed as T;
  } catch (err) {
    console.warn(`Failed to read storage key "${key}":`, err);
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T): boolean {
  try {
    const data = { ...value, __version: CURRENT_VERSION } as Record<string, unknown>;
    localStorage.setItem(getStorageKey(key), JSON.stringify(data));
    setVersion(CURRENT_VERSION);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded');
    }
    console.warn(`Failed to write storage key "${key}":`, err);
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch {
    // ignore
  }
}

export function clearAllStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

// Specific storage helpers for known keys
export const storage = {
  // Realm selection
  getRealm: () => getStorage<number>('realm', 0),
  setRealm: (realm: number) => setStorage('realm', realm),
  
  // Corporate Suite state
  getSuiteState: <T,>(fallback: T) => getStorage<T>('suite_v6', fallback),
  setSuiteState: <T,>(state: T) => setStorage('suite_v6', state),
  
  // Pairing code
  getPairingCode: () => getStorage<string>('pairing_code', ''),
  setPairingCode: (code: string) => setStorage('pairing_code', code),
  
  // Theme
  getTheme: () => getStorage<'light' | 'dark'>('theme', 'light'),
  setTheme: (theme: 'light' | 'dark') => setStorage('theme', theme),
  
  // Generic
  get: <T,>(key: string, fallback: T) => getStorage<T>(key, fallback),
  set: <T,>(key: string, value: T) => setStorage(key, value),
  remove: (key: string) => removeStorage(key),
};

// Backward compat - migrate old keys on first load
export function migrateLegacyStorage(): void {
  const legacyKeys = [
    'simco_realm',
    'simco_suite_v6',
    'simcointel-pairing-code',
  ];
  
  for (const legacyKey of legacyKeys) {
    try {
      const value = localStorage.getItem(legacyKey);
      if (value !== null) {
        const newKey = legacyKey.replace('simco_', '').replace('simcointel-', '');
        localStorage.setItem(getStorageKey(newKey), value);
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // ignore
    }
  }
}