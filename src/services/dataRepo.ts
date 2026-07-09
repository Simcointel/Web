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
  MacroLatest,
  MacroHistoryResponse,
  MacroIndexesResponse,
  MacroInflationResponse,
  MacroPhases,
  ProfitMarginsResponse,
  PriceHistoryItem,
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
  }>(`aggregates/market/realm-${realm}`, "market-summary-");
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
  const phaseDetails: MacroPhases["phases"] = [];
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const prev = phaseDetails[phaseDetails.length - 1];
    if (prev && prev.phase === p.phase && prev.endDate) {
      prev.endDate = null;
      prev.days = Math.round((new Date(p.date).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
    } else {
      phaseDetails.push({ phase: p.phase, startDate: p.date, endDate: null, days: 1 });
    }
  }
  for (let i = 0; i < phaseDetails.length; i++) {
    const next = phaseDetails[i + 1];
    if (next) {
      phaseDetails[i].endDate = next.startDate;
      phaseDetails[i].days = Math.round((new Date(next.startDate).getTime() - new Date(phaseDetails[i].startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
    }
  }
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


