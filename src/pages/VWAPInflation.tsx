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
    <div className="space-y-6 animate-in fade-in duration-300 font-mono text-[10px]">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">VWAP_Inflation_Matrix</h1>
          <p className="text-[10px] text-surface-500 mt-0.5 font-bold uppercase opacity-60">Price_Integrity_Monitor</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black px-2 py-1 outline-none uppercase"
          >
            <option value={0}>R0</option>
            <option value={1}>R1</option>
          </select>
        </div>
      </div>

      <div className="border border-surface-200 dark:border-surface-800">
        <div className="p-2 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 flex flex-wrap items-center justify-between gap-4">
           <div className="flex gap-px bg-surface-200 dark:bg-surface-800 border border-surface-200 dark:border-surface-800">
             {(["overall", "quality", "product", "both"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setVwapTab(t)}
                  className={`px-3 py-1 text-[9px] font-black uppercase transition-all ${vwapTab === t ? "bg-surface-900 text-white dark:bg-white dark:text-surface-950" : "bg-white dark:bg-surface-950 opacity-40 hover:opacity-100"}`}
                >
                  {t}
                </button>
              ))}
           </div>

            {vwapTab === "quality" && (
              <div className="flex items-center gap-2">
                <span className="opacity-40 uppercase font-black">Qualities:</span>
                <input value={selectedQualities} onChange={(e) => setSelectedQualities(e.target.value)} className="w-24 px-2 py-1 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 text-[9px] focus:outline-none" />
              </div>
            )}
            {(vwapTab === "product" || vwapTab === "both") && (
              <div className="flex items-center gap-2">
                <span className="opacity-40 uppercase font-black">Resource:</span>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 px-2 py-1 text-[9px] outline-none uppercase font-bold">
                  <option value="">--select--</option>
                  {productList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
        </div>

        <div className="p-6">
          {data?.vwapInflation && data.vwapInflation.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.vwapInflation.map(d => ({ ...d, dt: new Date(d.date).toLocaleDateString() }))}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="dt" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', fontSize: '9px' }} />
                <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="overall.vw" stroke="#000" strokeWidth={1.5} dot={false} name="Overall VWAP" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-20 text-center opacity-30 italic uppercase">INSUFFICIENT_DATA_FEED</div>
          )}
        </div>
      </div>
    </div>
  );
}
