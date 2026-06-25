import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
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

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Name", "Category", "Margin %", "Profit/hr", "Revenue/hr", "Inputs/hr", "Wages/hr", "Transport/hr", "Price"];
    const rows = filtered.map(r => [
      r.name, r.categoryName, r.marginPct.toFixed(2), r.netProfitPerHour.toFixed(2),
      r.revenuePerHour.toFixed(2), r.inputCostPerHour.toFixed(2), r.wagesPerHour.toFixed(2),
      r.transportPerHour.toFixed(2), r.outputVwap.toFixed(4)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `profit_margins_realm_${realm}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const profitable = resources.filter((r: any) => r.marginPct > 0);
  const avgMargin = resources.length > 0 ? resources.reduce((s: number, r: any) => s + r.marginPct, 0) / resources.length : 0;
  const topMargin = profitable.length > 0 ? Math.max(...profitable.map((r: any) => r.marginPct)) : 0;
  const topProfit = resources.length > 0 ? Math.max(...resources.map((r: any) => r.netProfitPerHour)) : 0;

  if (loading && !data) return <LoadingState text="Analyzing margins..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (resources.length === 0) return <EmptyState message="No profit margin data available" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mb-2 inline-block">
            Production Analytics
          </span>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Profit Margins</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Real-time profitability analysis across all resources and production chains.
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

      <CardGrid cols={4}>
        <StatCard title="Resources" value={resources.length} color="border-l-brand-500" />
        <StatCard title="Profitable" value={profitable.length} subtitle={`${((profitable.length / resources.length) * 100).toFixed(0)}% conversion`} color="border-l-econ-green" />
        <StatCard title="Avg Margin" value={`${avgMargin.toFixed(1)}%`} color="border-l-econ-purple" />
        <StatCard title="Top Profit" value={fmt(topProfit)} subtitle={`Max margin: ${topMargin.toFixed(1)}%`} color="border-l-econ-amber" />
      </CardGrid>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 dark:text-white w-64"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-800/30 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-200 dark:border-surface-800">
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-brand-600 transition-colors" onClick={() => toggleSort("mg")}>
                  Margin {sortBy === "mg" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-brand-600 transition-colors" onClick={() => toggleSort("np")}>
                  Profit/hr {sortBy === "np" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-brand-600 transition-colors" onClick={() => toggleSort("rv")}>
                  Revenue/hr {sortBy === "rv" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-6 py-4 text-right hidden lg:table-cell">Inputs/hr</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-brand-600 transition-colors" onClick={() => toggleSort("vw")}>
                  Price {sortBy === "vw" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {filtered.map((r: any) => (
                <tr
                  key={r.id}
                  className={`hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group cursor-pointer ${selectedResId === r.id ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                  onClick={() => setSelectedResId(r.id)}
                >
                  <td className="px-6 py-4 font-bold text-surface-900 dark:text-white">{r.name}</td>
                  <td className="px-6 py-4 text-surface-500 dark:text-surface-400">{r.categoryName}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold ${r.marginPct > 0 ? "bg-econ-green/10 text-econ-green" : "bg-econ-red/10 text-econ-red"}`}>
                      {r.marginPct > 0 ? "+" : ""}{r.marginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-surface-900 dark:text-surface-100 tabular-nums">
                    {fmt(r.netProfitPerHour)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-surface-500 dark:text-surface-400 tabular-nums">
                    {fmt(r.revenuePerHour)}
                  </td>
                  <td className="px-6 py-4 text-right text-surface-400 font-mono hidden lg:table-cell tabular-nums">
                    {fmt(r.inputCostPerHour)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                    {r.outputVwap.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
             <div className="py-20 text-center text-surface-400 font-medium">
                No resources found matching your criteria
             </div>
          )}
        </div>
      </div>

      {/* Feature: Sourcing Intelligence */}
      {selectedResId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="card p-6">
              <h3 className="font-bold text-surface-900 dark:text-white mb-4 uppercase text-xs tracking-widest">Sourcing Dependency</h3>
              <div className="space-y-3">
                 {(() => {
                    const res = RESOURCES.find(r => r.id === selectedResId);
                    if (!res || !res.inputs) return <p className="text-sm text-surface-400 italic">No primary inputs required for this resource.</p>;
                    return Object.entries(res.inputs).map(([id, qty]) => {
                       const input = RESOURCES.find(r => r.id === Number(id));
                       const inputMargin = resources.find((r: any) => r.id === Number(id));
                       return (
                          <div key={id} className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{input?.name || `ID ${id}`}</span>
                                <span className="text-[10px] text-surface-400 uppercase">Req: {qty} units</span>
                             </div>
                             <div className="text-right">
                                <span className={`text-xs font-black font-mono ${inputMargin?.marginPct > 0 ? 'text-econ-green' : 'text-econ-red'}`}>
                                   {inputMargin ? `${inputMargin.marginPct.toFixed(1)}%` : '??'}
                                </span>
                                <p className="text-[8px] font-bold text-surface-400 uppercase">Input Margin</p>
                             </div>
                          </div>
                       )
                    });
                 })()}
              </div>
           </div>
           <div className="card p-6 flex flex-col justify-center items-center text-center bg-brand-600 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">Production Advice</p>
              <p className="text-lg font-black italic mb-2">
                 {resources.find((r: any) => r.id === selectedResId)?.marginPct > 10 ? 'STRATEGIC EXPANSION RECOMMENDED' : 'OPTIMIZE INPUT SOURCING'}
              </p>
              <p className="text-xs opacity-80 leading-relaxed max-w-xs">
                 Current market conditions favor {RESOURCES.find(r => r.id === selectedResId)?.name} {resources.find((r: any) => r.id === selectedResId)?.marginPct > 0 ? 'production' : 'outsourcing'}.
                 Analyze input margins to find vertical integration opportunities.
              </p>
           </div>
        </div>
      )}
    </div>
  );
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
