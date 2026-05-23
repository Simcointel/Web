const DATA_REPO_OWNER = "SimcoIntel";
const DATA_REPO_NAME = "Data";
const DATA_REPO_BRANCH = "main";

const GITHUB_RAW = `https://raw.githubusercontent.com/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/${DATA_REPO_BRANCH}`;
const GITHUB_API = `https://api.github.com/repos/${DATA_REPO_OWNER}/${DATA_REPO_NAME}`;

const DATA_CACHE = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 2 * 60 * 1000;
const CACHE_FAIL_TTL = 10 * 1000;

async function withCache<T>(key: string, fn: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const cached = DATA_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;
  try {
    const data = await fn();
    DATA_CACHE.set(key, { data, expiry: Date.now() + ttl });
    return data;
  } catch (err) {
    DATA_CACHE.set(key, { data: null, expiry: Date.now() + CACHE_FAIL_TTL });
    throw err;
  }
}

async function rawFetch(path: string): Promise<any> {
  const res = await fetch(`${GITHUB_RAW}/${path}`);
  if (!res.ok) throw new Error(`Data repo fetch failed: ${res.status}`);
  return res.json();
}

const INDEX_CACHE = new Map<string, { data: any; expiry: number }>();
const INDEX_TTL = 5 * 60 * 1000;
const INDEX_FAIL_TTL = 30 * 1000;

async function fetchIndex(dir: string): Promise<{ latest: string; files: string[] } | null> {
  const key = `index:${dir}`;
  const cached = INDEX_CACHE.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;
  try {
    const data = await rawFetch(`${dir}/index.json`);
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

async function tryDirectFetch(dir: string, prefix: string, dateStr: string): Promise<any> {
  const path = `${dir}/${prefix}${dateStr}.json`;
  const res = await fetch(`${GITHUB_RAW}/${path}`);
  if (res.ok) return res.json();
  return null;
}

async function fetchLatest(dir: string, prefix: string): Promise<any> {
  const index = await fetchIndex(dir);
  if (index?.latest && index.latest.startsWith(prefix)) {
    return rawFetch(`${dir}/${index.latest}`);
  }

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) =>
    new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
  );
  const results = await Promise.all(dates.map(d => tryDirectFetch(dir, prefix, d)));
  const found = results.find(r => r !== null);
  if (found) return found;

  const files = await listFiles(dir);
  const matches = files.filter(f => f.startsWith(prefix) && f.endsWith(".json")).sort().reverse();
  if (matches.length === 0) return null;
  return rawFetch(`${dir}/${matches[0]}`);
}

const LIST_CACHE = new Map<string, { files: string[]; expiry: number }>();
const LIST_TTL = 60 * 1000;

async function listFiles(path: string): Promise<string[]> {
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
    const files = data.filter((f: any) => f.type === "file").map((f: any) => f.name);
    LIST_CACHE.set(key, { files, expiry: Date.now() + LIST_TTL });
    return files;
  } catch {
    LIST_CACHE.set(key, { files: [], expiry: Date.now() + LIST_TTL });
    return [];
  }
}

async function fetchAllFiles(dir: string, prefix: string, limit = 100): Promise<any[]> {
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
      filenames.map(f => rawFetch(`${dir}/${f}`).catch(() => null as any))
    );
    return results.filter(Boolean);
  });
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   Dashboard
   ============================================================ */
