// Cache TTL configuration - optimized for balance between freshness and performance
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for successful data
const CACHE_FAIL_TTL = 30 * 1000; // 30 seconds for failed requests (faster retry)
const CACHE_LONG_TTL = 15 * 60 * 1000; // 15 minutes for stable reference data
const MAX_CACHE_SIZE = 200; // Maximum entries to prevent memory leaks

// Namespaced cache to prevent key collisions
type CacheEntry = { data: unknown; expiry: number; namespace: string };
export const DATA_CACHE = new Map<string, CacheEntry>();

function enforceCacheLimit() {
  if (DATA_CACHE.size <= MAX_CACHE_SIZE) return;
  // Remove oldest expired entries first, then oldest by insertion order
  const entries = Array.from(DATA_CACHE.entries());
  const now = Date.now();
  // First pass: remove expired
  for (const [key, entry] of entries) {
    if (now >= entry.expiry) DATA_CACHE.delete(key);
  }
  // Second pass: remove oldest if still over limit
  if (DATA_CACHE.size > MAX_CACHE_SIZE) {
    const toDelete = DATA_CACHE.size - MAX_CACHE_SIZE;
    for (const [key] of entries.slice(0, toDelete)) {
      DATA_CACHE.delete(key);
    }
  }
}

export function createNamespacedCache(namespace: string) {
  return {
    async withCache<T>(key: string, fn: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
      const fullKey = `${namespace}:${key}`;
      const cached = DATA_CACHE.get(fullKey);
      if (cached && Date.now() < cached.expiry) return cached.data as T;
      try {
        const data = await fn();
        DATA_CACHE.set(fullKey, { data, expiry: Date.now() + ttl, namespace });
        enforceCacheLimit();
        return data;
      } catch (err) {
        DATA_CACHE.set(fullKey, { data: null, expiry: Date.now() + CACHE_FAIL_TTL, namespace });
        throw err;
      }
    },
    clear() {
      for (const [key, entry] of DATA_CACHE.entries()) {
        if (entry.namespace === namespace) DATA_CACHE.delete(key);
      }
    },
    getSize() {
      let count = 0;
      for (const entry of DATA_CACHE.values()) {
        if (entry.namespace === namespace) count++;
      }
      return count;
    },
  };
}

// Default global cache (no namespace)
export async function withCache<T>(key: string, fn: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const cached = DATA_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data as T;
  try {
    const data = await fn();
    DATA_CACHE.set(key, { data, expiry: Date.now() + ttl, namespace: 'global' });
    enforceCacheLimit();
    return data;
  } catch (err) {
    DATA_CACHE.set(key, { data: null, expiry: Date.now() + CACHE_FAIL_TTL, namespace: 'global' });
    throw err;
  }
}

export { CACHE_TTL, CACHE_FAIL_TTL, CACHE_LONG_TTL, MAX_CACHE_SIZE };
