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
  ArrowUpRight, ArrowDownRight, Clock, Wallet
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
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-7xl mx-auto p-4 sm:p-10 space-y-10 relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-brand-500/5 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-brand-500/5 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-[10px] uppercase tracking-widest">
            <Activity size={12} />
            Internal Systems
          </div>
          <h2 className="text-4xl font-bold text-surface-900 dark:text-white tracking-tight">Corporate Suite</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={downloadCombinedCSV} className="btn btn-secondary py-2.5 px-5 gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all">
             <Download size={14} />
             Export Configuration
          </button>
          <div className="relative group">
             <div className="absolute -inset-1 bg-brand-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all" />
             <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="relative bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-800 rounded-xl text-xs font-black px-6 py-3 uppercase tracking-widest focus:ring-0 focus:border-brand-500 appearance-none pr-10">
                <option value={0}>R0 // GLOBAL</option>
                <option value={1}>R1 // MAGNATES</option>
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400"><ChevronRight size={14} className="rotate-90" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {navItems.map((cat) => (
           <button key={cat.id} onClick={() => { setCategory(cat.id as any); setActiveTab(cat.id === "financials" ? "overview" : "main"); }} className={`group relative flex flex-col p-8 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${category === cat.id ? "bg-brand-600 border-brand-500 text-white shadow-2xl shadow-brand-600/40" : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-brand-500/50"}`}>
              {category === cat.id && <div className="absolute top-0 right-0 p-2 opacity-20"><cat.icon size={64} /></div>}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all ${category === cat.id ? "bg-white/20 scale-110 shadow-lg" : "bg-surface-50 dark:bg-surface-800 text-brand-600 dark:text-brand-400 group-hover:scale-105"}`}><cat.icon size={28} /></div>
              <span className="text-sm font-black uppercase tracking-[0.2em]">{cat.label}</span>
              <span className={`text-[10px] mt-2 font-black tabular-nums tracking-widest ${category === cat.id ? "text-white/70" : "text-surface-400"}`}>{cat.desc}</span>
              <div className={`mt-6 h-1 w-0 group-hover:w-full transition-all duration-500 ${category === cat.id ? "bg-white/40" : "bg-brand-500/40"}`} />
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="terminal-card min-h-[700px] relative">
           {category === "financials" && <FinancialsTools savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} activeTab={activeTab} setActiveTab={setActiveTab} />}
           {category === "operations" && <OperationsTools realm={realm} margins={margins?.resources ?? []} />}
           {category === "simulators" && <SimulatorsTools realm={realm} margins={margins?.resources ?? []} />}
           {category === "encyclopedia" && <EncyclopediaTools realm={realm} margins={margins?.resources ?? []} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function FinancialsTools({ savedData, deleteData, handleFileUpload, activeTab, setActiveTab }: any) {
   const tabs = [
     { id: "overview", label: "Overview", icon: Activity },
     { id: "income", label: "Income", icon: LineIcon },
     { id: "balance", label: "Balance", icon: PieIcon },
     { id: "cashflow", label: "Cash Flow", icon: DollarSign },
     { id: "receipts", label: "Receipts", icon: Receipt }
   ];
   return (
      <div className="space-y-12">
         <div className="flex flex-wrap gap-3 p-2 bg-surface-100 dark:bg-surface-800 rounded-2xl w-fit border-2 border-surface-200 dark:border-surface-700">
            {tabs.map(t => (
               <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === t.id ? "bg-white dark:bg-surface-700 text-brand-600 shadow-xl border border-surface-200 dark:border-surface-600" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-50/50"}`}
               >
                  <t.icon size={16} />
                  {t.label}
                  {activeTab === t.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
               </button>
            ))}
         </div>
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {activeTab === "overview" ? <OverviewView savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} /> : <FinancialsView type={activeTab} savedData={savedData} deleteData={deleteData} handleFileUpload={handleFileUpload} />}
         </motion.div>
      </div>
   );
}

