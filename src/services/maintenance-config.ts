/**
 * Maintenance (kill switch) config, fetched from a public GitHub Gist.
 *
 * Why a Gist and not Firebase Remote Config: Remote Config bills 100k
 * fetch requests/day on the free tier and throttles past that, which
 * silently breaks the kill switch. A Gist is served from a CDN with no
 * quota, and a shared time-bucket cache-buster keeps propagation at
 * ~30s while origin load stays flat (one origin hit per bucket, not
 * per user).
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

/** Raw Gist URL of the JSON file holding the settings. */
const CONFIG_URL = (import.meta.env.VITE_MAINTENANCE_CONFIG_URL as string | undefined)?.trim();

/**
 * Cache-bust window. Every client uses the same bucket value within a
 * window, so the CDN serves one cached copy to all of them (origin is
 * hit once per bucket) while still picking up gist edits quickly.
 */
const BUCKET_MS = 30_000;

/** True when a config URL is configured. */
export function isMaintenanceConfigAvailable(): boolean {
  return Boolean(CONFIG_URL);
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

/** Normalize raw gist JSON into settings, falling back to safe defaults. */
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

/**
 * Fetch the current settings. Returns null when unavailable so callers
 * can fail open (site keeps working).
 */
export async function fetchMaintenanceSettings(): Promise<MaintenanceSettings | null> {
  if (!CONFIG_URL) return null;

  const sep = CONFIG_URL.includes("?") ? "&" : "?";
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const url = `${CONFIG_URL}${sep}t=${bucket}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`maintenance config HTTP ${res.status}`);

  const json = await res.json();
  return parseSettings(json);
}
