import { withCache, CACHE_TTL, CACHE_FAIL_TTL } from "./data-cache";
import { apiUrl } from "../config";

const DATA_REPO_OWNER = "SimcoIntel";
const DATA_REPO_NAME = "Data";
const DATA_REPO_BRANCH = "main";

// Use GitHub Raw CDN for faster, more reliable data fetching
const GITHUB_RAW = `https://raw.githubusercontent.com/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/${DATA_REPO_BRANCH}`;
const GITHUB_API = `https://api.github.com/repos/${DATA_REPO_OWNER}/${DATA_REPO_NAME}`;

// In-flight request deduplication: cache promises for concurrent identical requests
const inFlightCache = new Map<string, Promise<unknown>>();

function getOrCreateInFlight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlightCache.get(key);
  if (existing) {
    return existing as Promise<T>;
  }
  const promise = factory().finally(() => {
    inFlightCache.delete(key);
  });
  inFlightCache.set(key, promise);
  return promise;
}

// Map GitHub raw paths to backend API endpoints for fallback (path without /api prefix)
const GITHUB_TO_API_MAP: Record<string, (realm: number) => string> = {
  "public/realm-{realm}/macro.json": (realm) => `/public/export/macro?realm=${realm}`,
  "public/realm-{realm}/history.json": (realm) => `/public/export/history?realm=${realm}&limit=120`,
  "public/realm-{realm}/indexes.json": (realm) => `/public/export/indexes?realm=${realm}&limit=60`,
  "public/realm-{realm}/inflation.json": (realm) => `/public/export/inflation?realm=${realm}&limit=60`,
  "public/realm-{realm}/margins.json": (realm) => `/public/export/margins?realm=${realm}`,
  // Aggregates fallbacks (legacy paths)
  "aggregates/market/realm-{realm}": (realm) => `/public/export/dashboard?realm=${realm}`,
  "aggregates/realm-status/realm-{realm}": (realm) => `/public/export/macro?realm=${realm}`,
  "aggregates/indexes/realm-{realm}": (realm) => `/public/export/indexes?realm=${realm}&limit=60`,
  "aggregates/inflation/realm-{realm}": (realm) => `/public/export/inflation?realm=${realm}&limit=60`,
  // Retail and calculator-live don't have direct backend endpoints yet
};

function getBackendApiUrl(githubPath: string): string | null {
  for (const [pattern, mapper] of Object.entries(GITHUB_TO_API_MAP)) {
    const regex = new RegExp("^" + pattern.replace(/\{realm\}/g, "(\\d+)") + "$");
    const match = githubPath.match(regex);
    if (match) {
      const realm = parseInt(match[1], 10);
      return apiUrl(mapper(realm));
    }
  }
  return null;
}

