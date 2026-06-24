import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";
import {
  TrendingUp, Activity, Calculator, BookOpen, Upload, Download, Trash2,
  ChevronRight, Building2, Package, UserCheck, DollarSign, ArrowLeft,
  PieChart as PieIcon, LineChart as LineIcon, Receipt, Landmark, Info, Search,
  ArrowUpRight, ArrowDownRight, Clock, Wallet, GraduationCap, Users, UserPlus, Zap
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

const FAST_TRANSITION = { duration: 0.15, ease: "easeOut" } as const;

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
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-[10px] uppercase tracking-widest">
            <Activity size={12} />
            Internal Systems
          </div>
          <h2 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Corporate Suite</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadCombinedCSV} className="btn btn-secondary py-2 px-4 gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all">
             <Download size={14} />
             Export Configuration
          </button>
          <div className="relative group">
             <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg text-xs font-bold px-4 py-2 uppercase tracking-widest focus:ring-brand-500 appearance-none pr-8">
                <option value={0}>R0 // GLOBAL</option>
                <option value={1}>R1 // MAGNATES</option>
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400"><ChevronRight size={12} className="rotate-90" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
         {navItems.map((cat) => (
           <button key={cat.id} onClick={() => { setCategory(cat.id as any); setActiveTab(cat.id === "financials" ? "overview" : "main"); }} className={`group relative flex flex-col p-6 rounded-xl border transition-all duration-200 ${category === cat.id ? "bg-brand-600 border-brand-500 text-white shadow-lg" : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-brand-500/50"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all ${category === cat.id ? "bg-white/20 shadow-md" : "bg-surface-50 dark:bg-surface-800 text-brand-600 dark:text-brand-400"}`}><cat.icon size={20} /></div>
              <span className="text-xs font-black uppercase tracking-wider">{cat.label}</span>
              <span className={`text-[9px] mt-1 font-bold tracking-widest ${category === cat.id ? "text-white/70" : "text-surface-400"}`}>{cat.desc}</span>
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FAST_TRANSITION} className="terminal-card min-h-[600px] relative">
           {category === "financials" && <FinancialsTools savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} activeTab={activeTab} setActiveTab={setActiveTab} />}
           {category === "operations" && <OperationsTools realm={realm} margins={margins?.resources ?? []} />}
           {category === "simulators" && <SimulatorsTools realm={realm} margins={margins?.resources ?? []} />}
           {category === "encyclopedia" && <EncyclopediaTools realm={realm} margins={margins?.resources ?? []} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FinancialsTools({ savedData, deleteData, handleFileUpload, activeTab, setActiveTab }: any) {
   const tabs = [
     { id: "overview", label: "Overview", icon: Activity },
     { id: "income", label: "Income", icon: LineIcon },
     { id: "balance", label: "Balance", icon: PieIcon },
     { id: "cashflow", label: "Cash Flow", icon: DollarSign },
     { id: "receipts", label: "Receipts", icon: Receipt },
     { id: "bonds", label: "Debt & Bonds", icon: Landmark },
     { id: "contracts", label: "Contract vs Exchange", icon: ArrowUpRight },
     { id: "inventory", label: "Inventory Valuator", icon: Package }
   ];
   return (
      <div className="space-y-8">
         <div className="flex flex-wrap gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit border border-surface-200 dark:border-surface-700">
            {tabs.map(t => (
               <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === t.id ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm border border-surface-200 dark:border-surface-600" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-50/50"}`}
               >
                  <t.icon size={14} />
                  {t.label}
               </button>
            ))}
         </div>
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FAST_TRANSITION}>
            {activeTab === "overview" && <OverviewView savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />}
            {["income", "balance", "cashflow", "receipts"].includes(activeTab) && <FinancialsView type={activeTab} savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />}
            {activeTab === "bonds" && <BondCalculator />}
            {activeTab === "contracts" && <ContractCalculator />}
            {activeTab === "inventory" && <InventoryValuator margins={margins?.resources ?? []} />}
         </motion.div>
      </div>
   );
}

function OverviewView({ savedData, deleteData, handleFileUpload }: any) {
   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="card p-6 border-brand-500/20 bg-brand-500/[0.01]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-2">Data Points</p>
                  <div className="text-3xl font-bold text-surface-900 dark:text-white tabular-nums">{savedData.length}</div>
               </div>
               <div className="card p-6 border-econ-green/20 bg-econ-green/[0.01]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-econ-green mb-2">Integration</p>
                  <div className="text-xl font-bold text-econ-green flex items-center gap-2 uppercase">
                     <UserCheck size={20} />
                     ACTIVE
                  </div>
               </div>
               <div className="card p-6 border-surface-200 dark:border-surface-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">Latest Sync</p>
                  <div className="text-sm font-bold text-surface-900 dark:text-white tabular-nums">
                     {savedData.length > 0 ? new Date(savedData[0].date).toLocaleDateString() : "No data"}
                  </div>
               </div>
            </div>
            <div className="card overflow-hidden p-0 border">
               <div className="px-6 py-4 border-b bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between font-bold text-[10px] uppercase tracking-wider text-surface-500">
                  <div className="flex items-center gap-2">
                     <Activity size={12} className="text-brand-500" />
                     Recent Transactions
                  </div>
               </div>
               <div className="divide-y">
                  {savedData.length > 0 ? savedData.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-brand-500/[0.02] transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 flex flex-col items-center justify-center text-brand-600 uppercase text-[8px] font-black border group-hover:border-brand-500 transition-colors">
                             <span className="text-[10px] leading-none font-mono">{d.type.slice(0, 3)}</span>
                          </div>
                          <div>
                             <p className="text-sm font-bold text-surface-900 dark:text-white uppercase group-hover:text-brand-500 transition-colors">{d.name}</p>
                             <p className="text-[9px] text-surface-400 font-mono uppercase">TS: {new Date(d.date).toLocaleString()}</p>
                          </div>
                       </div>
                       <button onClick={() => deleteData(d.id)} className="p-2 text-surface-300 hover:text-white hover:bg-econ-red rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                    </div>
                  )) : (
                    <div className="p-16 text-center text-surface-400 font-bold uppercase text-[10px] tracking-widest opacity-30">No data found.</div>
                  )}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4">
            <div className="card p-8 border-dashed border-2 border-brand-500/20 text-center bg-brand-500/[0.01] group hover:border-brand-500 transition-all cursor-pointer">
               <h3 className="font-bold text-[10px] uppercase mb-6 tracking-widest text-brand-600">Data Import</h3>
               <div className="flex flex-col gap-4 relative z-10">
                  <input type="file" id="bulk-upload" className="hidden" onChange={(e) => handleFileUpload(e, "income")} />
                  <label htmlFor="bulk-upload" className="btn btn-primary w-full py-4 rounded-xl cursor-pointer flex items-center justify-center gap-3 text-xs font-bold shadow-sm border border-brand-400">
                     <Upload size={18} />
                     Upload CSV
                  </label>
                  <p className="text-[9px] font-medium text-surface-500 uppercase leading-relaxed px-4 opacity-60">
                     Accepts INCOME, BALANCE, CASHFLOW, or RECEIPTS exports.
                  </p>
               </div>
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

         return { chartType: "area", data: results, label: "Net Profit Momentum" };
      }

      if (type === "balance") {
         const assetCols = ["cash", "inventory - materials", "inventory - research", "inventory - finished goods", "buildings", "patents"];
         const latestRow = dataRows[0];
         const breakdown = assetCols.map(name => {
            const idx = headers.indexOf(name);
            return {
               name: name.split(" - ").pop()?.toUpperCase() || name.toUpperCase(),
               value: idx !== -1 ? Math.abs(parseFloat(latestRow[idx])) || 0 : 0
            };
         }).filter(d => d.value > 0);

         return { chartType: "pie", data: breakdown, label: "Capital Allocation" };
      }

      const valIdx = headers.indexOf("netincome") !== -1 ? headers.indexOf("netincome") : headers.length - 1;
      const labelIdx = headers.indexOf("timestamp") !== -1 ? headers.indexOf("timestamp") : 0;

      const barData = dataRows.map(r => ({
         date: r[labelIdx]?.slice(5, 10) || "Data",
         val: Math.abs(parseFloat(r[valIdx])) || 0
      })).filter(d => !isNaN(d.val)).slice(0, 12).reverse();

      return { chartType: "bar", data: barData, label: "Performance Overview" };
    } catch (e) { console.error("CSV Parse Error:", e); return null; }
  }, [filtered, type]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
         <div className="card p-6 border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-6">
            <h3 className="font-bold text-[10px] uppercase tracking-wider text-surface-900 dark:text-white border-b pb-3">{type} Control</h3>
            <label className="btn btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-3 rounded-lg text-[10px] font-bold uppercase"><Upload size={16} />Upload CSV<input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, type)} className="hidden" /></label>
         </div>
      </div>
      <div className="lg:col-span-8 space-y-6">
         {analysis ? (
           <div className="card p-8 bg-white dark:bg-surface-900 border">
              <div className="flex items-center justify-between mb-8 pb-3 border-b"><h3 className="font-bold text-[10px] uppercase tracking-wider text-surface-900 dark:text-white">{analysis.label}</h3></div>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    {analysis.chartType === "pie" ? (
                      <PieChart><Pie data={analysis.data} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">{analysis.data.map((_: any, i: number) => <Cell key={`c-${i}`} fill={["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][i % 5]} />)}</Pie><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }} /></PieChart>
                    ) : analysis.chartType === "area" ? (
                      <AreaChart data={analysis.data}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} /><XAxis dataKey="date" tick={{ fontSize: 9 }} hide /><YAxis hide /><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', fontSize: '10px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Profit']} /><Area type="monotone" dataKey="val" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={2} /></AreaChart>
                    ) : (
                      <BarChart data={analysis.data}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} /><XAxis dataKey="date" tick={{ fontSize: 9 }} /><YAxis hide /><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', fontSize: '10px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']} /><Bar dataKey="val" fill="#0ea5e9" radius={[4, 4, 0, 0]} /></BarChart>
                    )}
                 </ResponsiveContainer>
              </div>
           </div>
         ) : <div className="card p-24 text-center bg-surface-50/50 border-dashed border-2"><p className="text-surface-400 text-[10px] font-bold uppercase tracking-widest opacity-50">Awaiting data...</p></div>}
      </div>
    </div>
  );
}

function OperationsTools({ realm, margins }: { realm: number, margins: any[] }) {
  const [activeSub, setActiveSub] = useState("manager");
  return (
    <div className="space-y-8">
       <div className="flex gap-4 border-b pb-3">
          <button onClick={() => setActiveSub("manager")} className={`text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeSub === "manager" ? "text-brand-600" : "text-surface-400 hover:text-surface-600"}`}>Facility Manager{activeSub === "manager" && <div className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-brand-600" />}</button>
          <button onClick={() => setActiveSub("board")} className={`text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeSub === "board" ? "text-brand-600" : "text-surface-400 hover:text-surface-600"}`}>Executive Board{activeSub === "board" && <div className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-brand-600" />}</button>
       </div>
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FAST_TRANSITION}>
          {activeSub === "manager" && <FacilityManager realm={realm} margins={margins} />}
          {activeSub === "board" && <ExecutiveSuiteView />}
       </motion.div>
    </div>
  );
}

function FacilityManager({ realm, margins }: { realm: number, margins: any[] }) {
  const [map, setMap] = useState<Array<{ id: string | number; level: number }>>(() => {
    const saved = localStorage.getItem("simco_map_config");
    return saved ? JSON.parse(saved) : [{ id: BUILDINGS[0].id, level: 1 }];
  });

  useEffect(() => {
    localStorage.setItem("simco_map_config", JSON.stringify(map));
  }, [map]);

  const [estDailyProfit, setEstDailyProfit] = useState(() => {
    const saved = localStorage.getItem("simco_est_daily_profit");
    return saved ? Number(saved) : 100000;
  });

  useEffect(() => {
    localStorage.setItem("simco_est_daily_profit", String(estDailyProfit));
  }, [estDailyProfit]);

  const totalLevels = useMemo(() => map.reduce((sum, item) => sum + item.level, 0), [map]);
  const rawAO = useMemo(() => Math.max(0, (totalLevels - 1) / 170), [totalLevels]);

  const dailyLabor = useMemo(() => map.reduce((sum, item) => {
    const b = (BUILDINGS as any).find((bu: any) => bu.id === item.id);
    return sum + (item.level * (b?.wages || 0) * 24);
  }, 0), [map]);

  const addBuilding = () => setMap(prev => [...prev, { id: BUILDINGS[0].id, level: 1 }]);
  const updateBuilding = (idx: number, field: string, val: string | number) => { const next = [...map]; (next[idx] as any)[field] = val; setMap(next); };
  const removeBuilding = (idx: number) => setMap(prev => prev.filter((_, i) => i !== idx));

  const mapCapitalValue = useMemo(() => map.reduce((sum, item) => {
    const b = (BUILDINGS as any).find((bu: any) => bu.id === item.id);
    if (!b) return sum;
    let buildCost = 0;
    for (let l = 1; l <= item.level; l++) {
      const mult = l <= 2 ? 1 : l - 1;
      buildCost += b.cost * mult;
    }
    return sum + buildCost;
  }, 0), [map]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between"><h3 className="font-bold text-[10px] uppercase tracking-wider text-surface-900 dark:text-white">Active Map Configuration</h3><button onClick={addBuilding} className="btn btn-primary text-[9px] font-bold py-2 px-4 rounded-lg flex items-center gap-2 border">ADD FACILITY</button></div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {map.map((item, i) => (
              <div key={i} className="card p-4 flex items-center gap-4 bg-white dark:bg-surface-900 border hover:border-brand-500/50 transition-all">
                <select value={item.id} onChange={(e) => updateBuilding(i, "id", e.target.value)} className="input flex-1 py-1.5 px-3 font-bold text-xs uppercase bg-surface-50 dark:bg-surface-800 border-none rounded-lg">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-bold text-surface-400 uppercase">LVL</label>
                  <input type="number" value={item.level} onChange={(e) => updateBuilding(i, "level", Number(e.target.value))} className="input w-16 py-1.5 px-2 font-bold text-xs text-center bg-surface-50 dark:bg-surface-800 border-none rounded-lg" />
                </div>
                <button onClick={() => removeBuilding(i)} className="text-surface-300 hover:text-econ-red transition-all p-1.5"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
       </div>
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 bg-surface-900 text-white border-none shadow-xl space-y-8 rounded-2xl relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[9px] font-bold text-brand-400 uppercase mb-1 tracking-wider">ADMIN OVERHEAD</p>
                <div className="text-5xl font-black font-mono tracking-tighter">{(rawAO * 100).toFixed(2)}%</div>
             </div>
             <div className="relative z-10 pt-6 border-t border-white/10 space-y-4">
                <div>
                   <p className="text-[9px] font-bold text-surface-500 uppercase mb-1 tracking-wider">OPERATIONAL LABOR</p>
                   <div className="text-2xl font-bold font-mono text-econ-red tabular-nums">${(dailyLabor * (1 + rawAO)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/DAY</div>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-surface-500 uppercase mb-1 tracking-wider">ADMIN SWEET SPOT</p>
                   <div className="text-xl font-bold font-mono text-brand-400 tabular-nums">~{Math.round(rawAO * 170 + 1)} LEVELS</div>
                   <p className="text-[8px] text-surface-500 uppercase mt-1">Optimal levels for current overhead</p>
                </div>
             </div>
             <div className="relative z-10 pt-6 border-t border-white/10">
                <p className="text-[9px] font-bold text-econ-amber uppercase mb-3 tracking-wider">DAYS TO PAYBACK (ROI)</p>
                <div className="flex items-end gap-2">
                   <div className="text-5xl font-black font-mono tracking-tighter text-econ-amber">{estDailyProfit > 0 ? (mapCapitalValue / estDailyProfit).toFixed(1) : "∞"}</div>
                   <span className="text-[10px] font-bold mb-1.5 opacity-50 uppercase">Cycles</span>
                </div>
                <div className="mt-6 space-y-2 bg-white/5 p-4 rounded-xl border border-white/10">
                   <label className="text-[8px] font-bold uppercase text-surface-400 tracking-wider block">Est. Net Daily Profit</label>
                   <input type="number" value={estDailyProfit} onChange={(e) => setEstDailyProfit(Number(e.target.value))} className="bg-transparent border-none p-0 text-lg font-bold font-mono text-white focus:ring-0 w-full" />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function SimulatorsTools({ realm, margins }: any) {
  const [activeSub, setActiveSub] = useState("production");
  return (
    <div className="space-y-8">
       <div className="flex gap-4 border-b pb-3 overflow-x-auto">
          {[
            { id: "production", label: "Production Yields", icon: Package },
            { id: "construction", label: "Expansion Logistics", icon: Building2 },
            { id: "retail", label: "Retail Momentum", icon: Wallet },
            { id: "roi", label: "Training ROI", icon: GraduationCap },
            { id: "matrix", label: "Profit Matrix", icon: Activity }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveSub(t.id)} className={`text-[10px] font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 ${activeSub === t.id ? "text-brand-600" : "text-surface-400 hover:text-surface-600"}`}>
               <t.icon size={14} />
               {t.label}
               {activeSub === t.id && <div className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-brand-600" />}
            </button>
          ))}
       </div>
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FAST_TRANSITION}>
          {activeSub === "production" && <AdvancedProductionSimulator margins={margins} />}
          {activeSub === "construction" && <ConstructionCalculator margins={margins} />}
          {activeSub === "retail" && <RetailCalculator realm={realm} />}
          {activeSub === "roi" && <TrainingROISimulator />}
          {activeSub === "matrix" && <ProfitMatrix margins={margins} />}
       </motion.div>
    </div>
  );
}

function AdvancedProductionSimulator({ margins }: { margins: any[] }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("simco_prod_settings");
    return saved ? JSON.parse(saved) : {
      selectedBuildingId: BUILDINGS[0].id,
      prodBonus: 0,
      robotBonus: 0,
      aoPercent: 10,
      abundance: 100
    };
  });

  const [sourcingCost, setSourcingCost] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem("simco_prod_sourcing");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("simco_prod_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("simco_prod_sourcing", JSON.stringify(sourcingCost));
  }, [sourcingCost]);

  const building = useMemo(() => (BUILDINGS as any).find((b: any) => b.id === settings.selectedBuildingId), [settings.selectedBuildingId]);
  const buildingResources = useMemo(() => RESOURCES.filter(r => r.buildingId === settings.selectedBuildingId), [settings.selectedBuildingId]);

  const requiredInputs = useMemo(() => {
    const ids = new Set<number>();
    buildingResources.forEach(r => {
      if (r.inputs) Object.keys(r.inputs).forEach(iid => ids.add(Number(iid)));
    });
    return Array.from(ids).map(id => {
      const res = RESOURCES.find(r => r.id === id);
      const m = margins.find(m => m.id === id);
      return { id, name: res?.name || `ID: ${id}`, vwap: m?.outputVwap || 0 };
    });
  }, [buildingResources, margins]);

  const simulations = useMemo(() => {
    if (!buildingResources.length) return [];
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
          const marketPrice = margins.find(m => m.id === Number(iid))?.outputVwap || 0;
          const price = sourcingCost[Number(iid)] !== undefined ? sourcingCost[Number(iid)] : marketPrice;
          inputCost += price * (qty as number);
        });
      }
      const costPerUnit = (inputCost + (effectivePh > 0 ? (effectiveWages / effectivePh) : 0));
      const revenue = market?.outputVwap || 0;
      const profit = revenue - costPerUnit;
      return { ...res, costPerUnit, revenue, profit, pphpl: profit * effectivePh, effectivePh };
    });
  }, [buildingResources, building, settings, sourcingCost, margins]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="card p-6 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-6 rounded-2xl">
              <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-3">Facility Modeling</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Selected Facility</label>
                    <select value={settings.selectedBuildingId} onChange={(e) => setSettings({...settings, selectedBuildingId: e.target.value})} className="input py-2 px-3 font-bold text-xs uppercase bg-surface-50 border-none rounded-lg w-full">
                       {BUILDINGS.filter(b => b.type === "production" || b.type === "research").map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Prod Bonus %</label><input type="number" value={settings.prodBonus} onChange={(e) => setSettings({...settings, prodBonus: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg w-full" /></div>
                    <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Robots %</label><input type="number" value={settings.robotBonus} onChange={(e) => setSettings({...settings, robotBonus: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg w-full" /></div>
                 </div>
                 <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Admin Overhead %</label><input type="number" value={settings.aoPercent} onChange={(e) => setSettings({...settings, aoPercent: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg w-full" /></div>
              </div>
           </div>

           {requiredInputs.length > 0 && (
             <div className="card p-6 border bg-white dark:bg-surface-900 shadow-sm space-y-6 rounded-2xl">
                <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-3">Supply Chain Basis</h3>
                <div className="space-y-4">
                   {requiredInputs.map(input => (
                     <div key={input.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-bold uppercase text-surface-400">{input.name}</span>
                           <div className="flex gap-1 bg-surface-100 p-0.5 rounded border">
                              <button onClick={() => { const next = {...sourcingCost}; delete next[input.id]; setSourcingCost(next); }} className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded ${sourcingCost[input.id] === undefined ? 'bg-white shadow-sm text-brand-600' : 'text-surface-400'}`}>Market</button>
                              <button onClick={() => setSourcingCost({...sourcingCost, [input.id]: sourcingCost[input.id] || input.vwap})} className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded ${sourcingCost[input.id] !== undefined ? 'bg-white shadow-sm text-brand-600' : 'text-surface-400'}`}>Self</button>
                           </div>
                        </div>
                        {sourcingCost[input.id] !== undefined && (
                          <input type="number" value={sourcingCost[input.id]} onChange={(e) => setSourcingCost({...sourcingCost, [input.id]: Number(e.target.value)})} className="input py-1.5 px-3 font-bold text-xs bg-brand-50 border-brand-100 text-brand-600 rounded-lg w-full" />
                        )}
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
        <div className="lg:col-span-8 space-y-6">
           <div className="card overflow-hidden bg-white dark:bg-surface-900 border rounded-2xl">
              <div className="px-8 py-4 border-b bg-surface-50/50 flex justify-between items-center"><h3 className="font-bold text-[10px] uppercase tracking-wider">{building?.name} Pipeline</h3></div>
              <div className="divide-y">
                 {simulations.length > 0 ? simulations.map(s => (
                    <div key={s.id} className="p-8 hover:bg-surface-50/50 transition-all">
                       <div className="flex justify-between items-start mb-8">
                          <div>
                             <h4 className="text-2xl font-bold uppercase tracking-tight italic group-hover:text-brand-600 transition-colors">{s.name}</h4>
                             <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] text-surface-400 font-bold uppercase bg-surface-100 px-2 py-0.5 rounded">Rate: {s.effectivePh.toFixed(2)}/H</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-bold text-brand-600 uppercase mb-1 tracking-wider">Hourly Profit / Lvl</p>
                             <div className={`text-4xl font-black font-mono tracking-tighter ${s.pphpl > 0 ? "text-econ-green" : "text-econ-red"}`}>${s.pphpl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                          </div>
                       </div>
                       <div className="grid grid-cols-4 gap-4">
                          <div className="bg-surface-50 rounded-xl p-4 border"><p className="text-[8px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Unit Cost</p><p className="text-sm font-bold font-mono">${s.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 3 })}</p></div>
                          <div className="bg-surface-50 rounded-xl p-4 border"><p className="text-[8px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Revenue</p><p className="text-sm font-bold font-mono">${s.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                          <div className="bg-brand-50 rounded-xl p-4 border-brand-100 border"><p className="text-[8px] font-bold text-brand-600 uppercase mb-1 tracking-widest">Margin</p><p className={`text-sm font-bold font-mono ${s.profit > 0 ? "text-econ-green" : "text-econ-red"}`}>${s.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                          <div className="bg-surface-50 rounded-xl p-4 border"><p className="text-[8px] font-bold text-surface-400 uppercase mb-1 tracking-widest">Transport Hit</p><p className="text-sm font-bold font-mono text-econ-red">-${(s.transport * 0.35).toFixed(2)}</p></div>
                       </div>
                    </div>
                 )) : (
                   <div className="p-24 text-center text-surface-400 font-bold uppercase text-[10px] tracking-widest opacity-50 italic">No resources found.</div>
                 )}
              </div>
           </div>
        </div>
     </div>
  );
}

function EncyclopediaTools({ margins, realm }: { margins: any[], realm: number }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"buildings" | "resources">("buildings");
  const [selectedResource, setSelectedResource] = useState<number | null>(null);

  const filteredBuildings = useMemo(() => {
    const s = search.toLowerCase();
    return BUILDINGS.filter(b => b.name.toLowerCase().includes(s));
  }, [search]);
  const filteredResources = useMemo(() => {
    const s = search.toLowerCase();
    return RESOURCES.filter(r => r.name.toLowerCase().includes(s));
  }, [search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
       <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b pb-8">
          <div className="max-w-md w-full relative">
             <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 rounded-xl py-3 shadow-sm border font-bold text-xs uppercase tracking-wider bg-surface-50 dark:bg-surface-800/50 w-full focus:ring-0 focus:border-brand-500" />
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400"><Search size={18} /></div>
          </div>
          <div className="flex gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl border">
             <button onClick={() => setMode("buildings")} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${mode === "buildings" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm border" : "text-surface-500 hover:text-surface-900"}`}>BUILDINGS</button>
             <button onClick={() => setMode("resources")} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${mode === "resources" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-sm border" : "text-surface-500 hover:text-surface-900"}`}>RESOURCES</button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mode === "buildings" ? filteredBuildings.map(b => (
             <div key={b.id} className="card p-6 border group hover:border-brand-500 transition-all cursor-default">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="font-bold text-lg uppercase tracking-tight italic group-hover:text-brand-600 transition-colors">{b.name}</h3>
                      <p className="text-[9px] font-bold text-surface-400 uppercase">ID: 0x{Number(b.id).toString(16).toUpperCase() || b.id}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-[9px] border-b pb-2">
                      <span className="text-surface-400 font-bold uppercase">Wages</span>
                      <span className="font-mono text-surface-900 dark:text-white font-bold italic">${b.wages}/H</span>
                   </div>
                   <div className="flex justify-between items-center text-[9px]">
                      <span className="text-surface-400 font-bold uppercase">Reference Cost</span>
                      <span className="font-mono text-brand-600 font-bold italic">${b.cost.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          )) : filteredResources.map(r => (
             <div key={r.id} className="card p-6 border group hover:border-brand-500 transition-all cursor-default relative overflow-hidden">
                <h3 className="font-bold text-lg uppercase tracking-tight italic group-hover:text-brand-600 transition-colors mb-4">{r.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-[9px] border-t pt-4">
                   <div><p className="text-surface-400 uppercase font-bold">Transport</p><p className="font-mono font-bold">{r.transport} U</p></div>
                   <div className="text-right"><p className="text-surface-400 uppercase font-bold">Rate</p><p className="font-mono font-bold">{r.basePh?.toFixed(2)}/H</p></div>
                </div>
                <div className="absolute -bottom-2 -right-2 text-5xl font-black text-surface-100 dark:text-surface-800/20 pointer-events-none italic">{r.id}</div>
             </div>
          ))}
       </div>
    </div>
  );
}

