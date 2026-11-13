/**
 * Maintenance (kill switch) config, fetched from GitHub.
 *
 * Strategy:
 * 1. Try GitHub API first (instant, no CDN cache, rate limit 5000/hr)
 * 2. Fall back to raw.githubusercontent.com with shared 30s bucket cache-buster
 * 3. Fail open if both fail
 */

export interface MaintenanceSettings {
  enabled: boolean;
  title: string;
  message: string;
  retryAfter: number;
}

export const DEFAULT_SETTINGS: MaintenanceSettings = {
  enabled: false,
  title: "Site Under Maintenance",
  message: "We're performing scheduled maintenance. Please check back soon.",
  retryAfter: 300,
};

/** Raw Gist URL from env (with or without commit SHA). */
const RAW_URL = (import.meta.env.VITE_MAINTENANCE_CONFIG_URL as string | undefined)?.trim();

/** Extract gist ID and filename from any raw URL format. */
function parseGistInfo(rawUrl: string): { id: string; filename: string } | null {
  try {
    // https://gist.githubusercontent.com/<user>/<id>/raw[/<sha>]/<filename>
    const m = rawUrl.match(/gist\.githubusercontent\.com\/[^/]+\/([^/]+)\/raw(?:\/[^/]+)?\/([^/?#]+)/);
    if (m) return { id: m[1], filename: m[2] };
  } catch { }
  return null;
}

const GIST_INFO = RAW_URL ? parseGistInfo(RAW_URL) : null;
const API_URL = GIST_INFO ? `https://api.github.com/gists/${GIST_INFO.id}` : null;
const RAW_BASE = GIST_INFO
  ? `https://gist.githubusercontent.com/${GIST_INFO.id}/raw/${GIST_INFO.filename}`
  : RAW_URL;

/** Shared 30s time bucket for raw URL cache-busting (coalesces origin hits). */
const BUCKET_MS = 30_000;

export function isMaintenanceConfigAvailable(): boolean {
  return Boolean(RAW_BASE);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(v)) return true;
    if (["0", "false", "no", "off"].includes(v)) return false;
  }
  return fallback;
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parseSettings(raw: unknown): MaintenanceSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  return {
    enabled: toBoolean(r.maintenance_enabled, DEFAULT_SETTINGS.enabled),
    title: (typeof r.maintenance_title === "string" && r.maintenance_title.trim()) || DEFAULT_SETTINGS.title,
    message: (typeof r.maintenance_message === "string" && r.maintenance_message.trim()) || DEFAULT_SETTINGS.message,
    retryAfter: toNumber(r.maintenance_retry_after, DEFAULT_SETTINGS.retryAfter),
  };
}

async function fetchFromApi(): Promise<MaintenanceSettings | null> {
  if (!API_URL) return null;
  const res = await fetch(API_URL, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const gist = await res.json();
  const file = gist.files?.[GIST_INFO!.filename];
  if (!file?.content) throw new Error("File not found in gist");
  const json = JSON.parse(file.content);
  return parseSettings(json);
}

async function fetchFromRaw(): Promise<MaintenanceSettings | null> {
  if (!RAW_BASE) return null;
  const sep = RAW_BASE.includes("?") ? "&" : "?";
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const url = `${RAW_BASE}${sep}t=${bucket}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`raw HTTP ${res.status}`);
  const json = await res.json();
  return parseSettings(json);
}

/**
 * Fetch settings: try API first (instant), then raw with bucket cache-buster.
 * Returns null on total failure (fail-open).
 */
export async function fetchMaintenanceSettings(): Promise<MaintenanceSettings | null> {
  if (!isMaintenanceConfigAvailable()) return null;

  // 1. GitHub API — no cache, instant propagation
  try {
    return await fetchFromApi();
  } catch (e) {
    console.warn("[Maintenance] GitHub API failed, falling back to raw:", e);
  }

  // 2. Raw URL with shared time-bucket cache-buster
  try {
    return await fetchFromRaw();
  } catch (e) {
    console.warn("[Maintenance] Raw fetch failed:", e);
  }

  return null;
}