export async function fetchDashboardState(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/dashboard/realm-${realm}`, "summary-");
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

function normalizeEvent(raw: any): any {
  return {
    id: raw.id ?? raw.i ?? "",
    se: raw.se ?? raw.s ?? "info",
    ts: raw.ts ?? raw.t ?? "",
    ca: raw.ca ?? raw.c ?? "general",
    ti: raw.ti ?? raw.ti ?? "",
    de: raw.de ?? raw.d ?? "",
    da: raw.da ?? raw.data ?? {},
    ty: raw.ty ?? raw.type ?? "",
  };
}

async function fetchEvents(realm: number, limit: number): Promise<any> {
  const data = await fetchLatest(`aggregates/events/realm-${realm}`, getTodayDate());
  if (!data) return { events: [], total: 0 };
  const raw = Array.isArray(data) ? data : [];
  const events = raw.map(normalizeEvent);
  return { events: events.slice(0, limit), total: events.length };
}

export async function fetchDashboardAlerts(realm: number): Promise<any> {
  return fetchEvents(realm, 5);
}

export async function fetchDashboardEvents(realm: number, limit = 200): Promise<any> {
  return fetchEvents(realm, limit);
}

/* ============================================================
   Macro
   ============================================================ */
export async function fetchMacroLatest(realm: number): Promise<any> {
  const [data, ixData, infData] = await Promise.all([
    fetchLatest(`aggregates/realm-status/realm-${realm}`, "realm-status-"),
    fetchLatest(`aggregates/indexes/realm-${realm}`, "price-indexes-").catch(() => null),
    fetchLatest(`aggregates/inflation/realm-${realm}`, "inflation-report-").catch(() => null),
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

async function loadHistoryYearFiles(realm: number): Promise<any[]> {
  return withCache(`history:${realm}`, async () => {
    const dir = `aggregates/macro-history/realm-${realm}`;
    const index = await fetchIndex(dir);
    let yearFiles: string[];
    if (index?.files) {
      yearFiles = index.files.filter(f => /^\d{4}\.json$/.test(f)).sort();
    } else {
      const files = await listFiles(dir);
      yearFiles = files.filter(f => /^\d{4}\.json$/.test(f)).sort();
    }
    const allChunks = await Promise.all(
      yearFiles.map(f => rawFetch(`${dir}/${f}`).catch(() => null as any))
    );
    const allEntries: any[] = [];
    for (const chunk of allChunks) {
      if (chunk?.e) {
        for (const entry of chunk.e) allEntries.push(entry);
      }
    }
    return allEntries;
  }, CACHE_TTL);
}

export async function fetchMacroHistory(realm: number, limit = 120): Promise<any> {
  const allEntries = await loadHistoryYearFiles(realm);
  const step = Math.max(1, Math.floor(allEntries.length / limit));
  const sampled = allEntries.filter((_, i) => i % step === 0 || i === allEntries.length - 1);
  return {
    history: sampled.map((e: any) => ({
      date: e.d,
      activeCompanies: e.ac,
      companiesValue: e.cv,
      totalBuildings: e.tb,
      bondsSold: e.bs,
      phase: e.ph,
      checkpoint: e.cp,
    })),
    total: allEntries.length,
  };
}

export async function fetchMacroPhases(realm: number): Promise<any> {
  const allEntries = await loadHistoryYearFiles(realm);
  const seen = new Set<string>();
  const phases: Array<{ date: string; phase: string }> = [];
  for (const e of allEntries) {
    if (!e.ph || e.ph === "" || seen.has(e.d)) continue;
    seen.add(e.d);
    phases.push({ date: e.d, phase: e.ph });
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

export async function fetchMacroIndexes(realm: number, limit = 200): Promise<any> {
  const items = await fetchAllFiles(`aggregates/indexes/realm-${realm}`, "price-indexes-", limit);
  return {
    indexes: latestPerDay(items).map((item: any) => ({
      date: item.t,
      cpi: item.ix?.cpi?.v ?? null,
      coreCpi: item.ix?.["core-cpi"]?.v ?? null,
      gdp: item.ix?.gdp?.v ?? null,
    })),
    total: items.length,
  };
}

export async function fetchMacroInflation(realm: number, limit = 200): Promise<any> {
  const items = await fetchAllFiles(`aggregates/inflation/realm-${realm}`, "inflation-report-", limit);
  return {
    inflation: latestPerDay(items).map((item: any) => ({
      date: item.t,
      cpiRate: item.in?.["cpi"]?.ch ?? null,
      coreCpiRate: item.in?.["core-cpi"]?.ch ?? null,
      gdpGrowth: item.in?.["gdp"]?.ch ?? null,
    })),
    total: items.length,
  };
}

/* ============================================================
   Intelligence
   ============================================================ */
export async function fetchMomentum(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/intelligence/realm-${realm}`, "momentum-");
  if (!data) throw new Error("No momentum data");
  const sectors = data.momentum ?? {};
  const values = Object.values(sectors) as any[];
  const avgMomentum = values.length > 0 ? values.reduce((s: number, v: any) => s + (v.st ?? 0), 0) / values.length : 0;
  return {
    [String(realm)]: {
      realm: String(realm),
      momentum: avgMomentum,
      direction: avgMomentum >= 0 ? "up" : "down",
      trend: values.reduce((s: number, v: any) => s + (v.ts ?? 0), 0) / (values.length || 1),
    },
  };
}

