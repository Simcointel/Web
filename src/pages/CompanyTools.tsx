import React, { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, CONSTRUCTION_MATERIALS, RESOURCES, ResourceData } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { Section, CardGrid, Tooltip } from "../components/Layout";
import { LoadingState } from "../components/States";

type ToolCategory = "financials" | "operations" | "simulators" | "encyclopedia";
type StatementType = "overview" | "income" | "cashflow" | "receipts" | "balance";

interface CSVData {
  id: string;
  name: string;
  date: string;
  type: string;
  content: string;
}

export function CompanyToolsPage() {
  const [category, setCategory] = useState<ToolCategory>("financials");
  const [activeTab, setActiveTab] = useState<StatementType | string>("overview");
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
      const newData: CSVData = { id: crypto.randomUUID(), name: file.name, date: new Date().toISOString(), type, content: event.target?.result as string };
      setSavedData(prev => [newData, ...prev]);
    };
    reader.readAsText(file);
  };

  const deleteData = (id: string) => setSavedData(prev => prev.filter(d => d.id !== id));

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div>
          <h2 className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">Company Suite</h2>
          <p className="text-surface-500 dark:text-surface-400 mt-2 max-w-xl text-sm leading-relaxed">
            Professional business intelligence tools modeled after SimcoTools and CooperInc.
          </p>
        </div>
        <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-xs font-bold px-4 py-2 uppercase tracking-wider">
           <option value={0}>Realm 0</option>
           <option value={1}>Realm 1</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
         {[
           { id: "financials", label: "Financials", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
           { id: "operations", label: "Map & Ops", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
           { id: "simulators", label: "Simulators", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
           { id: "encyclopedia", label: "Encyclopedia", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }
         ].map((cat) => (
           <button key={cat.id} onClick={() => { setCategory(cat.id as any); setActiveTab(cat.id === "financials" ? "overview" : "main"); }} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${category === cat.id ? "bg-brand-600 text-white shadow-xl shadow-brand-600/30 ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-surface-950" : "bg-white dark:bg-surface-900 text-surface-500 border border-surface-200 dark:border-surface-800 hover:border-brand-500"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} /></svg>
              {cat.label}
           </button>
         ))}
      </div>

      <div className="bg-surface-50 dark:bg-surface-900/50 rounded-2xl p-8 border border-surface-100 dark:border-surface-800">
         {category === "financials" && <FinancialsTools savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} activeTab={activeTab} setActiveTab={setActiveTab} />}
         {category === "operations" && <OperationsTools realm={realm} />}
         {category === "simulators" && <SimulatorsTools realm={realm} margins={margins?.resources ?? []} />}
         {category === "encyclopedia" && <EncyclopediaTools />}
      </div>
    </div>
  );
}

function FinancialsTools({ savedData, deleteData, handleFileUpload, activeTab, setActiveTab }: any) {
   const tabs = ["overview", "income", "cashflow", "receipts", "balance"];
   return (
      <div className="space-y-8">
         <div className="flex gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
            {tabs.map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-900"}`}>{t}</button>)}
         </div>
         {activeTab === "overview" ? <OverviewView savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} /> : <FinancialsView type={activeTab} savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />}
      </div>
   );
}

function OverviewView({ savedData, deleteData, handleFileUpload }: any) {
   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <CardGrid cols={2}>
               <div className="card p-6 border-l-4 border-l-brand-600">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Vault Size</h3>
                  <div className="text-4xl font-black mb-1 text-surface-900 dark:text-white">{savedData.length}</div>
                  <p className="text-xs text-surface-500 uppercase font-bold">Stored Financial Snapshots</p>
               </div>
               <div className="card p-6 border-l-4 border-l-econ-green">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Compliance</h3>
                  <div className="text-xl font-black mb-1 text-surface-900 dark:text-white">GDPR Compliant</div>
                  <p className="text-xs text-surface-500 uppercase font-bold">Data stays on your machine</p>
               </div>
            </CardGrid>
            <div className="card overflow-hidden">
               <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 flex items-center justify-between font-black text-[10px] uppercase tracking-widest">Recent Activity</div>
               <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {savedData.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-[10px] font-black uppercase">{d.type.slice(0, 3)}</div>
                          <div><p className="text-sm font-bold">{d.name}</p><p className="text-[10px] text-surface-400">{new Date(d.date).toLocaleString()}</p></div>
                       </div>
                       <button onClick={() => deleteData(d.id)} className="text-surface-400 hover:text-econ-red transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4">
            <div className="card p-6 border-2 border-dashed border-surface-200 text-center bg-surface-50/50">
               <h3 className="font-bold text-xs uppercase mb-4">Quick Sourcing</h3>
               <input type="file" id="quick-up" className="hidden" onChange={(e) => handleFileUpload(e, "income")} />
               <label htmlFor="quick-up" className="btn btn-primary w-full cursor-pointer">Drop CSV Here</label>
            </div>
         </div>
      </div>
   );
}