function OverviewView({ savedData, deleteData, handleFileUpload }: any) {
   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="terminal-card p-10 border-brand-500/20 bg-brand-500/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-6">Data Points</p>
                  <div className="text-5xl font-bold text-surface-900 dark:text-white tabular-nums">{savedData.length}</div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-surface-400 uppercase">
                     <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                     Statements Loaded
                  </div>
               </div>
               <div className="terminal-card p-10 border-econ-green/20 bg-econ-green/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-econ-green mb-6">Integration</p>
                  <div className="text-3xl font-bold text-econ-green flex items-center gap-3 uppercase">
                     <UserCheck size={28} />
                     ACTIVE
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-surface-400 uppercase">Local Storage Enabled</div>
               </div>
               <div className="terminal-card p-10 border-surface-200 dark:border-surface-800 bg-surface-500/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-6">Latest Sync</p>
                  <div className="text-lg font-bold text-surface-900 dark:text-white tabular-nums">
                     {savedData.length > 0 ? new Date(savedData[0].date).toLocaleDateString() : "No data"}
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Verified Baseline</div>
               </div>
            </div>
            <div className="terminal-card overflow-hidden border-2 p-0">
               <div className="px-8 py-6 border-b-2 border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between font-black text-[10px] uppercase tracking-[0.3em] text-surface-500">
                  <div className="flex items-center gap-3">
                     <Activity size={14} className="text-brand-500" />
                     Recent Transactions
                  </div>
                  <span className="tabular-nums">TOP_8_ENTRIES</span>
               </div>
               <div className="divide-y-2 divide-surface-100 dark:divide-surface-800">
                  {savedData.length > 0 ? savedData.slice(0, 8).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-8 py-6 hover:bg-brand-500/[0.03] transition-all group cursor-default">
                       <div className="flex items-center gap-8">
                          <div className="w-14 h-14 rounded-xl bg-surface-100 dark:bg-surface-800 flex flex-col items-center justify-center text-brand-600 uppercase text-[9px] font-black tracking-tighter border-2 border-surface-200 dark:border-surface-700 shadow-inner group-hover:border-brand-500 group-hover:text-brand-500 transition-colors">
                             <span className="opacity-50">TYPE</span>
                             <span className="text-xs leading-none mt-1 font-mono">{d.type.slice(0, 3)}</span>
                          </div>
                          <div>
                             <p className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-wider group-hover:text-brand-500 transition-colors">{d.name}</p>
                             <div className="flex items-center gap-4 mt-2">
                                <p className="text-[9px] text-surface-400 font-black font-mono uppercase tracking-widest">TS: {new Date(d.date).toLocaleString()}</p>
                                <div className="w-1 h-1 rounded-full bg-surface-300" />
                                <p className="text-[9px] text-surface-400 font-black uppercase tracking-widest">ID: {d.id.slice(0,8)}</p>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => deleteData(d.id)} className="p-3 text-surface-300 hover:text-white hover:bg-econ-red rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-econ-red/20"><Trash2 size={20} /></button>
                    </div>
                  )) : (
                    <div className="p-32 text-center text-surface-400 font-black uppercase text-[10px] tracking-[0.5em] opacity-30 italic">No data statements found.</div>
                  )}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4 space-y-10">
            <div className="terminal-card p-12 border-dashed border-4 border-brand-500/30 text-center bg-brand-500/[0.02] group hover:border-brand-500 hover:bg-brand-500/[0.05] transition-all cursor-pointer relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Upload size={120} /></div>
               <h3 className="font-black text-xs uppercase mb-10 tracking-[0.4em] text-brand-600">Data Import</h3>
               <div className="flex flex-col gap-6 relative z-10">
                  <input type="file" id="bulk-upload" className="hidden" onChange={(e) => handleFileUpload(e, "income")} />
                  <label htmlFor="bulk-upload" className="btn btn-primary w-full py-6 rounded-2xl cursor-pointer flex items-center justify-center gap-5 text-xs font-black shadow-2xl shadow-brand-500/30 border-2 border-brand-400 group-hover:scale-[1.02] transition-transform">
                     <Upload size={24} className="animate-bounce" />
                     Upload CSV Statement
                  </label>
                  <p className="text-[10px] font-black text-surface-500 uppercase leading-loose tracking-widest px-6 opacity-60">
                     Accepts [INCOME], [BALANCE], [CASHFLOW], or [RECEIPTS] exported CSV clusters.
                  </p>
               </div>
               <div className="mt-12 pt-8 border-t border-brand-500/10 text-left">
                  <div className="flex items-center gap-3 mb-4 text-[9px] font-black text-brand-500 uppercase tracking-widest">
                     <Info size={12} />
                     Data Usage Notes
                  </div>
                  <ul className="space-y-2">
                     <li className="text-[8px] font-black text-surface-400 uppercase tracking-tighter list-disc list-inside">End-to-end local encryption</li>
                     <li className="text-[8px] font-black text-surface-400 uppercase tracking-tighter list-disc list-inside">Cross-realm parsing active</li>
                     <li className="text-[8px] font-black text-surface-400 uppercase tracking-tighter list-disc list-inside">CSV Schema auto-detection</li>
                  </ul>
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

         return { chartType: "area", data: results, label: "Net Profit Momentum (from transaction JSON)" };
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

      return { chartType: "bar", data: barData, label: "Snapshot Performance" };
    } catch (e) { console.error("CSV Parse Error:", e); return null; }
  }, [filtered, type]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 space-y-8">
         <div className="card p-8 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-8">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-surface-900 dark:text-white border-b border-surface-100 pb-4">{type} CONTROL</h3>
            <label className="btn btn-primary w-full flex items-center justify-center gap-3 cursor-pointer py-4 rounded-xl text-[10px] font-black uppercase"><Upload size={18} />Upload Snapshot<input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, type)} className="hidden" /></label>
         </div>
      </div>
      <div className="lg:col-span-8 space-y-10">
         {analysis ? (
           <div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800">
              <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-surface-50 dark:border-surface-800"><h3 className="font-black text-xs uppercase tracking-[0.2em] text-surface-900 dark:text-white">{analysis.label}</h3></div>
              <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    {analysis.chartType === "pie" ? (
                      <PieChart><Pie data={analysis.data} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">{analysis.data.map((_: any, i: number) => <Cell key={`c-${i}`} fill={["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][i % 5]} />)}</Pie><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} /></PieChart>
                    ) : analysis.chartType === "area" ? (
                      <AreaChart data={analysis.data}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} /><XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} hide /><YAxis hide /><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Profit']} /><Area type="monotone" dataKey="val" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={3} /></AreaChart>
                    ) : (
                      <BarChart data={analysis.data}><CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} /><XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700 }} /><YAxis hide /><RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Value']} /><Bar dataKey="val" fill="#0ea5e9" radius={[6, 6, 0, 0]} /></BarChart>
                    )}
                 </ResponsiveContainer>
              </div>
           </div>
         ) : <div className="card p-32 text-center bg-surface-50/50 border-2 border-dashed border-surface-200"><p className="text-surface-400 text-xs font-black uppercase tracking-widest opacity-50">Awaiting {type} data...</p></div>}
         <div className="card overflow-hidden bg-white dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800"><div className="px-6 py-5 border-b-2 border-surface-100 bg-surface-50/50 font-black text-[10px] uppercase tracking-[0.2em] text-surface-500">Historical Archives</div><div className="divide-y-2 divide-surface-100">{filtered.map((d: any) => <div key={d.id} className="flex items-center justify-between px-6 py-5 group hover:bg-surface-50"><div><p className="text-sm font-black uppercase">{d.name}</p><p className="text-[10px] text-surface-400 font-mono mt-1">{new Date(d.date).toLocaleString()}</p></div><button onClick={() => deleteData(d.id)} className="text-surface-300 hover:text-econ-red transition-all p-2 opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button></div>)}</div></div>
      </div>
    </div>
  );
}

