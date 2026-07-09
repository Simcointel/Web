// Re-exports from split modules for backward compat
export { withCache, DATA_CACHE } from "./data-cache";
export {
  rawFetch,
  fetchLatest,
  fetchIndex,
  listFiles,
  fetchAllFiles,
} from "./github-transport";

import { withCache } from "./data-cache";
import {
  rawFetch,
  fetchLatest,
  fetchAllFiles,
} from "./github-transport";

import type {
  RealmDashboard,
  DashboardMap,
  EventsResponse,
  NormalizedEvent,
  MacroLatest,
  MacroHistoryResponse,
  MacroIndexesResponse,
  MacroInflationResponse,
  MacroPhases,
  ProfitMarginsResponse,
  ProfitMarginResource,
  PriceHistoryItem,
  VWAPInflationResponse,
  RetailData,
} from "../types/api";

/* ============================================================
   Dashboard
   ============================================================ */
export async function fetchDashboardState(realm: number): Promise<DashboardMap> {
  const data = await fetchLatest<{
    scores: RealmDashboard["scores"];
    regime: RealmDashboard["regime"];
    alerts?: { total?: number };
    leaders?: Record<string, unknown>;
  }>(`aggregates/dashboard/realm-${realm}`, "summary-");
  if (!data) throw new Error("No dashboard data");
  return {
    [String(realm)]: {
      scores: data.scores,
      regime: data.regime,
      alerts: data.alerts?.total ?? 0,
      sectors: Object.keys(data.leaders ?? {}).length,
    },
  };
}

function normalizeEvent(raw: Record<string, unknown>): NormalizedEvent {
  return {
    id: (raw.id ?? raw.i ?? "") as string,
    se: (raw.se ?? raw.s ?? "info") as string,
    ts: (raw.ts ?? raw.t ?? "") as string,
    ca: (raw.ca ?? raw.c ?? "general") as string,
    ti: (raw.ti ?? raw.ti ?? "") as string,
    de: (raw.de ?? raw.d ?? "") as string,
    da: (raw.da ?? raw.data ?? {}) as Record<string, unknown>,
    ty: (raw.ty ?? raw.type ?? "") as string,
  };
}

async function fetchEvents(realm: number, limit: number): Promise<EventsResponse> {
  const data = await fetchLatest<unknown[]>(`aggregates/events/realm-${realm}`, "");
  if (!data) return { events: [], total: 0 };
  const raw = Array.isArray(data) ? data : [];
  const events = raw.map(normalizeEvent as (v: unknown) => NormalizedEvent);
  return { events: events.slice(0, limit), total: events.length };
}

export async function fetchDashboardAlerts(realm: number): Promise<EventsResponse> {
  return fetchEvents(realm, 5);
}

export async function fetchDashboardEvents(realm: number, limit = 200): Promise<EventsResponse> {
  return fetchEvents(realm, limit);
}

/* ============================================================
   Macro
   ============================================================ */
