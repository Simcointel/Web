import { useState, useEffect, useCallback, useRef } from "react";

export function useDataRepo<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  fallback?: () => Promise<T>,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  const fallbackRef = useRef(fallback);
  const abortControllerRef = useRef<AbortController | null>(null);
  fetcherRef.current = fetcher;
  fallbackRef.current = fallback;

  const load = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (fallbackRef.current) {
        try {
          setData(await fallbackRef.current());
        } catch (fallbackErr) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : "Request failed");
        }
      } else {
        setError("Data repo unavailable");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    load();
    return () => abortControllerRef.current?.abort();
  }, [load]);

  return { data, loading, error, refresh: load };
}

export function useDataRepoPoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  deps: unknown[] = [],
  fallback?: () => Promise<T>,
) {
  const result = useDataRepo(fetcher, deps, fallback);
  const { refresh } = result;
  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);
  return result;
}
