import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

export function VWAPInflationPage() {
  const [realm, setRealm] = useSharedRealm();
  const [vwapTab, setVwapTab] = useState<"overall" | "quality" | "product" | "both">("overall");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQualities, setSelectedQualities] = useState("0,1,2,3,4");

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

  if (loading && !data) return <LoadingState text="SYNC_PRICES..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-xl font-bold italic tracking-tight">VWAP Inflation Analytics</h1>
          <p className="text-sm text-surface-500 mt-1 font-medium italic opacity-80 text-brand-600">Global Price Integrity Monitor</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-bold px-3 py-1.5 rounded-lg outline-none"
          >
            <option value={0}>R0</option>
            <option value={1}>R1</option>
          </select>
        </div>
      </div>

      <div className="card !shadow-none border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 flex flex-wrap items-center justify-between gap-6">
           <div className="flex bg-surface-200 dark:bg-surface-800 p-1 rounded-lg">
             {(["overall", "quality", "product", "both"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setVwapTab(t)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${vwapTab === t ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}
                >
                  {t}
                </button>
              ))}
           </div>

            {vwapTab === "quality" && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase text-surface-400">Qualities:</span>
                <input value={selectedQualities} onChange={(e) => setSelectedQualities(e.target.value)} className="w-32 px-3 py-1.5 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none" />
              </div>
            )}
            {(vwapTab === "product" || vwapTab === "both") && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase text-surface-400">Resource:</span>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm rounded-lg outline-none font-bold">
                  <option value="">-- Select Product --</option>
                  {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
        </div>

        <div className="p-8">
          {data?.vwapInflation && data.vwapInflation.length > 1 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.vwapInflation.map(d => ({ ...d, dt: new Date(d.date).toLocaleDateString() }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-100 dark:stroke-surface-800" />
                <XAxis dataKey="dt" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="overall.vw" stroke="#0284c7" strokeWidth={3} dot={false} name="Market VWAP" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-24 text-center text-surface-300 font-bold italic text-lg uppercase tracking-widest">Waiting for sufficient data feed...</div>
          )}
        </div>
      </div>
    </div>
  );
}
