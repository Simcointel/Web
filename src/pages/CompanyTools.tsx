import React, { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, CONSTRUCTION_MATERIALS } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { Section, CardGrid, Tooltip } from "../components/Layout";
import { LoadingState } from "../components/States";

type StatementType = "overview" | "income" | "cashflow" | "receipts" | "balance" | "calculators" | "board";

interface CSVData {
  id: string;
  name: string;
  date: string;
  type: string;
  content: string;
}

export function CompanyToolsPage() {
  const [activeTab, setActiveTab] = useState<StatementType>("overview");
  const [realm, setRealm] = useState(0);
  const [savedData, setSavedData] = useState<CSVData[]>(() => {
    const saved = localStorage.getItem("simco_company_data");
    return saved ? JSON.parse(saved) : [];
  });

  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);

  useEffect(() => {
    localStorage.setItem("simco_company_data", JSON.stringify(savedData));
  }, [savedData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newData: CSVData = {
        id: crypto.randomUUID(),
        name: file.name,
        date: new Date().toISOString(),
        type,
        content
      };
      setSavedData(prev => [newData, ...prev]);
    };
    reader.readAsText(file);
  };

  const deleteData = (id: string) => {
    setSavedData(prev => prev.filter(d => d.id !== id));
  };

  const downloadCombinedCSV = () => {
    if (savedData.length === 0) return;
    const combined = savedData.map(d => `--- ${d.type.toUpperCase()}: ${d.name} (${d.date}) ---\n${d.content}\n`).join("\n");
    const blob = new Blob([combined], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combined_financials_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div>
          <h2 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">Company Suite</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 max-w-xl leading-relaxed">
            Professional intelligence suite for financial management and production optimization.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <select
              value={realm}
              onChange={(e) => setRealm(Number(e.target.value))}
              className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-brand-500 dark:text-white uppercase tracking-wider"
            >
              <option value={0}>Realm 0</option>
              <option value={1}>Realm 1</option>
            </select>
           <button onClick={downloadCombinedCSV} className="btn btn-primary gap-2 shadow-lg shadow-brand-600/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Archive
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
        {(["overview", "income", "cashflow", "receipts", "balance", "calculators", "board"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap
              ${activeTab === tab
                ? "bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}
            `}
          >
            {tab === "overview" ? "Overview" :
             tab === "income" ? "Income" :
             tab === "cashflow" ? "Cash Flow" :
             tab === "receipts" ? "Receipts" :
             tab === "balance" ? "Balance" :
             tab === "calculators" ? "Calculators" : "Board"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewView savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />}
      {activeTab === "calculators" && <CalculatorsView margins={margins?.resources ?? []} loading={mLoading} realm={realm} />}
      {activeTab === "board" && <BoardImpactView />}
      {(activeTab === "income" || activeTab === "cashflow" || activeTab === "receipts" || activeTab === "balance") && (
         <FinancialsView type={activeTab} savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />
      )}
    </div>
  );
}

function OverviewView({ savedData, deleteData, handleFileUpload }: any) {
   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <CardGrid cols={2}>
               <div className="card p-6 border-l-4 border-l-brand-600">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Financial Records</h3>
                  <div className="text-4xl font-black mb-1 text-surface-900 dark:text-white">{savedData.length}</div>
                  <p className="text-xs text-surface-500">CSV files stored in local cache.</p>
               </div>
               <div className="card p-6 border-l-4 border-l-econ-green">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Data Privacy</h3>
                  <div className="text-xl font-black mb-1 text-surface-900 dark:text-white">Local-First</div>
                  <p className="text-xs text-surface-500">Analytics processed entirely on your device.</p>
               </div>
            </CardGrid>

            <div className="card overflow-hidden">
               <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
                  <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest">Recent Activity</h3>
               </div>
               <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {savedData.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 uppercase text-[10px] font-bold">
                             {d.type.slice(0, 3)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</p>
                             <p className="text-[10px] text-surface-400">{new Date(d.date).toLocaleString()}</p>
                          </div>
                       </div>
                       <button onClick={() => deleteData(d.id)} className="text-surface-400 hover:text-econ-red transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  ))}
                  {savedData.length === 0 && <div className="p-20 text-center text-surface-400 text-xs italic">No activity yet. Upload a CSV to begin.</div>}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4 space-y-6">
            <div className="card p-6 border-2 border-dashed border-surface-200 dark:border-surface-800 text-center bg-surface-50/50 dark:bg-surface-900/50">
               <h3 className="font-bold text-sm mb-4 uppercase tracking-tight">Quick Import</h3>
               <input type="file" id="quick-upload" className="hidden" onChange={(e) => handleFileUpload(e, "income")} />
               <label htmlFor="quick-upload" className="btn btn-primary w-full cursor-pointer">Select CSV File</label>
               <p className="text-[10px] text-surface-500 mt-2 uppercase font-bold tracking-tighter">Automatic category detection coming soon</p>
            </div>
         </div>
      </div>
   );
}

function FinancialsView({ type, savedData, deleteData, handleFileUpload }: any) {
  const filteredData = savedData.filter((d: any) => d.type === type);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4">
         <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-widest text-surface-400 mb-4">Add {type} Record</h3>
            <label className="btn btn-primary w-full cursor-pointer">
               Upload daily CSV
               <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, type)} className="hidden" />
            </label>
            <p className="text-[10px] text-surface-500 mt-4 leading-relaxed">
               Export your data from SimCompanies settings and drop it here for local analysis.
            </p>
         </div>
      </div>
      <div className="lg:col-span-8">
         <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
               <h3 className="font-bold text-xs uppercase tracking-widest text-surface-900 dark:text-white">{type} History</h3>
               <span className="text-[10px] font-bold text-surface-400 uppercase">{filteredData.length} Records</span>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
               {filteredData.length > 0 ? filteredData.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                     <div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-surface-400 font-mono uppercase tracking-tighter">{new Date(d.date).toLocaleString()}</p>
                     </div>
                     <button onClick={() => deleteData(d.id)} className="text-surface-400 hover:text-econ-red transition-opacity opacity-0 group-hover:opacity-100 p-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     </button>
                  </div>
               )) : (
                  <div className="p-20 text-center text-surface-400 text-xs italic">No data records found for this category.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function CalculatorsView({ margins, loading, realm }: { margins: any[]; loading: boolean; realm: number }) {
  const [activeCalc, setActiveCalc] = useState<"production" | "construction" | "retail">("production");
  const [selectedBuilding, setSelectedBuilding] = useState<number>(1);
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [qty, setQty] = useState<number>(100);
  const [adminCost, setAdminCost] = useState<number>(10);
  const { data: deps } = useDataRepoPoll(() => dataRepo.fetchDependencies(realm), 120000, [realm]);

  const res = useMemo(() => margins.find(m => m.id === Number(selectedResource)), [margins, selectedResource]);

  const resourceDeps = useMemo(() => {
    if (!res || !deps?.bottleneckChains) return [];
    return deps.bottleneckChains.filter((c: any) => c.sectors.includes(res.categoryName));
  }, [res, deps]);

  return (
    <div className="space-y-8">
      <div className="flex gap-4 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
        {["production", "construction", "retail"].map((c: any) => (
           <button key={c} onClick={() => setActiveCalc(c)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCalc === c ? "bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"}`}>
              {c}
           </button>
        ))}
      </div>

    {activeCalc === "production" && (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm">
             <h3 className="font-bold text-surface-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Production Config</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">Building Type</label>
                   <select value={selectedBuilding} onChange={(e) => {
                      setSelectedBuilding(Number(e.target.value));
                      setSelectedResource("");
                   }} className="input">
                      {BUILDINGS.filter(b => b.type === "production").map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1.5 block">Resource</label>
                   <select
                      value={selectedResource}
                      onChange={(e) => setSelectedResource(e.target.value)}
                      className="input"
                   >
                      <option value="">-- select --</option>
                      {BUILDINGS.find(b => b.id === selectedBuilding)?.produces?.map(pid => {
                         const m = margins.find(rm => rm.id === pid);
                         return m ? <option key={m.id} value={m.id}>{m.name}</option> : null;
                      })}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1.5 block">Produced / Hour</label>
                   <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="input font-mono" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1.5 block">Admin Overhead (%)</label>
                   <input type="number" value={adminCost} onChange={(e) => setAdminCost(Number(e.target.value))} className="input font-mono" />
                </div>
             </div>
          </div>

          {res && (
            <div className="card p-6 bg-brand-600 text-white border-none shadow-xl shadow-brand-600/20">
               <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest opacity-80">Real-time Market</h3>
               <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                     <span className="text-xs">Market VWAP</span>
                     <span className="font-mono font-bold text-lg">${res.outputVwap.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs">Benchmark Margin</span>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-white/20`}>
                        {res.marginPct.toFixed(1)}%
                     </span>
                  </div>
               </div>
            </div>
          )}

          {resourceDeps.length > 0 && (
            <div className="card p-6 border-l-4 border-l-econ-amber bg-econ-amber/5">
               <h3 className="font-bold text-econ-amber text-[10px] uppercase tracking-widest mb-4">Supply Pressures</h3>
               <div className="space-y-3">
                  {resourceDeps.map((d: any, i: number) => (
                    <div key={i} className="text-xs">
                       <p className="font-bold text-surface-900 dark:text-white mb-1">{d.chain}</p>
                       <p className="text-surface-500 dark:text-surface-400">Pressure Index: <span className="font-mono font-bold text-econ-amber">{d.pressure.toFixed(2)}</span></p>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>

       <div className="lg:col-span-8">
          {res ? (
             <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
                   <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest tracking-tight">Financial Projection: {res.name}</h3>
                   <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded text-[10px] font-black uppercase tracking-tighter">Live Estimate</span>
                </div>
                <div className="p-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                      <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                         <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Hourly Revenue</p>
                         <div className="text-2xl font-black text-surface-900 dark:text-white font-mono tracking-tighter">${(res.outputVwap * qty).toFixed(2)}</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                         <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Operating Costs</p>
                         <div className="text-2xl font-black text-econ-red font-mono tracking-tighter">${((res.inputCostPerHour + res.wagesPerHour + res.transportPerHour) * (qty/res.producedPerHour) * (1 + adminCost/100)).toFixed(2)}</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50">
                         <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase mb-1">Hourly Profit</p>
                         <div className="text-2xl font-black text-econ-green font-mono tracking-tighter">${((res.outputVwap * qty) - ((res.inputCostPerHour + res.wagesPerHour + res.transportPerHour) * (qty/res.producedPerHour) * (1 + adminCost/100))).toFixed(2)}</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                         <Tooltip text="Profit Per Hour Per Level. Calculation: ((Price * Hourly_Produced) - Total_Base_Costs) * (1 - Admin_OH%)">
                           <p className="text-[10px] font-bold text-surface-400 uppercase mb-1 cursor-help underline decoration-dotted">PPHPL</p>
                         </Tooltip>
                         <div className="text-2xl font-black text-surface-900 dark:text-white font-mono tracking-tighter">${(((res.outputVwap * res.producedPerHour) - (res.inputCostPerHour + res.wagesPerHour + res.transportPerHour)) * (1 - adminCost/100)).toFixed(2)}</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                            <span className="text-[10px] font-bold text-surface-500 uppercase">Input Materials</span>
                            <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">${(res.inputCostPerHour * (qty/res.producedPerHour)).toFixed(2)}</span>
                         </div>
                         <div className="flex items-center justify-between p-4 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                            <span className="text-[10px] font-bold text-surface-500 uppercase">Labor Costs</span>
                            <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">${(res.wagesPerHour * (qty/res.producedPerHour)).toFixed(2)}</span>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                            <span className="text-[10px] font-bold text-surface-500 uppercase">Transport Logistics</span>
                            <span className="font-mono text-sm font-bold text-surface-900 dark:text-white">${(res.transportPerHour * (qty/res.producedPerHour)).toFixed(2)}</span>
                         </div>
                         <div className="flex items-center justify-between p-4 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900">
                            <span className="text-[10px] font-bold text-surface-500 uppercase">Admin Fee Effect</span>
                            <span className="font-mono text-sm font-bold text-econ-red">${(((res.inputCostPerHour + res.wagesPerHour + res.transportPerHour) * (qty/res.producedPerHour)) * (adminCost/100)).toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <div className="card h-full min-h-[400px] flex flex-col items-center justify-center p-20 text-center border-dashed border-2 border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-950/30">
                <h3 className="text-xl font-black text-surface-900 dark:text-white mb-2 uppercase tracking-tight opacity-50">Calculator Idle</h3>
                <p className="text-xs text-surface-400 max-w-xs leading-relaxed uppercase font-bold tracking-tighter">Configure target resource and building parameters to begin profitability simulation.</p>
             </div>
          )}
       </div>
    </div>
    )}

    {activeCalc === "construction" && <ConstructionCalculator margins={margins} />}
    {activeCalc === "retail" && <RetailCalculator realm={realm} />}
    </div>
  );
}

function ConstructionCalculator({ margins }: { margins: any[] }) {
  const [selectedBuilding, setSelectedBuilding] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [targetLevel, setTargetLevel] = useState<number>(1);
  const [manualPrices, setManualPrices] = useState<Record<number, number>>({});

  const b = useMemo(() => BUILDINGS.find(b => b.id === selectedBuilding), [selectedBuilding]);

  const getMaterialPrice = (id: number) => {
    if (manualPrices[id] !== undefined) return manualPrices[id];
    const mName = CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.name;
    const real = margins.find(m => m.name === mName);
    return real?.outputVwap ?? CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.basePrice ?? 0;
  };

  const cost = useMemo(() => {
    if (!b) return { cash: 0, materials: [] as any[] };
    let totalCash = 0;
    const materialMap = new Map<number, number>();

    for (let l = currentLevel + 1; l <= targetLevel; l++) {
       const mult = l <= 2 ? 1 : l - 1;
       totalCash += b.cost * mult;
       const materials = (b as any).resources || [];
       materials.forEach((r: any) => {
         materialMap.set(r.id, (materialMap.get(r.id) || 0) + (r.qty * mult));
       });
    }

    return {
      cash: totalCash,
      materials: Array.from(materialMap.entries()).map(([id, qty]) => ({
        id,
        qty,
        name: CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.name || "Unknown",
        price: getMaterialPrice(id)
      }))
    };
  }, [b, currentLevel, targetLevel, margins]);

  const totalMarketValue = cost.materials.reduce((sum, m) => sum + (m.qty * m.price), 0) + cost.cash;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-l-4 border-l-econ-amber bg-white dark:bg-surface-900 shadow-sm">
             <h3 className="font-bold text-surface-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-surface-400">Expansion Config</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">Building</label>
                   <select value={selectedBuilding} onChange={(e) => setSelectedBuilding(Number(e.target.value))} className="input">
                      {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">From Level</label>
                      <input type="number" value={currentLevel} onChange={(e) => setCurrentLevel(Number(e.target.value))} className="input" />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">To Level</label>
                      <input type="number" value={targetLevel} onChange={(e) => setTargetLevel(Number(e.target.value))} className="input" />
                   </div>
                </div>
             </div>
          </div>
          <div className="card p-6 bg-surface-900 text-white border-none shadow-xl">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Mechanics Note</h4>
             <p className="text-xs leading-relaxed opacity-80">
                Upgrading to level 2 costs the same as level 1. From level 3 onwards, costs increase by the base Level 1 amount per level.
             </p>
             <div className="mt-4 pt-4 border-t border-surface-800">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-surface-500">
                   <span>Scrap Value</span>
                   <span className="text-white">${((targetLevel * (b?.cost || 0))).toLocaleString()}</span>
                </div>
             </div>
          </div>
       </div>
       <div className="lg:col-span-8">
          <div className="card p-8">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest">Upgrade Logistics</h3>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Total Market Value</p>
                   <p className="text-3xl font-black text-brand-600 font-mono tracking-tighter">${totalMarketValue.toLocaleString()}</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-econ-green"></div>
                      <span className="text-sm font-bold uppercase text-surface-900 dark:text-white">Construction Cash</span>
                   </div>
                   <span className="font-mono font-bold text-surface-900 dark:text-white tracking-tight">${cost.cash.toLocaleString()}</span>
                </div>
                {cost.materials.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800">
                     <div className="space-y-1">
                        <span className="text-sm font-bold uppercase text-surface-700 dark:text-surface-300">{m.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-surface-400 uppercase font-bold">Price:</span>
                           <input
                              type="number"
                              value={m.price}
                              onChange={(e) => setManualPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))}
                              className="bg-transparent border-b border-surface-200 dark:border-surface-700 text-[10px] font-mono w-20 focus:outline-none focus:border-brand-500"
                           />
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-mono font-bold text-surface-900 dark:text-white">{m.qty.toLocaleString()}</p>
                        <p className="text-[10px] text-surface-400 font-mono tracking-tighter">${(m.qty * m.price).toLocaleString()}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

function RetailCalculator({ realm }: { realm: number }) {
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const products = useMemo(() => {
    if (!retail?.retail) return [];
    return Object.entries(retail.retail).map(([k, v]: [string, any]) => ({ id: k, ...v }));
  }, [retail]);

  const p = useMemo(() => products.find(p => p.id === selectedProduct), [products, selectedProduct]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-l-4 border-l-econ-purple bg-white dark:bg-surface-900 shadow-sm">
             <h3 className="font-bold text-surface-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-surface-400">Inventory Select</h3>
             <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="input">
                <option value="">-- select product --</option>
                {products.map(pr => <option key={pr.id} value={pr.id}>{pr.id}</option>)}
             </select>
          </div>
          <div className="card p-6 bg-surface-50 dark:bg-surface-900/50">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Retail Mastery</h4>
             <p className="text-xs text-surface-500 leading-relaxed italic">
                \"Optimization in retail depends on balancing volume against saturation. High saturation requires lower pricing to maintain speed.\"
             </p>
          </div>
       </div>
       <div className="lg:col-span-8">
          {p ? (
            <div className="card p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest">Market Analysis: {p.id}</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                     <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Avg Sale Price</p>
                     <p className="text-2xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">${p.avgPrice?.toFixed(2)}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                     <p className="text-[10px] font-bold text-surface-400 uppercase mb-1 underline decoration-dotted cursor-help" title="Saturation reflects relative supply in the retail market. High saturation (>1.0) leads to slower sales.">Saturation</p>
                     <p className="text-2xl font-black font-mono tracking-tighter text-econ-amber">{p.saturation?.toFixed(2)}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50">
                     <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">Profit/Unit</p>
                     <p className="text-2xl font-black font-mono tracking-tighter text-econ-green">${p.profitPerUnit?.toFixed(2)}</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="card h-full min-h-[300px] flex items-center justify-center text-surface-400 text-xs font-bold uppercase tracking-widest opacity-40">
               Select inventory product to view retail dynamics.
            </div>
          )}
       </div>
    </div>
  );
}

function BoardImpactView() {
  const [coo, setCoo] = useState(0);
  const [cfo, setCfo] = useState(0);
  const [cmo, setCmo] = useState(0);
  const [cto, setCto] = useState(0);
  const [cash, setCash] = useState(5000000);
  const [buildingLevels, setBuildingLevels] = useState(1);

  // Formulas from guides
  // CFO Lift: Increases accounting threshold. Guide: base $3M + Executive Lift.
  // CFO Lift: Increases accounting threshold.
  const cfoLift = cfo * 250000;
  const baseThreshold = 3000000;
  const threshold = baseThreshold + cfoLift;

  const accountingBase = Math.max(0, cash - threshold);
  let estimatedFee = 0;
  if (accountingBase > 0) {
    if (accountingBase <= 3000000) estimatedFee = accountingBase * 0.005;
    else if (accountingBase <= 6000000) estimatedFee = 3000000 * 0.005 + (accountingBase - 3000000) * 0.01;
    else if (accountingBase <= 9000000) estimatedFee = 3000000 * 0.005 + 3000000 * 0.01 + (accountingBase - 6000000) * 0.015;
    else if (accountingBase <= 12000000) estimatedFee = 3000000 * 0.015 + 3000000 * 0.015 + (accountingBase - 9000000) * 0.02;
    else estimatedFee = 3000000 * 0.05 + (accountingBase - 12000000) * 0.03; // Simplified tiered calc
  }

  // AO: (Levels - 1) / 170. Guide says 1% reduction per COO management point.
  const rawAO = Math.max(0, (buildingLevels - 1) / 170);
  const cooReduction = (coo * 0.01); // 1% per point
  const actualAO = Math.max(0, rawAO - cooReduction);

  // CMO: guide says increases sales speed.
  const salesSpeedBonus = cmo * 0.01; // 1% per communication point

  // CTO: Increases patent probability. Base is usually low.
  const patentProb = 0.05 + (cto * 0.02); // 5% base + 2% per science point

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm">
             <h3 className="font-bold text-surface-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-surface-400">Board Statistics</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block underline decoration-dotted cursor-help" title="Chief Operations Officer: Reduces Administrative Overhead.">COO Management</label>
                   <input type="number" value={coo} onChange={(e) => setCoo(Number(e.target.value))} className="input" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block underline decoration-dotted cursor-help" title="Chief Financial Officer: Increases cash threshold for accounting fees.">CFO Accounting</label>
                   <input type="number" value={cfo} onChange={(e) => setCfo(Number(e.target.value))} className="input" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block underline decoration-dotted cursor-help" title="Chief Marketing Officer: Increases retail sales speed.">CMO Communication</label>
                   <input type="number" value={cmo} onChange={(e) => setCmo(Number(e.target.value))} className="input" />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block underline decoration-dotted cursor-help" title="Chief Technical Officer: Increases patent probability from research.">CTO Science</label>
                   <input type="number" value={cto} onChange={(e) => setCto(Number(e.target.value))} className="input" />
                </div>
                <div className="pt-4 border-t border-surface-100 dark:border-surface-800 space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">Current Cash</label>
                      <input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} className="input font-mono" />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">Total Building Levels</label>
                      <input type="number" value={buildingLevels} onChange={(e) => setBuildingLevels(Number(e.target.value))} className="input font-mono" />
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card p-6">
                <p className="text-[10px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Accounting Threshold</p>
                <div className="text-2xl font-black font-mono tracking-tight text-surface-900 dark:text-white">${threshold.toLocaleString()}</div>
                <p className="text-[10px] text-surface-500 mt-2">CFO Lift: <span className="text-econ-green font-bold">+${cfoLift.toLocaleString()}</span></p>
             </div>
             <div className="card p-6">
                <p className="text-[10px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Effective Admin OH</p>
                <div className="text-2xl font-black font-mono tracking-tight text-surface-900 dark:text-white">{(actualAO * 100).toFixed(2)}%</div>
                <p className="text-[10px] text-surface-500 mt-2">Base: {(rawAO * 100).toFixed(2)}% | COO Reduction: <span className="text-econ-green font-bold">-{(cooReduction * 100).toFixed(1)}%</span></p>
             </div>
             <div className="card p-6">
                <p className="text-[10px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Sales Speed Bonus</p>
                <div className="text-2xl font-black text-econ-green font-mono tracking-tight">+{ (salesSpeedBonus * 100).toFixed(1) }%</div>
                <p className="text-[10px] text-surface-500 mt-2">CMO communication skill accelerates inventory turnover.</p>
             </div>
             <div className="card p-6">
                <p className="text-[10px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Patent Probability</p>
                <div className="text-2xl font-black text-brand-600 font-mono tracking-tight">{(patentProb * 100).toFixed(1)}%</div>
                <p className="text-[10px] text-surface-500 mt-2">Likelihood of converting research to quality upgrades.</p>
             </div>
          </div>

          <Section title="Professional Analysis">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                   <h4 className="text-xs font-black uppercase mb-3 text-brand-600 tracking-widest">Training ROI</h4>
                   <p className="text-[10px] leading-relaxed text-surface-500">
                      Increasing CFO by 1 point extends threshold by $250,000, saving <span className="font-bold text-surface-900 dark:text-white">$1,250/day</span> in accounting fees.
                   </p>
                </div>
                <div className="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                   <h4 className="text-xs font-black uppercase mb-3 text-econ-amber tracking-widest">Research Optimizer</h4>
                   <p className="text-[10px] leading-relaxed text-surface-500">
                      Effective research cost is reduced significantly. CTO science skill improves efficiency of R&D investments by <span className="font-bold text-surface-900 dark:text-white">{(cto * 1.8).toFixed(1)}%</span>.
                   </p>
                </div>
                <div className="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800">
                   <h4 className="text-xs font-black uppercase mb-3 text-econ-purple tracking-widest">Expansion Cap</h4>
                   <p className="text-[10px] leading-relaxed text-surface-500">
                      With current COO management, you can add <span className="font-bold text-surface-900 dark:text-white">{Math.floor(coo * 1.7)}</span> levels before hitting next major AO bracket.
                   </p>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}
