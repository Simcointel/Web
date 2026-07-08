const CACHE_TTL = 2 * 60 * 1000;
const CACHE_FAIL_TTL = 10 * 1000;

export const DATA_CACHE = new Map<string, { data: unknown; expiry: number }>();

export async function withCache<T>(key: string, fn: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const cached = DATA_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data as T;
  try {
    const data = await fn();
    DATA_CACHE.set(key, { data, expiry: Date.now() + ttl });
    return data;
  } catch (err) {
    DATA_CACHE.set(key, { data: null, expiry: Date.now() + CACHE_FAIL_TTL });
    throw err;
  }
}

export { CACHE_TTL, CACHE_FAIL_TTL };