export async function fetchMacroLatest(realm: number): Promise<MacroLatest> {
  try {
    const publicData = await rawFetch<{
      generatedAt: string;
      latest: {
        companiesValue: number;
        activeCompanies: number;
        bondsSold: number;
        totalBuildings: number;
      };
      latestIndexes?: { cpi?: number; coreCpi?: number; gdp?: number };
      latestInflation?: { cpiRate?: number; coreCpiRate?: number; gdpGrowth?: number };
    }>(`public/realm-${realm}/macro.json`);
    if (publicData && publicData.latest) {
      return {
        latestHistory: {
          date: publicData.generatedAt,
          companiesValue: publicData.latest.companiesValue,
          activeCompanies: publicData.latest.activeCompanies,
          bondsSold: publicData.latest.bondsSold,
          totalBuildings: publicData.latest.totalBuildings,
        },
        latestIndexes: publicData.latestIndexes ? {
          cpi: publicData.latestIndexes.cpi ?? null,
          coreCpi: publicData.latestIndexes.coreCpi ?? null,
          gdp: publicData.latestIndexes.gdp ?? null,
        } : null,
        latestInflation: publicData.latestInflation ? {
          cpiRate: publicData.latestInflation.cpiRate ?? null,
          coreCpiRate: publicData.latestInflation.coreCpiRate ?? null,
          gdpGrowth: publicData.latestInflation.gdpGrowth ?? null,
        } : null,
      };
    }
  } catch {
    // Fallback to legacy structure
  }

  const [data, ixData, infData] = await Promise.all([
    fetchLatest<{ t: string; cv: number; ac: number; bs: number; tb: number }>(
      `aggregates/realm-status/realm-${realm}`, "realm-status-"),
    fetchLatest<{ ix: Record<string, { v: number }> }>(
      `aggregates/indexes/realm-${realm}`, "price-indexes-").catch(() => null),
    fetchLatest<{ in: Record<string, { ch: number }> }>(
      `aggregates/inflation/realm-${realm}`, "inflation-report-").catch(() => null),
  ]);
  if (!data) throw new Error("No macro latest data");
  return {
    latestHistory: {
      date: data.t,
      companiesValue: data.cv,
      activeCompanies: data.ac,
      bondsSold: data.bs,
      totalBuildings: data.tb,
    },
    latestIndexes: ixData?.ix ? {
      cpi: ixData.ix.cpi?.v ?? null,
      coreCpi: ixData.ix["core-cpi"]?.v ?? null,
      gdp: ixData.ix.gdp?.v ?? null,
    } : null,
    latestInflation: infData?.in ? {
      cpiRate: infData.in.cpi?.ch ?? null,
      coreCpiRate: infData.in["core-cpi"]?.ch ?? null,
      gdpGrowth: infData.in["gdp"]?.ch ?? null,
    } : null,
  };
}

async function loadHistoryYearFiles(realm: number): Promise<Record<string, unknown>[]> {
  return withCache(`history:${realm}`, async () => {
    const dir = `aggregates/macro-history/realm-${realm}`;
    const { fetchIndex, listFiles } = await import("./github-transport");
    const index = await fetchIndex(dir);
    let yearFiles: string[];
    if (index?.files) {
      yearFiles = index.files.filter(f => /^\d{4}\.json$/.test(f)).sort();
    } else {
      const files = await listFiles(dir);
      yearFiles = files.filter(f => /^\d{4}\.json$/.test(f)).sort();
    }
    const allChunks = await Promise.all(
      yearFiles.map(f => rawFetch<{ e: Record<string, unknown>[] }>(`${dir}/${f}`).catch(() => null))
    );
    const allEntries: Record<string, unknown>[] = [];
    for (const chunk of allChunks) {
      if (chunk?.e) {
        for (const entry of chunk.e) allEntries.push(entry);
      }
    }
    return allEntries;
  });
}

export async function fetchMacroHistory(realm: number, limit = 120): Promise<MacroHistoryResponse> {
  const allEntries = await loadHistoryYearFiles(realm);
  const step = Math.max(1, Math.floor(allEntries.length / limit));
  const sampled = allEntries.filter((_, i) => i % step === 0 || i === allEntries.length - 1);
  return {
    history: sampled.map((e) => ({
      date: e.d as string,
      activeCompanies: e.ac as number,
      companiesValue: e.cv as number,
      totalBuildings: e.tb as number,
      bondsSold: e.bs as number,
      phase: e.ph as string,
      checkpoint: e.cp as string,
    })),
    total: allEntries.length,
  };
}

