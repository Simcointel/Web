import type { ApiEnvelope } from "../types/api";
import { apiUrl } from "../config";

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as ApiEnvelope).error ?? `HTTP ${res.status}`);
  }
  const body: ApiEnvelope<T> = await res.json();
  if (!body.ok) throw new Error(body.error ?? "API error");
  return body.data;
}

export const api = {
  health: () => request<import("../types/api").HealthReport>("/health"),

  dashboard: {
    state: () => request<Record<string, import("../types/api").RealmDashboard>>("/dashboard/state"),
    health: () => request<Record<string, unknown>>("/dashboard/health"),
    events: (params?: { severity?: string; category?: string; realm?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.severity) q.set("severity", params.severity);
      if (params?.category) q.set("category", params.category);
      if (params?.realm) q.set("realm", params.realm);
      if (params?.limit) q.set("limit", String(params.limit));
      const qs = q.toString();
      return request<Record<string, import("../types/api").UnifiedFeed>>(`/dashboard/events${qs ? "?" + qs : ""}`);
    },
    alerts: () => request<Record<string, { events: import("../types/api").EventFeedItem[]; total: number }>>("/dashboard/alerts"),
  },

  macro: {
    latest: (realm: number) => request<import("../types/api").MacroLatest>(`/macro/latest/${realm}`),
    history: (realm: number, params?: { limit?: number }) => {
      const q = params?.limit ? `?limit=${params.limit}` : "";
      return request<import("../types/api").MacroHistory>(`/macro/realm/${realm}/history${q}`);
    },
    indexes: (realm: number, limit?: number) => {
      const q = limit ? `?limit=${limit}` : "";
      return request<import("../types/api").MacroIndexes>(`/macro/indexes/${realm}${q}`);
    },
    inflation: (realm: number, limit?: number) => {
      const q = limit ? `?limit=${limit}` : "";
      return request<import("../types/api").MacroInflation>(`/macro/inflation/${realm}${q}`);
    },
    phases: (realm: number) => request<import("../types/api").MacroPhases>(`/macro/phases/${realm}`),
  },

  intelligence: {
    momentum: () => request<import("../types/api").IntelligenceMomentum>("/intelligence/momentum"),
    volatility: () => request<import("../types/api").IntelligenceVolatility>("/intelligence/volatility"),
    regimes: () => request<import("../types/api").IntelligenceRegime>("/intelligence/regimes"),
    sectors: () => request<Record<string, import("../types/api").SectorView[]>>("/intelligence/sectors"),
    correlations: () => request<import("../types/api").CorrelationData[]>("/intelligence/correlations"),
    anomalies: () => request<import("../types/api").AnomalyData[]>("/intelligence/anomalies"),
    divergence: () => request<import("../types/api").DivergenceData[]>("/intelligence/divergence"),
    contagion: () => request<import("../types/api").ContagionData[]>("/intelligence/contagion"),
    alerts: () => request<Record<string, { events: import("../types/api").EventFeedItem[]; total: number }>>("/intelligence/alerts"),
  },

  forecast: {
    get: (realm: number, compact?: boolean) => {
      const q = `realm=${realm}${compact ? "&compact=true" : ""}`;
      return request<Record<string, import("../types/api").ForecastSeries>>(`/public/forecast?${q}`);
    },
    category: (realm: number, category: string) => {
      return request<import("../types/api").ForecastSeries>(`/public/forecast/${category}?realm=${realm}`);
    },
  },

  signals: {
    get: (realm: number, compact?: boolean) => {
      const q = `realm=${realm}${compact ? "&compact=true" : ""}`;
      return request<import("../types/api").SignalData[]>(`/public/signals?${q}`);
    },
  },

  cycles: {
    get: (realm: number, compact?: boolean) => {
      const q = `realm=${realm}${compact ? "&compact=true" : ""}`;
      return request<import("../types/api").CycleData>(`/public/cycles?${q}`);
    },
  },

  dependencies: {
    get: (realm: number, compact?: boolean) => {
      const q = `realm=${realm}${compact ? "&compact=true" : ""}`;
      return request<import("../types/api").DependencyData>(`/public/dependencies?${q}`);
    },
  },

};
