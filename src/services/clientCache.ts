/**
 * Client-side IndexedDB cache with automatic expiration, compression, and quotas.
 * Provides offline-first capabilities and reduces backend load.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  compressed?: boolean;
  size: number;
}

interface CacheOptions {
  maxAge?: number;           // TTL in ms
  maxSize?: number;          // Max total cache size in bytes
  compress?: boolean;        // Enable compression for large entries
  namespace?: string;        // Cache namespace
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  maxSize: 50 * 1024 * 1024,    // 50 MB
  compress: true,
  namespace: 'simcointel',
};

class ClientCache {
  private db: IDBDatabase | null = null;
  private options: Required<CacheOptions>;
  private initPromise: Promise<void> | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(`${this.options.namespace}-cache`, 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('namespace', 'namespace', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  private async compress(data: string): Promise<string> {
    if (!this.options.compress) return data;
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    await writer.write(new TextEncoder().encode(data));
    await writer.close();
    const compressed = await new Response(stream.readable).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(compressed)));
  }

  private async decompress(data: string): Promise<string> {
    if (!this.options.compress) return data;
    try {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      await writer.write(bytes);
      await writer.close();
      const decompressed = await new Response(stream.readable).text();
      return decompressed;
    } catch {
      return data; // Return as-is if decompression fails
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Cache not initialized');

    const serialized = JSON.stringify(data);
    const compressed = this.options.compress ? await this.compress(serialized) : serialized;
    const size = new TextEncoder().encode(compressed).length;
    const now = Date.now();
    const expiresAt = now + (ttl || this.options.maxAge);

    // Check quota before writing
    await this.enforceQuota(size);

    const entry: CacheEntry<string> = {
      data: compressed,
      timestamp: Date.now(),
      expiresAt,
      compressed: this.options.compress,
      size,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('entries', 'readwrite');
      tx.objectStore('entries').put({ key, ...entry, namespace: this.options.namespace });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) throw new Error('Cache not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('entries', 'readonly');
      const request = tx.objectStore('entries').get([this.options.namespace, key]);
      request.onsuccess = async () => {
        const entry = request.result as CacheEntry<string> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }

        if (Date.now() > entry.expiresAt) {
          // Expired - delete and return null
          this.delete(key).catch(() => {});
          resolve(null);
          return;
        }

        try {
          const data = entry.compressed 
            ? JSON.parse(await this.decompress(entry.data))
            : JSON.parse(entry.data);
          resolve(data);
        } catch (e) {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('entries', 'readwrite');
      tx.objectStore('entries').delete([this.options.namespace, key]);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(namespace?: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const targetNamespace = namespace || this.options.namespace;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      const index = store.index('namespace');
      const request = index.openCursor(IDBKeyRange.only(targetNamespace));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async enforceQuota(newEntrySize: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const index = store.index('namespace');
      const request = index.openCursor(IDBKeyRange.only(this.options.namespace));

      let totalSize = 0;
      const entries: { key: IDBValidKey; size: number; expiresAt: number }[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<string>;
          totalSize += entry.size;
          entries.push({ key: cursor.primaryKey, size: entry.size, expiresAt: entry.expiresAt });
          cursor.continue();
        } else {
          // Check if we need to evict
          const maxSize = this.options.maxSize;
          if (totalSize + newEntrySize > maxSize) {
            // Sort by expiration (expire soonest first) then by LRU
            entries.sort((a, b) => a.expiresAt - b.expiresAt || a.expiresAt - b.expiresAt);
            this.evictEntries(entries, totalSize + newEntrySize - maxSize).then(resolve).catch(reject);
          } else {
            resolve();
          }
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async evictEntries(entries: { key: IDBValidKey; size: number }[], bytesToFree: number): Promise<void> {
    if (!this.db) return;

    let freed = 0;
    for (const entry of entries) {
      if (freed >= bytesToFree) break;
      await this.delete(entry.key as string);
      freed += entry.size;
    }
  }

  async getStats(): Promise<{ entries: number; totalSize: number; oldestEntry: number; newestEntry: number }> {
    await this.init();
    if (!this.db) return { entries: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('entries', 'readonly');
      const store = tx.objectStore('entries');
      const index = store.index('namespace');
      const request = index.openCursor(IDBKeyRange.only(this.options.namespace));

      let entries = 0;
      let totalSize = 0;
      let oldest = Infinity;
      let newest = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value as CacheEntry<string>;
          entries++;
          totalSize += entry.size;
          oldest = Math.min(oldest, entry.timestamp);
          newest = Math.max(newest, entry.timestamp);
          cursor.continue();
        } else {
          resolve({ entries, totalSize, oldestEntry: oldest === Infinity ? 0 : oldest, newestEntry: newest });
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
let cacheInstance: ClientCache | null = null;

export function getClientCache(options?: CacheOptions): ClientCache {
  if (!cacheInstance) {
    cacheInstance = new ClientCache(options);
  }
  return cacheInstance;
}

export async function initClientCache(options?: CacheOptions): Promise<ClientCache> {
  const cache = getClientCache(options);
  await cache.init();
  return cache;
}

// React hook for easy usage
export function useClientCache<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions & { ttl?: number }) {
  // This would be used with React Query or SWR in practice
  // For now, return the cache instance
  return getClientCache(options);
}