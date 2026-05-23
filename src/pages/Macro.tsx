import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

export function MacroPage() {
  const [realm, setRealm] = useState(0);
  const { data: latest, loading: lLoading, error: lError, refresh: lRefresh } = useDataRepoPoll(() => dataRepo.fetchMacroLatest(realm), 60000, [realm]);
  const { data: history, loading: hLoading } = useDataRepoPoll(() => dataRepo.fetchMacroHistory(realm, 120), 120000, [realm]);
  const { data: indexes, loading: iLoading } = useDataRepoPoll(() => dataRepo.fetchMacroIndexes(realm, 200), 120000, [realm]);
  const { data: inflation, loading: infLoading } = useDataRepoPoll(() => dataRepo.fetchMacroInflation(realm, 200), 120000, [realm]);
  const { data: phases } = useDataRepoPoll(() => dataRepo.fetchMacroPhases(realm), 120000, [realm]);

  const [refOverride, setRefOverride] = useState(0);
  const [vwapTab, setVwapTab] = useState<"overall" | "quality" | "product" | "both">("overall");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQualities, setSelectedQualities] = useState("0,1,2,3,4,5,6,7,8,9,10,11,12");

  const { data: vwapData } = useDataRepoPoll(() => dataRepo.fetchVWAPInflation(realm, 200), 120000, [realm]);

  const refPrice = useMemo(() => {
    if (refOverride > 0) return refOverride;
    if (indexes?.indexes?.length) return indexes.indexes[0].cpi ?? 0;
    return 0;
  }, [refOverride, indexes]);

  const productList = useMemo(() => {
    if (!vwapData?.vwapInflation) return [];
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const item of vwapData.vwapInflation) {
      if (!item.product) continue;
      for (const [id, p] of Object.entries(item.product)) {
        if (!seen.has(id)) { seen.add(id); list.push({ id, name: (p as any).nm ?? `Product ${id}` }); }
      }
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [vwapData]);

  if (lLoading) return <LoadingState text="Loading macro data..." />;
  if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;

  const latestH = latest?.latestHistory;
  const latestI = latest?.latestIndexes;
  const latestInf = latest?.latestInflation;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Macro Economy</h1>
          <p className="text-sm text-gray-500 mt-0.5">Realm-level economic indicators, history, and phase analysis</p>
        </div>
        <select
          value={realm}
          onChange={(e) => setRealm(Number(e.target.value))}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700"
        >
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <Section title="Latest State">
        <CardGrid cols={4}>
          <StatCard title="Companies Value" value={latestH?.companiesValue != null ? fmt(latestH.companiesValue) : "-"} subtitle={latestH?.date ? new Date(latestH.date).toLocaleDateString() : undefined} color="border-l-blue-500" />
          <StatCard title="Active Companies" value={latestH?.activeCompanies ?? "-"} color="border-l-green-500" />
          <StatCard title="Bonds Sold" value={latestH?.bondsSold != null ? fmt(latestH.bondsSold) : "-"} color="border-l-purple-500" />
          <StatCard title="Total Buildings" value={latestH?.totalBuildings ?? "-"} color="border-l-amber-500" />
        </CardGrid>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {history?.history && history.history.length > 0 && (
          <Section title="Companies Value &amp; GDP History">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={(indexes?.indexes ? history.history.map((h) => {
                  const ix = indexes.indexes.find((i: any) => i.date === h.date);
                  return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
                }) : history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() })))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="companiesValue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Companies Value" />
                  <Line type="monotone" dataKey="gdp" stroke="#059669" strokeWidth={2} dot={false} name="GDP" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {history?.history && history.history.length > 0 && (
          <Section title="Active Companies &amp; Buildings">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="activeCompanies" stroke="#059669" strokeWidth={2} dot={false} name="Active Companies" />
                  <Line type="monotone" dataKey="totalBuildings" stroke="#d97706" strokeWidth={2} dot={false} name="Total Buildings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {indexes?.indexes && indexes.indexes.length > 0 && (
          <Section title="Price Indexes (CPI, Core CPI)">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={indexes.indexes.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpi" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPI" />
                  <Line type="monotone" dataKey="coreCpi" stroke="#7c3aed" strokeWidth={2} dot={false} name="Core CPI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {inflation?.inflation && inflation.inflation.length > 0 && (
          <Section title="Inflation Rates">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={inflation.inflation.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpiRate" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPI Rate" />
                  <Line type="monotone" dataKey="coreCpiRate" stroke="#7c3aed" strokeWidth={2} dot={false} name="Core CPI Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}
      </div>

      {indexes?.indexes && indexes.indexes.length > 0 && refPrice > 0 && (
        <Section title="Inflation vs Reference" subtitle="Deviation from reference price (%)">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Reference:</span>
              <span className="text-xs font-mono font-medium text-gray-700">{refPrice.toFixed(2)}</span>
              <span className="text-xs text-gray-400 ml-1">(first CPI value)</span>
              <div className="ml-auto flex items-center gap-1">
                <span className="text-xs text-gray-400">Override:</span>
                <input type="number" value={refOverride || ""} onChange={(e) => setRefOverride(Number(e.target.value))} className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded" placeholder="0" />
                {refOverride > 0 && <button onClick={() => setRefOverride(0)} className="text-xs text-gray-400 hover:text-gray-600">&times;</button>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={indexes.indexes.map((h) => ({
                ...h,
                d: new Date(h.date).toLocaleDateString(),
                cpiDev: ((h.cpi - refPrice) / refPrice) * 100,
                coreCpiDev: ((h.coreCpi - refPrice) / refPrice) * 100,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`]} />
                <Legend />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" label="Baseline" />
                <Line type="monotone" dataKey="cpiDev" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPI" />
                <Line type="monotone" dataKey="coreCpiDev" stroke="#7c3aed" strokeWidth={2} dot={false} name="Core CPI" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {vwapData?.vwapInflation && vwapData.vwapInflation.length > 1 && (
        <Section title="VWAP Inflation" subtitle="Day-over-day inflation from raw VWAP data">
          <div className="card p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {(["overall", "quality", "product", "both"] as const).map((t) => (
                <button key={t} onClick={() => setVwapTab(t)} className={`px-2.5 py-1 text-xs rounded font-medium ${vwapTab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {t === "overall" ? "Overall" : t === "quality" ? "By Quality" : t === "product" ? "By Product" : "By Both"}
                </button>
              ))}
              {vwapTab === "quality" && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-gray-400">Q:</span>
                  <input value={selectedQualities} onChange={(e) => setSelectedQualities(e.target.value)} className="w-32 px-1.5 py-0.5 text-xs border border-gray-300 rounded font-mono" placeholder="0,1,2" />
                </span>
              )}
              {vwapTab === "product" && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-gray-400">Product:</span>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 max-w-[160px]">
                    <option value="">-- select --</option>
                    {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </span>
              )}
              {vwapTab === "both" && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-gray-400">Product:</span>
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="text-xs border border-gray-300 rounded px-1.5 py-0.5 max-w-[160px]">
                    <option value="">-- select --</option>
                    {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </span>
              )}
            </div>
            {vwapTab === "overall" && <VWAPOverallChart data={vwapData.vwapInflation} />}
            {vwapTab === "quality" && <VWAPQualityChart data={vwapData.vwapInflation} qualities={selectedQualities} />}
            {vwapTab === "product" && <VWAPProductChart data={vwapData.vwapInflation} productId={selectedProduct} />}
            {vwapTab === "both" && <VWAPBothChart data={vwapData.vwapInflation} productId={selectedProduct} qualities={selectedQualities} />}
          </div>
        </Section>
      )}

      {phases && (
        <Section title="Phase History" subtitle={`Current: ${phases.currentPhase} (${phases.totalDays} days tracked)`}>
          <div className="card divide-y divide-gray-100">
            {phases.phases.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <PhaseDot phase={p.phase} />
                  <span className="font-medium text-gray-900">{p.phase}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(p.startDate).toLocaleDateString()} &ndash; {p.endDate ? new Date(p.endDate).toLocaleDateString() : "Present"}
                  <span className="ml-2 text-gray-400">({p.days}d)</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PhaseDot({ phase }: { phase: string }) {
  const colors: Record<string, string> = { Expansion: "bg-econ-green", Stagnation: "bg-econ-amber", Recession: "bg-econ-red", Recovery: "bg-blue-500", Volatile: "bg-purple-500" };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[phase] ?? "bg-gray-400"}`} />;
}

const QCOLORS = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48","#a855f7"];

function inflationSeries(data: any[], getVal: (item: any) => number | null): { d: string; v: number | null }[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((item, i) => {
    const cur = getVal(item);
    if (i === 0 || cur == null) return { d: new Date(item.date).toLocaleDateString(), v: null };
    const prev = getVal(sorted[i - 1]);
    if (prev == null || prev === 0) return { d: new Date(item.date).toLocaleDateString(), v: null };
    return { d: new Date(item.date).toLocaleDateString(), v: ((cur - prev) / prev) * 100 };
  });
}

function VWAPOverallChart({ data }: { data: any[] }) {
  const chart = inflationSeries(data, (item) => item.overall?.vw ?? null);
  if (chart.length < 2) return <p className="text-xs text-gray-400 py-4 text-center">Not enough data</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
        <Tooltip formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`]} />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} name="Overall Inflation" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function VWAPQualityChart({ data, qualities }: { data: any[]; qualities: string }) {
  const qList = qualities.split(",").map(s => s.trim()).filter(Boolean);
  if (qList.length === 0) return <p className="text-xs text-gray-400 py-4 text-center">Enter quality levels (e.g. 0,1,2)</p>;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const chart = sorted.map((item, i) => {
    const entry: any = { d: new Date(item.date).toLocaleDateString() };
    for (const q of qList) {
      const cur = item.quality?.[q]?.vw;
      if (i === 0 || cur == null) { entry[q] = null; continue; }
      const prev = sorted[i - 1].quality?.[q]?.vw;
      if (prev == null || prev === 0) { entry[q] = null; continue; }
      entry[q] = ((cur - prev) / prev) * 100;
    }
    return entry;
  });

  if (chart.length < 2) return <p className="text-xs text-gray-400 py-4 text-center">Not enough data</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
        <Tooltip formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`]} />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
        {qList.map((q, i) => <Line key={q} type="monotone" dataKey={q} stroke={QCOLORS[i % QCOLORS.length]} strokeWidth={2} dot={false} name={`Q${q}`} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

function VWAPProductChart({ data, productId }: { data: any[]; productId: string }) {
  if (!productId) return <p className="text-xs text-gray-400 py-4 text-center">Select a product</p>;
  const chart = inflationSeries(data, (item) => item.product?.[productId]?.vw ?? null);
  const name = data.find((d: any) => d.product?.[productId])?.product?.[productId]?.nm ?? `Product ${productId}`;
  if (chart.length < 2) return <p className="text-xs text-gray-400 py-4 text-center">Not enough data</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
        <Tooltip formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`]} />
        <Legend />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} dot={false} name={name} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function VWAPBothChart({ data, productId, qualities }: { data: any[]; productId: string; qualities: string }) {
  if (!productId) return <p className="text-xs text-gray-400 py-4 text-center">Select a product</p>;
  const qList = qualities.split(",").map(s => s.trim()).filter(Boolean);
  if (qList.length === 0) return <p className="text-xs text-gray-400 py-4 text-center">Enter quality levels (e.g. 0,1,2)</p>;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const chart = sorted.map((item, i) => {
    const entry: any = { d: new Date(item.date).toLocaleDateString() };
    for (const q of qList) {
      const cur = item.both?.[`${productId}_${q}`]?.vw;
      if (i === 0 || cur == null) { entry[q] = null; continue; }
      const prev = sorted[i - 1].both?.[`${productId}_${q}`]?.vw;
      if (prev == null || prev === 0) { entry[q] = null; continue; }
      entry[q] = ((cur - prev) / prev) * 100;
    }
    return entry;
  });

  const nm = data.find((d: any) => d.product?.[productId])?.product?.[productId]?.nm ?? `Product ${productId}`;
  if (chart.length < 2) return <p className="text-xs text-gray-400 py-4 text-center">Not enough data</p>;
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{nm} — quality-level inflation</p>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`]} />
          <Legend />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
          {qList.map((q, i) => <Line key={q} type="monotone" dataKey={q} stroke={QCOLORS[i % QCOLORS.length]} strokeWidth={2} dot={false} name={`Q${q}`} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