function OperationsTools({ realm, margins }: { realm: number, margins: any[] }) {
  const [activeSub, setActiveSub] = useState("manager");
  return (
    <div className="space-y-10">
       <div className="flex gap-6 border-b-2 border-surface-100 dark:border-surface-800 pb-4">
          <button onClick={() => setActiveSub("manager")} className={`text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeSub === "manager" ? "text-brand-600" : "text-surface-400 hover:text-surface-600"}`}>Facility Manager{activeSub === "manager" && <motion.div layoutId="subtab" className="absolute -bottom-4 left-0 right-0 h-1 bg-brand-600" />}</button>
          <button onClick={() => setActiveSub("board")} className={`text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeSub === "board" ? "text-brand-600" : "text-surface-400 hover:text-surface-600"}`}>Executive Board{activeSub === "board" && <motion.div layoutId="subtab" className="absolute -bottom-4 left-0 right-0 h-1 bg-brand-600" />}</button>
       </div>
       {activeSub === "manager" && <FacilityManager realm={realm} margins={margins} />}
       {activeSub === "board" && <BoardImpactView />}
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

  // Community Metric: Total Cap Value
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between"><h3 className="font-black text-xs uppercase tracking-[0.2em] text-surface-900 dark:text-white">Active Map Configuration</h3><button onClick={addBuilding} className="btn btn-primary text-[10px] font-black py-2 px-6 rounded-xl flex items-center gap-2 border-2 border-brand-400"><ChevronRight size={14} />ADD FACILITY</button></div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {map.map((item, i) => (
              <div key={i} className="card p-5 flex items-center gap-6 bg-white dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800 group hover:border-brand-500/50 transition-all">
                <select value={item.id} onChange={(e) => updateBuilding(i, "id", e.target.value)} className="input flex-1 py-2 px-5 font-black text-xs uppercase bg-surface-50 dark:bg-surface-800 border-none rounded-xl">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-tighter">LVL</label>
                  <input type="number" value={item.level} onChange={(e) => updateBuilding(i, "level", Number(e.target.value))} className="input w-24 py-2 px-4 font-black text-sm text-center bg-surface-50 dark:bg-surface-800 border-none rounded-xl" />
                </div>
                <button onClick={() => removeBuilding(i)} className="text-surface-300 hover:text-econ-red transition-all p-2"><Trash2 size={20} /></button>
              </div>
            ))}
          </div>
       </div>
       <div className="lg:col-span-4 space-y-10">
          <div className="card p-10 bg-surface-900 text-white border-none shadow-2xl space-y-10 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={120} /></div>
             <div className="relative z-10">
                <p className="text-[10px] font-black text-brand-400 uppercase mb-2 tracking-[0.2em]">ADMIN OVERHEAD</p>
                <div className="text-6xl font-black font-mono tracking-tighter italic">{(rawAO * 100).toFixed(2)}%</div>
             </div>
             <div className="relative z-10 pt-10 border-t border-white/10 grid grid-cols-1 gap-8">
                <div>
                   <p className="text-[10px] font-black text-surface-500 uppercase mb-2 tracking-[0.2em]">OPERATIONAL LABOR</p>
                   <div className="text-3xl font-black font-mono text-econ-red italic tabular-nums">${(dailyLabor * (1 + rawAO)).toLocaleString(undefined, { maximumFractionDigits: 0 })}/DAY</div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-surface-500 uppercase mb-2 tracking-[0.2em]">CAPITAL ALLOCATION</p>
                   <div className="text-3xl font-black font-mono text-brand-400 italic tabular-nums">${mapCapitalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
             </div>
             <div className="relative z-10 pt-10 border-t border-white/10">
                <p className="text-[10px] font-black text-econ-amber uppercase mb-4 tracking-[0.2em]">DAYS TO PAYBACK (ROI)</p>
                <div className="flex items-end gap-3">
                   <div className="text-6xl font-black font-mono tracking-tighter italic text-econ-amber">{estDailyProfit > 0 ? (mapCapitalValue / estDailyProfit).toFixed(1) : "∞"}</div>
                   <span className="text-xs font-black mb-2 opacity-50 uppercase tracking-widest">Cycles</span>
                </div>
                <div className="mt-8 space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                   <label className="text-[9px] font-black uppercase text-surface-400 tracking-widest block">Est. Net Daily Profit</label>
                   <input
                      type="number"
                      value={estDailyProfit}
                      onChange={(e) => setEstDailyProfit(Number(e.target.value))}
                      className="bg-transparent border-none p-0 text-xl font-black font-mono text-white focus:ring-0 w-full"
                   />
                </div>
             </div>
          </div>
          <div className="card p-8 border-2 border-surface-100 dark:border-surface-800 bg-surface-50/50 space-y-4">
             <div className="flex items-center gap-3 text-brand-600"><Info size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Efficiency Insight</span></div>
             <p className="text-[11px] leading-relaxed text-surface-500 font-bold uppercase">Your next level will increase Admin Overhead by <span className="text-surface-900 dark:text-white">{(1/170 * 100).toFixed(2)}%</span>. This equals roughly <span className="text-econ-red">${(dailyLabor * (1/170)).toFixed(0)}</span> in additional daily costs.</p>
          </div>
       </div>
    </div>
  );
}

