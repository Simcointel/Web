import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

export function VWAPInflationPage() {
  const [realm, setRealm] = useSharedRealm();
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

  const volatilityInsights = useMemo(() => {
    if (!data?.vwapInflation || data.vwapInflation.length < 2) return null;
    const latest = data.vwapInflation[data.vwapInflation.length - 1];
    const prev = data.vwapInflation[data.vwapInflation.length - 2];

    const delta = latest.overall?.vw && prev.overall?.vw ? ((latest.overall.vw - prev.overall.vw) / prev.overall.vw) * 100 : 0;

    return {
       delta,
       nodeCount: Object.keys(latest.product || {}).length,
       highVolatility: Object.entries(latest.quality || {}).sort((a: any, b: any) => Math.abs(b[1].vw - (prev.quality?.[a[0]]?.vw || 0)) - Math.abs(a[1].vw - (prev.quality?.[a[0]]?.vw || 0))).slice(0, 3)
    };
  }, [data]);

  if (loading && !data) return <LoadingState text="Calculating price variations..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mb-2 inline-block">
            Inflation Tracking
          </span>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">VWAP Inflation</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Cumulative price deviation from standard VWAP baselines.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-surface-900 p-1.5 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <label className="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase ml-2">Realm</label>
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-surface-50 dark:bg-surface-800 border-none rounded-lg text-sm font-semibold px-4 py-1.5 focus:ring-2 focus:ring-brand-500 dark:text-white"
          >
            <option value={0}>Realm 0</option>
            <option value={1}>Realm 1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="card p-6 border-t-2 border-t-brand-600">
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Overall Trend</p>
            <div className="flex items-center gap-2">
               <span className={`text-2xl font-black font-mono ${volatilityInsights && volatilityInsights.delta >= 0 ? 'text-econ-green' : 'text-econ-red'}`}>
                  {volatilityInsights ? (volatilityInsights.delta >= 0 ? '+' : '') + volatilityInsights.delta.toFixed(2) : '--'}%
               </span>
               <span className="text-[10px] font-bold text-surface-400 uppercase italic">Daily Velocity</span>
            </div>
         </div>
         <div className="card p-6 border-t-2 border-t-econ-purple">
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Market Coverage</p>
            <div className="flex items-center gap-2">
               <span className="text-2xl font-black font-mono text-surface-900 dark:text-white">
                  {volatilityInsights?.nodeCount || '--'}
               </span>
               <span className="text-[10px] font-bold text-surface-400 uppercase italic">Monitored Assets</span>
            </div>
         </div>
         <div className="card p-6 border-t-2 border-t-econ-amber">
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">System Integrity</p>
            <div className="flex items-center gap-2">
               <span className="text-2xl font-black font-mono text-econ-green">NOMINAL</span>
               <span className="text-[10px] font-bold text-surface-400 uppercase italic">Price Feeds</span>
            </div>
         </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex flex-wrap items-center justify-between gap-4">
           <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
             {(["overall", "quality", "product", "both"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setVwapTab(t)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${vwapTab === t ? "bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}`}
                >
                  {t}
                </button>
              ))}
           </div>

            {vwapTab === "quality" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-surface-400 uppercase">Qualities:</span>
                <input value={selectedQualities} onChange={(e) => setSelectedQualities(e.target.value)} className="w-32 px-2 py-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded text-xs focus:ring-1 focus:ring-brand-500 dark:text-white font-mono" placeholder="0,1,2" />
              </div>
            )}
            {(vwapTab === "product" || vwapTab === "both") && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-surface-400 uppercase">Resource:</span>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="text-xs bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 focus:ring-1 focus:ring-brand-500 dark:text-white max-w-[160px]">
                  <option value="">-- select --</option>
                  {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
        </div>

        <div className="p-8">
          {data?.vwapInflation && data.vwapInflation.length > 1 ? (
            <>
              {vwapTab === "overall" && <VWAPOverallChart data={data.vwapInflation} />}
              {vwapTab === "quality" && <VWAPQualityChart data={data.vwapInflation} qualities={selectedQualities} />}
              {vwapTab === "product" && <VWAPProductChart data={data.vwapInflation} productId={selectedProduct} />}
              {vwapTab === "both" && <VWAPBothChart data={data.vwapInflation} productId={selectedProduct} qualities={selectedQualities} />}
            </>
          ) : (
            <div className="py-20 text-center">
               <p className="text-sm text-surface-400 font-medium italic">Insufficient historical data to calculate inflation trajectory</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const QCOLORS = ["#0ea5e9", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#e11d48", "#a855f7"];

const BASE_PRICES: Record<string, number> = {
  "101": 140.00,
  "107": 300.00,
  "111": 2200.00,
  "108": 5.00,
};

function pctRef(data: any[], getVal: (item: any) => number | null, fixedRef?: number): { d: string; v: number | null; raw: number | null }[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const ref = fixedRef ?? sorted.reduce<number | null>((acc, item) => acc ?? getVal(item), null);
  if (ref == null || ref === 0) return [];
  return sorted.map(item => {
    const val = getVal(item);
    return { d: new Date(item.date).toLocaleDateString(), v: val != null ? ((val - ref) / ref) * 100 : null, raw: val };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-surface-900 p-4 border border-surface-200 dark:border-surface-800 rounded-lg shadow-xl shadow-black/10">
        <p className="text-[10px] font-bold text-surface-400 uppercase mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{entry.name}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-xs font-black text-surface-900 dark:text-white">
                   {entry.value >= 0 ? "+" : ""}{entry.value.toFixed(2)}%
                 </span>
                 {entry.payload.raw != null && (
                   <span className="text-[10px] font-mono text-surface-400">
                     Price: {entry.payload.raw.toFixed(2)}
                   </span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function VWAPOverallChart({ data }: { data: any[] }) {
  const chart = pctRef(data, (item) => item.overall?.vw ?? null);
  if (chart.length < 2) return <div className="text-center py-10 text-surface-400 text-sm italic">Not enough data</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="v" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} name="Overall VWAP Deviation" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function VWAPQualityChart({ data, qualities }: { data: any[]; qualities: string }) {
  const qList = qualities.split(",").map(s => s.trim()).filter(Boolean);
  if (qList.length === 0) return <div className="text-center py-10 text-surface-400 text-sm italic">Select qualities to visualize</div>;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const refs: Record<string, number | null> = {};
  for (const q of qList) refs[q] = sorted.reduce<number | null>((acc, item) => acc ?? item.quality?.[q]?.vw ?? null, null);

  const chart = sorted.map(item => {
    const entry: any = { d: new Date(item.date).toLocaleDateString() };
    for (const q of qList) {
      const val = item.quality?.[q]?.vw;
      const ref = refs[q];
      entry[q] = (val != null && ref != null && ref !== 0) ? ((val - ref) / ref) * 100 : null;
      entry[`${q}_raw`] = val;
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
        <Tooltip content={({ active, payload, label }: any) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-white dark:bg-surface-900 p-4 border border-surface-200 dark:border-surface-800 rounded-lg shadow-xl shadow-black/10">
                <p className="text-[10px] font-bold text-surface-400 uppercase mb-2">{label}</p>
                <div className="space-y-1.5">
                  {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Quality {entry.name.replace('Q', '')}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-xs font-black text-surface-900 dark:text-white">{entry.value.toFixed(2)}%</span>
                         <span className="text-[10px] font-mono text-surface-400">Price: {entry.payload[`${entry.name.replace('Q', '')}_raw`]?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        }} />
        <Legend iconType="circle" />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" />
        {qList.map((q, i) => <Line key={q} type="monotone" dataKey={q} stroke={QCOLORS[i % QCOLORS.length]} strokeWidth={2} dot={false} name={`Q${q}`} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

function VWAPProductChart({ data, productId }: { data: any[]; productId: string }) {
  if (!productId) return <div className="text-center py-10 text-surface-400 text-sm italic">Please select a resource to analyze</div>;
  const basePrice = BASE_PRICES[productId];
  const chart = pctRef(data, (item) => item.product?.[productId]?.vw ?? null, basePrice);
  const name = data.find((d: any) => d.product?.[productId])?.product?.[productId]?.nm ?? `Product ${productId}`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
        <span>Baseline Benchmark:</span>
        <span className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-900 dark:text-white font-mono">
          {basePrice?.toFixed(2) ?? "FIRST RECORD"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} name={name} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VWAPBothChart({ data, productId, qualities }: { data: any[]; productId: string; qualities: string }) {
  if (!productId) return <div className="text-center py-10 text-surface-400 text-sm italic">Select a resource for joint analysis</div>;
  const qList = qualities.split(",").map(s => s.trim()).filter(Boolean);
  if (qList.length === 0) return <div className="text-center py-10 text-surface-400 text-sm italic">Select quality levels</div>;

  const basePrice = BASE_PRICES[productId];
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const refs: Record<string, number | null> = {};
  for (const q of qList) {
    const firstVal = sorted.reduce<number | null>((acc, item) => acc ?? item.both?.[`${productId}_${q}`]?.vw ?? null, null);
    refs[q] = basePrice ?? firstVal;
  }

  const chart = sorted.map(item => {
    const entry: any = { d: new Date(item.date).toLocaleDateString() };
    for (const q of qList) {
      const val = item.both?.[`${productId}_${q}`]?.vw;
      const ref = refs[q];
      entry[q] = (val != null && ref != null && ref !== 0) ? ((val - ref) / ref) * 100 : null;
      entry[`${q}_raw`] = val;
    }
    return entry;
  });

  const nm = data.find((d: any) => d.product?.[productId])?.product?.[productId]?.nm ?? `Product ${productId}`;
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
        <span>Resource: {nm}</span>
        <span className="mx-2">|</span>
        <span>Baseline:</span>
        <span className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-900 dark:text-white font-mono">
          {basePrice?.toFixed(2) ?? "DYNAMIC"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
          <Tooltip content={({ active, payload, label }: any) => {
             if (active && payload && payload.length) {
               return (
                 <div className="bg-white dark:bg-surface-900 p-4 border border-surface-200 dark:border-surface-800 rounded-lg shadow-xl shadow-black/10">
                   <p className="text-[10px] font-bold text-surface-400 uppercase mb-2">{label}</p>
                   <div className="space-y-1.5">
                     {payload.map((entry: any, index: number) => (
                       <div key={index} className="flex items-center justify-between gap-6">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">Q{entry.name} {nm}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-surface-900 dark:text-white">{entry.value.toFixed(2)}%</span>
                            <span className="text-[10px] font-mono text-surface-400">Price: {entry.payload[`${entry.name}_raw`]?.toFixed(2)}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               );
             }
             return null;
          }} />
          <Legend iconType="circle" />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" />
          {qList.map((q, i) => <Line key={q} type="monotone" dataKey={q} stroke={QCOLORS[i % QCOLORS.length]} strokeWidth={2} dot={false} name={`Q${q}`} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