function FinancialsView({ type, savedData, deleteData, handleFileUpload }: any) {
  const filtered = savedData.filter((d: any) => d.type === type);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4">
         <div className="card p-6 border-l-4 border-l-brand-600 space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest">New {type} Entry</h3>
            <label className="btn btn-primary w-full cursor-pointer">Choose File<input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, type)} className="hidden" /></label>
         </div>
      </div>
      <div className="lg:col-span-8">
         <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-200 bg-surface-50/50 font-black text-[10px] uppercase tracking-widest">{type} History</div>
            <div className="divide-y divide-surface-100">
               {filtered.length > 0 ? filtered.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-6 py-4 group">
                     <div><p className="text-sm font-bold">{d.name}</p><p className="text-[10px] text-surface-400 font-mono uppercase">{new Date(d.date).toLocaleString()}</p></div>
                     <button onClick={() => deleteData(d.id)} className="text-surface-400 hover:text-econ-red opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
               )) : <div className="p-20 text-center text-surface-400 text-xs italic">No records.</div>}
            </div>
         </div>
      </div>
    </div>
  );
}

function OperationsTools({ realm }: { realm: number }) {
  const [activeSub, setActiveSub] = useState("manager");
  return (
    <div className="space-y-8">
       <div className="flex gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
          <button onClick={() => setActiveSub("manager")} className={`text-xs font-black uppercase tracking-widest ${activeSub === "manager" ? "text-brand-600" : "text-surface-400"}`}>Facility Manager</button>
          <button onClick={() => setActiveSub("board")} className={`text-xs font-black uppercase tracking-widest ${activeSub === "board" ? "text-brand-600" : "text-surface-400"}`}>Board Impact</button>
       </div>
       {activeSub === "manager" && <FacilityManager realm={realm} />}
       {activeSub === "board" && <BoardImpactView />}
    </div>
  );
}