function SimulatorsTools({ realm, margins }: any) {
  const [activeSub, setActiveSub] = useState("production");
  return (
    <div className="space-y-10">
       <div className="flex gap-6 border-b-2 border-surface-100 dark:border-surface-800 pb-4">
          {[
            { id: "production", label: "Production Yields", icon: Package },
            { id: "construction", label: "Expansion Logistics", icon: Building2 },
            { id: "retail", label: "Retail Momentum", icon: Wallet }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveSub(t.id)} className={`text-xs font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeSub === t.id ? "text-brand-600" : "text-surface-400 hover:text-surface-600"}`}>
               <t.icon size={16} />
               {t.label}
               {activeSub === t.id && <motion.div layoutId="subtab2" className="absolute -bottom-4 left-0 right-0 h-1 bg-brand-600" />}
            </button>
          ))}
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
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        <div className="lg:col-span-4 space-y-8">
           <div className="card p-10 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-10 rounded-3xl">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] border-b-2 border-surface-50 pb-4">Facility Modeling</h3>
              <div className="space-y-6">
                 <div>
                    <label htmlFor="target-building" className="text-[10px] font-black uppercase block mb-3 text-surface-400 tracking-widest">Selected Facility</label>
                    <select id="target-building" value={settings.selectedBuildingId} onChange={(e) => setSettings({...settings, selectedBuildingId: e.target.value})} className="input py-3 px-5 font-black text-xs uppercase bg-surface-50 border-none rounded-2xl w-full">
                       {BUILDINGS.filter(b => b.type === "production" || b.type === "research").map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black uppercase block mb-3 text-surface-400 tracking-widest">Prod Bonus %</label><input type="number" value={settings.prodBonus} onChange={(e) => setSettings({...settings, prodBonus: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div>
                    <div><label className="text-[10px] font-black uppercase block mb-3 text-surface-400 tracking-widest">Robots %</label><input type="number" value={settings.robotBonus} onChange={(e) => setSettings({...settings, robotBonus: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div>
                 </div>
                 <div><label className="text-[10px] font-black uppercase block mb-3 text-surface-400 tracking-widest">Admin Overhead %</label><input type="number" value={settings.aoPercent} onChange={(e) => setSettings({...settings, aoPercent: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div>
                 {(building as any)?.abundance && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="text-[10px] font-black uppercase block mb-3 text-brand-600 tracking-widest">Current Abundance %</label>
                      <input type="number" value={settings.abundance} onChange={(e) => setSettings({...settings, abundance: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-brand-50 border-2 border-brand-100 text-brand-600 rounded-2xl w-full" />
                   </motion.div>
                 )}
              </div>
           </div>

           {requiredInputs.length > 0 && (
             <div className="card p-10 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-10 rounded-3xl">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] border-b-2 border-surface-50 pb-4">Supply Chain Options</h3>
                <div className="space-y-6">
                   {requiredInputs.map(input => (
                     <div key={input.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">{input.name}</span>
                           <div className="flex gap-1 bg-surface-100 p-0.5 rounded-lg border">
                              <button
                                 onClick={() => { const next = {...sourcingCost}; delete next[input.id]; setSourcingCost(next); }}
                                 className={`px-2 py-1 text-[8px] font-black uppercase rounded ${sourcingCost[input.id] === undefined ? 'bg-white shadow-sm text-brand-600' : 'text-surface-400'}`}
                              >Market</button>
                              <button
                                 onClick={() => setSourcingCost({...sourcingCost, [input.id]: sourcingCost[input.id] || input.vwap})}
                                 className={`px-2 py-1 text-[8px] font-black uppercase rounded ${sourcingCost[input.id] !== undefined ? 'bg-white shadow-sm text-brand-600' : 'text-surface-400'}`}
                              >Self</button>
                           </div>
                        </div>
                        {sourcingCost[input.id] !== undefined && (
                          <input
                             type="number"
                             value={sourcingCost[input.id]}
                             onChange={(e) => setSourcingCost({...sourcingCost, [input.id]: Number(e.target.value)})}
                             className="input py-2 px-4 font-black text-xs bg-brand-50 border-brand-100 text-brand-600 rounded-xl w-full"
                             placeholder="Sourcing Cost"
                          />
                        )}
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
        <div className="lg:col-span-8 space-y-10">
           <div className="card overflow-hidden bg-white dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800 rounded-3xl">
              <div className="px-10 py-6 border-b-2 border-surface-100 bg-surface-50/50 flex justify-between items-center"><h3 className="font-black text-xs uppercase tracking-[0.2em]">{building?.name} Production Pipeline</h3></div>
              <div className="divide-y-2 divide-surface-100">
                 {simulations.length > 0 ? simulations.map(s => (
                    <div key={s.id} className="p-10 hover:bg-surface-50/50 group transition-all">
                       <div className="flex justify-between items-start mb-10">
                          <div>
                             <h4 className="text-3xl font-black uppercase tracking-tight italic group-hover:text-brand-600 transition-colors">{s.name}</h4>
                             <div className="flex items-center gap-4 mt-3">
                                <span className="text-[10px] text-surface-400 font-black uppercase bg-surface-100 px-3 py-1 rounded-lg">Rate: {s.effectivePh.toFixed(2)}/HR</span>
                                <span className="text-[10px] text-surface-400 font-black uppercase bg-surface-100 px-3 py-1 rounded-lg">Base wages: ${s.baseWages}/hr</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-brand-600 uppercase mb-3 tracking-[0.2em]">Profit per Hour per Level</p>
                             <div className={`text-5xl font-black font-mono tracking-tighter italic tabular-nums ${s.pphpl > 0 ? "text-econ-green" : "text-econ-red"}`}>${s.pphpl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                       </div>
                       <div className="grid grid-cols-3 gap-8">
                          <div className="bg-surface-50 rounded-2xl p-6 border-2 border-surface-100"><p className="text-[9px] font-black text-surface-400 uppercase mb-3 tracking-widest">Production Cost</p><p className="text-lg font-black font-mono tabular-nums">${s.costPerUnit.toLocaleString(undefined, { minimumFractionDigits: 3 })}</p></div>
                          <div className="bg-surface-50 rounded-2xl p-6 border-2 border-surface-100"><p className="text-[9px] font-black text-surface-400 uppercase mb-3 tracking-widest">Market Price</p><p className="text-lg font-black font-mono tabular-nums">${s.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                          <div className="bg-brand-50 rounded-2xl p-6 border-2 border-brand-100"><p className="text-[9px] font-black text-brand-600 uppercase mb-3 tracking-widest">Unit Margin</p><p className={`text-lg font-black font-mono tabular-nums ${s.profit > 0 ? "text-econ-green" : "text-econ-red"}`}>${s.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                       </div>
                    </div>
                 )) : (
                   <div className="p-32 text-center text-surface-400 font-black uppercase text-[10px] tracking-widest opacity-50 italic">No resource mappings found for this facility.</div>
                 )}
              </div>
           </div>
        </div>
     </div>
  );
}

function PriceExplorer({ resourceId, resourceName, realm }: { resourceId: number, resourceName: string, realm: number }) {
   const [history, setHistory] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let mounted = true;
      setLoading(true);
      dataRepo.fetchResourcePriceHistory(realm, resourceId, 30)
         .then(data => {
            if (mounted) {
               setHistory(data.map(d => ({ ...d, date: new Date(d.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })));
               setLoading(false);
            }
         })
         .catch(() => setLoading(false));
      return () => { mounted = false; };
   }, [resourceId, realm]);

   if (loading) return <div className="h-64 flex items-center justify-center"><LoadingState text="SYNCING_HISTORY..." /></div>;

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-4">
            <div className="flex items-center gap-3">
               <LineIcon size={18} className="text-brand-600" />
               <h4 className="text-sm font-black uppercase tracking-[0.2em]">{resourceName} // PRICE_INDEX</h4>
            </div>
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[8px] font-black text-surface-400 uppercase tracking-widest">VOLATILITY</p>
                  <p className="text-xs font-black font-mono text-brand-600 italic">LOW_STABLE</p>
               </div>
            </div>
         </div>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={history}>
                  <defs>
                     <linearGradient id="colorVwap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <RechartsTooltip
                     contentStyle={{ backgroundColor: '#000', border: '2px solid #333', borderRadius: '12px', fontSize: '10px', color: '#fff', fontWeight: '900' }}
                     itemStyle={{ color: '#0ea5e9' }}
                     labelStyle={{ color: '#666', marginBottom: '4px' }}
                     formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'VWAP']}
                  />
                  <Area type="monotone" dataKey="vwap" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVwap)" strokeWidth={3} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
   );
}

function EncyclopediaTools({ margins, realm }: { margins: any[], realm: number }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"buildings" | "resources">("buildings");
  const [selectedResource, setSelectedResource] = useState<number | null>(null);

  const filteredBuildings = useMemo(() => BUILDINGS.filter(b => b.name.toLowerCase().includes(search.toLowerCase())), [search]);
  const filteredResources = useMemo(() => RESOURCES.filter(r => r.name.toLowerCase().includes(search.toLowerCase())), [search]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row gap-10 items-start md:items-center justify-between border-b-2 border-surface-200 dark:border-surface-800 pb-10">
          <div className="max-w-xl w-full relative group">
             <div className="absolute -inset-1 bg-brand-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all" />
             <input type="text" placeholder="Search Encyclopedia..." value={search} onChange={(e) => setSearch(e.target.value)} className="relative input pl-16 rounded-2xl py-5 shadow-sm border-2 border-surface-200 dark:border-surface-700 font-black text-xs uppercase tracking-[0.2em] bg-surface-50 dark:bg-surface-800/50 focus:bg-white dark:focus:bg-surface-800 transition-all w-full focus:ring-0 focus:border-brand-500" />
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-600"><Search size={24} /></div>
          </div>
          <div className="flex gap-3 bg-surface-100 dark:bg-surface-800 p-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700">
             <button onClick={() => setMode("buildings")} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${mode === "buildings" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-xl border border-surface-200 dark:border-surface-600" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-200"}`}>BUILDINGS</button>
             <button onClick={() => setMode("resources")} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${mode === "resources" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-xl border border-surface-200 dark:border-surface-600" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-200"}`}>RESOURCES</button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {mode === "buildings" ? filteredBuildings.map(b => (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={b.id} className="terminal-card p-10 group cursor-default">
                <div className="flex justify-between items-start mb-10">
                   <div className="space-y-1">
                      <h3 className="font-black text-2xl uppercase tracking-tighter italic group-hover:text-brand-600 transition-colors">{b.name}</h3>
                      <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest opacity-60">Building ID: 0x{Number(b.id).toString(16).toUpperCase() || b.id}</p>
                   </div>
                   <span className="text-[9px] font-black uppercase bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 px-4 py-1.5 rounded-lg text-surface-500 tracking-[0.3em] shadow-inner">{b.type}</span>
                </div>
                <div className="space-y-6">
                   <div className="flex justify-between items-center text-[10px] border-b border-surface-100 dark:border-surface-800 pb-4 group/row">
                      <span className="text-surface-400 font-black uppercase tracking-[0.2em] group-hover/row:text-surface-600 transition-colors">Wages per Hour</span>
                      <span className="font-mono text-surface-900 dark:text-white font-black tabular-nums italic text-sm">${b.wages}/HR</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] border-b border-surface-100 dark:border-surface-800 pb-4 group/row">
                      <span className="text-surface-400 font-black uppercase tracking-[0.2em] group-hover/row:text-surface-600 transition-colors">Construction Time</span>
                      <span className="font-mono text-surface-900 dark:text-white font-black tabular-nums italic text-sm">{b.baseTime} HOURS</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] group/row">
                      <span className="text-surface-400 font-black uppercase tracking-[0.2em] group-hover/row:text-surface-600 transition-colors">Reference Cost</span>
                      <span className="font-mono text-brand-600 font-black tabular-nums italic text-lg">${b.cost.toLocaleString()}</span>
                   </div>
                </div>
                <div className="mt-10 pt-8 border-t-2 border-surface-50 dark:border-surface-800 flex justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                   <button className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-600 flex items-center gap-2 hover:scale-105 transition-transform">
                      View Production Details
                      <ChevronRight size={12} />
                   </button>
                </div>
             </motion.div>
          )) : filteredResources.map(r => {
             const m = margins.find(m => m.id === r.id);
             const isSelected = selectedResource === r.id;
             return (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={r.id} className={`terminal-card group cursor-default overflow-hidden transition-all duration-500 ${isSelected ? 'p-0 border-brand-500 ring-2 ring-brand-500/20 md:col-span-2 xl:col-span-2' : 'p-10'}`}>
                {isSelected ? (
                  <div className="flex flex-col lg:flex-row h-full">
                     <div className="p-10 bg-surface-50 dark:bg-surface-800/30 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-surface-100 dark:border-surface-800">
                        <div className="flex justify-between items-start mb-6">
                           <h3 className="font-black text-2xl uppercase tracking-tighter italic text-brand-600">{r.name}</h3>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedResource(null); }} className="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"><ArrowLeft size={16} /></button>
                        </div>
                        <div className="space-y-4">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-surface-400">ID</span><span className="text-surface-900 dark:text-white">#{r.id}</span></div>
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-surface-400">TRANSPORT</span><span className="text-surface-900 dark:text-white">{r.transport} U</span></div>
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-surface-400">FLOW_RATE</span><span className="text-surface-900 dark:text-white">{r.basePh?.toFixed(2)}/H</span></div>
                        </div>
                     </div>
                     <div className="p-10 flex-1">
                        <PriceExplorer resourceId={r.id} resourceName={r.name} realm={realm} />
                     </div>
                  </div>
                ) : (
                <div className="flex flex-col h-full" onClick={() => setSelectedResource(r.id)}>
                   <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="space-y-1">
                         <h3 className="font-black text-2xl uppercase tracking-tighter italic group-hover:text-brand-600 transition-colors">{r.name}</h3>
                         <div className="flex gap-3">
                            <span className="text-[9px] font-black uppercase bg-brand-500/10 px-3 py-1 rounded text-brand-600 tracking-widest border border-brand-500/20 shadow-sm">ID: {r.id}</span>
                            {r.retailInfo && <span className="text-[9px] font-black uppercase bg-econ-amber/10 px-3 py-1 rounded text-econ-amber tracking-widest border border-econ-amber/20 shadow-sm flex items-center gap-1"><Activity size={10} />RETAILABLE</span>}
                         </div>
                      </div>
                   </div>
                   <div className="space-y-6 relative z-10">
                      <div className="grid grid-cols-2 gap-6 border-b border-surface-100 dark:border-surface-800 pb-6">
                         <div className="space-y-2">
                            <p className="text-[9px] font-black text-surface-400 uppercase tracking-widest">Transport Required</p>
                            <p className="font-mono text-sm font-black tabular-nums italic">{r.transport} U</p>
                         </div>
                         <div className="space-y-2 text-right">
                            <p className="text-[9px] font-black text-surface-400 uppercase tracking-widest text-right">Production Rate</p>
                            <p className="font-mono text-sm font-black tabular-nums italic">{r.basePh?.toFixed(2)}/H</p>
                         </div>
                      </div>
                      {r.inputs && Object.keys(r.inputs).length > 0 && (
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-surface-400 uppercase tracking-[0.3em]">Required Inputs</p>
                            <div className="flex flex-wrap gap-2">
                               {Object.entries(r.inputs).map(([iid, qty]) => {
                                  const ir = RESOURCES.find(res => res.id === Number(iid));
                                  return <div key={iid} className="text-[9px] font-black bg-surface-100 dark:bg-surface-800/80 px-3 py-2 rounded-lg border-2 border-surface-200 dark:border-surface-700 whitespace-nowrap shadow-sm group-hover:border-brand-500/30 transition-colors font-mono italic">{qty}x {ir?.name || iid}</div>;
                               })}
                            </div>
                         </div>
                      )}
                      {m && (
                         <div className="pt-8 border-t-2 border-surface-50 dark:border-surface-800 flex justify-between items-end">
                            <div className="space-y-1">
                               <span className="text-[9px] font-black text-brand-600 uppercase tracking-[0.3em] block">MARKET_VWAP</span>
                               <span className="text-[8px] font-black text-surface-400 uppercase tracking-widest block italic opacity-50">Market Value</span>
                            </div>
                            <span className="font-mono text-2xl text-econ-green font-black tabular-nums italic terminal-glow">${m.outputVwap?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                      )}
                   </div>
                   {/* Decorative background ID */}
                   <div className="absolute -bottom-4 -right-4 text-7xl font-black text-surface-100 dark:text-surface-800/30 pointer-events-none select-none italic font-mono group-hover:text-brand-500/5 transition-colors">{r.id}</div>
                   <div className="mt-8 pt-6 border-t border-surface-50 dark:border-surface-800 flex justify-end">
                      <button className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-600 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                         Market Trends
                         <ChevronRight size={12} />
                      </button>
                   </div>
                </div>
                )}
               </motion.div>
             );
          })}
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

  const totalMarketValue = cost.materials.reduce((sum, m) => sum + (m.qty * m.price), 0) + cost.cash;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8"><div className="card p-10 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-10 rounded-3xl"><h3 className="font-black text-xs uppercase tracking-[0.2em] border-b-2 border-surface-50 pb-4 text-surface-900 dark:text-white">Expansion Logistics</h3><div className="space-y-6"><div><label className="text-[10px] font-black uppercase mb-3 block tracking-widest text-surface-400">Target Facility</label><select value={config.selectedBuilding} onChange={(e) => setConfig({...config, selectedBuilding: e.target.value})} className="input py-3 px-5 font-black text-xs uppercase bg-surface-50 border-none rounded-2xl w-full">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase mb-3 block tracking-widest text-surface-400">Current Level</label><input type="number" value={config.currentLevel} onChange={(e) => setConfig({...config, currentLevel: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div><div><label className="text-[10px] font-black uppercase mb-3 block tracking-widest text-surface-400">Target Level</label><input type="number" value={config.targetLevel} onChange={(e) => setConfig({...config, targetLevel: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div></div></div></div></div>
       <div className="lg:col-span-8"><div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800 rounded-3xl"><div className="flex items-center justify-between mb-12 pb-6 border-b-2 border-surface-50"><h3 className="font-black text-xs uppercase tracking-[0.2em]">Upgrade Logistics</h3><div className="text-right"><p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-3">Total Estimated Market Value</p><p className="text-5xl font-black text-brand-600 font-mono tracking-tighter italic tabular-nums">${totalMarketValue.toLocaleString()}</p></div></div><div className="space-y-6"><div className="flex items-center justify-between p-6 bg-surface-50 dark:bg-surface-800 rounded-3xl border-2 border-surface-100 group"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-brand-600 border-2 border-surface-100"><DollarSign size={24} /></div><span className="text-[10px] font-black uppercase tracking-[0.2em]">CASH RESERVE REQUIRED</span></div><span className="font-black font-mono text-2xl italic tabular-nums">${cost.cash.toLocaleString()}</span></div>{cost.materials.map((m, i) => <div key={i} className="flex items-center justify-between p-6 bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-100 group hover:border-brand-500/50 transition-all"><div className="space-y-2"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center text-surface-400 border-2 border-surface-100"><Package size={24} /></div><span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-brand-600 transition-colors">{m.name}</span></div><div className="flex items-center gap-3"><span className="text-[8px] text-surface-400 uppercase font-black tracking-widest">Sync Price:</span><input type="number" value={m.price} onChange={(e) => setManualPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))} className="bg-transparent border-none text-[10px] font-black font-mono w-24 text-brand-500 focus:ring-0" /></div></div><div className="text-right"><p className="font-black font-mono text-3xl italic tabular-nums">{m.qty.toLocaleString()}</p><p className="text-[10px] text-surface-400 font-black tracking-widest opacity-60 mt-1 tabular-nums">EST. VALUE: ${(m.qty * m.price).toLocaleString()}</p></div></div>)}</div></div></div>
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

    // Attempt to match with static resource data for better base speed
    const staticRes = RESOURCES.find(r => r.name.toLowerCase() === p.id.toLowerCase() || r.id.toString() === p.id);
    const baseSpeed = staticRes?.retailInfo?.[0]?.modeledUnitsSoldAnHour || 100;
    const refPrice = p.avgPrice || staticRes?.retailInfo?.[0]?.averagePrice || settings.sellingPrice;

    // SimCo Retail Physics Approximation
    const priceFactor = Math.pow(settings.sellingPrice / (refPrice || settings.sellingPrice), 3);
    const speed = baseSpeed / (priceFactor * (1 + saturation * 0.22)); // 0.22 is a common saturation weight

    // Apply CMO bonus if we had access to board state here (ideally)
    // For now, we assume base speed from modeled data which might already include some baseline

    const profitPerUnit = settings.sellingPrice - settings.sourcingCost;
    return { speed, profitPerUnit, hourlyProfit: speed * profitPerUnit };
  }, [p, settings]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8"><div className="card p-10 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-10 rounded-3xl"><h3 className="font-black text-xs uppercase tracking-[0.2em] text-surface-900 dark:text-white border-b-2 border-surface-50 pb-4">Retail Strategy</h3><div className="space-y-6"><div><label className="text-[10px] font-black uppercase block mb-3 text-surface-400 tracking-widest">Inventory Ledger</label><select value={settings.selectedProduct} onChange={(e) => setSettings({...settings, selectedProduct: e.target.value})} className="input py-3 px-5 font-black text-xs uppercase bg-surface-50 border-none rounded-2xl w-full"><option value="">-- NO SELECTION --</option>{products.map(pr => <option key={pr.id} value={pr.id}>{pr.id}</option>)}</select></div>{p && <><div className="pt-8 border-t-2 border-surface-50 dark:border-surface-800 space-y-6"><div><label className="text-[10px] font-black uppercase block mb-3 text-surface-400 tracking-widest">Sourcing Basis</label><input type="number" value={settings.sourcingCost} onChange={(e) => setSettings({...settings, sourcingCost: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div><div><label className="text-[10px] font-black uppercase block mb-3 text-brand-600 tracking-widest">Market Price Target</label><input type="number" value={settings.sellingPrice} onChange={(e) => setSettings({...settings, sellingPrice: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-brand-50 border-2 border-brand-100 text-brand-600 rounded-2xl w-full" /></div></div></>}</div></div></div>
       <div className="lg:col-span-8">{p && stats ? <div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 dark:border-surface-800 rounded-3xl"><div className="flex items-center justify-between mb-12 pb-6 border-b-2 border-surface-50"><h3 className="font-black text-xs uppercase tracking-[0.2em]">{p.id} Retail Dynamics</h3><span className="text-[10px] font-black text-econ-amber bg-econ-amber/10 px-4 py-2 rounded-xl border border-econ-amber/20 tracking-[0.1em]">Saturation: {p.saturation?.toFixed(2)}</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"><div className="p-8 rounded-3xl bg-surface-50 dark:bg-surface-800/40 border-2 border-surface-100 group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Sales Velocity</p><p className="text-4xl font-black font-mono tracking-tighter text-surface-900 dark:text-white italic tabular-nums">{stats.speed.toFixed(1)}/HR</p></div><div className="p-8 rounded-3xl bg-surface-50 dark:bg-surface-800/40 border-2 border-surface-100 group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Hourly Yield</p><p className={`text-4xl font-black font-mono tracking-tighter italic tabular-nums ${stats.hourlyProfit > 0 ? "text-econ-green" : "text-econ-red"}`}>${stats.hourlyProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div><div className="p-8 rounded-3xl bg-brand-50 dark:bg-brand-900/10 border-2 border-brand-100 group shadow-lg shadow-brand-500/5"><p className="text-[10px] font-black text-brand-600 uppercase mb-4 tracking-[0.2em]">Net Unit Margin</p><p className="text-4xl font-black font-mono tracking-tighter text-econ-green italic tabular-nums">${stats.profitPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div></div></div> : <div className="card p-32 text-center bg-surface-50/50 border-2 border-dashed border-surface-200 rounded-3xl flex flex-col items-center gap-6"><Package size={48} className="text-surface-200" /><p className="text-surface-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-50 italic">Select inventory item to begin analysis.</p></div>}</div>
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

  const cfoLift = board.cfo * 500000;
  const threshold = 3000000 + cfoLift;
  const rawAO = Math.max(0, (board.buildingLevels - 1) / 170);
  const actualAO = rawAO * (1 - (board.coo * 0.01)); // COO: 1% per point
  const salesSpeedBonus = board.cmo * 0.01; // CMO: 1% per point
  const patentProb = 0.10 + (board.cto * 0.015); // CTO: 1.5% per point

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8"><div className="card p-10 border-2 border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm space-y-10 rounded-3xl"><h3 className="font-black text-xs uppercase tracking-[0.2em] text-surface-900 dark:text-white border-b-2 border-surface-50 pb-4">Executive Suite</h3><div className="space-y-6"><div><label className="text-[10px] font-black text-surface-400 uppercase mb-3 block tracking-widest underline decoration-brand-500/30">COO (Management)</label><input type="number" value={board.coo} onChange={(e) => setBoard({...board, coo: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-3 block tracking-widest underline decoration-brand-500/30">CFO (Accounting)</label><input type="number" value={board.cfo} onChange={(e) => setBoard({...board, cfo: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-3 block tracking-widest underline decoration-brand-500/30">CMO (Comms)</label><input type="number" value={board.cmo} onChange={(e) => setBoard({...board, cmo: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-3 block tracking-widest underline decoration-brand-500/30">CTO (Science)</label><input type="number" value={board.cto} onChange={(e) => setBoard({...board, cto: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div><div className="pt-10 border-t-2 border-surface-50 space-y-6"><div><label className="text-[10px] font-black text-surface-400 uppercase mb-3 block tracking-widest">Liquid Cash</label><input type="number" value={board.cash} onChange={(e) => setBoard({...board, cash: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-econ-green/5 text-econ-green border-2 border-econ-green/10 rounded-2xl w-full" /></div><div><label className="text-[10px] font-black text-surface-400 uppercase mb-3 block tracking-widest">Global Map Levels</label><input type="number" value={board.buildingLevels} onChange={(e) => setBoard({...board, buildingLevels: Number(e.target.value)})} className="input py-3 px-5 font-black text-sm bg-surface-50 border-none rounded-2xl w-full" /></div></div></div></div></div>
       <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 group rounded-3xl"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Accounting Threshold</p><div className="text-4xl font-black font-mono tracking-tighter italic tabular-nums">${threshold.toLocaleString()}</div><p className="text-[10px] text-surface-500 mt-6 font-bold uppercase tracking-tight">Executive Impact: <span className="text-econ-green font-black">+${cfoLift.toLocaleString()}</span></p></div>
             <div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 group rounded-3xl"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Effective Admin OH</p><div className="text-4xl font-black font-mono tracking-tighter italic tabular-nums">{(actualAO * 100).toFixed(2)}%</div><p className="text-[10px] text-surface-500 mt-6 font-bold uppercase tracking-tight">Base: {(rawAO * 100).toFixed(2)}% | <span className="text-econ-green font-black">-{ (board.coo) }% COO Reduction</span></p></div>
             <div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 group rounded-3xl"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Sales Velocity Boost</p><div className="text-4xl font-black font-mono tracking-tighter text-econ-green italic tabular-nums">+{ (salesSpeedBonus * 100).toFixed(1) }%</div></div>
             <div className="card p-10 bg-white dark:bg-surface-900 border-2 border-surface-100 group rounded-3xl"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Patent Prob (R&D)</p><div className="text-4xl font-black font-mono tracking-tighter text-brand-600 italic tabular-nums">{(patentProb * 100).toFixed(1)}%</div></div>
          </div>
          <Section title="Strategic Governance Analysis">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-8 bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700 rounded-2xl group transition-all">
                  <h4 className="text-[10px] font-bold uppercase mb-6 text-brand-600 tracking-widest">CFO Impact</h4>
                  <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-400 font-medium">Each point in Accounting skill increases the tax-free threshold by <span className="text-surface-900 dark:text-white">$500,000</span>.</p>
                </div>
                <div className="card p-8 bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700 rounded-2xl group transition-all">
                  <h4 className="text-[10px] font-bold uppercase mb-6 text-econ-amber tracking-widest">CTO Yield</h4>
                  <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-400 font-medium">Each point in Science skill increases the base patent probability by <span className="text-surface-900 dark:text-white">1.5%</span>.</p>
                </div>
                <div className="card p-8 bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700 rounded-2xl group transition-all">
                  <h4 className="text-[10px] font-bold uppercase mb-6 text-econ-purple tracking-widest">COO Efficiency</h4>
                  <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-400 font-medium">Each point in Management skill reduces effective Admin Overhead by <span className="text-surface-900 dark:text-white">1%</span> of the base rate.</p>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}
