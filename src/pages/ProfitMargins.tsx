import React, { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { RESOURCES } from "../data/simco_static";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";
import {
  BarChart3, Search, Filter, ArrowUpDown,
  TrendingUp, TrendingDown, Target, Info
} from "lucide-react";

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
    for (const r of resources) if (r.categoryName) set.add(r.categoryName);
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
    if (search) list = list.filter((r: any) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.categoryName && r.categoryName.toLowerCase().includes(search.toLowerCase()))
    );

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

  if (loading && !data) return <LoadingState text="Synthesizing Profit Matrices..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (resources.length === 0) return <EmptyState message="No margin data available for the selected realm." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Margins.<span className="text-sky-600">Matrix</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time profitability analysis across all economic sectors.</p>
        </div>

        <div className="flex items-center gap-4">
           <Badge variant="neutral" className="tabular-nums">
              {resources.length} RESOURCES TRACKED
           </Badge>
           <select
             value={realm}
             onChange={(e) => setRealm(Number(e.target.value))}
             className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
           >
             <option value={0}>REALM_0</option>
             <option value={1}>REALM_1</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricSummary label="Total Items" value={resources.length} />
         <MetricSummary label="Profitable" value={resources.filter((r: any) => r.marginPct > 0).length} variant="success" />
         <MetricSummary label="Avg Margin" value={`${(resources.reduce((s: number, r: any) => s + r.marginPct, 0) / resources.length).toFixed(1)}%`} />
         <MetricSummary label="Highest Margin" value={`${Math.max(...resources.map((r: any) => r.marginPct)).toFixed(1)}%`} variant="info" />
      </div>

      <Card className="p-0 overflow-hidden border-t-4 border-t-sky-600">
         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
               <Input
                  placeholder="Filter resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={Search}
                  className="bg-white dark:bg-slate-900"
               />
            </div>
            <div className="flex gap-2">
               <select
                 value={category}
                 onChange={(e) => setCategory(e.target.value)}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none"
               >
                 <option value="all">All Categories</option>
                 {categories.map((c) => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Resource</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right cursor-pointer group" onClick={() => toggleSort("mg")}>
                        <div className="flex items-center justify-end gap-2">
                           Margin {sortBy === "mg" && (sortDir === "desc" ? "▼" : "▲")}
                           <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right cursor-pointer group" onClick={() => toggleSort("np")}>
                        <div className="flex items-center justify-end gap-2">
                           Net/Hr
                           <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Rev/Hr</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Price</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filtered.map((r: any) => (
                     <tr
                        key={r.id}
                        className={cn(
                           "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer",
                           selectedResId === r.id && "bg-sky-50 dark:bg-sky-900/20"
                        )}
                        onClick={() => setSelectedResId(r.id)}
                     >
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.name}</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">{r.categoryName || 'General'}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Badge variant={r.marginPct > 0 ? 'success' : 'error'} className="w-20 justify-center">
                              {r.marginPct.toFixed(1)}%
                           </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-black tabular-nums text-slate-900 dark:text-white">
                           {fmt(r.netProfitPerHour)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold tabular-nums text-slate-400 text-xs">
                           {fmt(r.revenuePerHour)}
                        </td>
                        <td className="px-6 py-4 text-right font-black tabular-nums text-sky-600">
                           ${r.outputVwap.toFixed(2)}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>

      {selectedResId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
           <Card title="Sourcing Matrix" icon={Target} subtitle="Supply Chain Breakdown">
              <div className="space-y-3">
                 {(() => {
                    const res = RESOURCES.find(r => r.id === selectedResId);
                    if (!res || !res.inputs) return (
                       <div className="py-10 text-center opacity-30 italic text-sm">
                          No direct input requirements found for this resource.
                       </div>
                    );
                    return Object.entries(res.inputs).map(([id, qty]) => {
                       const input = RESOURCES.find(r => r.id === Number(id));
                       const inputMargin = resources.find((rm: any) => rm.id === Number(id));
                       return (
                          <div key={id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center font-bold text-xs text-sky-600 shadow-sm">
                                   {input?.name.charAt(0)}
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight">{input?.name || `ID_${id}`}</span>
                             </div>
                             <div className="flex items-center gap-6">
                                <span className="txt-label tabular-nums font-black text-slate-900 dark:text-white">{qty} UNITS</span>
                                <Badge variant={inputMargin?.marginPct > 0 ? 'success' : 'neutral'}>
                                   {inputMargin ? `${inputMargin.marginPct.toFixed(1)}%` : '---'}
                                </Badge>
                             </div>
                          </div>
                       )
                    });
                 })()}
              </div>
           </Card>

           <Card title="Strategic Advisory" icon={Info} className="bg-slate-900 text-white border-none relative overflow-hidden">
              <Info className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
              <div className="relative z-10 space-y-6">
                 <div>
                    <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-4">Market Outlook</p>
                    <p className="text-lg font-medium leading-relaxed italic">
                       {resources.find((rm: any) => rm.id === selectedResId)?.marginPct > 5
                          ? "Current data indicates strong internal production ROI. Expand facility capacity to capture increased sector yields."
                          : "Low margin detected. Advise vertical integration or seeking external contract sourcing to reduce overhead."}
                    </p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="txt-label text-slate-400">COMMAND_ACTION</p>
                    <p className="text-xl font-black mt-1 uppercase">
                       {resources.find((rm: any) => rm.id === selectedResId)?.marginPct > 5 ? 'SCALING_INITIATED' : 'SENSITIVITY_CHECK'}
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

function MetricSummary({ label, value, variant = 'neutral' }: any) {
   const colors = {
      neutral: 'text-slate-900 dark:text-white',
      success: 'text-emerald-600',
      info: 'text-sky-600'
   };

   return (
      <Card className="hover:shadow-md transition-all">
         <p className="txt-label mb-1">{label}</p>
         <p className={cn("text-3xl font-black tabular-nums tracking-tighter", colors[variant as keyof typeof colors])}>
            {value}
         </p>
      </Card>
   );
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(1);
}