function FacilityManager({ realm }: { realm: number }) {
  const [map, setMap] = useState<Array<{ id: number; level: number }>>([{ id: 1, level: 1 }]);

  const totalLevels = useMemo(() => map.reduce((sum, item) => sum + item.level, 0), [map]);
  const rawAO = useMemo(() => Math.max(0, (totalLevels - 1) / 170), [totalLevels]);

  const dailyLabor = useMemo(() => {
     return map.reduce((sum, item) => {
        const b = BUILDINGS.find(bu => bu.id === item.id);
        return sum + (item.level * (b?.wages || 0) * 24);
     }, 0);
  }, [map]);

  const addBuilding = () => setMap(prev => [...prev, { id: 1, level: 1 }]);
  const updateBuilding = (idx: number, field: string, val: number) => {
     const next = [...map];
     (next[idx] as any)[field] = val;
     setMap(next);
  };
  const removeBuilding = (idx: number) => setMap(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-black text-xs uppercase tracking-widest">Active Map Structure</h3>
             <button onClick={addBuilding} className="btn btn-primary py-1 px-3 text-[10px]">Add Facility</button>
          </div>
          <div className="space-y-2">
             {map.map((item, i) => (
                <div key={i} className="card p-4 flex items-center gap-4 bg-white dark:bg-surface-900 border-surface-200">
                   <select value={item.id} onChange={(e) => updateBuilding(i, "id", Number(e.target.value))} className="input flex-1 py-1 px-3">
                      {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                   <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-surface-400">LVL</label>
                      <input type="number" value={item.level} onChange={(e) => updateBuilding(i, "level", Number(e.target.value))} className="input w-16 py-1 px-2 font-mono" />
                   </div>
                   <button onClick={() => removeBuilding(i)} className="text-surface-300 hover:text-econ-red transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             ))}
          </div>
       </div>
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-l-4 border-l-brand-600 bg-surface-900 text-white border-none shadow-2xl">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-6">Efficiency Report</h3>
             <div className="space-y-6">
                <div>
                   <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Admin Overhead</p>
                   <div className="text-3xl font-black font-mono tracking-tighter text-brand-400">{(rawAO * 100).toFixed(2)}%</div>
                   <p className="text-[10px] opacity-60 mt-1">Based on {totalLevels} building levels.</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Base Daily Wages</p>
                   <div className="text-xl font-black font-mono">\${dailyLabor.toLocaleString()}</div>
                   <p className="text-[10px] opacity-60 mt-1">Labor cost at 0% AO impact.</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <p className="text-[10px] font-bold text-surface-500 uppercase mb-1">Total Daily Labor</p>
                   <div className="text-2xl font-black font-mono text-econ-red">\${(dailyLabor * (1 + rawAO)).toLocaleString()}</div>
                   <p className="text-[10px] opacity-60 mt-1">Includes admin tax impact.</p>
                </div>
             </div>
          </div>
          <div className="card p-6 bg-brand-50 border-brand-100">
             <h4 className="text-[10px] font-black uppercase text-brand-600 mb-2">Expansion Insight</h4>
             <p className="text-[10px] text-brand-800 leading-relaxed">Adding 1 level to any building will increase your Daily AO cost by approx <span className="font-bold">\${((dailyLabor / totalLevels) * (1/170) * 24).toFixed(2)}</span>.</p>
          </div>
       </div>
    </div>
  );
}

function SimulatorsTools({ realm, margins }: any) {
  const [activeSub, setActiveSub] = useState("production");
  return (
    <div className="space-y-8">
       <div className="flex gap-4 border-b border-surface-100 pb-4">
          <button onClick={() => setActiveSub("production")} className={`text-xs font-black uppercase tracking-widest ${activeSub === "production" ? "text-brand-600" : "text-surface-400"}`}>Production Simulator</button>
          <button onClick={() => setActiveSub("construction")} className={`text-xs font-black uppercase tracking-widest ${activeSub === "construction" ? "text-brand-600" : "text-surface-400"}`}>Construction Estimator</button>
          <button onClick={() => setActiveSub("retail")} className={`text-xs font-black uppercase tracking-widest ${activeSub === "retail" ? "text-brand-600" : "text-surface-400"}`}>Retail Analyzer</button>
       </div>
       {activeSub === "production" && <AdvancedProductionSimulator margins={margins} />}
       {activeSub === "construction" && <ConstructionCalculator margins={margins} />}
       {activeSub === "retail" && <RetailCalculator realm={realm} />}
    </div>
  );
}

function AdvancedProductionSimulator({ margins }: { margins: any[] }) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(3); // Farm
  const [sourcingCost, setSourcingCost] = useState<Record<number, number>>({});
  const [prodBonus, setProdBonus] = useState(0);
  const [robotBonus, setRobotBonus] = useState(0);
  const [aoPercent, setAoPercent] = useState(10);

  const building = useMemo(() => BUILDINGS.find(b => b.id === selectedBuildingId), [selectedBuildingId]);
  const buildingResources = useMemo(() => RESOURCES.filter(r => r.buildingId === selectedBuildingId), [selectedBuildingId]);

  const simulations = useMemo(() => {
    return buildingResources.map(res => {
       const market = margins.find(m => m.id === res.id);
       const baseWages = res.baseWages || 0;
       const basePh = res.basePh || 0;
       const effectivePh = basePh * (1 + prodBonus/100);
       const effectiveWages = baseWages * (1 - robotBonus/100) * (1 + aoPercent/100);

       let inputCost = 0;
       if (res.inputs) {
          Object.entries(res.inputs).forEach(([iid, qty]) => {
             const price = sourcingCost[Number(iid)] || margins.find(m => m.id === Number(iid))?.outputVwap || 0;
             inputCost += price * (qty as number);
          });
       }

       const costPerUnit = (inputCost + (effectiveWages / effectivePh));
       const revenue = market?.outputVwap || 0;
       const profit = revenue - costPerUnit;
       return { ...res, costPerUnit, revenue, profit, pphpl: profit * effectivePh, effectivePh };
    });
  }, [buildingResources, prodBonus, robotBonus, aoPercent, sourcingCost, margins]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
        <div className="lg:col-span-4 space-y-6">
           <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-surface-400">Simulation Config</h3>
              <div>
                 <label className="text-[10px] font-bold uppercase block mb-1">Building</label>
                 <select value={selectedBuildingId} onChange={(e) => setSelectedBuildingId(Number(e.target.value))} className="input py-1 px-3">
                    {BUILDINGS.filter(b => b.type === "production").map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-bold uppercase block mb-1">Prod Bonus (%)</label>
                    <input type="number" value={prodBonus} onChange={(e) => setProdBonus(Number(e.target.value))} className="input py-1 px-3" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase block mb-1">Robot Bonus (%)</label>
                    <input type="number" value={robotBonus} onChange={(e) => setRobotBonus(Number(e.target.value))} className="input py-1 px-3" />
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-bold uppercase block mb-1">Admin Overhead (%)</label>
                 <input type="number" value={aoPercent} onChange={(e) => setAoPercent(Number(e.target.value))} className="input py-1 px-3" />
              </div>
           </div>

           <div className="card p-6 bg-surface-900 text-white border-none">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Market Sourcing</h4>
              <p className="text-[10px] opacity-60 mb-4">Enter manual costs for common inputs to override market VWAP.</p>
              <div className="space-y-3">
                 {[1, 2, 18, 40].map(iid => (
                    <div key={iid} className="flex items-center justify-between gap-4">
                       <label className="text-[10px] font-bold uppercase text-surface-400">{RESOURCES.find(r => r.id === iid)?.name}</label>
                       <input type="number" placeholder="Price" onChange={(e) => setSourcingCost(prev => ({ ...prev, [iid]: Number(e.target.value) }))} className="bg-surface-800 border-none rounded px-2 py-1 text-[10px] font-mono w-20" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
        <div className="lg:col-span-8">
           <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50/50 flex justify-between items-center">
                 <h3 className="font-black text-xs uppercase tracking-widest">{building?.name} Output Analysis</h3>
              </div>
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                 {simulations.map(s => (
                    <div key={s.id} className="p-6 hover:bg-surface-50 transition-colors">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h4 className="font-black text-surface-900 dark:text-white uppercase tracking-tight">{s.name}</h4>
                             <p className="text-[10px] text-surface-400 font-bold uppercase">Rate: {s.effectivePh.toFixed(1)}/hr</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-brand-600 uppercase mb-1">PPHPL</p>
                             <div className={`text-xl font-black font-mono ${s.pphpl > 0 ? "text-econ-green" : "text-econ-red"}`}>
                                ${s.pphpl.toFixed(2)}
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="bg-surface-100/50 rounded-lg p-3">
                             <p className="text-[8px] font-black text-surface-400 uppercase mb-1">Cost Basis</p>
                             <p className="text-sm font-bold font-mono">${s.costPerUnit.toFixed(3)}</p>
                          </div>
                          <div className="bg-surface-100/50 rounded-lg p-3">
                             <p className="text-[8px] font-black text-surface-400 uppercase mb-1">Market Price</p>
                             <p className="text-sm font-bold font-mono">${s.revenue.toFixed(2)}</p>
                          </div>
                          <div className="bg-surface-100/50 rounded-lg p-3">
                             <p className="text-[8px] font-black text-surface-400 uppercase mb-1">Profit / Unit</p>
                             <p className={`text-sm font-bold font-mono ${s.profit > 0 ? "text-econ-green" : "text-econ-red"}`}>
                                ${s.profit.toFixed(2)}
                             </p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
     </div>
  );
}

function EncyclopediaTools() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"buildings" | "resources">("buildings");

  const filteredBuildings = BUILDINGS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const filteredResources = RESOURCES.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="max-w-md w-full">
             <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" />
          </div>
          <div className="flex gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
             <button onClick={() => setMode("buildings")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all \${mode === "buildings" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm" : "text-surface-500"}`}>Buildings</button>
             <button onClick={() => setMode("resources")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all \${mode === "resources" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm" : "text-surface-500"}`}>Resources</button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mode === "buildings" ? filteredBuildings.map(b => (
             <div key={b.id} className="card p-6 hover:border-brand-500 transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-black text-sm uppercase group-hover:text-brand-600 transition-colors">{b.name}</h3>
                   <span className="text-[8px] font-black uppercase bg-surface-100 px-1.5 py-0.5 rounded">{b.type}</span>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px]"><span className="text-surface-400 font-bold uppercase">Base Wages</span><span className="font-mono">${b.wages}/hr</span></div>
                   <div className="flex justify-between text-[10px]"><span className="text-surface-400 font-bold uppercase">Build Time</span><span className="font-mono">{b.baseTime} hrs</span></div>
                </div>
             </div>
          )) : filteredResources.map(r => (
             <div key={r.id} className="card p-6 hover:border-brand-500 transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-black text-sm uppercase group-hover:text-brand-600 transition-colors">{r.name}</h3>
                   <span className="text-[8px] font-black uppercase bg-surface-100 px-1.5 py-0.5 rounded">ID: {r.id}</span>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px]"><span className="text-surface-400 font-bold uppercase">Transport</span><span className="font-mono">{r.transport} units</span></div>
                   <div className="flex justify-between text-[10px]"><span className="text-surface-400 font-bold uppercase">Base Rate</span><span className="font-mono">{r.basePh}/hr</span></div>
                </div>
             </div>
          ))}
       </div>
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
       materials.forEach((r: any) => { materialMap.set(r.id, (materialMap.get(r.id) || 0) + (r.qty * mult)); });
    }
    return {
      cash: totalCash,
      materials: Array.from(materialMap.entries()).map(([id, qty]) => ({
        id, qty, name: CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.name || "Unknown", price: getMaterialPrice(id)
      }))
    };
  }, [b, currentLevel, targetLevel, margins, manualPrices]);

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
                      <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">From</label>
                      <input type="number" value={currentLevel} onChange={(e) => setCurrentLevel(Number(e.target.value))} className="input" />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-surface-400 uppercase mb-1 block">To</label>
                      <input type="number" value={targetLevel} onChange={(e) => setTargetLevel(Number(e.target.value))} className="input" />
                   </div>
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
                   <p className="text-3xl font-black text-brand-600 font-mono tracking-tighter">\${totalMarketValue.toLocaleString()}</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800">
                   <span className="text-sm font-bold uppercase text-surface-900 dark:text-white font-black tracking-widest text-[10px]">Construction Cash</span>
                   <span className="font-mono font-bold text-surface-900 dark:text-white tracking-tight">\${cost.cash.toLocaleString()}</span>
                </div>
                {cost.materials.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800">
                     <div className="space-y-1">
                        <span className="text-sm font-bold uppercase text-surface-700 dark:text-surface-300 text-[10px] tracking-widest font-black">{m.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] text-surface-400 uppercase font-black tracking-widest">Price:</span>
                           <input type="number" value={m.price} onChange={(e) => setManualPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))} className="bg-transparent border-b border-surface-200 dark:border-surface-700 text-[10px] font-mono w-20 focus:outline-none" />
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-mono font-bold text-surface-900 dark:text-white">{m.qty.toLocaleString()}</p>
                        <p className="text-[10px] text-surface-400 font-mono tracking-tighter">\${(m.qty * m.price).toLocaleString()}</p>
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
  const products = useMemo(() => { if (!retail?.retail) return []; return Object.entries(retail.retail).map(([k, v]: [string, any]) => ({ id: k, ...v })); }, [retail]);
  const p = useMemo(() => products.find(p => p.id === selectedProduct), [products, selectedProduct]);
  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-l-4 border-l-econ-purple bg-white dark:bg-surface-900 shadow-sm">
             <h3 className="font-bold text-surface-900 dark:text-white mb-6 uppercase text-xs tracking-widest text-surface-400">Inventory Select</h3>
             <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="input"><option value="">-- select product --</option>{products.map(pr => <option key={pr.id} value={pr.id}>{pr.id}</option>)}</select>
          </div>
       </div>
       <div className="lg:col-span-8">
          {p ? (
            <div className="card p-8">
               <h3 className="font-bold text-surface-900 dark:text-white mb-8 uppercase text-xs tracking-widest">Market Analysis: {p.id}</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800"><p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Avg Sale Price</p><p className="text-2xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">\${p.avgPrice?.toFixed(2)}</p></div>
                  <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800"><p className="text-[10px] font-bold text-surface-400 uppercase mb-1 underline decoration-dotted cursor-help" title="Saturation reflects relative supply in the retail market. High saturation (>1.0) leads to slower sales.">Saturation</p><p className="text-2xl font-black font-mono tracking-tighter text-econ-amber">{p.saturation?.toFixed(2)}</p></div>
                  <div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/50"><p className="text-[10px] font-bold text-brand-600 uppercase mb-1">Profit/Unit</p><p className="text-2xl font-black font-mono tracking-tighter text-econ-green">\${p.profitPerUnit?.toFixed(2)}</p></div>
               </div>
            </div>
          ) : <div className="card h-full min-h-[300px] flex items-center justify-center text-surface-400 text-xs font-bold uppercase tracking-widest opacity-40">Select inventory product to view retail dynamics.</div>}
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

  const cfoLift = cfo * 250000;
  const threshold = 3000000 + cfoLift;
  const rawAO = Math.max(0, (buildingLevels - 1) / 170);
  const cooReduction = (coo * 0.01);
  const actualAO = Math.max(0, rawAO - cooReduction);
  const salesSpeedBonus = cmo * 0.01;
  const patentProb = 0.05 + (cto * 0.02);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-4">
             <h3 className="font-bold text-surface-900 dark:text-white mb-2 uppercase text-xs tracking-widest text-surface-400">Board Statistics</h3>
             <div><label className="text-[10px] font-black text-surface-400 uppercase mb-1 block">COO Management</label><input type="number" value={coo} onChange={(e) => setCoo(Number(e.target.value))} className="input" /></div>
             <div><label className="text-[10px] font-black text-surface-400 uppercase mb-1 block">CFO Accounting</label><input type="number" value={cfo} onChange={(e) => setCfo(Number(e.target.value))} className="input" /></div>
             <div><label className="text-[10px] font-black text-surface-400 uppercase mb-1 block">CMO Communication</label><input type="number" value={cmo} onChange={(e) => setCmo(Number(e.target.value))} className="input" /></div>
             <div><label className="text-[10px] font-black text-surface-400 uppercase mb-1 block">CTO Science</label><input type="number" value={cto} onChange={(e) => setCto(Number(e.target.value))} className="input" /></div>
             <div className="pt-4 border-t border-surface-100 dark:border-surface-800 space-y-4">
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-1 block">Cash</label><input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} className="input font-mono" /></div>
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-1 block">Total Levels</label><input type="number" value={buildingLevels} onChange={(e) => setBuildingLevels(Number(e.target.value))} className="input font-mono" /></div>
             </div>
          </div>
       </div>
       <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card p-6"><p className="text-[10px] font-black text-surface-400 uppercase mb-1 tracking-widest">Accounting Threshold</p><div className="text-2xl font-black font-mono tracking-tight text-surface-900 dark:text-white">\${threshold.toLocaleString()}</div><p className="text-[10px] text-surface-500 mt-2">CFO Lift: <span className="text-econ-green font-bold">+\${cfoLift.toLocaleString()}</span></p></div>
             <div className="card p-6"><p className="text-[10px] font-black text-surface-400 uppercase mb-1 tracking-widest">Effective Admin OH</p><div className="text-2xl font-black font-mono tracking-tight text-surface-900 dark:text-white">{(actualAO * 100).toFixed(2)}%</div><p className="text-[10px] text-surface-500 mt-2">Reduction: <span className="text-econ-green font-bold">-{(cooReduction * 100).toFixed(1)}%</span></p></div>
             <div className="card p-6"><p className="text-[10px] font-black text-surface-400 uppercase mb-1 tracking-widest">Sales Speed Bonus</p><div className="text-2xl font-black text-econ-green font-mono tracking-tight">+{ (salesSpeedBonus * 100).toFixed(1) }%</div></div>
             <div className="card p-6"><p className="text-[10px] font-black text-surface-400 uppercase mb-1 tracking-widest">Patent Probability</p><div className="text-2xl font-black text-brand-600 font-mono tracking-tight">{(patentProb * 100).toFixed(1)}%</div></div>
          </div>
          <Section title="Operational Insights"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="card p-6 bg-surface-50 dark:bg-surface-900 border-surface-200"><h4 className="text-[10px] font-black uppercase mb-3 text-brand-600 tracking-widest">Training ROI</h4><p className="text-[10px] leading-relaxed text-surface-500">Increasing CFO by 1 point saves <span className="font-bold text-surface-900 dark:text-white">\${(0.005 * 250000).toFixed(2)}/day</span> per accounting bracket.</p></div><div className="card p-6 bg-surface-50 dark:bg-surface-900 border-surface-200"><h4 className="text-[10px] font-black uppercase mb-3 text-econ-amber tracking-widest">Research Boost</h4><p className="text-[10px] leading-relaxed text-surface-500">CTO science skill improves efficiency of R&D investments by <span className="font-bold text-surface-900 dark:text-white">{(cto * 1.8).toFixed(1)}%</span>.</p></div><div className="card p-6 bg-surface-50 dark:bg-surface-900 border-surface-200"><h4 className="text-[10px] font-black uppercase mb-3 text-econ-purple tracking-widest">Expansion Cap</h4><p className="text-[10px] leading-relaxed text-surface-500">With current COO, you can add <span className="font-bold text-surface-900 dark:text-white">{Math.floor(coo * 1.7)}</span> levels before hitting next major AO bracket.</p></div></div></Section>
       </div>
    </div>
  );
}
