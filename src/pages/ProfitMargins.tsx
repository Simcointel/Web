import { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { RESOURCES } from "../data/simco_static";
import { BarChart3 } from "lucide-react";
import type { ProfitMarginsResponse, ProfitMarginResource } from "../types/api";

export function ProfitMarginsPage() {
  useEffect(() => { document.title = "Profit Matrix - SimcoIntel"; }, []);

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
      } catch { /* ignore */ }
    }
  }, [syncWithSuite]);

  const marginsData = data as ProfitMarginsResponse | undefined;
  const resources: ProfitMarginResource[] = marginsData?.resources ?? [];
  const categories = useMemo(() => [...new Set(resources.map(r => r.categoryName))].sort(), [resources]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = resources.map(r => {
      if (!localCalc) return r;
      const sr = RESOURCES.find(x => x.id === r.id);
      if (!sr || !sr.basePh || !sr.baseWages) return r;
      const isExtraction = ["O","M","Q"].includes(String(sr.buildingId));
      const isResearch = ["p","b","c","h","s","a","f","y"].includes(String(sr.buildingId));
      const effProdBonus = isResearch ? 0 : prodBonus;
      const effResBonus = isResearch ? resBonus : 0;
      let ph = sr.basePh * (1 + (effProdBonus + effResBonus) / 100);
      if (isExtraction) ph *= abundance / 100;
      // Wages = baseWage * buildingLevel (per game: linear with level)
      // Since we don't know the exact level per building, use the default API wages
      const wagesPh = sr.baseWages;
      const rev = ph * r.outputVwap;
      const cost = r.inputCostPerHour + wagesPh * (1 + adminOverhead / 100) + r.transportPerHour;
      const np = rev - cost;
      return { ...r, producedPerHour: ph, revenuePerHour: rev, netProfitPerHour: np, marginPct: rev > 0 ? (np / rev) * 100 : 0 };
    });
    if (category !== "all") list = list.filter(r => r.categoryName === category);
    if (search) list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.categoryName.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      const va = sortBy === "mg" ? a.marginPct : sortBy === "np" ? a.netProfitPerHour : sortBy === "rv" ? a.revenuePerHour : a.outputVwap;
      const vb = sortBy === "mg" ? b.marginPct : sortBy === "np" ? b.netProfitPerHour : sortBy === "rv" ? b.revenuePerHour : b.outputVwap;
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [resources, category, search, sortBy, sortDir, localCalc, prodBonus, adminOverhead, abundance, resBonus]);

  if (loading && !data) return <LoadingState text="Loading prices..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!loading && resources.length === 0) return <EmptyState message="No data available" />;

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-violet-600" /></div>
          <div><h1 className="text-lg font-bold">Profit Matrix (R{realm})</h1><p className="text-xs text-surface-400">Margin analysis & profitability ranking</p></div>
        </div>
        <select value={realm} onChange={e => setRealm(Number(e.target.value))} className="input w-auto"><option value={0}>R0</option><option value={1}>R1</option></select>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 text-center"><p className="text-xs font-bold text-surface-400 uppercase tracking-wider">Items</p><p className="text-xl font-bold">{resources.length}</p></div>
        <div className="card p-3 text-center"><p className="text-xs font-bold text-surface-400 uppercase tracking-wider">Profitable</p><p className="text-xl font-bold text-emerald-600">{resources.filter(r => r.marginPct > 0).length}</p></div>
        <div className="card p-3 text-center"><p className="text-xs font-bold text-surface-400 uppercase tracking-wider">Avg Margin</p><p className="text-xl font-bold">{(resources.reduce((s, r) => s + r.marginPct, 0) / (resources.length || 1)).toFixed(1)}%</p></div>
        <div className="card p-3 text-center"><p className="text-xs font-bold text-surface-400 uppercase tracking-wider">Top Margin</p><p className="text-xl font-bold text-brand-600">{Math.max(...resources.map(r => r.marginPct), 0).toFixed(1)}%</p></div>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 dark:border-surface-800 pb-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
              <input type="checkbox" checked={localCalc} onChange={e => setLocalCalc(e.target.checked)} className="accent-brand-500" />
              Overrides
            </label>
            {localCalc && <><label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-600"><input type="checkbox" checked={syncWithSuite} onChange={e => setSyncWithSuite(e.target.checked)} className="accent-brand-500" />Sync</label>
            <div className="flex flex-wrap gap-2">
              <InputNode label="PROD" val={prodBonus} set={setProdBonus} unit="%" disabled={syncWithSuite} />
              <InputNode label="AO" val={adminOverhead} set={setAdminOverhead} unit="%" disabled={syncWithSuite} />
              <InputNode label="ABUN" val={abundance} set={setAbundance} unit="%" disabled={syncWithSuite} />
              <InputNode label="RES" val={resBonus} set={setResBonus} unit="%" disabled={syncWithSuite} />
            </div></>}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="input w-44" />
            <select value={category} onChange={e => setCategory(e.target.value)} className="input w-auto">
              <option value="all">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900 text-[10px] font-bold uppercase text-surface-500 border-b border-surface-100 dark:border-surface-800">
                <th className="px-3 py-2.5 text-left">Resource</th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-brand-600" onClick={() => toggleSort("mg")}>Margin {sortBy === "mg" && (sortDir === "desc" ? "▼" : "▲")}</th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-brand-600" onClick={() => toggleSort("np")}>Profit/H {sortBy === "np" && (sortDir === "desc" ? "▼" : "▲")}</th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-brand-600" onClick={() => toggleSort("rv")}>Rev/H {sortBy === "rv" && (sortDir === "desc" ? "▼" : "▲")}</th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-brand-600" onClick={() => toggleSort("vw")}>VWAP {sortBy === "vw" && (sortDir === "desc" ? "▼" : "▲")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {filtered.map(r => (
                <tr key={r.id} className={`hover:bg-surface-50 dark:hover:bg-surface-900/50 cursor-pointer ${selectedResId === r.id ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`} onClick={() => setSelectedResId(r.id)}>
                  <td className="px-3 py-2 font-bold">{r.name}</td>
                  <td className={`px-3 py-2 text-right font-bold ${r.marginPct > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.marginPct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right font-bold">{fmt(r.netProfitPerHour)}</td>
                  <td className="px-3 py-2 text-right text-surface-400">{fmt(r.revenuePerHour)}</td>
                  <td className="px-3 py-2 text-right font-bold text-brand-600">{r.outputVwap.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedResId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-surface-400">Input Requirements</h3>
            <div className="space-y-2">
              {(() => {
                const res = RESOURCES.find(r => r.id === selectedResId);
                if (!res || !res.inputs) return <p className="text-xs text-surface-400 italic">No inputs required.</p>;
                return Object.entries(res.inputs).map(([id, qty]) => {
                  const input = RESOURCES.find(r => r.id === Number(id));
                  const im = resources.find(r => r.id === Number(id));
                  return <div key={id} className="flex justify-between items-center py-1.5 border-b border-surface-100 dark:border-surface-800 last:border-0"><span className="font-bold text-xs">{input?.name || `ID_${id}`}</span><div className="flex items-center gap-3"><span className="text-surface-400 text-xs">{qty} units</span><span className={`font-bold text-xs ${im && im.marginPct > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{im ? `${im.marginPct.toFixed(1)}%` : '--'}</span></div></div>;
                });
              })()}
            </div>
          </div>
          <div className="card p-4 bg-surface-50 dark:bg-surface-900 flex flex-col justify-center space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-surface-400">Advice</h3>
            <p className="text-lg font-bold">{(resources.find(r => r.id === selectedResId)?.marginPct ?? 0) > 5 ? 'Expand production capacity.' : 'Sourcing from market may be more efficient.'}</p>
            <p className="text-xs text-surface-400">Resource ID: {selectedResId}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="card p-3 text-center"><p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">{label}</p><p className="text-xl font-bold">{value}</p></div>;
}

function InputNode({ label, val, set, unit, disabled }: { label: string; val: number; set: (v: number) => void; unit: string; disabled: boolean }) {
  return <div className="flex items-center gap-1"><span className="text-xs font-bold text-surface-500">{label}</span><div className={`flex items-center border border-surface-300 rounded px-1.5 py-0.5 ${disabled ? 'opacity-50' : ''}`}><input type="number" value={val} onChange={e => !disabled && set(Number(e.target.value))} disabled={disabled} className="w-10 bg-transparent text-xs font-bold text-right outline-none" /><span className="text-xs text-surface-400">{unit}</span></div></div>;
}

function fmt(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}