export async function fetchMacroPhases(realm: number): Promise<MacroPhases> {
  // ponytail: realm not included in response — consumers key by realm already
  const allEntries = await loadHistoryYearFiles(realm);
  const seen = new Set<string>();
  const phases: Array<{ date: string; phase: string }> = [];
  for (const e of allEntries) {
    const ph = e.ph as string | undefined;
    const d = e.d as string;
    if (!ph || ph === "" || seen.has(d)) continue;
    seen.add(d);
    phases.push({ date: d, phase: ph });
  }
  phases.sort((a, b) => a.date.localeCompare(b.date));
  const phaseDetails = phases.map((p, i) => {
    const next = phases[i + 1];
    const startDate = p.date;
    const endDate = next?.date ?? null;
    const days = next
      ? Math.round((new Date(next.date).getTime() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    return { phase: p.phase, startDate, endDate, days };
  });
  const transitions: Array<{ from: string; to: string; date: string; reason: string }> = [];
  for (let i = 1; i < phases.length; i++) {
    if (phases[i].phase !== phases[i - 1].phase) {
      transitions.push({ from: phases[i - 1].phase, to: phases[i].phase, date: phases[i].date, reason: "" });
    }
  }
  return {
    totalDays: phaseDetails.reduce((sum, p) => sum + p.days, 0),
    currentPhase: phases.length > 0 ? phases[phases.length - 1].phase : null,
    transitions,
    phases: phaseDetails,
  };
}

function latestPerDay<T extends { t?: string }>(items: T[]): T[] {
  const best = new Map<string, T>();
  for (const item of items) {
    const key = item.t ? item.t.slice(0, 10) : '';
    if (!key) continue;
    if (!best.has(key)) best.set(key, item);
  }
  return [...best.values()].sort((a, b) => (a.t ?? '').localeCompare(b.t ?? ''));
}

export async function fetchMacroIndexes(realm: number, limit = 200): Promise<MacroIndexesResponse> {
  try {
    const publicData = await rawFetch<Array<{ t: string; ix?: Record<string, { v: number }> }>>(
      `public/realm-${realm}/indexes.json`);
    if (publicData && Array.isArray(publicData) && publicData.length > 0) {
      return {
        indexes: publicData.slice(0, limit).map((item) => ({
          date: item.t,
          cpi: item.ix?.cpi?.v ?? null,
          coreCpi: item.ix?.["core-cpi"]?.v ?? null,
          gdp: item.ix?.gdp?.v ?? null,
        })),
        total: publicData.length,
      };
    }
  } catch {
    // Fallback to legacy
  }

  const items = await fetchAllFiles<{ t: string; ix?: Record<string, { v: number }> }>(
    `aggregates/indexes/realm-${realm}`, "price-indexes-", 20);
  return {
    indexes: latestPerDay(items).map((item) => ({
      date: item.t,
      cpi: item.ix?.cpi?.v ?? null,
      coreCpi: item.ix?.["core-cpi"]?.v ?? null,
      gdp: item.ix?.gdp?.v ?? null,
    })),
    total: items.length,
  };
}

export async function fetchMacroInflation(realm: number, limit = 200): Promise<MacroInflationResponse> {
  try {
    const publicData = await rawFetch<Array<{ t: string; in?: Record<string, { ch: number }> }>>(
      `public/realm-${realm}/inflation.json`);
    if (publicData && Array.isArray(publicData) && publicData.length > 0) {
      return {
        inflation: publicData.slice(0, limit).map((item) => ({
          date: item.t,
          cpiRate: item.in?.["cpi"]?.ch ?? null,
          coreCpiRate: item.in?.["core-cpi"]?.ch ?? null,
          gdpGrowth: item.in?.["gdp"]?.ch ?? null,
        })),
        total: publicData.length,
      };
    }
  } catch {
    // Fallback to legacy
  }

  const items = await fetchAllFiles<{ t: string; in?: Record<string, { ch: number }> }>(
    `aggregates/inflation/realm-${realm}`, "inflation-report-", 20);
  return {
    inflation: latestPerDay(items).map((item) => ({
      date: item.t,
      cpiRate: item.in?.["cpi"]?.ch ?? null,
      coreCpiRate: item.in?.["core-cpi"]?.ch ?? null,
      gdpGrowth: item.in?.["gdp"]?.ch ?? null,
    })),
    total: items.length,
  };
}

/* ============================================================
   Retail
   ============================================================ */
export async function fetchRetailData(realm: number): Promise<RetailData> {
  try {
    return await rawFetch<RetailData>(`public/realm-${realm}/retail.json`);
  } catch { /* fall through */ }
  const data = await fetchLatest<RetailData>(`aggregates/retail/realm-${realm}`, "retail-summary-");
  if (!data) throw new Error("No retail data");
  return data;
}

/* ============================================================
   Profit Margins
   ============================================================ */
function mapProfitMargins(data: Record<string, unknown>): ProfitMarginsResponse | null {
  if (!data) return null;
  return {
    ts: data.t as string,
    realm: data.r as number,
    resources: ((data.rs ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.i as number,
      name: r.n as string,
      category: r.c as string,
      categoryName: r.cn as string,
      producedPerHour: r.ph as number,
      revenuePerHour: r.rv as number,
      inputCostPerHour: r.ic as number,
      wagesPerHour: r.wg as number,
      transportPerHour: r.tr as number,
      netProfitPerHour: r.np as number,
      marginPct: r.mg as number,
      marginDelta: (r.m1 as number) ?? null,
      profitDelta: (r.n1 as number) ?? null,
      marginDirection: (r.md as string) ?? null,
      forecastMargin: (r.fp as number) ?? null,
      trendDirection: (r.td as string) ?? null,
      outputVwap: r.vw as number,
    })),
    total: ((data.rs ?? []) as unknown[]).length,
  };
}

export async function fetchProfitMargins(realm: number): Promise<ProfitMarginsResponse> {
  try {
    const publicData = await rawFetch<Array<Record<string, unknown>>>(`public/realm-${realm}/margins.json`);
    if (publicData && Array.isArray(publicData)) {
      return {
        ts: new Date().toISOString(),
        realm,
        resources: publicData.map((r) => ({
          id: r.i as number,
          name: r.n as string,
          category: r.c as string,
          categoryName: r.cn as string,
          producedPerHour: r.ph as number,
          revenuePerHour: r.rv as number,
          inputCostPerHour: r.ic as number,
          wagesPerHour: r.wg as number,
          transportPerHour: r.tr as number,
          netProfitPerHour: r.np as number,
          marginPct: r.mg as number,
          marginDelta: (r.m1 as number) ?? null,
          profitDelta: (r.n1 as number) ?? null,
          marginDirection: (r.md as string) ?? null,
          forecastMargin: (r.fp as number) ?? null,
          trendDirection: (r.td as string) ?? null,
          outputVwap: r.vw as number,
        })),
        total: publicData.length,
      };
    }
  } catch {
    // Fallback to legacy structure
  }

  const data = await fetchLatest<Record<string, unknown>>(`aggregates/profit-margins/realm-${realm}`, "profit-margins-");
  const mapped = mapProfitMargins(data ?? {});
  if (!mapped) throw new Error("No profit margins data");
  return mapped;
}

export async function fetchResourcePriceHistory(realm: number, resourceId: number, limit = 20): Promise<PriceHistoryItem[]> {
  const items = await fetchAllFiles<Record<string, unknown>>(`aggregates/profit-margins/realm-${realm}`, "profit-margins-", limit);
  const history: PriceHistoryItem[] = [];

  for (const item of items) {
    const mapped = mapProfitMargins(item);
    if (!mapped) continue;
    const res = mapped.resources.find((r) => r.id === resourceId);
    if (res) {
      history.push({
        date: mapped.ts,
        vwap: res.outputVwap,
        profit: res.netProfitPerHour,
      });
    }
  }

  return history.reverse();
}

/* ============================================================
   VWAP Inflation
   ============================================================ */
export async function fetchVWAPInflation(realm: number, limit = 200): Promise<VWAPInflationResponse> {
  try {
    const publicData = await rawFetch<Array<{
      t: string;
      overall: Record<string, number>;
      quality?: Record<string, number>;
      product?: Record<string, number>;
      both?: Record<string, number>;
    }>>(`public/realm-${realm}/vwap-inflation.json`);
    if (publicData && Array.isArray(publicData) && publicData.length > 0) {
      return {
        vwapInflation: publicData.slice(0, limit).map((item) => ({
          date: item.t,
          overall: item.overall,
          quality: item.quality ?? {},
          product: item.product ?? {},
          both: item.both ?? {},
        })),
        total: publicData.length,
      };
    }
  } catch {
    // Fallback to legacy
  }

  const items = await fetchAllFiles<{
    t: string;
    overall: Record<string, number>;
  }>(`aggregates/vwap-inflation/realm-${realm}`, "vwap-inflation-", 20);
  return {
    vwapInflation: latestPerDay(items).map((item) => ({
      date: item.t,
      overall: item.overall,
      quality: {} as Record<string, number>,
      product: {} as Record<string, number>,
      both: {} as Record<string, number>,
    })),
    total: items.length,
  };
}

/* ============================================================
   Intelligence
   ============================================================ */
export async function fetchMomentum(realm: number): Promise<Record<string, { realm: string; momentum: number; direction: string; trend: number }>> {
  const data = await fetchLatest<{ momentum?: Record<string, { st: number; ts: number }> }>(
    `aggregates/intelligence/realm-${realm}`, "momentum-");
  if (!data) throw new Error("No momentum data");
  const sectors = data.momentum ?? {};
  const values = Object.values(sectors);
  const avgMomentum = values.length > 0 ? values.reduce((s, v) => s + (v.st ?? 0), 0) / values.length : 0;
  return {
    [String(realm)]: {
      realm: String(realm),
      momentum: avgMomentum,
      direction: avgMomentum >= 0 ? "up" : "down",
      trend: values.reduce((s, v) => s + (v.ts ?? 0), 0) / (values.length || 1),
    },
  };
}

export async function fetchVolatility(realm: number): Promise<Record<string, { realm: string; volatility: number; classification: string; trend: number }>> {
  const data = await fetchLatest<{ stress?: Record<string, { scp: number; flags?: unknown[]; trend?: number }> }>(
    `aggregates/intelligence/realm-${realm}`, "stress-");
  if (!data) throw new Error("No volatility data");
  const stress = data.stress ?? {};
  const values = Object.values(stress);
  const avgVol = values.length > 0 ? values.reduce((s, v) => s + (v.scp ?? 0), 0) / values.length : 0;
  return {
    [String(realm)]: {
      realm: String(realm),
      volatility: avgVol,
      classification: avgVol > 0.5 ? "high" : avgVol > 0.2 ? "medium" : "low",
      trend: values.length > 0 ? values.reduce((s, v) => s + (v.trend ?? v.scp ?? 0), 0) / values.length : 0,
    },
  };
}

export async function fetchRegimes(realm: number): Promise<Record<string, { realm: string; regime: string; score: number; confidence: string }>> {
  const data = await fetchLatest<{ cr?: string; rs?: number; rc?: number }>(
    `aggregates/intelligence/realm-${realm}`, "regime-");
  if (!data) throw new Error("No regime data");
  return {
    [String(realm)]: {
      realm: String(realm),
      regime: data.cr ?? "unknown",
      score: data.rs ?? data.rc ?? 0,
      confidence: String(data.rc ?? 0),
    },
  };
}

export async function fetchSectors(realm: number): Promise<Record<string, Array<{ sector: string; strength: number; momentum: number; leader: string; volatility: number }>>> {
  const data = await fetchLatest<{ sectors?: Record<string, { momentum?: { st: number; mt: number }; leaders?: string; volatility?: { v5: number } }> }>(
    `aggregates/intelligence/realm-${realm}`, "sectors-");
  if (!data) throw new Error("No sector data");
  const sectors = data.sectors ?? {};
  const list = Object.entries(sectors).map(([name, s]) => ({
    sector: name,
    strength: s.momentum?.st ?? 0,
    momentum: s.momentum?.mt ?? 0,
    leader: s.leaders ?? "-",
    volatility: s.volatility?.v5 ?? 0,
  }));
  return { [String(realm)]: list };
}

export async function fetchCorrelations(realm = 0): Promise<Array<{ realm: string; pair: string; coefficient: number; strength: string }>> {
  const data = await fetchLatest<{ m?: Record<string, Record<string, Record<string, unknown>>>; pairs?: unknown; correlations?: unknown }>(
    `aggregates/correlations/realm-${realm}`, "correlation-");
  if (!data) throw new Error("No correlation data");
  const matrix = data.m ?? data.pairs ?? data.correlations ?? {};
  const pairs: Array<{ realm: string; pair: string; coefficient: number; strength: string }> = [];
  const categories = Object.keys(matrix);
  for (let i = 0; i < categories.length; i++) {
    const a = categories[i];
    const row = matrix[a] ?? {};
    const subCategories = Object.keys(row);
    for (let j = 0; j < subCategories.length; j++) {
      const b = subCategories[j];
      if (a === b) continue;
      const cell = row[b] ?? {};
      const r = (cell.r ?? cell.coefficient ?? null) as number | null;
      if (r === null || r === undefined) continue;
      pairs.push({
        realm: String(realm),
        pair: `${a} ↔ ${b}`,
        coefficient: r,
        strength: (cell.s ?? cell.strength ?? "weak") as string,
      });
    }
  }
  pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  return pairs;
}

export async function fetchAnomalies(realm: number): Promise<Array<{ category: string; zScore: number; deviation: number; direction: string; timestamp: string }>> {
  const data = await fetchLatest<{ an?: Array<Record<string, unknown>>; t?: string }>(
    `aggregates/anomalies/realm-${realm}`, "anomaly-");
  if (!data) throw new Error("No anomaly data");
  const anomalies = data.an ?? [];
  return anomalies.map((a) => ({
    category: (a.ca ?? "unknown") as string,
    zScore: (a.zs ?? 0) as number,
    deviation: (a.vl ?? 0) as number,
    direction: (a.vl as number) >= 0 ? "above" : "below",
    timestamp: (a.ts ?? data.t) as string,
  }));
}

export async function fetchDivergence(realm: number): Promise<Array<{ sector: string; strength: number; type: string; signal: string }>> {
  const data = await fetchLatest<{ di?: Array<Record<string, unknown>> }>(
    `aggregates/divergence/realm-${realm}`, "divergence-");
  if (!data) throw new Error("No divergence data");
  const divergences = data.di ?? [];
  return divergences.map((d) => ({
    sector: (d.sector ?? "unknown") as string,
    strength: (d.strength ?? 0) as number,
    type: (d.type ?? "unknown") as string,
    signal: (d.severity ?? "info") as string,
  }));
}

export async function fetchContagion(realm: number): Promise<Array<{ origin: string; spread: number; risk: string; affected: string[] }>> {
  const data = await fetchLatest<{ co?: Array<Record<string, unknown>> }>(
    `aggregates/contagion/realm-${realm}`, "contagion-");
  if (!data) throw new Error("No contagion data");
  const contagions = data.co ?? [];
  return contagions.map((c) => ({
    origin: (c.origin ?? "unknown") as string,
    spread: (c.spread ?? 0) as number,
    risk: (c.risk ?? "low") as string,
    affected: (c.affected ?? []) as string[],
  }));
}

/* ============================================================
   Forecasts
   ============================================================ */
export async function fetchForecast(realm: number): Promise<Record<string, unknown>> {
  const data = await fetchLatest<{ series?: Record<string, unknown> }>(
    `aggregates/forecasts/realm-${realm}`, "forecast-");
  if (!data) throw new Error("No forecast data");
  return data.series ?? {};
}

export async function fetchSignals(realm: number): Promise<Array<{
  type: string;
  label: string;
  severity: string;
  confidence: number;
  affectedSectors: string[];
  estimatedDurationDays: number;
  indicators: Array<{ name: string; value: number; threshold: number }>;
  rationale: string;
}>> {
  const data = await fetchLatest<{ signals?: Array<Record<string, unknown>> }>(
    `aggregates/signals/realm-${realm}`, "signals-");
  if (!data) throw new Error("No signal data");
  return (data.signals ?? []).map((s) => ({
    type: (s.type ?? "") as string,
    label: (s.label ?? "") as string,
    severity: (s.severity ?? "low") as string,
    confidence: (s.confidence ?? 0) as number,
    affectedSectors: (s.affectedSectors ?? []) as string[],
    estimatedDurationDays: (s.estimatedDurationDays ?? 0) as number,
    indicators: ((s.indicators ?? []) as Array<Record<string, unknown>>).map((ind) => {
      if (typeof ind === "string") return { name: ind, value: 0, threshold: 0 };
      return { name: (ind.name ?? "") as string, value: (ind.value ?? 0) as number, threshold: (ind.threshold ?? 0) as number };
    }),
    rationale: (s.rationale ?? "") as string,
  }));
}

/* ============================================================
   Cycles
   ============================================================ */
export async function fetchCycles(realm: number): Promise<{
  current: { phase: string; confidence: number; duration: number; intensity: number; stability: number };
  transitions: Array<{ from: string; to: string; probability: number }>;
  history: Array<{ phase: string; startDate: string | null; endDate: string | null }>;
  stability: number;
  intensity: number;
}> {
  const data = await fetchLatest<{
    current?: Record<string, unknown>;
    transitionProbabilities?: Record<string, Record<string, number>>;
    stability?: number;
    history?: Array<Record<string, unknown>>;
  }>(`aggregates/cycles/realm-${realm}`, "cycle-");
  if (!data) throw new Error("No cycle data");
  const current = data.current ?? {};
  const transitions: Array<{ from: string; to: string; probability: number }> = [];
  const tp = data.transitionProbabilities ?? {};
  for (const [fromPh, toPhs] of Object.entries(tp)) {
    for (const [toPh, prob] of Object.entries(toPhs)) {
      transitions.push({ from: fromPh, to: toPh, probability: prob });
    }
  }
  return {
    current: {
      phase: (current.phase ?? "unknown") as string,
      confidence: (current.confidence ?? 0) as number,
      duration: (current.durationDays ?? 0) as number,
      intensity: (current.intensity ?? 0) as number,
      stability: data.stability ?? 0,
    },
    transitions,
    history: ((data.history ?? []) as Array<Record<string, unknown>>).map((h) => ({
      phase: (h.phase ?? "unknown") as string,
      startDate: (h.detectedAt ?? null) as string | null,
      endDate: null as string | null,
    })),
    stability: data.stability ?? 0,
    intensity: (current.intensity ?? 0) as number,
  };
}

/* ============================================================
   Player API
   ============================================================ */
export interface CompanyInfrastructure {
  buildings?: Array<{
    id?: number;
    kind?: string;
    level?: number;
    size?: number;
    busy?: Record<string, unknown>;
  }>;
  administrationOverhead?: number;
  workers?: number;
  recreationBonus?: number;
}

export interface CompanyPublicInfo {
  company?: string;
  logo?: string;
  level?: number;
  rank?: number;
  online?: string;
  productionModifier?: number;
  salesModifier?: number;
  extraBuildingSlots?: number;
}

export interface CompanyHistory {
  value?: number;
  bondsPayable?: number;
}

export interface CompanyData {
  infrastructure?: CompanyInfrastructure;
  companyPublicInfo?: CompanyPublicInfo;
  history?: CompanyHistory;
  governmentOrderTierIndex?: number;
}

export async function fetchCompanyData(companyId: string | number, realm = 0): Promise<CompanyData> {
  const base = realm === 1
    ? "https://www.simcompanies.com/api/v3/entrepreneurs/companies/"
    : "https://www.simcompanies.com/api/v3/companies/";
  const targetUrl = `${base}${companyId}/`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(targetUrl);
      if (res.ok) return res.json();
    } catch {
      // retry
    }
    if (attempt < 1) await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Company data fetch failed");
}