// Add retry logic with exponential backoff for transient failures
async function fetchWithRetry<T>(url: string, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = Math.min(15000, 5000 * (attempt + 1)); // Increase timeout per retry
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (res.ok) return res.json();
      
      if (res.status === 404) {
        throw new Error(`Resource not found: ${res.status}`);
      }
      
      if (res.status >= 500) {
        // Server error - retry with backoff
        lastError = new Error(`Server error: ${res.status}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      
      throw new Error(`Fetch failed: ${res.status}`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('Request timeout');
      } else if (err instanceof Error) {
        lastError = err;
      } else {
        lastError = new Error('Unknown fetch error');
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }
  
  throw lastError ?? new Error('Fetch failed');
}

// Fetch from GitHub raw with fallback to backend API on 404
export async function fetchWithBackendFallback<T = unknown>(githubPath: string): Promise<T> {
  // Try GitHub raw first
  const githubUrl = `${GITHUB_RAW}/${githubPath}`;
  try {
    return await getOrCreateInFlight(githubUrl, () => fetchWithRetry<T>(githubUrl));
  } catch (githubErr) {
    // Check if it's a 404 error (resource not found)
    if (githubErr instanceof Error && githubErr.message.includes("404")) {
      const apiUrl = getBackendApiUrl(githubPath);
      if (apiUrl) {
        try {
          const res = await fetch(apiUrl);
          if (res.ok) {
            const data = await res.json();
            // Backend API returns { ok: true, data: ... } format
            if (data && typeof data === "object" && "ok" in data && data.ok && "data" in data) {
              return data.data as T;
            }
            return data as T;
          }
        } catch {
          // Backend also failed, fall through to throw original error
        }
      }
    }
    throw githubErr;
  }
}

export async function rawFetch<T = unknown>(path: string): Promise<T> {
  const url = `${GITHUB_RAW}/${path}`;
  return getOrCreateInFlight(url, () => fetchWithRetry<T>(url));
}

const INDEX_CACHE = new Map<string, { data: unknown; expiry: number }>();
const INDEX_TTL = 3 * 60 * 1000; // 3 minutes for index freshness
const INDEX_FAIL_TTL = 20 * 1000; // 20 seconds on failure for quick recovery

export async function fetchIndex(dir: string): Promise<{ latest: string; files: string[] } | null> {
  const key = `index:${dir}`;
  const cached = INDEX_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data as { latest: string; files: string[] } | null;
  
  const fetchKey = `fetchIndex:${dir}`;
  return getOrCreateInFlight(fetchKey, async () => {
    try {
      const data = await rawFetch<{ latest: string; files: string[] }>(`${dir}/index.json`);
      if (data && Array.isArray(data.files)) {
        INDEX_CACHE.set(key, { data, expiry: Date.now() + INDEX_TTL });
        return data;
      }
      INDEX_CACHE.set(key, { data: null, expiry: Date.now() + INDEX_FAIL_TTL });
      return null;
    } catch {
      INDEX_CACHE.set(key, { data: null, expiry: Date.now() + INDEX_FAIL_TTL });
      return null;
    }
  });
}

export async function fetchLatest<T = unknown>(dir: string, prefix: string): Promise<T | null> {
  const index = await fetchIndex(dir);
  if (!index) return null;
  if (index.latest && index.latest.startsWith(prefix)) {
    return rawFetch<T>(`${dir}/${index.latest}`);
  }
  const sorted = (index.files ?? []).filter(f => f.startsWith(prefix) && f.endsWith(".json")).sort().reverse();
  if (sorted.length === 0) return null;
  return rawFetch<T>(`${dir}/${sorted[0]}`);
}

const LIST_CACHE = new Map<string, { files: string[]; expiry: number }>();
const LIST_TTL = 2 * 60 * 1000; // 2 minutes for file listing

export async function listFiles(path: string): Promise<string[]> {
  const key = path;
  const cached = LIST_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.files;

  const fetchKey = `listFiles:${path}`;
  return getOrCreateInFlight(fetchKey, async () => {
    const url = `${GITHUB_API}/contents/${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Not an array");
      const files = data.filter((f: { type: string }) => f.type === "file").map((f: { name: string }) => f.name);
      LIST_CACHE.set(key, { files, expiry: Date.now() + LIST_TTL });
      return files;
    } catch {
      LIST_CACHE.set(key, { files: [], expiry: Date.now() + LIST_TTL });
      return [];
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function fetchAllFiles<T = unknown>(dir: string, prefix: string, limit = 100): Promise<T[]> {
  return withCache(`allfiles:${dir}:${prefix}:${limit}`, async () => {
    const index = await fetchIndex(dir);
    let filenames: string[];
    if (index?.files && index.files.length >= limit) {
      filenames = index.files.filter(f => f.startsWith(prefix) && f.endsWith(".json")).slice(0, limit);
    } else {
      const files = await listFiles(dir);
      filenames = files.filter(f => f.startsWith(prefix) && f.endsWith(".json")).sort().reverse().slice(0, limit);
    }
    // Fetch in parallel with reasonable concurrency
    const BATCH_SIZE = 10;
    const results: T[] = [];
    for (let i = 0; i < filenames.length; i += BATCH_SIZE) {
      const batch = filenames.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(f => rawFetch<T>(`${dir}/${f}`).catch(() => null as T))
      );
      results.push(...batchResults.filter(Boolean) as T[]);
    }
    return results;
  }, 3 * 60 * 1000); // 3 minute cache for batch file fetches
}


