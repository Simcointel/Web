import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { RESOURCES } from "../data/simco_static";

export function ProfitMarginsPage() {
  const [realm, setRealm] = useSharedRealm();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"mg" | "np" | "rv" | "vw">("mg");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);

  const [selectedResId, setSelectedResId] = useState<number | null>(null);
  const resources = data?.resources ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) set.add(r.categoryName);
    return [...set].sort();
  }, [resources]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let list = resources;
    if (category !== "all") list = list.filter((r: any) => r.categoryName === category);
    if (search) list = list.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()) || r.categoryName.toLowerCase().includes(search.toLowerCase()));

    list = [...list].sort((a: any, b: any) => {
      let valA, valB;
      if (sortBy === "mg") { valA = a.marginPct; valB = b.marginPct; }
      else if (sortBy === "np") { valA = a.netProfitPerHour; valB = b.netProfitPerHour; }
      else if (sortBy === "rv") { valA = a.revenuePerHour; valB = b.revenuePerHour; }
      else { valA = a.outputVwap; valB = b.outputVwap; }

      return sortDir === "desc" ? valB - valA : valA - valB;
    });
    return list;
  }, [resources, category, search, sortBy, sortDir]);

  if (loading && !data) return <LoadingState text="SYNC_PRICES..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (resources.length === 0) return <EmptyState message="NO_DATA_AVAILABLE" />;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-mono text-[9px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-100 dark:border-surface-800/50 pb-2">
        <div>
          <h1 className="text-xs font-black uppercase tracking-widest">Margins.Matrix_R{realm}</h1>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-100 dark:bg-surface-800 border border-surface-100 dark:border-surface-800">
         <SmallMetric label="ITEMS" value={resources.length} />
         <SmallMetric label="PROFIT" value={resources.filter((r: any) => r.marginPct > 0).length} />
         <SmallMetric label="AVG_MG" value={`${(resources.reduce((s: number, r: any) => s + r.marginPct, 0) / resources.length).toFixed(0)}%`} />
         <SmallMetric label="TOP_MG" value={`${Math.max(...resources.map((r: any) => r.marginPct)).toFixed(0)}%`} />
      </div>

      <div className="card">
        <div className="p-1 border-b border-surface-50 dark:border-surface-800 bg-surface-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="SEARCH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-surface-950 border border-surface-100 dark:border-surface-800 px-2 py-0.5 text-[9px] focus:outline-none uppercase font-bold rounded"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white dark:bg-surface-950 border border-surface-100 dark:border-surface-800 px-2 py-0.5 text-[9px] focus:outline-none uppercase font-bold rounded"
            >
              <option value="all">ALL_CATEGORIES</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50 text-[8px] font-black uppercase text-surface-400 border-b border-surface-50 dark:border-surface-800">
                <th className="px-3 py-1.5">ITEM</th>
                <th className="px-3 py-1.5 text-right cursor-pointer" onClick={() => toggleSort("mg")}>
                  MG% {sortBy === "mg" && (sortDir === "desc" ? "▼" : "▲")}
                </th>
                <th className="px-3 py-1.5 text-right cursor-pointer" onClick={() => toggleSort("np")}>PR/H</th>
                <th className="px-3 py-1.5 text-right">RV/H</th>
                <th className="px-3 py-1.5 text-right">PRICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
              {filtered.map((r: any) => (
                <tr
                  key={r.id}
                  className={`hover:bg-brand-500/5 transition-colors cursor-pointer ${selectedResId === r.id ? 'bg-brand-500/10' : ''}`}
                  onClick={() => setSelectedResId(r.id)}
                >
                  <td className="px-3 py-1 font-bold uppercase truncate max-w-[100px]">{r.name}</td>
                  <td className="px-3 py-1 text-right">
                    <span className={r.marginPct > 0 ? "text-emerald-500" : "text-rose-500"}>
                      {r.marginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-1 text-right font-black">{fmt(r.netProfitPerHour)}</td>
                  <td className="px-3 py-1 text-right opacity-40">{fmt(r.revenuePerHour)}</td>
                  <td className="px-3 py-1 text-right font-bold text-brand-500">{r.outputVwap.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedResId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="border border-surface-200 dark:border-surface-800 p-4">
              <span className="block font-black uppercase text-[10px] opacity-40 mb-4 tracking-widest">Sourcing_Matrix</span>
              <div className="space-y-1">
                 {(() => {
                    const res = RESOURCES.find(r => r.id === selectedResId);
                    if (!res || !res.inputs) return <p className="opacity-40 italic">NO_INPUTS_REQ</p>;
                    return Object.entries(res.inputs).map(([id, qty]) => {
                       const input = RESOURCES.find(r => r.id === Number(id));
                       const inputMargin = resources.find((r: any) => r.id === Number(id));
                       return (
                          <div key={id} className="flex justify-between items-center py-1 border-b border-surface-100 dark:border-surface-900 last:border-0">
                             <span className="uppercase font-bold">{input?.name || `ID_${id}`}</span>
                             <div className="flex gap-4">
                                <span className="opacity-40">{qty}U</span>
                                <span className={`font-black ${inputMargin?.marginPct > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                   {inputMargin ? `${inputMargin.marginPct.toFixed(1)}%` : '??'}
                                </span>
                             </div>
                          </div>
                       )
                    });
                 })()}
              </div>
           </div>
           <div className="border border-surface-200 dark:border-surface-800 p-4 bg-surface-900 text-white dark:bg-white dark:text-surface-950 flex flex-col justify-center">
              <span className="font-black uppercase text-[10px] opacity-60 mb-2">Operational_Advisory</span>
              <p className="text-[10px] font-bold leading-relaxed uppercase">
                 {resources.find((r: any) => r.id === selectedResId)?.marginPct > 5 ? 'EXPAND_CAPACITY' : 'SEEK_EXTERNAL_CONTRACTS'}
                 <br/>
                 RESOURCE_ID: {selectedResId}
              </p>
           </div>
        </div>
      )}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string | number }) {
   return (
      <div className="bg-white dark:bg-surface-950 p-3 text-center">
         <p className="text-[8px] font-bold opacity-40 uppercase mb-1">{label}</p>
         <p className="text-sm font-black">{value}</p>
      </div>
   );
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
