// Cache TTL configuration - optimized for balance between freshness and performance
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for successful data
const CACHE_FAIL_TTL = 30 * 1000; // 30 seconds for failed requests (faster retry)
const CACHE_LONG_TTL = 15 * 60 * 1000; // 15 minutes for stable reference data

export const DATA_CACHE = new Map<string, { data: unknown; expiry: number }>();

export async function withCache<T>(key: string, fn: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const cached = DATA_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data as T;
  try {
    const data = await fn();
    DATA_CACHE.set(key, { data, expiry: Date.now() + ttl });
    return data;
  } catch (err) {
    // Don't cache failures: upstream fetchers (rawFetch/fetchWithRetry) already
    // implement retry with exponential backoff. Caching failures here would
    // suppress their retry logic and cause premature fallback to stale data.
    // If a caller wants failure caching, it can wrap withCache and handle it.
    DATA_CACHE.delete(key);
    throw err;
  }
}

export { CACHE_TTL, CACHE_FAIL_TTL, CACHE_LONG_TTL };
