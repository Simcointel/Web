import { useState, useEffect, useCallback } from "react";
import {
  fetchMaintenanceSettings,
  isMaintenanceConfigAvailable,
  DEFAULT_SETTINGS,
  type MaintenanceSettings,
} from "../services/maintenance-config";

export type { MaintenanceSettings };

// How often an open tab re-checks the flag.
const POLL_MS = import.meta.env.DEV ? 15_000 : 60_000;

// Hard cap on how long the app stays blocked waiting for the flag.
// Past this we fail open and render the app normally.
const LOAD_TIMEOUT_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("maintenance config timeout")), ms),
    ),
  ]);
}

/** Dev-only preview: `?maintenance=1` forces the overlay without any config. */
function devOverride(): MaintenanceSettings | null {
  if (!import.meta.env.DEV) return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("maintenance") !== "1" && params.get("maintenance") !== "true") return null;
  return {
    enabled: true,
    title: params.get("maintenance_title") ?? DEFAULT_SETTINGS.title,
    message: params.get("maintenance_message") ?? DEFAULT_SETTINGS.message,
    retryAfter: Number(params.get("maintenance_retry")) || DEFAULT_SETTINGS.retryAfter,
  };
}

export function useMaintenanceMode(): MaintenanceSettings & { loading: boolean; refresh: () => Promise<void> } {
  const [settings, setSettings] = useState<MaintenanceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    const override = devOverride();
    if (override) {
      setSettings(override);
      setLoading(false);
      return;
    }

    if (!isMaintenanceConfigAvailable()) {
      setLoading(false);
      return;
    }

    try {
      const next = await withTimeout(fetchMaintenanceSettings(), LOAD_TIMEOUT_MS);
      if (next) setSettings(next);
    } catch (e) {
      // Fail-open: keep defaults so a config outage never blocks users.
      console.warn("[Maintenance] Config load failed, using defaults:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    // Poll so an already-open tab also picks up the flag.
    const id = setInterval(loadConfig, POLL_MS);
    return () => clearInterval(id);
  }, [loadConfig]);

  return { ...settings, loading, refresh: loadConfig };
}