/* ============================================================
   Dependencies
   ============================================================ */
export async function fetchDependencies(realm: number): Promise<{
  risks: Array<{ sector: string; score: number; upstreamPressure: number; downstreamPressure: number; critical: boolean }>;
  riskScores: Record<string, number>;
  criticalResources: string[];
  bottleneckChains: Array<{ chain: string; pressure: number; sectors: string[] }>;
  dependencyMatrix: Record<string, number>;
}> {
  const data = await fetchLatest<{
    risks?: Array<Record<string, unknown>>;
    criticalResources?: unknown[];
    bottleneckChains?: Array<Record<string, unknown>>;
  }>(`aggregates/dependencies/realm-${realm}`, "dependency-");
  if (!data) throw new Error("No dependency data");
  const risks: Array<{ sector: string; score: number; upstreamPressure: number; downstreamPressure: number; critical: boolean }> =
    (data.risks ?? []).map((r) => ({
      sector: (r.category ?? "unknown") as string,
      score: (r.riskScore ?? 0) as number,
      upstreamPressure: (r.upstreamCount ?? 0) as number,
      downstreamPressure: (r.downstreamCount ?? 0) as number,
      critical: (r.isCritical ?? false) as boolean,
    }));
  const riskScores: Record<string, number> = {};
  for (const r of risks) riskScores[r.sector] = r.score;
  return {
    risks,
    riskScores,
    criticalResources: (data.criticalResources ?? []).map((cr) =>
      typeof cr === "string" ? cr : (cr as Record<string, unknown>).category ?? cr) as string[],
    bottleneckChains: (data.bottleneckChains ?? []).map((bc) => ({
      chain: Array.isArray(bc.chain) ? (bc.chain as string[]).join(" → ") : ((bc.chain ?? "") as string),
      pressure: (bc.score ?? bc.pressure ?? 0) as number,
      sectors: Array.isArray(bc.chain) ? (bc.chain as string[]) : [],
    })),
    dependencyMatrix: {},
  };
}
