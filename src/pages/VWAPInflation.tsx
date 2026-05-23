import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

export function VWAPInflationPage() {
  const [realm, setRealm] = useState(0);
  const [vwapTab, setVwapTab] = useState<"overall" | "quality" | "product" | "both">("overall");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQualities, setSelectedQualities] = useState("0,1,2,3,4,5,6,7,8,9,10,11,12");

  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchVWAPInflation(realm, 200), 120000, [realm]);

  const productList = useMemo(() => {
    if (!data?.vwapInflation) return [];
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const item of data.vwapInflation) {
      if (!item.product) continue;
      for (const [id, p] of Object.entries(item.product)) {
        if (!seen.has(id)) { seen.add(id); list.push({ id, name: (p as any).nm ?? `Product ${id}` }); }
      }
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [data]);

  if (loading) return <LoadingState text="Loading VWAP inflation data..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">VWAP Inflation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Day-over-day inflation from raw VWAP data, broken down by quality and product</p>
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

      <Section title="VWAP Inflation">
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
          {data?.vwapInflation && data.vwapInflation.length > 1 ? (
            <>
              {vwapTab === "overall" && <VWAPOverallChart data={data.vwapInflation} />}
              {vwapTab === "quality" && <VWAPQualityChart data={data.vwapInflation} qualities={selectedQualities} />}
              {vwapTab === "product" && <VWAPProductChart data={data.vwapInflation} productId={selectedProduct} />}
              {vwapTab === "both" && <VWAPBothChart data={data.vwapInflation} productId={selectedProduct} qualities={selectedQualities} />}
            </>
          ) : (
            <p className="text-xs text-gray-400 py-8 text-center">Not enough data — need at least 2 dates with VWAP records</p>
          )}
        </div>
      </Section>
    </div>
  );
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