export async function fetchVolatility(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/intelligence/realm-${realm}`, "stress-");
  if (!data) throw new Error("No volatility data");
  const stress = data.stress ?? {};
  const values = Object.values(stress) as any[];
  const flags = values.flatMap((v: any) => v.flags ?? []);
  const avgVol = values.length > 0 ? values.reduce((s: number, v: any) => s + (v.scp ?? 0), 0) / values.length : 0;
  return {
    [String(realm)]: {
      realm: String(realm),
      volatility: avgVol,
      classification: avgVol > 0.5 ? "high" : avgVol > 0.2 ? "medium" : "low",
      trend: values.length > 0 ? values.reduce((s: number, v: any) => s + (v.trend ?? v.scp ?? 0), 0) / values.length : 0,
    },
  };
}

export async function fetchRegimes(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/intelligence/realm-${realm}`, "regime-");
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

export async function fetchSectors(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/intelligence/realm-${realm}`, "sectors-");
  if (!data) throw new Error("No sector data");
  const sectors = data.sectors ?? {};
  const list = Object.entries(sectors).map(([name, s]: [string, any]) => ({
    sector: name,
    strength: s.momentum?.st ?? 0,
    momentum: s.momentum?.mt ?? 0,
    leader: s.leaders ?? "-",
    volatility: s.volatility?.v5 ?? 0,
  }));
  return { [String(realm)]: list };
}

export async function fetchCorrelations(realm = 0): Promise<any> {
  const data = await fetchLatest(`aggregates/correlations/realm-${realm}`, "correlation-");
  if (!data) throw new Error("No correlation data");
  const matrix = data.m ?? data.pairs ?? data.correlations ?? {};
  const pairs: any[] = [];
  const categories = Object.keys(matrix);
  for (let i = 0; i < categories.length; i++) {
    const a = categories[i];
    const row = matrix[a] ?? {};
    const subCategories = Object.keys(row);
    for (let j = 0; j < subCategories.length; j++) {
      const b = subCategories[j];
      if (a === b) continue;
      const cell = row[b] ?? {};
      const r = cell.r ?? cell.coefficient ?? null;
      if (r === null || r === undefined) continue;
      pairs.push({
        realm: String(realm),
        pair: `${a} ↔ ${b}`,
        coefficient: r,
        strength: cell.s ?? cell.strength ?? "weak",
      });
    }
  }
  pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  return pairs;
}

export async function fetchAnomalies(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/anomalies/realm-${realm}`, "anomaly-");
  if (!data) throw new Error("No anomaly data");
  const anomalies = data.an ?? [];
  return anomalies.map((a: any) => ({
    category: a.ca ?? "unknown",
    zScore: a.zs ?? 0,
    deviation: a.vl ?? 0,
    direction: a.vl >= 0 ? "above" : "below",
    timestamp: a.ts ?? data.t,
  }));
}