function ProfitMatrix({ margins }: { margins: any[] }) {
  const [selectedBuildingType, setSelectedBuildingType] = useState("production");

  const relevantBuildings = useMemo(() => BUILDINGS.filter(b => b.type === selectedBuildingType), [selectedBuildingType]);

  const pphplData = useMemo(() => {
    return relevantBuildings.map(b => {
      const bResources = RESOURCES.filter(r => r.buildingId === b.id);
      const maxPphpl = bResources.reduce((max, res) => {
         const m = margins.find(mr => mr.id === res.id);
         const rev = m?.outputVwap || 0;
         const wages = (b.wages || 0) * 1.1; // estimate 10% admin
         const cost = (rev * 0.85) + (wages / (res.basePh || 1));
         const profit = rev - cost;
         const pphpl = profit * (res.basePh || 0);
         return Math.max(max, pphpl);
      }, 0);
      return { name: b.name, pphpl: maxPphpl };
    }).sort((a, b) => b.pphpl - a.pphpl);
  }, [relevantBuildings, margins]);

  return (
    <div className="card p-8 bg-white dark:bg-surface-900 border rounded-2xl">
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <h3 className="font-bold text-[10px] uppercase tracking-wider">Top Profit per Hour (PPHPL)</h3>
        <select value={selectedBuildingType} onChange={(e) => setSelectedBuildingType(e.target.value)} className="input text-[10px] font-bold uppercase py-1 bg-surface-50 border-none rounded">
          <option value="production">Production</option>
          <option value="retail">Retail</option>
        </select>
      </div>
      <div className="space-y-4">
        {pphplData.map((d, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-24 text-[9px] font-bold uppercase text-surface-400 truncate">{d.name}</div>
            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (d.pphpl / (pphplData[0].pphpl || 1)) * 100)}%` }} className="h-full bg-brand-500" />
            </div>
            <div className="w-20 text-right font-mono font-bold text-[10px] text-econ-green">${d.pphpl.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingROISimulator() {
  const [data, setData] = useState({ trainingCost: 10000, currentSkill: 10, targetSkill: 15, dailyProfit: 50000 });

  const skillImpact = (data.targetSkill - data.currentSkill) * 0.01;
  const dailyGain = data.dailyProfit * skillImpact;
  const daysToPayback = dailyGain > 0 ? data.trainingCost / dailyGain : Infinity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4">
        <div className="card p-6 border bg-white dark:bg-surface-900 space-y-6 rounded-2xl">
          <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-3">Training ROI</h3>
          <div className="space-y-4">
             <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Total Training Cost ($)</label><input type="number" value={data.trainingCost} onChange={(e) => setData({...data, trainingCost: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" /></div>
             <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Current Base Profit / Day ($)</label><input type="number" value={data.dailyProfit} onChange={(e) => setData({...data, dailyProfit: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" /></div>
             <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Current Skill</label><input type="number" value={data.currentSkill} onChange={(e) => setData({...data, currentSkill: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" /></div>
                <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Target Skill</label><input type="number" value={data.targetSkill} onChange={(e) => setData({...data, targetSkill: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" /></div>
             </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="card p-8 bg-surface-900 text-white rounded-2xl h-full flex flex-col justify-center">
           <p className="text-[9px] font-bold text-brand-400 uppercase mb-1">Payback Period</p>
           <div className="text-6xl font-black font-mono tracking-tighter text-econ-amber italic">{daysToPayback === Infinity ? "∞" : daysToPayback.toFixed(1)} DAYS</div>
           <p className="text-[10px] font-bold text-surface-500 uppercase mt-4">Estimated Profit Increase: <span className="text-econ-green">${dailyGain.toLocaleString()}/DAY</span></p>
        </div>
      </div>
    </div>
  );
}

function ConstructionCalculator({ margins }: { margins: any[] }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("simco_const_config");
    return saved ? JSON.parse(saved) : {
      selectedBuilding: BUILDINGS[0].id,
      currentLevel: 0,
      targetLevel: 1
    };
  });

  const [manualPrices, setManualPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    localStorage.setItem("simco_const_config", JSON.stringify(config));
  }, [config]);

  const b = useMemo(() => (BUILDINGS as any).find((bu: any) => bu.id === config.selectedBuilding), [config.selectedBuilding]);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-4 space-y-6"><div className="card p-6 border bg-white dark:bg-surface-900 shadow-sm space-y-6 rounded-2xl"><h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-3 text-surface-900 dark:text-white">Expansion Logistics</h3><div className="space-y-4"><div><label className="text-[9px] font-bold uppercase mb-2 block text-surface-400">Target Facility</label><select value={config.selectedBuilding} onChange={(e) => setConfig({...config, selectedBuilding: e.target.value})} className="input py-2 px-3 font-bold text-xs uppercase bg-surface-50 border-none rounded-lg w-full">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[9px] font-bold uppercase mb-2 block text-surface-400">Current Lvl</label><input type="number" value={config.currentLevel} onChange={(e) => setConfig({...config, currentLevel: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg w-full" /></div><div><label className="text-[9px] font-bold uppercase mb-2 block text-surface-400">Target Lvl</label><input type="number" value={config.targetLevel} onChange={(e) => setConfig({...config, targetLevel: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg w-full" /></div></div></div></div></div>
       <div className="lg:col-span-8 space-y-6">
          <div className="card p-8 bg-white dark:bg-surface-900 border rounded-2xl">
             <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <h3 className="font-bold text-[10px] uppercase tracking-wider">Upgrade Summary</h3>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border group">
                   <div className="flex items-center gap-3"><DollarSign size={18} className="text-brand-600" /><span className="text-[10px] font-bold uppercase tracking-wider">CASH RESERVE</span></div>
                   <span className="font-bold font-mono text-xl tabular-nums">${cost.cash.toLocaleString()}</span>
                </div>
                {cost.materials.map((m, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-surface-900 rounded-xl border group hover:border-brand-500/50 transition-all">
                      <div>
                         <div className="flex items-center gap-3 mb-1"><Package size={16} className="text-surface-400" /><span className="text-[10px] font-bold uppercase group-hover:text-brand-600 transition-colors">{m.name}</span></div>
                         <div className="flex items-center gap-2"><span className="text-[8px] text-surface-400 uppercase font-bold">Price:</span><input type="number" value={m.price} onChange={(e) => setManualPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))} className="bg-transparent border-none text-[9px] font-bold font-mono w-20 text-brand-500 focus:ring-0" /></div>
                      </div>
                      <div className="text-right">
                         <p className="font-bold font-mono text-2xl tabular-nums">{m.qty.toLocaleString()}</p>
                         <p className="text-[9px] text-surface-400 font-bold tracking-widest opacity-60">Value: ${(m.qty * m.price).toLocaleString()}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="card p-6 bg-brand-600 text-white rounded-2xl">
             <div className="flex items-center gap-2 mb-4">
                <Clock size={16} />
                <h3 className="text-[10px] font-bold uppercase tracking-wider">Production Timeline</h3>
             </div>
             <div className="grid grid-cols-2 gap-8">
                <div>
                   <p className="text-[9px] font-bold text-brand-200 uppercase mb-1">Self-Production Time</p>
                   <p className="text-2xl font-black font-mono italic">~{Math.round(cost.materials.reduce((s, m) => s + m.qty, 0) / 40)} HOURS</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-brand-200 uppercase mb-1">Logistics Load</p>
                   <p className="text-2xl font-black font-mono italic">~{Math.round(cost.materials.reduce((s, m) => s + (m.qty * 1), 0))} TRANSPORT</p>
                </div>
             </div>
          </div>
       </div>
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
    const staticRes = RESOURCES.find(r => r.name.toLowerCase() === p.id.toLowerCase() || r.id.toString() === p.id);
    const baseSpeed = staticRes?.retailInfo?.[0]?.modeledUnitsSoldAnHour || 100;
    const refPrice = p.avgPrice || staticRes?.retailInfo?.[0]?.averagePrice || settings.sellingPrice;
    const priceFactor = Math.pow(settings.sellingPrice / (refPrice || settings.sellingPrice), 3);
    const speed = baseSpeed / (priceFactor * (1 + saturation * 0.22));
    const profitPerUnit = settings.sellingPrice - settings.sourcingCost;
    return { speed, profitPerUnit, hourlyProfit: speed * profitPerUnit };
  }, [p, settings]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-4 space-y-6"><div className="card p-6 border bg-white dark:bg-surface-900 shadow-sm space-y-6 rounded-2xl"><h3 className="font-bold text-[10px] uppercase tracking-wider text-surface-900 dark:text-white border-b pb-3">Retail Strategy</h3><div className="space-y-4"><div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Inventory Ledger</label><select value={settings.selectedProduct} onChange={(e) => setSettings({...settings, selectedProduct: e.target.value})} className="input py-2 px-3 font-bold text-xs uppercase bg-surface-50 border-none rounded-lg w-full"><option value="">-- NONE --</option>{products.map(pr => <option key={pr.id} value={pr.id}>{pr.id}</option>)}</select></div>{p && <><div className="pt-6 border-t space-y-4"><div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Sourcing Basis</label><input type="number" value={settings.sourcingCost} onChange={(e) => setSettings({...settings, sourcingCost: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg w-full" /></div><div><label className="text-[9px] font-bold uppercase block mb-2 text-brand-600 tracking-wider">Price Target</label><input type="number" value={settings.sellingPrice} onChange={(e) => setSettings({...settings, sellingPrice: Number(e.target.value)})} className="input py-2 px-3 font-bold text-xs bg-brand-50 border border-brand-100 text-brand-600 rounded-lg w-full" /></div></div></>}</div></div></div>
       <div className="lg:col-span-8">{p && stats ? <div className="card p-8 bg-white dark:bg-surface-900 border rounded-2xl"><div className="flex items-center justify-between mb-8 pb-4 border-b"><h3 className="font-bold text-[10px] uppercase tracking-wider">{p.id} Dynamics</h3><span className="text-[9px] font-bold text-econ-amber bg-econ-amber/10 px-3 py-1 rounded-lg border border-econ-amber/20">Saturation: {p.saturation?.toFixed(2)}</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border group"><p className="text-[9px] font-bold text-surface-400 uppercase mb-2 tracking-wider">Velocity</p><p className="text-3xl font-black font-mono italic tabular-nums">{stats.speed.toFixed(1)}/H</p></div><div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border group"><p className="text-[9px] font-bold text-surface-400 uppercase mb-2 tracking-wider">Yield</p><p className={`text-3xl font-black font-mono italic tabular-nums ${stats.hourlyProfit > 0 ? "text-econ-green" : "text-econ-red"}`}>${stats.hourlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div><div className="p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 shadow-sm"><p className="text-[9px] font-bold text-brand-600 uppercase mb-2">Unit Margin</p><p className="text-3xl font-black font-mono text-econ-green italic tabular-nums">${stats.profitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div></div></div> : <div className="card p-24 text-center bg-surface-50/50 border-dashed border-2 rounded-2xl flex flex-col items-center gap-4"><Package size={40} className="text-surface-200" /><p className="text-surface-400 text-[10px] font-bold uppercase tracking-widest opacity-50 italic">Select inventory item.</p></div>}</div>
    </div>
  );
}

function InventoryValuator({ margins }: { margins: any[] }) {
  const [items, setItems] = useState<Array<{ id: number; qty: number }>>([]);

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = margins.find(m => m.id === item.id)?.outputVwap || 0;
      return sum + (price * item.qty);
    }, 0);
  }, [items, margins]);

  const add = (id: number) => setItems([...items, { id, qty: 0 }]);
  const update = (idx: number, qty: number) => { const n = [...items]; n[idx].qty = qty; setItems(n); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-4">
        <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-bold uppercase">Warehouse Manifest</h3><button onClick={() => add(RESOURCES[0].id)} className="btn btn-secondary text-[10px] py-1 px-3">Add Item</button></div>
        {items.map((item, i) => (
          <div key={i} className="card p-4 flex gap-4 items-center bg-white dark:bg-surface-900 border">
             <select value={item.id} onChange={(e) => { const n = [...items]; n[i].id = Number(e.target.value); setItems(n); }} className="input flex-1 py-1 px-2 text-xs font-bold uppercase bg-surface-50 border-none">{RESOURCES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
             <input type="number" value={item.qty} onChange={(e) => update(i, Number(e.target.value))} className="input w-32 py-1 px-2 text-xs font-bold text-center bg-surface-50 border-none" placeholder="Quantity" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-4">
        <div className="card p-8 bg-surface-900 text-white rounded-2xl">
           <p className="text-[9px] font-bold text-brand-400 uppercase mb-1">Total Market Liquidity</p>
           <div className="text-4xl font-black font-mono tracking-tighter italic text-econ-green">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
    </div>
  );
}

function ContractCalculator() {
  const [data, setData] = useState({ price: 10, quantity: 1000 });
  const exchangeTotal = (data.price * data.quantity) * 0.97;
  const contractTotal = (data.price * 0.97) * data.quantity; // assuming 3% discount or fee avoidance
  const exchangeFees = (data.price * data.quantity) * 0.03;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="card p-6 border bg-white dark:bg-surface-900 rounded-2xl">
           <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-3">Contract Simulation</h3>
           <div className="space-y-4">
              <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Market Price ($)</label><input type="number" value={data.price} onChange={(e) => setData({...data, price: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" /></div>
              <div><label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Quantity</label><input type="number" value={data.quantity} onChange={(e) => setData({...data, quantity: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" /></div>
           </div>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
           <div className="card p-8 bg-surface-50 border rounded-2xl">
              <p className="text-[9px] font-bold text-surface-400 uppercase mb-2">Exchange Sale</p>
              <p className="text-2xl font-black font-mono tabular-nums text-surface-900">${exchangeTotal.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-econ-red uppercase mt-4">Fees: -${exchangeFees.toLocaleString()}</p>
           </div>
           <div className="card p-8 bg-brand-600 border-none rounded-2xl text-white shadow-lg">
              <p className="text-[9px] font-bold text-brand-100 uppercase mb-2">Contract Sale (Net)</p>
              <p className="text-2xl font-black font-mono tabular-nums">${(data.price * data.quantity).toLocaleString()}</p>
              <p className="text-[10px] font-bold text-econ-green uppercase mt-4">Extra Profit: +${exchangeFees.toLocaleString()}</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function BondCalculator() {
  const [bonds, setBonds] = useState(() => {
    const saved = localStorage.getItem("simco_bonds");
    return saved ? JSON.parse(saved) : { currentDebt: 0, interestRate: 0.5 };
  });

  useEffect(() => {
    localStorage.setItem("simco_bonds", JSON.stringify(bonds));
  }, [bonds]);

  const dailyInterest = (bonds.currentDebt * (bonds.interestRate / 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4">
        <div className="card p-6 border bg-white dark:bg-surface-900 space-y-6 rounded-2xl">
          <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-3">Debt Management</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Total Debt ($)</label>
              <input type="number" value={bonds.currentDebt} onChange={(e) => setBonds({...bonds, currentDebt: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase block mb-2 text-surface-400">Daily Interest %</label>
              <input type="number" step="0.01" value={bonds.interestRate} onChange={(e) => setBonds({...bonds, interestRate: Number(e.target.value)})} className="input w-full py-2 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="card p-8 bg-surface-900 text-white rounded-2xl">
          <p className="text-[9px] font-bold text-brand-400 uppercase mb-1">Daily Interest Expense</p>
          <div className="text-5xl font-black font-mono tracking-tighter text-econ-red">${dailyInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[9px] font-bold text-surface-500 uppercase mb-1">Weekly Expense</p>
              <p className="text-xl font-bold font-mono">${(dailyInterest * 7).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-surface-500 uppercase mb-1">30-Day Outlook</p>
              <p className="text-xl font-bold font-mono">${(dailyInterest * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveSuiteView() {
  const [board, setBoard] = useState(() => {
    const saved = localStorage.getItem("simco_board_v3");
    return saved ? JSON.parse(saved) : {
      coo: { skill: 0, age: 30 },
      cfo: { skill: 0, age: 30 },
      cmo: { skill: 0, age: 30 },
      cto: { skill: 0, age: 30 },
      totalLevels: 1,
    };
  });

  const [hire, setHire] = useState({ age: 19, base: 10 });
  const [poach, setPoach] = useState({ skill: 20 });

  useEffect(() => {
    localStorage.setItem("simco_board_v3", JSON.stringify(board));
  }, [board]);

  const updateExec = (role: string, field: string, val: number) => {
    setBoard((prev: any) => ({
      ...prev,
      [role]: { ...prev[role], [field]: val }
    }));
  };

  const results = useMemo(() => {
    const cfoLift = board.cfo.skill * 500000;
    const threshold = 3000000 + cfoLift;
    const rawAO = Math.max(0, (board.totalLevels - 1) / 170);
    const actualAO = rawAO * (1 - (board.coo.skill * 0.01));
    const salesSpeedBonus = board.cmo.skill * 0.01;
    const patentProb = 0.10 + (board.cto.skill * 0.015);

    const dailyWage = (exec: any) => 500 + (exec.skill * 100);
    const totalDailyWages = dailyWage(board.coo) + dailyWage(board.cfo) + dailyWage(board.cmo) + dailyWage(board.cto);

    return { threshold, actualAO, rawAO, salesSpeedBonus, patentProb, totalDailyWages };
  }, [board]);

  // CooperInc Simulation Logic
  const potential = useMemo(() => {
     const yearsLeft = Math.max(0, 60 - hire.age);
     const statGainPerYear = 1.5; // Average expected gain
     return hire.base + (yearsLeft * statGainPerYear);
  }, [hire]);

  const poachFee = useMemo(() => {
     return 5000000 + (poach.skill * 500000);
  }, [poach]);

  const roles = [
    { id: "coo", label: "COO (Management)", desc: "Reduces Admin Overhead", color: "text-econ-purple" },
    { id: "cfo", label: "CFO (Accounting)", desc: "Increases Tax Threshold", color: "text-econ-green" },
    { id: "cmo", label: "CMO (Communication)", desc: "Boosts Sales Velocity", color: "text-econ-amber" },
    { id: "cto", label: "CTO (Science)", desc: "Raises Patent Probability", color: "text-brand-600" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {roles.map(r => (
                <div key={r.id} className="card p-6 border bg-white dark:bg-surface-900">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <h4 className={`text-xs font-bold uppercase tracking-wider ${r.color}`}>{r.label}</h4>
                         <p className="text-[9px] text-surface-400 font-bold uppercase mt-1">{r.desc}</p>
                      </div>
                      <Users size={14} className="text-surface-300" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[8px] font-bold uppercase text-surface-400 mb-1 block">Skill</label>
                         <input type="number" value={(board as any)[r.id].skill} onChange={(e) => updateExec(r.id, "skill", Number(e.target.value))} className="input w-full py-1.5 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" />
                      </div>
                      <div>
                         <label className="text-[8px] font-bold uppercase text-surface-400 mb-1 block">Age</label>
                         <input type="number" value={(board as any)[r.id].age} onChange={(e) => updateExec(r.id, "age", Number(e.target.value))} className="input w-full py-1.5 px-3 font-bold text-xs bg-surface-50 border-none rounded-lg" />
                      </div>
                   </div>
                </div>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card p-6 border bg-surface-50/50 space-y-6">
                <div className="flex items-center gap-2 text-brand-600 border-b pb-3">
                   <UserPlus size={16} />
                   <h3 className="text-[10px] font-bold uppercase tracking-wider">Hiring Potential</h3>
                </div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[8px] font-bold uppercase text-surface-400 mb-1 block">Candidate Age</label>
                         <input type="number" value={hire.age} onChange={(e) => setHire({...hire, age: Number(e.target.value)})} className="input w-full py-1.5 px-3 font-bold text-xs bg-white border rounded-lg" />
                      </div>
                      <div>
                         <label className="text-[8px] font-bold uppercase text-surface-400 mb-1 block">Base Skill</label>
                         <input type="number" value={hire.base} onChange={(e) => setHire({...hire, base: Number(e.target.value)})} className="input w-full py-1.5 px-3 font-bold text-xs bg-white border rounded-lg" />
                      </div>
                   </div>
                   <div className="p-4 bg-brand-600 rounded-xl text-white">
                      <p className="text-[8px] font-bold uppercase text-brand-100 opacity-80 mb-1">Max Potential (Age 60)</p>
                      <div className="text-2xl font-black font-mono">~{potential.toFixed(1)}</div>
                   </div>
                </div>
             </div>

             <div className="card p-6 border bg-surface-50/50 space-y-6">
                <div className="flex items-center gap-2 text-brand-600 border-b pb-3">
                   <Zap size={16} />
                   <h3 className="text-[10px] font-bold uppercase tracking-wider">Market Dynamics</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className="text-[8px] font-bold uppercase text-surface-400 mb-1 block">Target Poach Skill</label>
                      <input type="number" value={poach.skill} onChange={(e) => setPoach({...poach, skill: Number(e.target.value)})} className="input w-full py-1.5 px-3 font-bold text-xs bg-white border rounded-lg" />
                   </div>
                   <div className="p-4 bg-surface-900 rounded-xl text-white">
                      <p className="text-[8px] font-bold uppercase text-surface-400 mb-1">Estimated Poaching Fee</p>
                      <div className="text-2xl font-black font-mono text-econ-red">${poachFee.toLocaleString()}</div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 bg-brand-600 text-white border-none shadow-xl space-y-8 rounded-2xl">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-100 opacity-60">Board Performance</h3>
             <div className="space-y-6">
                <div>
                   <p className="text-[9px] font-bold uppercase text-brand-200 mb-1">Accounting Limit</p>
                   <div className="text-3xl font-black font-mono tracking-tighter italic">${results.threshold.toLocaleString()}</div>
                </div>
                <div>
                   <p className="text-[9px] font-bold uppercase text-brand-200 mb-1">Effective AO</p>
                   <div className="text-3xl font-black font-mono tracking-tighter italic">{(results.actualAO * 100).toFixed(2)}%</div>
                </div>
                <div>
                   <p className="text-[9px] font-bold uppercase text-brand-200 mb-1">Retail Speed</p>
                   <div className="text-3xl font-black font-mono tracking-tighter italic">+{ (results.salesSpeedBonus * 100).toFixed(1) }%</div>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <p className="text-[9px] font-bold uppercase text-brand-200 mb-1">Daily Wages</p>
                   <div className="text-2xl font-bold font-mono tracking-tighter text-econ-red italic">${results.totalDailyWages.toLocaleString()}</div>
                </div>
                <div>
                   <p className="text-[9px] font-bold uppercase text-brand-200 mb-1">Tax Est. (1M Profit)</p>
                   <div className="text-2xl font-bold font-mono tracking-tighter text-econ-amber italic">${Math.max(0, (1000000 - results.threshold) * 0.07).toLocaleString()}</div>
                   <p className="text-[7px] text-brand-200/50 uppercase mt-1">Projected daily tax on $1M profit</p>
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-bold uppercase text-brand-200 block">Company Map Levels</label>
                   <input type="number" value={board.totalLevels} onChange={(e) => setBoard({...board, totalLevels: Number(e.target.value)})} className="bg-white/10 border-none w-full py-1.5 px-3 font-bold text-xs text-white rounded-lg focus:ring-0" />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
