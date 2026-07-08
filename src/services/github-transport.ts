import { withCache, CACHE_TTL, CACHE_FAIL_TTL } from "./data-cache";

const DATA_REPO_OWNER = "SimcoIntel";
const DATA_REPO_NAME = "Data";
const DATA_REPO_BRANCH = "main";

const GITHUB_RAW = `https://raw.githubusercontent.com/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/${DATA_REPO_BRANCH}`;
const GITHUB_API = `https://api.github.com/repos/${DATA_REPO_OWNER}/${DATA_REPO_NAME}`;

export async function rawFetch<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_RAW}/${path}`);
  if (!res.ok) throw new Error(`Data repo fetch failed: ${res.status}`);
  return res.json();
}

const INDEX_CACHE = new Map<string, { data: unknown; expiry: number }>();
const INDEX_TTL = 5 * 60 * 1000;
const INDEX_FAIL_TTL = 30 * 1000;

export async function fetchIndex(dir: string): Promise<{ latest: string; files: string[] } | null> {
  const key = `index:${dir}`;
  const cached = INDEX_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data as { latest: string; files: string[] } | null;
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
}

export async function tryDirectFetch<T = unknown>(dir: string, prefix: string, dateStr: string): Promise<T | null> {
  const path = `${dir}/${prefix}${dateStr}.json`;
  const res = await fetch(`${GITHUB_RAW}/${path}`);
  if (res.ok) return res.json();
  return null;
}

export async function fetchLatest<T = unknown>(dir: string, prefix: string): Promise<T | null> {
  const index = await fetchIndex(dir);
  if (index?.latest && index.latest.startsWith(prefix)) {
    return rawFetch<T>(`${dir}/${index.latest}`);
  }

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) =>
    new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
  );
  const results = await Promise.all(dates.map(d => tryDirectFetch<T>(dir, prefix, d)));
  const found = results.find(r => r !== null);
  if (found) return found;

  const files = await listFiles(dir);
  const matches = files.filter(f => f.startsWith(prefix) && f.endsWith(".json")).sort().reverse();
  if (matches.length === 0) return null;
  return rawFetch<T>(`${dir}/${matches[0]}`);
}

const LIST_CACHE = new Map<string, { files: string[]; expiry: number }>();
const LIST_TTL = 60 * 1000;

export async function listFiles(path: string): Promise<string[]> {
  const key = path;
  const cached = LIST_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.files;

  const url = `${GITHUB_API}/contents/${path}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Not an array");
    const files = data.filter((f: { type: string }) => f.type === "file").map((f: { name: string }) => f.name);
    LIST_CACHE.set(key, { files, expiry: Date.now() + LIST_TTL });
    return files;
  } catch {
    LIST_CACHE.set(key, { files: [], expiry: Date.now() + LIST_TTL });
    return [];
  }
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
    const results = await Promise.all(
      filenames.map(f => rawFetch<T>(`${dir}/${f}`).catch(() => null as T))
    );
    return results.filter(Boolean) as T[];
  });
}

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