export async function fetchDivergence(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/divergence/realm-${realm}`, "divergence-");
  if (!data) throw new Error("No divergence data");
  const divergences = data.di ?? [];
  return divergences.map((d: any) => ({
    sector: d.sector ?? "unknown",
    strength: d.strength ?? 0,
    type: d.type ?? "unknown",
    signal: d.severity ?? "info",
  }));
}

export async function fetchContagion(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/contagion/realm-${realm}`, "contagion-");
  if (!data) throw new Error("No contagion data");
  const contagions = data.co ?? [];
  return contagions.map((c: any) => ({
    origin: c.origin ?? "unknown",
    spread: c.spread ?? 0,
    risk: c.risk ?? "low",
    affected: c.affected ?? [],
  }));
}

/* ============================================================
   Forecasts
   ============================================================ */
export async function fetchForecast(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/forecasts/realm-${realm}`, "forecast-");
  if (!data) throw new Error("No forecast data");
  return data.series ?? {};
}

export async function fetchSignals(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/signals/realm-${realm}`, "signals-");
  if (!data) throw new Error("No signal data");
  return (data.signals ?? []).map((s: any) => ({
    type: s.type ?? "",
    label: s.label ?? "",
    severity: s.severity ?? "low",
    confidence: s.confidence ?? 0,
    affectedSectors: s.affectedSectors ?? [],
    estimatedDurationDays: s.estimatedDurationDays ?? 0,
    indicators: (s.indicators ?? []).map((ind: any) => {
      if (typeof ind === "string") return { name: ind, value: 0, threshold: 0 };
      return { name: ind.name ?? "", value: ind.value ?? 0, threshold: ind.threshold ?? 0 };
    }),
    rationale: s.rationale ?? "",
  }));
}

/* ============================================================
   Cycles
   ============================================================ */
export async function fetchCycles(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/cycles/realm-${realm}`, "cycle-");
  if (!data) throw new Error("No cycle data");
  const current = data.current ?? {};
  const transitions: { from: string; to: string; probability: number }[] = [];
  const tp = data.transitionProbabilities ?? {};
  for (const [fromPh, toPhs] of Object.entries(tp)) {
    for (const [toPh, prob] of Object.entries(toPhs as Record<string, number>)) {
      transitions.push({ from: fromPh, to: toPh, probability: prob });
    }
  }
  return {
    current: {
      phase: current.phase ?? "unknown",
      confidence: current.confidence ?? 0,
      duration: current.durationDays ?? 0,
      intensity: current.intensity ?? 0,
      stability: data.stability ?? 0,
    },
    transitions,
    history: (data.history ?? []).map((h: any) => ({
      phase: h.phase ?? "unknown",
      startDate: h.detectedAt ?? null,
      endDate: null,
    })),
    stability: data.stability ?? 0,
    intensity: current.intensity ?? 0,
  };
}

/* ============================================================
   Dependencies
   ============================================================ */
export async function fetchDependencies(realm: number): Promise<any> {
  const data = await fetchLatest(`aggregates/dependencies/realm-${realm}`, "dependency-");
  if (!data) throw new Error("No dependency data");
  const risks: any[] = (data.risks ?? []).map((r: any) => ({
    sector: r.category ?? "unknown",
    score: r.riskScore ?? 0,
    upstreamPressure: r.upstreamCount ?? 0,
    downstreamPressure: r.downstreamCount ?? 0,
    critical: r.isCritical ?? false,
  }));
  const riskScores: Record<string, number> = {};
  for (const r of risks) riskScores[r.sector] = r.score;
  return {
    risks,
    riskScores,
    criticalResources: (data.criticalResources ?? []).map((cr: any) => cr.category ?? cr),
    bottleneckChains: (data.bottleneckChains ?? []).map((bc: any) => ({
      chain: Array.isArray(bc.chain) ? bc.chain.join(" → ") : (bc.chain ?? ""),
      pressure: bc.score ?? bc.pressure ?? 0,
      sectors: Array.isArray(bc.chain) ? bc.chain : [],
    })),
    dependencyMatrix: {},
  };
}


