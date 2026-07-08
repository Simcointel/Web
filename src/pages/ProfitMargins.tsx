import { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { RESOURCES } from "../data/simco_static";
import type { ProfitMarginsResponse, ProfitMarginResource } from "../types/api";

export function ProfitMarginsPage() {
  useEffect(() => {
    document.title = "Profit Matrix - SimcoIntel";
  }, []);

  const [realm, setRealm] = useSharedRealm();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"mg" | "np" | "rv" | "vw">("mg");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);

  const [localCalc, setLocalCalc] = useState(false);
  const [syncWithSuite, setSyncWithSuite] = useState(true);
  const [prodBonus, setProdBonus] = useState(12);
  const [adminOverhead, setAdminOverhead] = useState(0);
  const [abundance, setAbundance] = useState(100);
  const [resBonus, setResBonus] = useState(0);

  const [selectedResId, setSelectedResId] = useState<number | null>(null);

  // Sync with Corporate Suite
  useMemo(() => {
    if (!syncWithSuite) return;
    const saved = localStorage.getItem("simco_suite_metrics");
    if (saved) {
      try {
        const metrics = JSON.parse(saved);
        if (metrics) setProdBonus(metrics.prodBonus ?? 12);
        setAdminOverhead((metrics.actualAO ?? 0) * 100);
        setAbundance(metrics.abundance ?? 100);
        setResBonus(metrics.researchBonus ?? 0);
      } catch {
        // ignore parse errors
      }
    }
  }, [syncWithSuite]);
  const marginsData = data as ProfitMarginsResponse | undefined;
  const resources: ProfitMarginResource[] = marginsData?.resources ?? [];
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
    let list = resources.map((r) => {
      if (!localCalc) return r;

      const staticRes = RESOURCES.find(sr => sr.id === r.id);
      if (!staticRes || !staticRes.basePh || !staticRes.baseWages) return r;

      const isExtraction = ["O", "M", "Q"].includes(String(staticRes.buildingId));
      const isResearch = ["p", "b", "c", "h", "s", "a", "f", "y"].includes(String(staticRes.buildingId));

      const effProdBonus = isResearch ? 0 : prodBonus;
      const effResBonus = isResearch ? resBonus : 0;

      let unitsPh = staticRes.basePh * (1 + (effProdBonus + effResBonus) / 100);
      if (isExtraction) unitsPh *= (abundance / 100);

      const wagesPh = staticRes.baseWages * (1 + adminOverhead / 100);

      const totalCostPh = r.inputCostPerHour + wagesPh + r.transportPerHour;
      const revenuePh = unitsPh * r.outputVwap;
      const netProfitPh = revenuePh - totalCostPh;
      const marginPct = (netProfitPh / revenuePh) * 100;

      return {
        ...r,
        producedPerHour: unitsPh,
        revenuePerHour: revenuePh,
        netProfitPerHour: netProfitPh,
        marginPct: marginPct,
      };
    });

    if (category !== "all") list = list.filter((r) => r.categoryName === category);
    if (search) list = list.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.categoryName.toLowerCase().includes(search.toLowerCase()));

    list = [...list].sort((a, b) => {
      let valA, valB;
      if (sortBy === "mg") { valA = a.marginPct; valB = b.marginPct; }
      else if (sortBy === "np") { valA = a.netProfitPerHour; valB = b.netProfitPerHour; }
      else if (sortBy === "rv") { valA = a.revenuePerHour; valB = b.revenuePerHour; }
      else { valA = a.outputVwap; valB = b.outputVwap; }

      return sortDir === "desc" ? valB - valA : valA - valB;
    });
    return list;
  }, [resources, category, search, sortBy, sortDir, localCalc, prodBonus, adminOverhead, abundance, resBonus]);

  const status = useMemo(() => {
    if (loading && !data) return <LoadingState text="SYNC_PRICES..." />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    if (!loading && resources.length === 0) return <EmptyState message="NO_DATA_AVAILABLE" />;
    return null;
  }, [loading, data, error, refresh, resources.length]);

  if (status) return status;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-lg font-bold">Profit Matrix (R{realm})</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-medium px-3 py-1.5 rounded outline-none"
          >
            <option value={0}>R0</option>
            <option value={1}>R1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <SmallMetric label="Items" value={resources.length} />
         <SmallMetric label="Profit" value={resources.filter((r) => r.marginPct > 0).length} />
         <SmallMetric label="Avg Margin" value={`${(resources.reduce((s, r) => s + r.marginPct, 0) / (resources.length || 1)).toFixed(1)}%`} />
         <SmallMetric label="Top Margin" value={`${Math.max(...resources.map((r) => r.marginPct), 0).toFixed(1)}%`} />
      </div>

      <div className="card !shadow-none !border-surface-200 dark:!border-surface-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
           <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localCalc}
                  onChange={(e) => setLocalCalc(e.target.checked)}
                  className="w-4 h-4 accent-brand-500 rounded"
                />
                <span className="text-sm font-semibold">Local Overrides</span>
              </label>

              {localCalc && (
                 <label className="flex items-center gap-2 cursor-pointer pl-4 border-l border-surface-200 dark:border-surface-800">
                    <input
                      type="checkbox"
                      checked={syncWithSuite}
                      onChange={(e) => setSyncWithSuite(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded"
                    />
                    <span className="text-sm font-semibold text-brand-600">Sync with Corporate Suite</span>
                 </label>
              )}
           </div>

           {localCalc && (
              <div className="flex flex-wrap items-center gap-4">
                 <InputNode label="PROD" val={prodBonus} set={setProdBonus} unit="%" disabled={syncWithSuite} />
                 <InputNode label="AO" val={adminOverhead} set={setAdminOverhead} unit="%" disabled={syncWithSuite} />
                 <InputNode label="ABUN" val={abundance} set={setAbundance} unit="%" disabled={syncWithSuite} />
                 <InputNode label="RES" val={resBonus} set={setResBonus} unit="%" disabled={syncWithSuite} />
              </div>
           )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm rounded focus:ring-1 focus:ring-brand-500 outline-none w-64"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm rounded focus:ring-1 focus:ring-brand-500 outline-none"
            >
              <option value="all">ALL_CATEGORIES</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-surface-100 dark:border-surface-800 rounded">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900 text-xs font-bold uppercase text-surface-500 border-b border-surface-100 dark:border-surface-800">
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-brand-500" onClick={() => toggleSort("mg")}>
                  Margin {sortBy === "mg" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-brand-500" onClick={() => toggleSort("np")}>
                  Profit/H {sortBy === "np" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-brand-500" onClick={() => toggleSort("rv")}>
                  Rev/H {sortBy === "rv" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-brand-500" onClick={() => toggleSort("vw")}>
                  VWAP {sortBy === "vw" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer ${selectedResId === r.id ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                  onClick={() => setSelectedResId(r.id)}
                >
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`font-bold ${r.marginPct > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {r.marginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-bold">{fmt(r.netProfitPerHour)}</td>
                  <td className="px-4 py-2 text-right text-surface-400">{fmt(r.revenuePerHour)}</td>
                  <td className="px-4 py-2 text-right font-medium text-brand-600">{r.outputVwap.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedResId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="card p-6 border-surface-200 dark:border-surface-800">
              <h3 className="text-sm font-bold text-surface-500 mb-4">Input Requirements</h3>
              <div className="space-y-3">
                 {(() => {
                    const res = RESOURCES.find(r => r.id === selectedResId);
                    if (!res || !res.inputs) return <p className="text-sm text-surface-400 italic">No inputs required for this resource.</p>;
                    return Object.entries(res.inputs).map(([id, qty]) => {
                       const input = RESOURCES.find(r => r.id === Number(id));
                       const inputMargin = resources.find((r) => r.id === Number(id));
                       return (
                          <div key={id} className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800 last:border-0">
                             <span className="font-medium">{input?.name || `ID_${id}`}</span>
                             <div className="flex items-center gap-4">
                                <span className="text-surface-400 text-xs">{qty} Units</span>
                                <span className={`font-bold text-xs ${inputMargin && inputMargin.marginPct > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                   {inputMargin ? `${inputMargin.marginPct.toFixed(1)}%` : '--'}
                                </span>
                             </div>
                          </div>
                       )
                    });
                 })()}
              </div>
           </div>
           <div className="card p-6 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-surface-500 mb-2">Operational Advice</h3>
              <p className="text-lg font-bold leading-tight">
                 {(resources.find((r) => r.id === selectedResId)?.marginPct ?? 0) > 5
                   ? 'Recommended: Expand production capacity.'
                   : 'Notice: Sourcing from market may be more efficient.'}
              </p>
              <p className="text-xs text-surface-400 mt-2 font-medium">Resource Database Index: {selectedResId}</p>
           </div>
        </div>
      )}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string | number }) {
   return (
      <div className="card p-4 text-center border-surface-100 dark:border-surface-800">
         <p className="text-xs font-semibold text-surface-500 mb-1">{label}</p>
         <p className="text-xl font-bold">{value}</p>
      </div>
   );
}

function InputNode({ label, val, set, unit, disabled }: { label: string; val: number; set: (v: number) => void; unit: string; disabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
       <span className="text-xs font-bold text-surface-500">{label}</span>
       <div className={`flex items-center bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-md px-2 py-1 ${disabled ? 'opacity-50 bg-surface-50' : 'focus-within:ring-1 focus-within:ring-brand-500'}`}>
          <input
            type="number"
            value={val}
            onChange={(e) => !disabled && set(Number(e.target.value))}
            disabled={disabled}
            className="w-12 bg-transparent text-sm font-bold text-right outline-none appearance-none"
          />
          <span className="text-xs font-medium text-surface-400 ml-1">{unit}</span>
       </div>
    </div>
  )
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
