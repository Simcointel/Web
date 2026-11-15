/**
 * Cross-tab localStorage synchronization using BroadcastChannel and storage events.
 */

interface LocalSyncOptions {
  prefix: string;
  useBroadcastChannel: boolean;
  storageEventsEnabled: boolean;
}

interface BroadcastMessage {
  type: 'set' | 'delete' | 'clear';
  key: string;
  value?: any;
  timestamp: number;
  sourceTabId: string;
}

interface SyncListener {
  (event: string, key: string, value?: any): void;
}

const DEFAULT_OPTIONS: LocalSyncOptions = {
  prefix: 'simcointel:',
  useBroadcastChannel: true,
  storageEventsEnabled: true,
};

function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class LocalSync {
  private options: LocalSyncOptions;
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<SyncListener>> = new Map();
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private initialized = false;

  constructor(options: Partial<LocalSyncOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.tabId = generateTabId();
    this.initialized = false;
  }

  init(): void {
    if (this.initialized) return;

    if (this.options.useBroadcastChannel && typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('simcointel-sync');
      this.channel.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };
    }

    if (this.options.storageEventsEnabled) {
      this.storageListener = (event: StorageEvent) => {
        if (event.key && event.key.startsWith(this.options.prefix) && event.newValue !== event.oldValue) {
          try {
            const data = JSON.parse(event.newValue || '{}');
            this.notifyListeners('set', event.key.replace(this.options.prefix, ''), data);
          } catch {
            // Ignore parse errors
          }
        }
      };
      window.addEventListener('storage', this.storageListener);
    }

    this.initialized = true;
  }

  private handleMessage(message: BroadcastMessage): void {
    if (message.sourceTabId === this.tabId) return;
    this.notifyListeners(message.type, message.key, message.value);
  }

  private notifyListeners(event: string, key: string, value?: any): void {
    const keyListeners = this.listeners.get(key);
    const allListeners = this.listeners.get('*');

    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(event, key, value);
        } catch (e) {
          console.error('Sync listener error:', e);
        }
      });
    }
    if (allListeners) {
      allListeners.forEach((listener) => {
        try {
          listener(event, key, value);
        } catch (e) {
          console.error('Sync listener error:', e);
        }
      });
    }
  }

  set(key: string, value: any): void {
    if (!this.initialized) this.init();

    const timestamp = Date.now();
    localStorage.setItem(`${this.options.prefix}${key}`, JSON.stringify({ value, timestamp }));

    this.broadcast({ type: 'set', key, value, timestamp, sourceTabId: this.tabId });
    this.notifyListeners('set', key, value);
  }

  get(key: string): any {
    const item = localStorage.getItem(`${this.options.prefix}${key}`);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      return parsed.value;
    } catch {
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(`${this.options.prefix}${key}`);

    this.broadcast({ type: 'delete', key, timestamp: Date.now(), sourceTabId: this.tabId });
    this.notifyListeners('delete', key);
  }

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.options.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    this.broadcast({ type: 'clear', key: '', timestamp: Date.now(), sourceTabId: this.tabId });
    this.notifyListeners('clear', '');
  }

  private broadcast(message: BroadcastMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  subscribe(key: string, listener: SyncListener): () => void {
    if (!this.initialized) this.init();

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  subscribeAll(listener: SyncListener): () => void {
    if (!this.initialized) this.init();

    if (!this.listeners.has('*')) {
      this.listeners.set('*', new Set());
    }
    this.listeners.get('*')!.add(listener);

    return () => {
      this.listeners.get('*')?.delete(listener);
    };
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.options.prefix)) {
        const unprefixedKey = key.replace(this.options.prefix, '');
        const item = localStorage.getItem(key);
        if (item) {
          try {
            result[unprefixedKey] = JSON.parse(item).value;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
    return result;
  }

  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

let syncInstance: LocalSync | null = null;

export function getLocalSync(options: Partial<LocalSyncOptions> = {}): LocalSync {
  if (!syncInstance) {
    syncInstance = new LocalSync(options);
    syncInstance.init();
  }
  return syncInstance;
}

export function initLocalSync(options: Partial<LocalSyncOptions> = {}): LocalSync {
  const sync = getLocalSync(options);
  sync.init();
  return sync;
}

export function useLocalSync(key: string, defaultValue: any, options: Partial<LocalSyncOptions> = {}): LocalSync {
  return getLocalSync(options);
}