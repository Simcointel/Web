import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";

export function ProfitMarginsPage() {
  const [realm, setRealm] = useState(0);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"mg" | "np" | "rv" | "vw">("mg");
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);

  const resources = data?.resources ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) set.add(r.categoryName);
    return [...set].sort();
  }, [resources]);

  const filtered = useMemo(() => {
    let list = resources;
    if (category !== "all") list = list.filter((r: any) => r.categoryName === category);
    if (search) list = list.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a: any, b: any) => {
      if (sortBy === "mg") return b.marginPct - a.marginPct;
      if (sortBy === "np") return b.netProfitPerHour - a.netProfitPerHour;
      if (sortBy === "rv") return b.revenuePerHour - a.revenuePerHour;
      if (sortBy === "vw") return b.outputVwap - a.outputVwap;
      return 0;
    });
    return list;
  }, [resources, category, search, sortBy]);

  const profitable = resources.filter((r: any) => r.marginPct > 0);
  const lossMaking = resources.filter((r: any) => r.marginPct <= 0);
  const avgMargin = resources.length > 0 ? resources.reduce((s: number, r: any) => s + r.marginPct, 0) / resources.length : 0;
  const topMargin = profitable.length > 0 ? Math.max(...profitable.map((r: any) => r.marginPct)) : 0;
  const topProfit = resources.length > 0 ? Math.max(...resources.map((r: any) => r.netProfitPerHour)) : 0;

  if (loading && !data) return <LoadingState text="Loading profit margins..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (resources.length === 0) return <EmptyState message="No profit margin data available" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Profit Margins</h1>
          <p className="text-sm text-gray-500 mt-0.5">Per-resource profitability based on current market prices</p>
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

      <CardGrid cols={4}>
        <StatCard title="Resources Tracked" value={resources.length} color="border-l-blue-500" />
        <StatCard title="Profitable" value={profitable.length} subtitle={`${resources.length > 0 ? ((profitable.length / resources.length) * 100).toFixed(0) : 0}% of total`} color="border-l-green-500" />
        <StatCard title="Avg Margin" value={avgMargin > 0 ? `+${avgMargin.toFixed(1)}%` : `${avgMargin.toFixed(1)}%`} color="border-l-purple-500" />
        <StatCard title="Best Margin" value={topMargin > 0 ? `+${topMargin.toFixed(1)}%` : `${topMargin.toFixed(1)}%`} subtitle={`Best profit/hr: ${fmt(topProfit)}`} color="border-l-emerald-500" />
      </CardGrid>

      <Section title="All Resources" subtitle={`${filtered.length} resources — sorted by margin`}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 w-48"
          />
          <span className="text-xs text-gray-400 ml-auto">
            Sort:
            <button onClick={() => setSortBy("mg")} className={`ml-1 px-2 py-0.5 rounded ${sortBy === "mg" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>Margin</button>
            <button onClick={() => setSortBy("np")} className={`ml-1 px-2 py-0.5 rounded ${sortBy === "np" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>Profit/hr</button>
            <button onClick={() => setSortBy("rv")} className={`ml-1 px-2 py-0.5 rounded ${sortBy === "rv" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>Revenue/hr</button>
            <button onClick={() => setSortBy("vw")} className={`ml-1 px-2 py-0.5 rounded ${sortBy === "vw" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>Price</button>
          </span>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Resource</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Margin</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Δ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Trend</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Proj.</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Profit/hr</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Revenue/hr</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Inputs/hr</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Wages</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Transport</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wider">Output Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.categoryName}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-mono font-medium ${r.marginPct > 0 ? "text-green-600" : r.marginPct < 0 ? "text-red-600" : "text-gray-500"}`}>
                        {r.marginPct > 0 ? "+" : ""}{r.marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.marginDelta != null ? (
                        <span className={`font-mono text-xs ${r.marginDirection === "up" ? "text-green-500" : r.marginDirection === "down" ? "text-red-500" : "text-gray-400"}`}>
                          {r.marginDelta > 0 ? "+" : ""}{r.marginDelta.toFixed(1)}pp
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.trendDirection ? (
                        <span className={`text-xs font-medium ${r.trendDirection === "improving" ? "text-green-500" : r.trendDirection === "declining" ? "text-red-500" : "text-gray-400"}`}>
                          {r.trendDirection === "improving" ? "\u2191" : r.trendDirection === "declining" ? "\u2193" : "\u2192"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {r.forecastMargin != null ? (
                        <span className={`font-mono text-xs ${r.forecastMargin > r.marginPct + 0.5 ? "text-green-500" : r.forecastMargin < r.marginPct - 0.5 ? "text-red-500" : "text-gray-400"}`}>
                          {r.forecastMargin > 0 ? "+" : ""}{r.forecastMargin.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${r.netProfitPerHour > 0 ? "text-green-600" : r.netProfitPerHour < 0 ? "text-red-500" : "text-gray-500"}`}>
                      {r.netProfitPerHour > 0 ? "+" : ""}{fmt(r.netProfitPerHour)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">{fmt(r.revenuePerHour)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500 whitespace-nowrap">{fmt(r.inputCostPerHour)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500 whitespace-nowrap">{fmt(r.wagesPerHour)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500 whitespace-nowrap">{fmt(r.transportPerHour)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500 whitespace-nowrap">{r.outputVwap.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}
