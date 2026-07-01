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
        setProdBonus(metrics.prodBonus ?? 12);
        setAdminOverhead((metrics.actualAO ?? 0) * 100);
        setAbundance(metrics.abundance ?? 100);
        setResBonus(metrics.researchBonus ?? 0);
      } catch (e) {
        console.error("Suite sync failed", e);
      }
    }
  }, [syncWithSuite]);
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
    let list = resources.map((r: any) => {
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
      const inputCostPh = r.inputCostPerHour; // Keep original input cost for simplicity or calculate from VWAPs

      const totalCostPh = inputCostPh + wagesPh + r.transportPerHour;
      const revenuePh = unitsPh * r.outputVwap;
      const netProfitPh = revenuePh - totalCostPh;
      const marginPct = (netProfitPh / revenuePh) * 100;

      return {
        ...r,
        producedPerHour: unitsPh,
        revenuePerHour: revenuePh,
        netProfitPerHour: netProfitPh,
        marginPct: marginPct
      };
    });

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
  }, [resources, category, search, sortBy, sortDir, localCalc, prodBonus, adminOverhead, abundance, resBonus]);

  const status = useMemo(() => {
    if (loading && !data) return <LoadingState text="SYNC_PRICES..." />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    if (!loading && resources.length === 0) return <EmptyState message="NO_DATA_AVAILABLE" />;
    return null;
  }, [loading, data, error, refresh, resources.length]);

  if (status) return status;

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

      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-surface-50 dark:border-surface-800 pb-2">
           <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localCalc}
                onChange={(e) => setLocalCalc(e.target.checked)}
                className="w-3 h-3 accent-brand-500"
              />
              <span className="font-black uppercase tracking-widest text-[8px] text-surface-400">Local_Calculations_Override</span>
           </div>
           {localCalc && (
              <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2 mr-2 border-r border-surface-100 dark:border-surface-800 pr-4">
                    <input
                      type="checkbox"
                      checked={syncWithSuite}
                      onChange={(e) => setSyncWithSuite(e.target.checked)}
                      className="w-3 h-3 accent-brand-500"
                    />
                    <span className="font-black uppercase tracking-widest text-[8px] text-brand-500">Sync_Suite</span>
                 </div>
                 <InputNode label="PROD" val={prodBonus} set={setProdBonus} unit="%" disabled={syncWithSuite} />
                 <InputNode label="AO" val={adminOverhead} set={setAdminOverhead} unit="%" disabled={syncWithSuite} />
                 <InputNode label="ABUN" val={abundance} set={setAbundance} unit="%" disabled={syncWithSuite} />
                 <InputNode label="RES" val={resBonus} set={setResBonus} unit="%" disabled={syncWithSuite} />
              </div>
           )}
        </div>

        <div className="p-1 flex flex-wrap items-center justify-between gap-2">
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

function InputNode({ label, val, set, unit, disabled }: any) {
  return (
    <div className="flex items-center gap-1.5">
       <span className="text-[8px] font-black text-surface-400 uppercase">{label}</span>
       <div className={`flex items-center bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded px-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="number"
            value={val}
            onChange={(e) => !disabled && set(Number(e.target.value))}
            disabled={disabled}
            className="w-8 bg-transparent text-[9px] font-black text-right outline-none py-0.5 appearance-none"
          />
          <span className="text-[8px] font-bold opacity-30 ml-0.5">{unit}</span>
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
