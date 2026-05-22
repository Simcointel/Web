import { useState, useEffect, useCallback } from "react";

export function useDataRepo(
  fetcher: () => Promise<any>,
  deps: unknown[] = [],
  fallback?: () => Promise<any>,
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"repo" | "api">("repo");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
      setSource("repo");
    } catch {
      if (fallback) {
        try {
          setData(await fallback());
          setSource("api");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Request failed");
        }
      } else {
        setError("Data repo unavailable");
      }
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refresh: load, source };
}

export function useDataRepoPoll(
  fetcher: () => Promise<any>,
  intervalMs: number,
  deps: unknown[] = [],
  fallback?: () => Promise<any>,
) {
  const result = useDataRepo(fetcher, deps, fallback);
  const { refresh } = result;
  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);
  return result;
}
