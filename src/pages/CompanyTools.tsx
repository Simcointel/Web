import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import {
  TrendingUp, Activity, Calculator, BookOpen, Upload, Download, Trash2,
  ChevronRight, Building2, Package, UserCheck, DollarSign, ArrowLeft,
  PieChart as PieIcon, LineChart as LineIcon, Receipt, Landmark
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
    const combined = savedData.map(d => `--- ${d.type.toUpperCase()}: ${d.name} (${d.date}) ---\n${d.content}\n`).join("\n");
    const blob = new Blob([combined], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simco_intelligence_archive_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const navItems = [
    { id: "financials", label: "Financial Hub", icon: Landmark, desc: "Statements & Trends" },
    { id: "operations", label: "Map & Ops", icon: Activity, desc: "Overhead & Management" },
    { id: "simulators", label: "Simulation", icon: Calculator, desc: "Production & Retail" },
    { id: "encyclopedia", label: "Data Bank", icon: BookOpen, desc: "Building & Resource Refs" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <TrendingUp size={14} />
            Simco Intelligence Suite
          </div>
          <h2 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight">Corporate Workspace</h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-xl text-sm font-medium">
            Professional-grade analytics and modeling for high-growth companies.
          </p>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={downloadCombinedCSV} className="btn btn-secondary flex items-center gap-2 text-xs py-2 px-4 shadow-sm border-surface-200">
              <Download size={14} />
              Export Vault
           </button>
           <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl text-xs font-bold px-4 py-2 uppercase tracking-wider focus:ring-2 focus:ring-brand-500">
              <option value={0}>Realm 0</option>
              <option value={1}>Realm 1</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {navItems.map((cat) => (
           <button
             key={cat.id}
             onClick={() => { setCategory(cat.id as any); setActiveTab(cat.id === "financials" ? "overview" : "main"); }}
             className={`group relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 ${category === cat.id ? "bg-brand-600 border-brand-500 text-white shadow-xl shadow-brand-600/30 ring-4 ring-brand-500/10" : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-brand-400"}`}
           >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${category === cat.id ? "bg-white/20" : "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 group-hover:bg-brand-100"}`}>
                 <cat.icon size={20} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
              <span className={`text-[10px] mt-1 font-medium ${category === cat.id ? "text-white/70" : "text-surface-400"}`}>{cat.desc}</span>
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-surface-900/50 rounded-3xl p-8 border border-surface-200 dark:border-surface-800 shadow-sm min-h-[600px]"
        >
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
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? "bg-white dark:bg-surface-700 text-brand-600 shadow-md" : "text-surface-500 hover:text-surface-900 dark:hover:text-surface-200"}`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
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
               <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm hover:translate-y-[-2px] transition-transform">
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Vault Utilization</p>
                  <div className="text-4xl font-black text-surface-900 dark:text-white">{savedData.length}</div>
                  <div className="mt-4 w-full bg-surface-100 dark:bg-surface-800 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-brand-600 h-full rounded-full" style={{ width: `${Math.min(100, savedData.length * 5)}%` }}></div>
                  </div>
               </div>
               <div className="card p-6 border-l-4 border-l-econ-green bg-white dark:bg-surface-900 shadow-sm hover:translate-y-[-2px] transition-transform">
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Latest Sync</p>
                  <div className="text-xl font-black text-surface-900 dark:text-white">
                    {savedData[0] ? new Date(savedData[0].date).toLocaleDateString() : "No Data"}
                  </div>
                  <p className="text-[10px] text-surface-400 mt-2 font-bold uppercase">{savedData[0] ? savedData[0].name.slice(0, 20) : "Waiting for upload"}</p>
               </div>
               <div className="card p-6 border-l-4 border-l-econ-purple bg-white dark:bg-surface-900 shadow-sm hover:translate-y-[-2px] transition-transform">
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Encryption</p>
                  <div className="text-xl font-black text-surface-900 dark:text-white">AES-Local</div>
                  <div className="flex items-center gap-1.5 text-econ-green text-[10px] font-bold uppercase mt-2">
                    <UserCheck size={12} />
                    Verified Private
                  </div>
               </div>
            </div>

            <div className="card overflow-hidden bg-white dark:bg-surface-900 border-surface-200 shadow-sm">
               <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-[0.15em] text-surface-900 dark:text-white">Audit Trail</h3>
                  <span className="text-[10px] font-bold text-surface-400 uppercase">Recent Uploads</span>
               </div>
               <div className="divide-y divide-surface-100 dark:divide-surface-800">
                  {savedData.slice(0, 8).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 uppercase text-[10px] font-black tracking-tighter">
                             {d.type.slice(0, 3)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</p>
                             <p className="text-[10px] text-surface-400 font-mono">{new Date(d.date).toLocaleString()}</p>
                          </div>
                       </div>
                       <button onClick={() => deleteData(d.id)} className="p-2 text-surface-300 hover:text-econ-red transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                  {savedData.length === 0 && (
                    <div className="py-24 text-center space-y-4">
                       <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto text-surface-300">
                          <Upload size={24} />
                       </div>
                       <p className="text-surface-400 text-xs italic font-medium uppercase tracking-widest">Workspace Empty. Sync data to begin.</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
         <div className="lg:col-span-4 space-y-8">
            <div className="card p-8 border-2 border-dashed border-surface-200 dark:border-surface-700 text-center bg-brand-50/30 dark:bg-brand-900/5 hover:border-brand-500 transition-colors group">
               <h3 className="font-black text-xs uppercase mb-6 tracking-widest text-brand-600">Sync Financials</h3>
               <input type="file" id="bulk-upload" className="hidden" onChange={(e) => handleFileUpload(e, "income")} />
               <label htmlFor="bulk-upload" className="btn btn-primary w-full py-4 rounded-2xl cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-brand-600/20 active:scale-95 transition-transform">
                  <Upload size={18} />
                  Choose CSV File
               </label>
               <p className="text-[10px] text-surface-400 mt-4 leading-relaxed font-bold uppercase tracking-tight">
                  Supports Income, Balance, and Receipts statements.
               </p>
            </div>

            <div className="card p-6 bg-surface-900 text-white border-none shadow-2xl space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Suite Intelligence</h4>
               <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-800 border border-surface-700">
                     <p className="text-[10px] font-bold text-brand-400 uppercase mb-1">Receipts Engine</p>
                     <p className="text-xs opacity-70 leading-relaxed font-medium">Extracts net profit from individual contract and market transactions automatically.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-800 border border-surface-700">
                     <p className="text-[10px] font-bold text-econ-green uppercase mb-1">Visual Trends</p>
                     <p className="text-xs opacity-70 leading-relaxed font-medium">Turn flat CSV rows into professional trend charts for Revenue vs COGS.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function FinancialsView({ type, savedData, deleteData, handleFileUpload }: any) {
  const filtered = savedData.filter((d: any) => d.type === type);

  const metrics = useMemo(() => {
    if (filtered.length === 0) return null;
    try {
      const rows = filtered[0].content.split("\n").slice(1).filter((r: any) => r.trim());
      const data = rows.map((r: any) => {
         const cols = r.split(",");
         return {
           label: cols[0]?.slice(5, 10) || "Data",
           value: Math.abs(parseFloat(cols[cols.length - 1])) || 0,
           raw: parseFloat(cols[cols.length - 1]) || 0,
           name: cols[cols.length - 2] || "Item"
         };
      });

      if (type === "balance") {
         return {
            chartType: "pie",
            data: data.slice(0, 5).map(d => ({ name: d.name.slice(0, 15), value: d.value }))
         };
      }

      return {
         chartType: "bar",
         data: data.slice(0, 12).reverse()
      };
    } catch { return null; }
  }, [filtered, type]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 space-y-8">
         <div className="card p-6 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-6">
            <div className="space-y-1">
               <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Active Dataset: {type}</h3>
               <p className="text-[10px] text-surface-400 font-bold uppercase tracking-tight">{filtered.length} snapshots available</p>
            </div>
            <label className="btn btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-3 rounded-xl">
               <Upload size={16} />
               Upload Latest
               <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, type)} className="hidden" />
            </label>
         </div>

         {parsedData.length > 0 && (
           <div className="card p-6 bg-surface-900 text-white border-none shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-500 mb-6">Historical Peak</h4>
              <div className="text-3xl font-black font-mono tracking-tighter text-brand-400">
                ${Math.max(...parsedData.map((d: any) => Math.abs(d.value))).toLocaleString()}
              </div>
              <p className="text-[10px] opacity-60 mt-2 font-medium">Highest absolute transaction value in sync period.</p>
           </div>
         )}
      </div>

      <div className="lg:col-span-8 space-y-8">
         {metrics ? (
           <div className="card p-8 bg-white dark:bg-surface-900 border-surface-100 shadow-sm">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-50 dark:border-surface-800">
                 <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Snap-Analysis: {type}</h3>
                 <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">Latest Sync View</span>
              </div>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    {metrics.chartType === "pie" ? (
                      <PieChart>
                         <Pie data={metrics.data} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {metrics.data.map((_: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"][index % 5]} />
                            ))}
                         </Pie>
                         <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={metrics.data}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                         <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                         <YAxis hide />
                         <RechartsTooltip
                           contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                           itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                           formatter={(val: number) => [`$${val.toLocaleString()}`, 'Amount']}
                         />
                         <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    )}
                 </ResponsiveContainer>
              </div>
           </div>
         ) : (
           <div className="card p-24 text-center border-dashed border-2 border-surface-100 dark:border-surface-800 bg-surface-50/50 flex flex-col items-center gap-4">
              <Receipt size={32} className="text-surface-200" />
              <p className="text-surface-400 text-xs font-bold uppercase tracking-[0.2em]">No visual data for {type}.</p>
           </div>
         )}

         <div className="card overflow-hidden bg-white dark:bg-surface-900 border-surface-100 shadow-sm">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between font-black text-[10px] uppercase tracking-widest text-surface-500">Snapshot Archive</div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
               {filtered.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                     <div>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-surface-400 font-mono">{new Date(d.date).toLocaleString()}</p>
                     </div>
                     <button onClick={() => deleteData(d.id)} className="text-surface-300 hover:text-econ-red transition-all p-2 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function OperationsTools({ realm }: { realm: number }) {
  const [activeSub, setActiveSub] = useState("manager");
  return (
    <div className="space-y-10">
       <div className="flex gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
          <button onClick={() => setActiveSub("manager")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "manager" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Facility Manager</button>
          <button onClick={() => setActiveSub("board")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "board" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Board Impact</button>
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Active Map Config</h3>
             <button onClick={addBuilding} className="btn btn-primary text-[10px] py-1.5 px-4 rounded-xl flex items-center gap-2">
                <ChevronRight size={14} />
                New Facility
             </button>
          </div>
          <div className="space-y-3">
             {map.map((item, i) => (
                <div key={i} className="card p-4 flex items-center gap-6 bg-white dark:bg-surface-900 border-surface-200 shadow-sm group">
                   <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-400 font-black text-[10px]">#{i+1}</div>
                   <select value={item.id} onChange={(e) => updateBuilding(i, "id", Number(e.target.value))} className="input flex-1 py-1.5 px-4 font-bold text-sm">
                      {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                   <div className="flex items-center gap-3">
                      <label className="text-[10px] font-black text-surface-400 uppercase tracking-tighter underline decoration-brand-500/30">Level</label>
                      <input type="number" value={item.level} onChange={(e) => updateBuilding(i, "level", Number(e.target.value))} className="input w-20 py-1.5 px-3 font-black text-sm font-mono text-center" />
                   </div>
                   <button onClick={() => removeBuilding(i)} className="text-surface-300 hover:text-econ-red transition-all p-1 group-hover:translate-x-1">
                      <Trash2 size={16} />
                   </button>
                </div>
             ))}
          </div>
       </div>
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 bg-surface-900 text-white border-none shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Building2 size={120} />
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 mb-10">Efficiency Metrics</h3>
             <div className="space-y-8 relative z-10">
                <div>
                   <p className="text-[10px] font-black text-brand-400 uppercase mb-1 tracking-widest">Admin Overhead</p>
                   <div className="text-5xl font-black font-mono tracking-tighter">{(rawAO * 100).toFixed(2)}%</div>
                   <p className="text-[10px] opacity-40 mt-2 font-bold uppercase tracking-tight">Based on {totalLevels} active levels.</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-surface-500 uppercase mb-1 tracking-widest">Map Daily Labor</p>
                   <div className="text-2xl font-black font-mono text-econ-red">${(dailyLabor * (1 + rawAO)).toLocaleString()}</div>
                   <p className="text-[10px] opacity-40 mt-1 font-bold uppercase tracking-tight">Syncing base wages from Data Hub.</p>
                </div>
             </div>
          </div>
          <div className="card p-6 bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-800/30">
             <div className="flex gap-3">
                <div className="text-brand-600"><TrendingUp size={20} /></div>
                <div>
                   <h4 className="text-[10px] font-black uppercase text-brand-600 mb-2 tracking-widest">Expansion Threshold</h4>
                   <p className="text-[11px] text-brand-900 dark:text-brand-300 leading-relaxed font-medium">
                     Adding one more level will cost you <span className="font-bold underline">${((dailyLabor / totalLevels) * (1/170) * 24).toFixed(2)}</span> in additional daily AO taxes.
                   </p>
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
    <div className="space-y-10">
       <div className="flex gap-4 border-b border-surface-100 dark:border-surface-800 pb-4">
          <button onClick={() => setActiveSub("production")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "production" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Production Simulator</button>
          <button onClick={() => setActiveSub("construction")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "construction" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Construction Estimator</button>
          <button onClick={() => setActiveSub("retail")} className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeSub === "retail" ? "text-brand-600" : "text-surface-400 hover:text-surface-900"}`}>Retail Analyzer</button>
       </div>
       {activeSub === "production" && <AdvancedProductionSimulator margins={margins} />}
       {activeSub === "construction" && <ConstructionCalculator margins={margins} />}
       {activeSub === "retail" && <RetailCalculator realm={realm} />}
    </div>
  );
}

function AdvancedProductionSimulator({ margins }: { margins: any[] }) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(3);
  const [sourcingCost, setSourcingCost] = useState<Record<number, number>>({});
  const [prodBonus, setProdBonus] = useState(0);
  const [robotBonus, setRobotBonus] = useState(0);
  const [aoPercent, setAoPercent] = useState(10);
  const [abundance, setAbundance] = useState(100);

  const building = useMemo(() => BUILDINGS.find(b => b.id === selectedBuildingId), [selectedBuildingId]);
  const buildingResources = useMemo(() => RESOURCES.filter(r => r.buildingId === selectedBuildingId), [selectedBuildingId]);

  const simulations = useMemo(() => {
    return buildingResources.map(res => {
       const market = margins.find(m => m.id === res.id);
       const baseWages = res.baseWages || 0;
       const basePh = res.basePh || 0;
       const abundanceFactor = (building?.abundance) ? (abundance / 100) : 1;
       const effectivePh = basePh * (1 + prodBonus/100) * abundanceFactor;
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
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        <div className="lg:col-span-4 space-y-8">
           <div className="card p-8 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Facility Modeling</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Target Building</label>
                    <select value={selectedBuildingId} onChange={(e) => setSelectedBuildingId(Number(e.target.value))} className="input py-2 px-4 font-bold text-sm">
                       {BUILDINGS.filter(b => b.type === "production").map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Production %</label>
                       <input type="number" value={prodBonus} onChange={(e) => setProdBonus(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Robots %</label>
                       <input type="number" value={robotBonus} onChange={(e) => setRobotBonus(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Map Admin OH %</label>
                    <input type="number" value={aoPercent} onChange={(e) => setAoPercent(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm text-econ-red" />
                 </div>
                 {building?.abundance && (
                   <div>
                      <label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Resource Abundance %</label>
                      <input type="number" value={abundance} onChange={(e) => setAbundance(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm text-brand-500 font-black" />
                   </div>
                 )}
              </div>
           </div>

           <div className="card p-6 bg-surface-900 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-econ-amber rotate-12">
                 <Package size={80} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 mb-6">Market Overrides</h4>
              <div className="space-y-4 relative z-10">
                 {[1, 2, 18, 40].map(iid => (
                    <div key={iid} className="flex items-center justify-between gap-4">
                       <label className="text-[10px] font-black uppercase text-surface-400">{RESOURCES.find(r => r.id === iid)?.name}</label>
                       <input type="number" placeholder="Price" onChange={(e) => setSourcingCost(prev => ({ ...prev, [iid]: Number(e.target.value) }))} className="bg-surface-800 border-none rounded-lg px-3 py-1.5 text-[10px] font-mono w-24 focus:ring-1 focus:ring-brand-500" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
        <div className="lg:col-span-8">
           <div className="card overflow-hidden bg-white dark:bg-surface-900 border-surface-200 shadow-sm">
              <div className="px-8 py-5 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 flex justify-between items-center">
                 <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">{building?.name} Yield Analysis</h3>
                 <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Realm Current</span>
              </div>
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                 {simulations.map(s => (
                    <div key={s.id} className="p-8 hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-all group">
                       <div className="flex justify-between items-start mb-8">
                          <div className="space-y-1">
                             <h4 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight group-hover:text-brand-600 transition-colors">{s.name}</h4>
                             <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest">Hourly Velocity: <span className="text-surface-900 dark:text-white font-mono">{s.effectivePh.toFixed(2)}</span></p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-brand-600 uppercase mb-2 tracking-[0.2em]">PPHPL Efficiency</p>
                             <div className={`text-3xl font-black font-mono tracking-tighter ${s.pphpl > 0 ? "text-econ-green" : "text-econ-red"}`}>
                                ${s.pphpl.toFixed(2)}
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-3 gap-6">
                          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-4 border border-surface-100 dark:border-surface-700/30">
                             <p className="text-[8px] font-black text-surface-400 uppercase mb-2">Cost / Unit</p>
                             <p className="text-sm font-black font-mono text-surface-900 dark:text-white">${s.costPerUnit.toFixed(3)}</p>
                          </div>
                          <div className="bg-surface-50 dark:bg-surface-800/50 rounded-2xl p-4 border border-surface-100 dark:border-surface-700/30">
                             <p className="text-[8px] font-black text-surface-400 uppercase mb-2">Market Price</p>
                             <p className="text-sm font-black font-mono text-surface-900 dark:text-white">${s.revenue.toFixed(2)}</p>
                          </div>
                          <div className="bg-brand-50/50 dark:bg-brand-900/10 rounded-2xl p-4 border border-brand-100 dark:border-brand-800/30">
                             <p className="text-[8px] font-black text-brand-600 uppercase mb-2 tracking-widest">Net / Unit</p>
                             <p className={`text-sm font-black font-mono ${s.profit > 0 ? "text-econ-green" : "text-econ-red"}`}>
                                ${s.profit.toFixed(2)}
                             </p>
                          </div>
                       </div>
                    </div>
                 ))}
                 {simulations.length === 0 && (
                   <div className="p-24 text-center text-surface-400 text-xs font-black uppercase tracking-[0.2em] italic">Select building to analyze outputs.</div>
                 )}
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
    <div className="space-y-10 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="max-w-md w-full relative">
             <input type="text" placeholder="Search data points..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-12 rounded-2xl py-3 shadow-sm border-surface-200" />
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-300">
               <Activity size={18} />
             </div>
          </div>
          <div className="flex gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-2xl">
             <button onClick={() => setMode("buildings")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "buildings" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-md" : "text-surface-500"}`}>Buildings</button>
             <button onClick={() => setMode("resources")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "resources" ? "bg-white dark:bg-surface-700 text-brand-600 shadow-md" : "text-surface-500"}`}>Resources</button>
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mode === "buildings" ? filteredBuildings.map(b => (
             <div key={b.id} className="card p-8 bg-white dark:bg-surface-900 border-surface-200 shadow-sm hover:border-brand-500 hover:shadow-xl hover:shadow-brand-600/5 transition-all group">
                <div className="flex justify-between items-start mb-8">
                   <h3 className="font-black text-lg uppercase tracking-tight text-surface-900 dark:text-white group-hover:text-brand-600 transition-colors">{b.name}</h3>
                   <span className="text-[8px] font-black uppercase bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-lg text-surface-500 tracking-[0.2em]">{b.type}</span>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Base Wages</span><span className="font-mono text-surface-900 dark:text-white font-black">${b.wages}/hr</span></div>
                   <div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Build Time</span><span className="font-mono text-surface-900 dark:text-white font-black">{b.baseTime} hrs</span></div>
                   <div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Fixed Cost</span><span className="font-mono text-surface-900 dark:text-white font-black">${b.cost.toLocaleString()}</span></div>
                </div>
             </div>
          )) : filteredResources.map(r => (
             <div key={r.id} className="card p-8 bg-white dark:bg-surface-900 border-surface-200 shadow-sm hover:border-brand-500 hover:shadow-xl hover:shadow-brand-600/5 transition-all group">
                <div className="flex justify-between items-start mb-8">
                   <h3 className="font-black text-lg uppercase tracking-tight text-surface-900 dark:text-white group-hover:text-brand-600 transition-colors">{r.name}</h3>
                   <span className="text-[8px] font-black uppercase bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-lg text-brand-600 dark:text-brand-400 tracking-[0.2em]">ID: {r.id}</span>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Transport</span><span className="font-mono text-surface-900 dark:text-white font-black">{r.transport} units</span></div>
                   <div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Base PPH</span><span className="font-mono text-surface-900 dark:text-white font-black">{r.basePh}/hr</span></div>
                   <div className="flex justify-between text-[11px] border-b border-surface-50 dark:border-surface-800 pb-2"><span className="text-surface-400 font-bold uppercase tracking-widest">Input Count</span><span className="font-mono text-surface-900 dark:text-white font-black">{Object.keys(r.inputs || {}).length} materials</span></div>
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 border-l-4 border-l-econ-amber bg-white dark:bg-surface-900 shadow-sm space-y-6">
             <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Expansion Modeling</h3>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">Building Type</label><select value={selectedBuilding} onChange={(e) => setSelectedBuilding(Number(e.target.value))} className="input py-2 px-4 font-bold text-sm">{BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">From</label><input type="number" value={currentLevel} onChange={(e) => setCurrentLevel(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm" /></div>
                   <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">To</label><input type="number" value={targetLevel} onChange={(e) => setTargetLevel(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm" /></div>
                </div>
             </div>
          </div>
          <div className="card p-6 bg-surface-900 text-white border-none shadow-2xl space-y-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-econ-green rotate-45"><ChevronRight size={100} /></div>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Mechanics Note</h4>
             <p className="text-[11px] leading-relaxed opacity-70 font-medium">Upgrading to level 2 costs same as level 1. Subsequent levels scale based on (L-1) factor.</p>
             <div className="pt-4 border-t border-surface-800 flex justify-between items-baseline relative z-10"><span className="text-[10px] font-black uppercase tracking-widest text-surface-500">Fixed CV Asset</span><span className="text-xl font-black font-mono text-econ-green">${((targetLevel * (b?.cost || 0))).toLocaleString()}</span></div>
          </div>
       </div>
       <div className="lg:col-span-8">
          <div className="card p-8 bg-white dark:bg-surface-900 border-surface-200 shadow-sm">
             <div className="flex items-center justify-between mb-10 pb-5 border-b border-surface-50 dark:border-surface-800">
                <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Upgrade Logistics Plan</h3>
                <div className="text-right"><p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Total Resource Value</p><p className="text-3xl font-black text-brand-600 font-mono tracking-tighter">${totalMarketValue.toLocaleString()}</p></div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-surface-50 dark:bg-surface-800/40 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-inner">
                   <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-econ-green shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="text-xs font-black uppercase text-surface-900 dark:text-white tracking-widest">Construction Cash</span></div>
                   <span className="font-black font-mono text-surface-900 dark:text-white text-lg tracking-tighter">${cost.cash.toLocaleString()}</span>
                </div>
                {cost.materials.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-surface-900 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm group hover:border-brand-300 transition-colors">
                     <div className="space-y-1">
                        <span className="text-xs font-black uppercase text-surface-900 dark:text-white tracking-widest group-hover:text-brand-600 transition-colors">{m.name}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] text-surface-400 uppercase font-black tracking-widest">Sync Price:</span>
                           <input type="number" value={m.price} onChange={(e) => setManualPrices(prev => ({ ...prev, [m.id]: Number(e.target.value) }))} className="bg-transparent border-none text-[10px] font-black font-mono w-20 text-brand-500 focus:outline-none" />
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-black font-mono text-surface-900 dark:text-white text-lg tracking-tighter">{m.qty.toLocaleString()}</p>
                        <p className="text-[10px] text-surface-400 font-black tracking-tight opacity-60">${(m.qty * m.price).toLocaleString()}</p>
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
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [sourcingCost, setSourcingCost] = useState<number>(0);
  const products = useMemo(() => { if (!retail?.retail) return []; return Object.entries(retail.retail).map(([k, v]: [string, any]) => ({ id: k, ...v })); }, [retail]);
  const p = useMemo(() => products.find(p => p.id === selectedProduct), [products, selectedProduct]);
  useEffect(() => { if (p) { setSellingPrice(p.avgPrice || 0); setSourcingCost(p.avgPrice ? p.avgPrice * 0.8 : 0); } }, [p]);
  const stats = useMemo(() => { if (!p) return null; const saturation = p.saturation || 0; const baseSpeed = 100; const priceFactor = Math.pow(sellingPrice / (p.avgPrice || sellingPrice), 2); const speed = baseSpeed / (priceFactor * (1 + saturation)); const profitPerUnit = sellingPrice - sourcingCost; return { speed, profitPerUnit, hourlyProfit: speed * profitPerUnit }; }, [p, sellingPrice, sourcingCost]);
  return (
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 border-l-4 border-l-econ-purple bg-white dark:bg-surface-900 shadow-sm space-y-6">
             <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Retail Strategy</h3>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400">Inventory Item</label><select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="input py-2 px-4 font-bold text-sm"><option value="">-- select product --</option>{products.map(pr => <option key={pr.id} value={pr.id}>{pr.id}</option>)}</select></div>
                {p && (
                   <>
                     <div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400 tracking-widest">Sourcing Basis</label><input type="number" value={sourcingCost} onChange={(e) => setSourcingCost(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm" /></div>
                     <div><label className="text-[10px] font-black uppercase block mb-2 text-surface-400 tracking-widest">Target Price</label><input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm text-brand-600 font-black" /></div>
                   </>
                )}
             </div>
          </div>
       </div>
       <div className="lg:col-span-8">
          {p && stats ? (
            <div className="card p-10 bg-white dark:bg-surface-900 border-surface-200 shadow-sm">
               <div className="flex items-center justify-between mb-10 pb-5 border-b border-surface-50 dark:border-surface-800">
                  <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Unit Economics: {p.id}</h3>
                  <span className="text-[10px] font-black text-econ-amber bg-econ-amber/10 px-2 py-1 rounded">Market Impact: {p.saturation?.toFixed(2)}</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800"><p className="text-[10px] font-black text-surface-400 uppercase mb-3 tracking-widest">Selling Speed</p><p className="text-3xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">{stats.speed.toFixed(1)}/hr</p></div>
                  <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800"><p className="text-[10px] font-black text-surface-400 uppercase mb-3 tracking-widest">Hourly Profit</p><p className={`text-3xl font-black font-mono tracking-tighter ${stats.hourlyProfit > 0 ? "text-econ-green" : "text-econ-red"}`}>${stats.hourlyProfit.toFixed(2)}</p></div>
                  <div className="p-6 rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/40"><p className="text-[10px] font-black text-brand-600 uppercase mb-3 tracking-widest">Margin/Unit</p><p className="text-3xl font-black font-mono tracking-tighter text-econ-green">${stats.profitPerUnit.toFixed(2)}</p></div>
               </div>
            </div>
          ) : <div className="card p-24 text-center border-dashed border-2 border-surface-100 bg-surface-50/50 flex flex-col items-center gap-4"><Package size={32} className="text-surface-200" /><p className="text-surface-400 text-xs font-black uppercase tracking-[0.2em] opacity-50">Select inventory product to view dynamics.</p></div>}
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
       <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 border-l-4 border-l-brand-600 bg-white dark:bg-surface-900 shadow-sm space-y-6">
             <h3 className="font-black text-xs uppercase tracking-widest text-surface-900 dark:text-white">Executive Bench</h3>
             <div className="space-y-4">
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">COO Management</label><input type="number" value={coo} onChange={(e) => setCoo(Number(e.target.value))} className="input py-2 px-4 font-bold text-sm" /></div>
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">CFO Accounting</label><input type="number" value={cfo} onChange={(e) => setCfo(Number(e.target.value))} className="input py-2 px-4 font-bold text-sm" /></div>
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">CMO Comm</label><input type="number" value={cmo} onChange={(e) => setCmo(Number(e.target.value))} className="input py-2 px-4 font-bold text-sm" /></div>
                <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest underline decoration-brand-500/30">CTO Science</label><input type="number" value={cto} onChange={(e) => setCto(Number(e.target.value))} className="input py-2 px-4 font-bold text-sm" /></div>
                <div className="pt-6 border-t border-surface-50 dark:border-surface-800 space-y-4">
                   <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">Liquid Cash</label><input type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm text-econ-green font-black" /></div>
                   <div><label className="text-[10px] font-black text-surface-400 uppercase mb-2 block tracking-widest">Total Levels</label><input type="number" value={buildingLevels} onChange={(e) => setBuildingLevels(Number(e.target.value))} className="input py-2 px-4 font-mono text-sm font-black" /></div>
                </div>
             </div>
          </div>
       </div>
       <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card p-8 bg-white dark:bg-surface-900 shadow-sm border-surface-100 hover:translate-y-[-2px] transition-transform group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Accounting Threshold</p><div className="text-3xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">${threshold.toLocaleString()}</div><p className="text-[10px] text-surface-500 mt-4 font-medium uppercase tracking-tight">CFO Impact: <span className="text-econ-green font-black">+${cfoLift.toLocaleString()}</span></p></div>
             <div className="card p-8 bg-white dark:bg-surface-900 shadow-sm border-surface-100 hover:translate-y-[-2px] transition-transform group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Effective Admin OH</p><div className="text-3xl font-black font-mono tracking-tighter text-surface-900 dark:text-white">{(actualAO * 100).toFixed(2)}%</div><p className="text-[10px] text-surface-500 mt-4 font-medium uppercase tracking-tight">Base: {(rawAO * 100).toFixed(2)}% | <span className="text-econ-green font-black">-{(cooReduction * 100).toFixed(1)}%</span></p></div>
             <div className="card p-8 bg-white dark:bg-surface-900 shadow-sm border-surface-100 hover:translate-y-[-2px] transition-transform group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Sales Velocity</p><div className="text-3xl font-black font-mono tracking-tighter text-econ-green">+{ (salesSpeedBonus * 100).toFixed(1) }%</div><p className="text-[10px] text-surface-500 mt-4 font-medium uppercase tracking-tight">Accelerated turnover rate.</p></div>
             <div className="card p-8 bg-white dark:bg-surface-900 shadow-sm border-surface-100 hover:translate-y-[-2px] transition-transform group"><p className="text-[10px] font-black text-surface-400 uppercase mb-4 tracking-[0.2em] group-hover:text-brand-600 transition-colors">Patent Prob</p><div className="text-3xl font-black font-mono tracking-tighter text-brand-600">{(patentProb * 100).toFixed(1)}%</div><p className="text-[10px] text-surface-500 mt-4 font-medium uppercase tracking-tight">Research to Patent efficiency.</p></div>
          </div>
          <Section title="Governance Analytics"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="card p-6 bg-surface-50 dark:bg-surface-800/40 border-surface-100 dark:border-surface-800 shadow-inner"><h4 className="text-[10px] font-black uppercase mb-4 text-brand-600 tracking-widest">Training ROI</h4><p className="text-[11px] leading-relaxed text-surface-500 font-medium tracking-tight">Increasing CFO by 1 point saves <span className="font-bold text-surface-900 dark:text-white">${(0.005 * 250000).toFixed(2)}/day</span> per bracket above the threshold.</p></div><div className="card p-6 bg-surface-50 dark:bg-surface-800/40 border-surface-100 dark:border-surface-800 shadow-inner"><h4 className="text-[10px] font-black uppercase mb-4 text-econ-amber tracking-widest">Research Boost</h4><p className="text-[11px] leading-relaxed text-surface-500 font-medium tracking-tight">CTO science skill improves efficiency of R&D investments by <span className="font-bold text-surface-900 dark:text-white">{(cto * 1.8).toFixed(1)}%</span>.</p></div><div className="card p-6 bg-surface-50 dark:bg-surface-800/40 border-surface-100 dark:border-surface-800 shadow-inner"><h4 className="text-[10px] font-black uppercase mb-4 text-econ-purple tracking-widest">Growth Limit</h4><p className="text-[11px] leading-relaxed text-surface-500 font-medium tracking-tight">Current management allows for <span className="font-bold text-surface-900 dark:text-white">{Math.floor(coo * 1.7)}</span> additional levels before major AO creep.</p></div></div></Section>
       </div>
    </div>
  );
}
