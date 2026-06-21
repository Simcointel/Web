import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";
import {
  TrendingUp, Activity, Calculator, BookOpen, Upload, Download, Trash2,
  ChevronRight, Building2, Package, UserCheck, DollarSign, ArrowLeft,
  PieChart as PieIcon, LineChart as LineIcon, Receipt, Landmark, Info
} from "lucide-react";
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

  const downloadCombinedCSV = () => {
    if (savedData.length === 0) return;
    let combined = "Type,Name,Date,Content\n";
    savedData.forEach(d => {
       const escapedContent = `"${d.content.replace(/"/g, '""')}"`;
       combined += `${d.type},${d.name},${d.date},${escapedContent}\n`;
    });
    const blob = new Blob([combined], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simcointel_combined_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const navItems = [
    { id: "financials", label: "Financial Hub", icon: Landmark, desc: "Sync & Trends" },
    { id: "operations", label: "Map & Ops", icon: Activity, desc: "Efficiency & AO" },
    { id: "simulators", label: "Simulation", icon: Calculator, desc: "Yields & Retail" },
    { id: "encyclopedia", label: "Data Bank", icon: BookOpen, desc: "Ref Encyclopedia" }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <TrendingUp size={14} />
            Simco Intelligence Suite
          </div>
          <h2 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">Intelligence Dashboard</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={downloadCombinedCSV} className="btn btn-secondary py-2 px-4 gap-2 text-[10px] font-black uppercase tracking-widest"><Download size={14} /> Export All</button>
          <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-xs font-bold px-4 py-2 uppercase tracking-wider focus:ring-2 focus:ring-brand-500">
             <option value={0}>Realm 0</option>
             <option value={1}>Realm 1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {navItems.map((cat) => (
           <button key={cat.id} onClick={() => { setCategory(cat.id as any); setActiveTab(cat.id === "financials" ? "overview" : "main"); }} className={`group relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 ${category === cat.id ? "bg-brand-600 border-brand-500 text-white shadow-xl shadow-brand-600/30" : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-brand-400"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${category === cat.id ? "bg-white/20" : "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"}`}><cat.icon size={20} /></div>
              <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
              <span className={`text-[10px] mt-1 font-medium ${category === cat.id ? "text-white/70" : "text-surface-400"}`}>{cat.desc}</span>
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={category} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} transition={{ duration: 0.15 }} className="bg-white dark:bg-surface-900/50 rounded-3xl p-8 border border-surface-200 dark:border-surface-800 shadow-sm min-h-[600px]">
           {category === "financials" && <FinancialsTools savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} activeTab={activeTab} setActiveTab={setActiveTab} />}
           {category === "operations" && <OperationsTools realm={realm} />}
           {category === "simulators" && <SimulatorsTools realm={realm} margins={margins?.resources ?? []} />}
           {category === "encyclopedia" && <EncyclopediaTools />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function FinancialsTools({ savedData, deleteData, handleFileUpload, activeTab, setActiveTab }: any) {
   const tabs = [
     { id: "overview", label: "Pulse", icon: Activity },
     { id: "income", label: "Income", icon: LineIcon },
     { id: "balance", label: "Balance", icon: PieIcon },
     { id: "cashflow", label: "Cash Flow", icon: DollarSign },
     { id: "receipts", label: "Receipts", icon: Receipt }
   ];
   return (
      <div className="space-y-10">
         <div className="flex flex-wrap gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit">
            {tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? "bg-white dark:bg-surface-700 text-brand-600 shadow-md" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-200"}`}><t.icon size={14} />{t.label}</button>)}
         </div>
         {activeTab === "overview" ? <OverviewView savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} /> : <FinancialsView type={activeTab} savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />}
      </div>
   );
}

function OverviewView({ savedData, deleteData, handleFileUpload }: any) {
   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Vault Count</p><div className="text-4xl font-black text-surface-900 dark:text-white">{savedData.length}</div></div>
               <div className="card p-6 border-l-4 border-l-econ-green bg-white dark:bg-surface-900 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Security</p><div className="text-xl font-black text-surface-900 dark:text-white flex items-center gap-2"><UserCheck size={20} className="text-econ-green" />Local-Only</div></div>
            </div>
            <div className="card overflow-hidden bg-white dark:bg-surface-900 border-surface-200 shadow-sm">
               <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 flex items-center justify-between font-black text-[10px] uppercase tracking-widest text-surface-400">Audit Trail</div>
               <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {savedData.slice(0, 8).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                       <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 uppercase text-[10px] font-black tracking-tighter">{d.type.slice(0, 3)}</div><div><p className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</p><p className="text-[10px] text-surface-400 font-mono">{new Date(d.date).toLocaleString()}</p></div></div>
                       <button onClick={() => deleteData(d.id)} className="p-2 text-surface-300 hover:text-econ-red transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4 space-y-8">
            <div className="card p-8 border-2 border-dashed border-surface-200 dark:border-surface-700 text-center bg-brand-50/30 group hover:border-brand-500 transition-all">
               <h3 className="font-black text-xs uppercase mb-6 tracking-widest text-brand-600">Quick Sync</h3>
               <input type="file" id="bulk-upload" className="hidden" onChange={(e) => handleFileUpload(e, "income")} />
               <label htmlFor="bulk-upload" className="btn btn-primary w-full py-4 rounded-2xl cursor-pointer flex items-center justify-center gap-3">Select CSV</label>
            </div>
         </div>
      </div>
   );
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function FinancialsView({ type, savedData, deleteData, handleFileUpload }: any) {
  const filtered = savedData.filter((d: any) => d.type === type);

  const analysis = useMemo(() => {
    if (filtered.length === 0) return null;
    try {
      const content = filtered[0].content;
      const lines = content.split("\n").filter(l => l.trim());
      const rows = lines.map(parseCSVLine);
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1);

      if (type === "receipts") {
         const detailsIdx = headers.indexOf("details");
         const moneyIdx = headers.indexOf("money");
         const timeIdx = headers.indexOf("timestamp");

         const results = dataRows.map(r => {
            let profit = 0;
            try {
               const details = JSON.parse(r[detailsIdx]);
               profit = details.profit || 0;
            } catch { profit = 0; }
            return { date: r[timeIdx]?.slice(5, 10), val: profit, money: parseFloat(r[moneyIdx]) || 0 };
         }).filter(d => !isNaN(d.money)).slice(0, 30).reverse();

         return { chartType: "area", data: results, label: "Net Profit Momentum (from transaction JSON)" };
      }

      if (type === "balance") {
         const assetCols = ["cash", "inventory - materials", "inventory - research", "inventory - finished goods", "buildings", "patents"];
         const latestRow = dataRows[0];
         const breakdown = assetCols.map(name => ({
            name: name.split(" - ").pop()?.toUpperCase() || name.toUpperCase(),
            value: Math.abs(parseFloat(latestRow[headers.indexOf(name)])) || 0
         })).filter(d => d.value > 0);

         return { chartType: "pie", data: breakdown, label: "Capital Allocation" };
      }

      const valIdx = headers.indexOf("netincome") !== -1 ? headers.indexOf("netincome") : headers.length - 1;
      const labelIdx = headers.indexOf("timestamp") !== -1 ? headers.indexOf("timestamp") : 0;

      const barData = dataRows.map(r => ({
         date: r[labelIdx]?.slice(5, 10) || "Data",
         val: Math.abs(parseFloat(r[valIdx])) || 0
      })).filter(d => !isNaN(d.val)).slice(0, 12).reverse();

      return { chartType: "bar", data: barData, label: "Snapshot Performance" };
    } catch (e) { console.error("CSV Parse Error:", e); return null; }
  }, [filtered, type]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 space-y-8">
         <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">{type} Control</h3>
            <label className="btn btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-3 rounded-xl"><Upload size={16} />Upload Latest Snapshot<input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, type)} className="hidden" /></label>
         </div>
      </div>
      <div className="lg:col-span-8 space-y-8">
         {analysis ? (
           <div className="card p-8 bg-white dark:bg-surface-900 border-surface-100 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-50 dark:border-surface-800"><h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">{analysis.label}</h3></div>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    {analysis.chartType === "pie" ? (
                      <PieChart><Pie data={analysis.data} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{analysis.data.map((_: any, i: number) => <Cell key={`c-${i}`} fill={["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][i % 5]} />)}</Pie><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} /></PieChart>
                    ) : analysis.chartType === "area" ? (
                      <AreaChart data={analysis.data}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} /><XAxis dataKey="date" tick={{ fontSize: 9 }} hide /><YAxis hide /><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Profit']} /><Area type="monotone" dataKey="val" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} /></AreaChart>
                    ) : (
                      <BarChart data={analysis.data}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} /><XAxis dataKey="date" tick={{ fontSize: 9 }} /><YAxis hide /><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']} /><Bar dataKey="val" fill="#0ea5e9" radius={[6, 6, 0, 0]} /></BarChart>
                    )}
                 </ResponsiveContainer>
              </div>
           </div>
         ) : <div className="card p-24 text-center bg-surface-50/50"><p className="text-surface-400 text-xs font-black uppercase tracking-widest">No visual analysis for {type}.</p></div>}
         <div className="card overflow-hidden bg-white dark:bg-surface-900 border-surface-100 shadow-sm"><div className="px-6 py-4 border-b border-surface-100 font-black text-[10px] uppercase tracking-widest text-surface-500">History</div><div className="divide-y divide-surface-100">{filtered.map((d: any) => <div key={d.id} className="flex items-center justify-between px-6 py-4 group"><div><p className="text-sm font-bold">{d.name}</p><p className="text-[10px] text-surface-400 font-mono">{new Date(d.date).toLocaleString()}</p></div><button onClick={() => deleteData(d.id)} className="text-surface-300 hover:text-econ-red transition-all p-2 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></div>)}</div></div>
      </div>
    </div>
  );
}

function OperationsTools({ realm }: { realm: number }) {
  const [activeSub, setActiveSub] = useState("manager");
  return (
    <div className="space-y-10">
       <div className="flex gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
          <button onClick={() => setActiveSub("manager")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "manager" ? "text-brand-600" : "text-surface-400"}`}>Facility Manager</button>
          <button onClick={() => setActiveSub("board")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "board" ? "text-brand-600" : "text-surface-400"}`}>Board Impact</button>
       </div>
       {activeSub === "manager" && <FacilityManager realm={realm} />}
       {activeSub === "board" && <BoardImpactView />}
    </div>
  );
}

function FacilityManager({ realm }: { realm: number }) {
  const [map, setMap] = useState<Array<{ id: number; level: number }>>(() => {
    const saved = localStorage.getItem("simco_map_config");
    return saved ? JSON.parse(saved) : [{ id: 1, level: 1 }];
  });

  useEffect(() => {
    localStorage.setItem("simco_map_config", JSON.stringify(map));
  }, [map]);

  const totalLevels = useMemo(() => map.reduce((sum, item) => sum + item.level, 0), [map]);
  const rawAO = useMemo(() => Math.max(0, (totalLevels - 1) / 170), [totalLevels]);
  const dailyLabor = useMemo(() => map.reduce((sum, item) => { const b = BUILDINGS.find(bu => bu.id === item.id); return sum + (item.level * (b?.wages || 0) * 24); }, 0), [map]);
  const addBuilding = () => setMap(prev => [...prev, { id: 1, level: 1 }]);
  const updateBuilding = (idx: number, field: string, val: number) => { const next = [...map]; (next[idx] as any)[field] = val; setMap(next); };
  const removeBuilding = (idx: number) => setMap(prev => prev.filter((_, i) => i !== idx));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between"><h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Active Map</h3><button onClick={addBuilding} className="btn btn-primary text-[10px] py-1.5 px-4 rounded-xl flex items-center gap-2"><ChevronRight size={14} />Add</button></div>
          <div className="space-y-3">{map.map((item, i) => <div key={i} className="card p-4 flex items-center gap-6 bg-white dark:bg-surface-900 border-surface-200 group"><select value={item.id} onChange={(e) => updateBuilding(i, "id", Number(e.target.value))} className="input flex-1 py-1.5 px-4 font-bold text-sm">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><div className="flex items-center gap-3"><label className="text-[10px] font-black text-surface-400 uppercase tracking-tighter underline decoration-brand-500/30">Level</label><input type="number" value={item.level} onChange={(e) => updateBuilding(i, "level", Number(e.target.value))} className="input w-20 py-1.5 px-3 font-black text-sm text-center" /></div><button onClick={() => removeBuilding(i)} className="text-surface-300 hover:text-econ-red transition-all p-1"><Trash2 size={16} /></button></div>)}</div>
       </div>
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 bg-surface-900 text-white border-none shadow-2xl space-y-8"><div><p className="text-[10px] font-black text-brand-400 uppercase mb-1">Admin Overhead</p><div className="text-5xl font-black font-mono tracking-tighter">{(rawAO * 100).toFixed(2)}%</div></div><div><p className="text-[10px] font-black text-surface-500 uppercase mb-1">Daily Labor</p><div className="text-2xl font-black font-mono text-econ-red">${(dailyLabor * (1 + rawAO)).toLocaleString()}</div></div></div>
       </div>
    </div>
  );
}

function SimulatorsTools({ realm, margins }: any) {
  const [activeSub, setActiveSub] = useState("production");
  return (
    <div className="space-y-10">
       <div className="flex gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
          <button onClick={() => setActiveSub("production")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "production" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Production</button>
          <button onClick={() => setActiveSub("construction")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "construction" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Construction</button>
          <button onClick={() => setActiveSub("retail")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "retail" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Retail</button>
       </div>
       {activeSub === "production" && <AdvancedProductionSimulator margins={margins} />}
       {activeSub === "construction" && <ConstructionCalculator margins={margins} />}
       {activeSub === "retail" && <RetailCalculator realm={realm} />}
    </div>
  );
}

function AdvancedProductionSimulator({ margins }: { margins: any[] }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("simco_prod_settings");
    return saved ? JSON.parse(saved) : {
      selectedBuildingId: 3,
      prodBonus: 0,
      robotBonus: 0,
      aoPercent: 10,
      abundance: 100
    };
  });

  const [sourcingCost, setSourcingCost] = useState<Record<number, number>>({});

  useEffect(() => {
    localStorage.setItem("simco_prod_settings", JSON.stringify(settings));
  }, [settings]);

  const building = useMemo(() => BUILDINGS.find(b => b.id === settings.selectedBuildingId), [settings.selectedBuildingId]);
  const buildingResources = useMemo(() => RESOURCES.filter(r => r.buildingId === settings.selectedBuildingId), [settings.selectedBuildingId]);

  const simulations = useMemo(() => {
    return buildingResources.map(res => {
      const market = margins.find(m => m.id === res.id);
      const baseWages = res.baseWages || 0;
      const basePh = res.basePh || 0;
      const abundanceFactor = (building?.abundance) ? (settings.abundance / 100) : 1;
      const effectivePh = basePh * (1 + settings.prodBonus/100) * abundanceFactor;
      const effectiveWages = baseWages * (1 - settings.robotBonus/100) * (1 + settings.aoPercent/100);
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
  }, [buildingResources, building, settings, sourcingCost, margins]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        <div className="lg:col-span-4 space-y-6"><div className="card p-8 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-6"><h3 className="font-black text-xs uppercase tracking-widest">Facility Modeling</h3><div className="space-y-4"><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Target Building</label><select value={settings.selectedBuildingId} onChange={(e) => setSettings({...settings, selectedBuildingId: Number(e.target.value)})} className="input py-2 px-4 font-bold text-sm">{BUILDINGS.filter(b => b.type === "production" || b.type === "research").map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Prod %</label><input type="number" value={settings.prodBonus} onChange={(e) => setSettings({...settings, prodBonus: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm" /></div><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Robots %</label><input type="number" value={settings.robotBonus} onChange={(e) => setSettings({...settings, robotBonus: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm" /></div></div><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Admin OH %</label><input type="number" value={settings.aoPercent} onChange={(e) => setSettings({...settings, aoPercent: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm" /></div>{building?.abundance && <div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Abundance %</label><input type="number" value={settings.abundance} onChange={(e) => setSettings({...settings, abundance: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm text-brand-500 font-black" /></div>}</div></div></div>
        <div className="lg:col-span-8"><div className="card overflow-hidden bg-white dark:bg-surface-900 shadow-sm"><div className="px-8 py-5 border-b border-surface-100 flex justify-between items-center"><h3 className="font-black text-xs uppercase tracking-widest">{building?.name} Output</h3></div><div className="divide-y divide-surface-100">{simulations.map(s => <div key={s.id} className="p-8 hover:bg-surface-50 group transition-all"><div className="flex justify-between items-start mb-8"><div><h4 className="text-xl font-black uppercase tracking-tight group-hover:text-brand-600 transition-colors">{s.name}</h4><p className="text-[10px] text-surface-400 font-black uppercase">Rate: {s.effectivePh.toFixed(2)}/hr</p></div><div className="text-right"><p className="text-[10px] font-black text-brand-600 uppercase mb-2 tracking-widest">PPHPL</p><div className={`text-3xl font-black font-mono tracking-tighter ${s.pphpl > 0 ? "text-econ-green" : "text-econ-red"}`}>${s.pphpl.toFixed(2)}</div></div></div><div className="grid grid-cols-3 gap-6"><div className="bg-surface-50 rounded-2xl p-4 border border-surface-100"><p className="text-[8px] font-black text-surface-400 uppercase mb-2">Cost Basis</p><p className="text-sm font-black font-mono">${s.costPerUnit.toFixed(3)}</p></div><div className="bg-surface-50 rounded-2xl p-4 border border-surface-100"><p className="text-[8px] font-black text-surface-400 uppercase mb-2">Market Price</p><p className="text-sm font-black font-mono">${s.revenue.toFixed(2)}</p></div><div className="bg-brand-50 rounded-2xl p-4 border border-brand-100"><p className="text-[8px] font-black text-brand-600 uppercase mb-2 tracking-widest">Net Profit</p><p className={`text-sm font-black font-mono ${s.profit > 0 ? "text-econ-green" : "text-econ-red"}`}>${s.profit.toFixed(2)}</p></div></div></div>)}</div></div></div>
     </div>
  );
}

function EncyclopediaTools() {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"buildings" | "resources">("buildings");
  const filteredBuildings = BUILDINGS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const filteredResources = RESOURCES.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"><div className="max-w-md w-full relative"><input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-12 rounded-2xl py-3 shadow-sm" /><div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-300"><Activity size={18} /></div></div><div className="flex gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-2xl"><button onClick={() => setMode("buildings")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "buildings" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-md" : "text-surface-500"}`}>Buildings</button><button onClick={() => setMode("resources")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "resources" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-md" : "text-surface-500"}`}>Resources</button></div></div>
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{mode === "buildings" ? filteredBuildings.map(b => <div key={b.id} className="card p-8 bg-white dark:bg-surface-900 border-surface-200 hover:border-brand-500 group"><div className="flex justify-between items-start mb-8"><h3 className="font-black text-lg uppercase tracking-tight group-hover:text-brand-600 transition-colors">{b.name}</h3><span className="text-[8px] font-black uppercase bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-lg text-surface-500 tracking-[0.2em]">{b.type}</span></div><div className="space-y-4"><div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Base Wages</span><span className="font-mono text-surface-900 dark:text-white font-black">${b.wages}/hr</span></div><div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Build Time</span><span className="font-mono text-surface-900 dark:text-white font-black">{b.baseTime} hrs</span></div></div></div>) : filteredResources.map(r => <div key={r.id} className="card p-8 bg-white dark:bg-surface-900 border-surface-200 hover:border-brand-500 group"><div className="flex justify-between items-start mb-8"><h3 className="font-black text-lg uppercase tracking-tight group-hover:text-brand-600 transition-colors">{r.name}</h3><span className="text-[8px] font-black uppercase bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-lg text-brand-600 tracking-[0.2em]">ID: {r.id}</span></div><div className="space-y-4"><div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Transport</span><span className="font-mono text-surface-900 dark:text-white font-black">{r.transport} units</span></div><div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Base Rate</span><span className="font-mono text-surface-900 dark:text-white font-black">{r.basePh}/hr</span></div></div></div>)}</div>
    </div>
  );
}

function ConstructionCalculator({ margins }: { margins: any[] }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("simco_const_config");
    return saved ? JSON.parse(saved) : {
      selectedBuilding: 1,
      currentLevel: 0,
      targetLevel: 1
    };
  });

  const [manualPrices, setManualPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    localStorage.setItem("simco_const_config", JSON.stringify(config));
  }, [config]);

  const b = useMemo(() => BUILDINGS.find(b => b.id === config.selectedBuilding), [config.selectedBuilding]);
  const getMaterialPrice = (id: number) => { if (manualPrices[id] !== undefined) return manualPrices[id]; const mName = CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.name; const real = margins.find(m => m.name === mName); return real?.outputVwap ?? CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.basePrice ?? 0; };

  const cost = useMemo(() => {
    if (!b) return { cash: 0, materials: [] as any[] };
    let totalCash = 0;
    const materialMap = new Map<number, number>();
    for (let l = config.currentLevel + 1; l <= config.targetLevel; l++) {
      const mult = l <= 2 ? 1 : l - 1;
      totalCash += b.cost * mult;
      const materials = (b as any).resources || [];
      materials.forEach((r: any) => {
        materialMap.set(r.id, (materialMap.get(r.id) || 0) + (r.qty * mult));
      });
    }
    return { cash: totalCash, materials: Array.from(materialMap.entries()).map(([id, qty]) => ({ id, qty, name: CONSTRUCTION_MATERIALS.find(cm => cm.id === id)?.name || "Unknown", price: getMaterialPrice(id) })) };
  }, [b, config.currentLevel, config.targetLevel, margins, manualPrices]);

  const totalMarketValue = cost.materials.reduce((sum, m) => sum + (m.qty * m.price), 0) + cost.cash;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8"><div className="card p-8 border-l-4 border-l-econ-amber bg-white dark:bg-surface-900 shadow-sm space-y-6"><h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Expansion Modeling</h3><div className="space-y-4"><div><label className="text-[10px] font-black uppercase mb-2 block tracking-widest text-surface-400">Building</label><select value={config.selectedBuilding} onChange={(e) => setConfig({...config, selectedBuilding: Number(e.target.value)})} className="input py-2 px-4 font-bold text-sm">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase mb-2 block tracking-widest text-surface-400">From</label><input type="number" value={config.currentLevel} onChange={(e) => setConfig({...config, currentLevel: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm" /></div><div><label className="text-[10px] font-black uppercase mb-2 block tracking-widest text-surface-400">To</label><input type="number" value={config.targetLevel} onChange={(e) => setConfig({...config, targetLevel: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm" /></div></div></div></div></div>
       <div className="lg:col-span-8"><div className="card p-8 bg-white dark:bg-surface-900 border-surface-200 shadow-sm"><div className="flex items-center justify-between mb-10 pb-5 border-b border-surface-50"><h3 className="font-black text-xs uppercase tracking-widest">Upgrade Logistics</h3><div className="text-right"><p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Total Resource Value</p><p className="text-3xl font-black text-brand-600 font-mono tracking-tighter">${totalMarketValue.toLocaleString()}</p></div></div><div className="space-y-4"><div className="flex items-center justify-between p-5 bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-100"><span className="text-xs font-black uppercase tracking-widest">Cash Needed</span><span className="font-black font-mono text-lg">${cost.cash.toLocaleString()}</span></div>{cost.materials.map((m, i) => <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 group"><div className="space-y-1"><span className="text-xs font-black uppercase tracking-widest group-hover:text-brand-600 transition-colors">{m.name}</span><div className="flex items-center gap-2"><span className="text-[8px] text-surface-400 uppercase font-black">Sync Price:</span><input type="number" value={m.price} onChange={(e) => setManualPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))} className="bg-transparent border-none text-[10px] font-black font-mono w-20 text-brand-500" /></div></div><div className="text-right"><p className="font-black font-mono text-lg">{m.qty.toLocaleString()}</p><p className="text-[10px] text-surface-400 font-black tracking-tight opacity-60">${(m.qty * m.price).toLocaleString()}</p></div></div>)}</div></div></div>
    </div>
  );
}

function RetailCalculator({ realm }: { realm: number }) {
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("simco_retail_settings");
    return saved ? JSON.parse(saved) : {
      selectedProduct: "",
      sellingPrice: 0,
      sourcingCost: 0
    };
  });

  useEffect(() => {
    localStorage.setItem("simco_retail_settings", JSON.stringify(settings));
  }, [settings]);

  const products = useMemo(() => { if (!retail?.retail) return []; return Object.entries(retail.retail).map(([k, v]: [string, any]) => ({ id: k, ...v })); }, [retail]);
  const p = useMemo(() => products.find(p => p.id === settings.selectedProduct), [products, settings.selectedProduct]);

  useEffect(() => {
    if (p && settings.selectedProduct !== localStorage.getItem("last_retail_product")) {
      setSettings({
        ...settings,
        sellingPrice: p.avgPrice || 0,
        sourcingCost: p.avgPrice ? p.avgPrice * 0.8 : 0
      });
      localStorage.setItem("last_retail_product", p.id);
    }
  }, [p]);

  const stats = useMemo(() => {
    if (!p) return null;
    const saturation = p.saturation || 0;
    const baseSpeed = 100;
    const priceFactor = Math.pow(settings.sellingPrice / (p.avgPrice || settings.sellingPrice), 2);
    const speed = baseSpeed / (priceFactor * (1 + saturation));
    const profitPerUnit = settings.sellingPrice - settings.sourcingCost;
    return { speed, profitPerUnit, hourlyProfit: speed * profitPerUnit };
  }, [p, settings]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8"><div className="card p-8 border-l-4 border-l-econ-purple bg-white dark:bg-surface-900 shadow-sm space-y-6"><h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Retail Strategy</h3><div className="space-y-4"><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Inventory Item</label><select value={settings.selectedProduct} onChange={(e) => setSettings({...settings, selectedProduct: e.target.value})} className="input py-2 px-4 font-bold text-sm"><option value="">-- select --</option>{products.map(pr => <option key={pr.id} value={pr.id}>{pr.id}</option>)}</select></div>{p && <><div className="pt-4 border-t border-surface-50 dark:border-surface-800 space-y-4"><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Sourcing Basis</label><input type="number" value={settings.sourcingCost} onChange={(e) => setSettings({...settings, sourcingCost: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm" /></div><div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Target Price</label><input type="number" value={settings.sellingPrice} onChange={(e) => setSettings({...settings, sellingPrice: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm text-brand-600 font-black" /></div></div></>}</div></div></div>
       <div className="lg:col-span-8">{p && stats ? <div className="card p-10 bg-white dark:bg-surface-900 shadow-sm"><div className="flex items-center justify-between mb-10 pb-5 border-b border-surface-50"><h3 className="font-black text-xs uppercase tracking-widest">{p.id} Analysis</h3><span className="text-[10px] font-black text-econ-amber bg-econ-amber/10 px-2 py-1 rounded">Saturation: {p.saturation?.toFixed(2)}</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10"><div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100"><p className="text-[10px] font-black text-surface-400 uppercase mb-3 tracking-widest">Velocity</p><p className="text-3xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">{stats.speed.toFixed(1)}/hr</p></div><div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100"><p className="text-[10px] font-black text-surface-400 uppercase mb-3 tracking-widest">Hourly Profit</p><p className={`text-3xl font-black font-mono tracking-tighter ${stats.hourlyProfit > 0 ? "text-econ-green" : "text-econ-red"}`}>${stats.hourlyProfit.toFixed(2)}</p></div><div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100"><p className="text-[10px] font-black text-brand-600 uppercase mb-3 tracking-widest">Net Margin</p><p className="text-3xl font-black font-mono tracking-tighter text-econ-green">${stats.profitPerUnit.toFixed(2)}</p></div></div></div> : <div className="card p-24 text-center bg-surface-50/50 flex flex-col items-center gap-4"><Package size={32} className="text-surface-200" /><p className="text-surface-400 text-xs font-black uppercase tracking-widest opacity-50">Select inventory product.</p></div>}</div>
    </div>
  );
}

function BoardImpactView() {
  const [board, setBoard] = useState(() => {
    const saved = localStorage.getItem("simco_board_config");
    return saved ? JSON.parse(saved) : {
      coo: 0, cfo: 0, cmo: 0, cto: 0, cash: 5000000, buildingLevels: 1
    };
  });

  useEffect(() => {
    localStorage.setItem("simco_board_config", JSON.stringify(board));
  }, [board]);

  const cfoLift = board.cfo * 250000;
  const threshold = 3000000 + cfoLift;
  const rawAO = Math.max(0, (board.buildingLevels - 1) / 170);
  const cooReduction = (board.coo * 0.01);
  const actualAO = Math.max(0, rawAO - cooReduction);
  const salesSpeedBonus = board.cmo * 0.01;
  const patentProb = 0.05 + (board.cto * 0.02);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8"><div className="card p-8 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-6"><h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Executives</h3><div className="space-y-4"><div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">COO Management</label><input type="number" value={board.coo} onChange={(e) => setBoard({...board, coo: Number(e.target.value)})} className="input py-2 px-4 font-bold text-sm" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">CFO Accounting</label><input type="number" value={board.cfo} onChange={(e) => setBoard({...board, cfo: Number(e.target.value)})} className="input py-2 px-4 font-bold text-sm" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">CMO Comm</label><input type="number" value={board.cmo} onChange={(e) => setBoard({...board, cmo: Number(e.target.value)})} className="input py-2 px-4 font-bold text-sm" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">CTO Science</label><input type="number" value={board.cto} onChange={(e) => setBoard({...board, cto: Number(e.target.value)})} className="input py-2 px-4 font-bold text-sm" /></div><div className="pt-6 border-t border-surface-50 space-y-4"><div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">Liquid Cash</label><input type="number" value={board.cash} onChange={(e) => setBoard({...board, cash: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm text-econ-green font-black" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">Total Levels</label><input type="number" value={board.buildingLevels} onChange={(e) => setBoard({...board, buildingLevels: Number(e.target.value)})} className="input py-2 px-4 font-mono text-sm font-black" /></div></div></div></div></div>
       <div className="lg:col-span-8 space-y-10"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="card p-8 bg-white dark:bg-surface-900 border-surface-100 group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Accounting Threshold</p><div className="text-3xl font-black font-mono tracking-tighter">${threshold.toLocaleString()}</div><p className="text-[10px] text-surface-500 mt-4 font-medium uppercase tracking-tight">Impact: <span className="text-econ-green font-black">+${cfoLift.toLocaleString()}</span></p></div><div className="card p-8 bg-white dark:bg-surface-900 border-surface-100 group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Effective Admin OH</p><div className="text-3xl font-black font-mono tracking-tighter">{(actualAO * 100).toFixed(2)}%</div><p className="text-[10px] text-surface-500 mt-4 font-medium uppercase tracking-tight">Base: {(rawAO * 100).toFixed(2)}% | <span className="text-econ-green font-black">-{(cooReduction * 100).toFixed(1)}%</span></p></div><div className="card p-8 bg-white dark:bg-surface-900 border-surface-100 group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Sales Velocity</p><div className="text-3xl font-black font-mono tracking-tighter text-econ-green">+{ (salesSpeedBonus * 100).toFixed(1) }%</div></div><div className="card p-8 bg-white dark:bg-surface-900 border-surface-100 group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Patent Prob</p><div className="text-3xl font-black font-mono tracking-tighter text-brand-600">{(patentProb * 100).toFixed(1)}%</div></div></div><Section title="Governance Analytics"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="card p-6 bg-surface-50 dark:bg-surface-800/40 border-surface-100 shadow-inner"><h4 className="text-[10px] font-black uppercase mb-4 text-brand-600 tracking-widest">Training ROI</h4><p className="text-[11px] leading-relaxed text-surface-500 font-medium">Increasing CFO by 1 point saves <span className="font-bold text-surface-900 dark:text-white">${(0.005 * 250000).toFixed(2)}/day</span> per bracket.</p></div><div className="card p-6 bg-surface-50 dark:bg-surface-800/40 border-surface-100 shadow-inner"><h4 className="text-[10px] font-black uppercase mb-4 text-econ-amber tracking-widest">Research Boost</h4><p className="text-[11px] leading-relaxed text-surface-500 font-medium">CTO science skill improves efficiency of R&D investments by <span className="font-bold text-surface-900 dark:text-white">{(board.cto * 1.8).toFixed(1)}%</span>.</p></div><div className="card p-6 bg-surface-50 dark:bg-surface-800/40 border-surface-100 shadow-inner"><h4 className="text-[10px] font-black uppercase mb-4 text-econ-purple tracking-widest">Growth Limit</h4><p className="text-[11px] leading-relaxed text-surface-500 font-medium">Add <span className="font-bold text-surface-900 dark:text-white">{Math.floor(board.coo * 1.7)}</span> levels before hitting next major AO bracket.</p></div></div></Section></div>
    </div>
  );
}
