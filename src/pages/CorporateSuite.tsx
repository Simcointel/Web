import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Activity, Calculator, Upload, Download, Trash2,
  Building2, Package, UserCheck, DollarSign, ArrowLeft,
  PieChart as PieIcon, LineChart as LineIcon, Receipt, Landmark, Info, Search,
  ArrowUpRight, ArrowDownRight, Clock, Wallet, GraduationCap, Users, UserPlus, Zap,
  AlertTriangle, ShieldCheck, BarChart3, Layers, Microscope, Target, Eye, Settings,
  Repeat, TrendingDown, Briefcase, Globe, BarChart2, Link, Link2Off, LayoutDashboard,
  HardHat, Ship, FileText, History, CheckCircle2
} from "lucide-react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, RESOURCES } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { LoadingState } from "../components/States";
import { useNavigate } from "../router";
import { useSharedRealm } from "../hooks/useSharedRealm";

// --- Types & Defaults ---
interface Executive { skill: number; age: number; }
interface MapItem { id: string; level: number; }
interface InventoryItem { id: number; qty: number; }

interface SuiteStateV6 {
  activeTab: 'command' | 'ops' | 'exec' | 'finance' | 'logistics' | 'risk';
  globalSync: boolean;
  map: MapItem[];
  board: { coo: Executive; cfo: Executive; cmo: Executive; cto: Executive; };
  inventory: InventoryItem[];
  settings: {
    prodBonus: number; realm: number; estDailyProfit: number;
    whatIfLevel: number;
  };
  debt: { current: number; rate: number; };
  moduleSettings: {
    opsLinked: boolean; execLinked: boolean; financeLinked: boolean;
    logisticsLinked: boolean; riskLinked: boolean;
  }
}

const DEFAULT_STATE: SuiteStateV6 = {
  activeTab: 'command',
  globalSync: true,
  map: [],
  board: {
    coo: { skill: 15, age: 35 }, cfo: { skill: 15, age: 35 },
    cmo: { skill: 15, age: 35 }, cto: { skill: 15, age: 35 },
  },
  inventory: [],
  settings: { prodBonus: 12, realm: 0, estDailyProfit: 250000, whatIfLevel: 0 },
  debt: { current: 2000000, rate: 0.5 },
  moduleSettings: {
    opsLinked: true, execLinked: true, financeLinked: true,
    logisticsLinked: true, riskLinked: true
  }
};

export function CorporateSuitePage() {
  const [realm, setRealm] = useSharedRealm();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const { data: dash } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);

  const [state, setState] = useState<SuiteStateV6>(() => {
    const saved = localStorage.getItem("simco_suite_v6");
    return saved ? JSON.parse(saved) : DEFAULT_STATE;
  });

  useEffect(() => { localStorage.setItem("simco_suite_v6", JSON.stringify(state)); }, [state]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const economyPhase = (dash as any)?.[String(realm)]?.regime?.na || 'Normal';

  const detachedModules = useMemo(() => {
    const detached: string[] = [];
    if (!state.moduleSettings.opsLinked) detached.push('Ops');
    if (!state.moduleSettings.execLinked) detached.push('Exec');
    if (!state.moduleSettings.financeLinked) detached.push('Finance');
    if (!state.moduleSettings.logisticsLinked) detached.push('Warehouse');
    if (!state.moduleSettings.riskLinked) detached.push('Risk');
    return detached;
  }, [state.moduleSettings]);

  const quickSync = () => {
    setState({
      ...state,
      moduleSettings: {
        opsLinked: true, execLinked: true, financeLinked: true,
        logisticsLinked: true, riskLinked: true
      }
    });
    setNotification({ msg: "All modules re-synchronized", type: "success" });
  };

  const core = useMemo(() => {
    const effMap = state.moduleSettings.opsLinked ? state.map : DEFAULT_STATE.map;
    const effBoard = state.moduleSettings.execLinked ? state.board : DEFAULT_STATE.board;
    const effProfit = state.moduleSettings.financeLinked ? state.settings.estDailyProfit : DEFAULT_STATE.settings.estDailyProfit;

    const totalLevels = effMap.reduce((s, i) => s + i.level, 0) + (state.moduleSettings.opsLinked ? state.settings.whatIfLevel : 0);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);
    const actualAO = rawAO * (1 - (effBoard.coo.skill * 0.01));
    const taxThreshold = 3000000 + (effBoard.cfo.skill * 500000);
    const salesSpeedBonus = effBoard.cmo.skill * 0.01;
    const patentProb = 0.10 + (effBoard.cto.skill * 0.015);

    const dailyWages = effMap.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      return sum + (item.level * (b?.wages || 0) * 24);
    }, 0);

    const dailyInterest = state.debt.current * (state.debt.rate / 100);
    const taxableAmount = Math.max(0, effProfit - (taxThreshold / 30));
    const estimatedDailyTax = taxableAmount * 0.07;

    const inventoryValue = state.inventory.reduce((sum, item) => {
      const price = (margins?.resources as any[])?.find(m => m.id === item.id)?.outputVwap || 0;
      return sum + (price * item.qty);
    }, 0);
    const mapValue = effMap.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      if (!b) return sum;
      let cost = 0;
      for(let l=1; l<=item.level; l++) cost += b.cost * (l <= 2 ? 1 : l-1);
      return sum + cost;
    }, 0);

    const coverageRatio = dailyInterest > 0 ? effProfit / dailyInterest : 100;

    return {
      totalLevels, actualAO, rawAO, taxThreshold, salesSpeedBonus,
      patentProb, dailyWages, inventoryValue, mapValue, dailyInterest,
      estimatedDailyTax, coverageRatio,
      totalValuation: inventoryValue + mapValue + (effProfit * 30),
      netDaily: effProfit - dailyInterest - estimatedDailyTax - (dailyWages * actualAO)
    };
  }, [state, margins]);

  const audit = useMemo(() => {
    const produces = new Set(RESOURCES.filter(r => state.map.some(m => m.id === r.buildingId)).map(r => r.id));
    const needs = new Set<number>();
    state.map.forEach(m => {
       RESOURCES.filter(r => r.buildingId === m.id).forEach(r => {
          if (r.inputs) Object.keys(r.inputs).forEach(id => needs.add(Number(id)));
       });
    });
    const missing = Array.from(needs).filter(n => !produces.has(n)).map(id => RESOURCES.find(r => r.id === id)?.name || `ID ${id}`);
    return { missing, health: needs.size > 0 ? (1 - missing.length / needs.size) * 100 : 100 };
  }, [state.map]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.activeTab) {
             setState(parsed);
             setNotification({ msg: "Platform state restored", type: "success" });
             return;
          }
        } catch (err) { setNotification({ msg: "Failed to parse JSON", type: "error" }); }
      }
      const lines = content.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      if (lines.length < 2) return;
      const headers = lines[0].map(h => h.toLowerCase());
      if (headers.includes('resource') && headers.includes('quantity')) {
        const qtyIdx = headers.indexOf('quantity');
        const nameIdx = headers.indexOf('resource');
        const nextInv: InventoryItem[] = [];
        lines.slice(1).forEach(row => {
          if (!row[nameIdx]) return;
          const res = RESOURCES.find(r => r.name.toLowerCase() === row[nameIdx].toLowerCase());
          const qty = parseInt(row[qtyIdx]);
          if (res && !isNaN(qty)) nextInv.push({ id: res.id, qty });
        });
        if (nextInv.length > 0) {
           setState(prev => ({ ...prev, inventory: nextInv }));
           setNotification({ msg: `Imported ${nextInv.length} resources`, type: "success" });
        }
      }
      if (headers.includes('profit/loss') || headers.includes('revenue')) {
        const profitIdx = headers.findIndex(h => h.includes('profit'));
        if (profitIdx !== -1) {
           const val = parseFloat(lines[1][profitIdx]);
           if (!isNaN(val)) {
              setState(prev => ({ ...prev, settings: { ...prev.settings, estDailyProfit: Math.abs(val) } }));
              setNotification({ msg: "Updated profit estimates", type: "success" });
           }
        }
      }
    };
    reader.readAsText(file);
  };

  const renderTab = () => {
    switch(state.activeTab) {
      case 'command': return <CommandView state={state} core={core} phase={economyPhase} setState={setState} fileInputRef={fileInputRef} />;
      case 'ops': return <OperationsView state={state} core={core} setState={setState} />;
      case 'exec': return <ExecutiveView state={state} core={core} setState={setState} />;
      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;
      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} margins={margins} audit={audit} fileInputRef={fileInputRef} />;
      case 'risk': return <RiskView state={state} core={core} phase={economyPhase} retail={retail} />;
    }
  };

  if (mLoading && !margins) return <LoadingState text="Booting Terminal..." />;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 bg-surface-50/20 min-h-screen relative">
      <AnimatePresence>
         {notification && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
               <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-econ-green text-white border-econ-green' : 'bg-econ-red text-white border-econ-red'}`}>
                  {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span className="text-xs font-black uppercase tracking-widest">{notification.msg}</span>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <header className="flex justify-between items-center pb-6 border-b border-surface-200 mb-6">
        <div className="flex items-center gap-6">
           <div>
              <div className="flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-[0.3em] mb-1">
                 <Globe size={14} /> Corporate Command
              </div>
              <h1 className="text-3xl font-black text-surface-900 uppercase tracking-tighter italic">
                Simco<span className="text-brand-600">Terminal</span> <span className="text-[10px] font-mono non-italic opacity-40">V6.0</span>
              </h1>
           </div>

           <nav className="flex items-center bg-white border rounded-2xl p-1 gap-1 shadow-sm ml-8">
              <TabBtn active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} icon={LayoutDashboard} label="Command" />
              <TabBtn active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} icon={HardHat} label="Operations" />
              <TabBtn active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} icon={Users} label="Executive" />
              <TabBtn active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} icon={DollarSign} label="Finance" />
              <TabBtn active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} icon={Ship} label="Logistics" />
              <TabBtn active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} icon={TrendingDown} label="Risk" />
           </nav>
        </div>

        <div className="flex items-center gap-4">
           {detachedModules.length > 0 && (
              <div className="flex flex-col items-end mr-2 animate-in fade-in zoom-in duration-300">
                 <div className="flex items-center gap-1.5 bg-econ-amber/10 border border-econ-amber/20 px-3 py-1.5 rounded-lg">
                    <span className="text-[8px] font-black text-econ-amber uppercase">Detached: {detachedModules.join(', ')}</span>
                    <button onClick={quickSync} className="ml-2 bg-econ-amber text-white text-[8px] font-black px-1.5 py-0.5 rounded hover:bg-econ-amber/80 transition-colors uppercase">Sync All</button>
                 </div>
              </div>
           )}
           <HeaderMetric label="Admin Load" value={`${(core.actualAO*100).toFixed(2)}%`} color={core.actualAO > 0.15 ? "text-econ-red" : "text-econ-green"} />
           <HeaderMetric label="Net Cashflow" value={`$${(core.netDaily/1000).toFixed(1)}K/d`} color="text-brand-600" />
           <div className="h-10 w-px bg-surface-200" />
           <button onClick={() => navigate('/')} className="p-3 text-surface-400 hover:text-surface-900 transition-colors"><ArrowLeft size={20} /></button>
        </div>
      </header>

      <main className="min-h-[700px]">
         <AnimatePresence mode="wait">
            <motion.div key={state.activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
               {renderTab()}
            </motion.div>
         </AnimatePresence>
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-8 z-50">
         <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.json" />
         <div className="flex items-center gap-6 px-4 border-r border-white/10">
            <DockToggle label="Global Sync" active={state.globalSync} onClick={() => setState({...state, globalSync: !state.globalSync})} />
            <DockMetric label="Realm" value={`R${realm}`} />
            <DockMetric label="Enterprise" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} />
         </div>
         <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:scale-105 transition-all"><Upload size={18} /></button>
            <button onClick={() => { const data = JSON.stringify(state); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'simco_suite_v6.json'; a.click(); }} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"><Download size={18} /></button>
         </div>
      </footer>
    </div>
  );
}

function CommandView({ state, core, phase, setState, fileInputRef }: any) {
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    state.map.forEach((m: any) => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (b) counts[(b as any).category || 'Other'] = (counts[(b as any).category || 'Other'] || 0) + m.level;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [state.map]);

  if (state.map.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600 mb-8 border border-brand-100 shadow-xl shadow-brand-500/10">
              <Building2 size={40} />
           </div>
           <h2 className="text-4xl font-black text-surface-900 uppercase italic tracking-tighter mb-4">Initialize Terminal</h2>
           <p className="text-surface-500 max-w-md text-center leading-relaxed font-medium mb-12">
              Your corporate workspace is currently empty. To begin economic analysis, upload your game data or manually add facilities.
           </p>
           <div className="grid grid-cols-2 gap-6 w-full max-w-xl">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 p-8 bg-white border border-surface-200 rounded-3xl hover:border-brand-600 hover:shadow-2xl transition-all group">
                 <div className="p-4 bg-surface-50 rounded-2xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Upload size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-surface-900">Import Data</p>
                    <p className="text-[10px] text-surface-400 mt-1 uppercase font-bold">CSV/JSON Exports</p>
                 </div>
              </button>
              <button onClick={() => setState({...state, activeTab: 'ops'})} className="flex flex-col items-center gap-4 p-8 bg-white border border-surface-200 rounded-3xl hover:border-brand-600 hover:shadow-2xl transition-all group">
                 <div className="p-4 bg-surface-50 rounded-2xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <UserPlus size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-surface-900">Manual Entry</p>
                    <p className="text-[10px] text-surface-400 mt-1 uppercase font-bold">Build from scratch</p>
                 </div>
              </button>
           </div>
        </div>
     );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
       <div className="col-span-8 space-y-6">
          <Section title="Strategic Overview" icon={Eye}>
             <div className="grid grid-cols-3 gap-6">
                <Kpi label="Enterprise Value" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} sub={`Liquid: $${(core.inventoryValue/1000).toFixed(1)}K`} icon={TrendingUp} color="text-brand-600" />
                <Kpi label="Daily Net Flow" value={`$${(core.netDaily/1000).toFixed(1)}K`} sub="Post-Tax/AO" icon={DollarSign} color="text-econ-green" />
                <Kpi label="Admin Overhead" value={`${(core.actualAO*100).toFixed(2)}%`} sub={`${core.totalLevels} Active Levels`} icon={BarChart3} color="text-econ-red" />
             </div>
             <div className="mt-6 flex items-center gap-3 bg-surface-50 p-4 rounded-2xl border border-dashed text-surface-400">
                <PhaseDot phase={phase} />
                <div>
                   <p className="text-[10px] font-black uppercase text-surface-900 tracking-widest">Regime Awareness: {phase}</p>
                   <p className="text-[8px] font-bold uppercase mt-0.5">Global modeling adjusted for current market phase.</p>
                </div>
             </div>
          </Section>
          <div className="grid grid-cols-2 gap-6">
             <Section title="Asset Allocation" icon={PieIcon} action={<button onClick={() => setState({...state, activeTab: 'ops'})} className="text-[8px] font-black uppercase text-brand-600 hover:text-brand-500">View All</button>}>
                <div className="space-y-3">
                   {categories.length > 0 ? categories.slice(0, 4).map(([cat, lvls]) => (
                      <div key={cat} className="space-y-1">
                         <div className="flex justify-between text-[10px] font-bold uppercase">
                            <span className="text-surface-500">{cat}</span>
                            <span className="text-surface-900">{lvls} Lvls</span>
                         </div>
                         <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500" style={{ width: `${(lvls / (core.totalLevels || 1)) * 100}%` }} />
                         </div>
                      </div>
                   )) : (
                      <div className="py-10 text-center text-surface-300 text-[10px] font-black uppercase italic">No Infrastructure Data</div>
                   )}
                </div>
             </Section>
             <Section title="Financial Projections" icon={LineIcon} action={<button onClick={() => setState({...state, activeTab: 'finance'})} className="text-[8px] font-black uppercase text-brand-600 hover:text-brand-500">View All</button>}>
                <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b border-surface-50">
                      <span className="text-[9px] font-bold text-surface-400 uppercase">7D Growth Est.</span>
                      <span className="text-xs font-black font-mono text-econ-green">+$${(core.netDaily * 7 / 1000).toFixed(1)}K</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-surface-50">
                      <span className="text-[9px] font-bold text-surface-400 uppercase">30D Forecast</span>
                      <span className="text-xs font-black font-mono text-brand-600">+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M</span>
                   </div>
                </div>
             </Section>
          </div>
       </div>
       <div className="col-span-4 space-y-6">
          <Section title="Facility Project Pipeline" icon={Calculator} action={<button onClick={() => setState({...state, activeTab: 'ops'})} className="text-[8px] font-black uppercase text-brand-600 hover:text-brand-500">View All</button>}>
             <div className="space-y-4">
                {state.map.slice(0, 4).map((m: any, i: number) => {
                   const b = BUILDINGS.find(bu => bu.id === m.id);
                   return (
                      <div key={i} className="p-4 bg-surface-50 border border-dashed rounded-2xl">
                         <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-brand-600 truncate max-w-[120px]">{b?.name || 'Building'}</p>
                            <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded border">LVL {m.level}</span>
                         </div>
                         <div className="flex justify-between items-end">
                            <span className="text-[8px] font-bold text-surface-400 uppercase">Daily Wages: $${(m.level * (b?.wages || 0) * 24 / 1000).toFixed(1)}K</span>
                            <span className="text-[8px] font-bold text-surface-400 uppercase">AO Contrib: ${((m.level / 170) * 100).toFixed(2)}%</span>
                         </div>
                      </div>
                   );
                })}
                {state.map.length === 0 && <div className="py-20 text-center text-surface-300 text-[10px] font-black uppercase italic">Add facilities in Operations</div>}
             </div>
          </Section>
       </div>
    </div>
  );
}

function OperationsView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-12 gap-6">
       <div className="col-span-4 space-y-6">
          <Section title="Facility Management" icon={Building2} action={<ModuleLink active={state.moduleSettings.opsLinked} onClick={() => setState({...state, moduleSettings: {...state.moduleSettings, opsLinked: !state.moduleSettings.opsLinked}})} />}>
             <div className="space-y-4">
                <div className="flex justify-between items-center bg-surface-50 p-4 rounded-xl border border-dashed">
                   <div className="text-center flex-1">
                      <p className="text-[8px] font-bold text-surface-400 uppercase">Total Levels</p>
                      <p className="text-lg font-black font-mono">{core.totalLevels}</p>
                   </div>
                   <div className="h-8 w-px bg-surface-200" />
                   <div className="text-center flex-1">
                      <p className="text-[8px] font-bold text-surface-400 uppercase">Daily Wages</p>
                      <p className="text-lg font-black font-mono text-econ-red">$${(core.dailyWages/1000).toFixed(1)}K</p>
                   </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                   {state.map.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-xl hover:border-brand-500 transition-all shadow-sm group">
                         <div className="w-8 h-8 rounded bg-surface-50 flex items-center justify-center text-surface-400 font-mono text-[10px] font-bold">#{i+1}</div>
                         <select value={m.id} onChange={(e) => { const next = [...state.map]; next[i].id = e.target.value; setState({...state, map: next}); }} className="flex-1 bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 p-0">
                            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                         <input type="number" value={m.level} onChange={(e) => { const next = [...state.map]; next[i].level = Number(e.target.value); setState({...state, map: next}); }} className="w-12 bg-surface-50 border-none rounded p-1 text-[10px] font-black text-center focus:ring-1 focus:ring-brand-500" />
                         <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className="p-1 text-surface-200 hover:text-econ-red transition-all"><Trash2 size={12} /></button>
                      </div>
                   ))}
                </div>
                <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="w-full py-4 border-2 border-dashed border-surface-200 rounded-xl text-[9px] font-black uppercase text-surface-400 hover:border-brand-500 hover:text-brand-600 transition-all flex items-center justify-center gap-2">
                   <UserPlus size={14} /> Add Facility
                </button>
             </div>
          </Section>
       </div>
       <div className="col-span-8 space-y-6">
          <Section title="What-If Expansion Simulator" icon={Layers}>
             <div className="p-6 bg-brand-50 border border-brand-100 rounded-2xl">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <p className="text-[10px] font-black text-brand-600 uppercase italic">Projected Scaling Impact</p>
                      <p className="text-3xl font-black text-surface-900">+{state.settings.whatIfLevel} Levels</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-bold text-surface-400 uppercase">Effective Admin Overhead</p>
                      <p className="text-2xl font-black font-mono text-econ-red">{(core.actualAO*100).toFixed(2)}%</p>
                   </div>
                </div>
                <input
                   type="range" min="0" max="500" step="10"
                   value={state.settings.whatIfLevel}
                   onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})}
                   className="w-full h-2 bg-brand-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
             </div>
          </Section>
       </div>
    </div>
  );
}

function ExecutiveView({ state, setState, core }: any) {
  const trainingROI = useMemo(() => {
    const costPerPoint = 42500;
    const totalWageImpact = core.dailyWages * (1 / 170);
    return {
       cost: costPerPoint,
       dailySaving: totalWageImpact + 16666,
    };
  }, [state.board, core.dailyWages]);

  return (
    <div className="grid grid-cols-12 gap-6">
       <div className="col-span-8 grid grid-cols-2 gap-6">
          {Object.entries(state.board).map(([role, exec]: [string, any]) => (
             <Section key={role} title={role.toUpperCase()} icon={UserCheck} action={<ModuleLink active={state.moduleSettings.execLinked} onClick={() => setState({...state, moduleSettings: {...state.moduleSettings, execLinked: !state.moduleSettings.execLinked}})} />}>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[8px] font-bold text-surface-400 uppercase mb-1">Skill Points</p>
                      <input type="number" value={exec.skill} onChange={(e) => setState({...state, board: {...state.board, [role]: {...exec, skill: Number(e.target.value)}}})} className="w-full bg-surface-50 border-none rounded p-2 text-xs font-black font-mono focus:ring-1 focus:ring-brand-500" />
                   </div>
                   <div>
                      <p className="text-[8px] font-bold text-surface-400 uppercase mb-1">Executive Age</p>
                      <input type="number" value={exec.age} onChange={(e) => setState({...state, board: {...state.board, [role]: {...exec, age: Number(e.target.value)}}})} className="w-full bg-surface-50 border-none rounded p-2 text-xs font-black font-mono focus:ring-1 focus:ring-brand-500" />
                   </div>
                </div>
                <div className="mt-4 pt-4 border-t border-surface-50">
                   <p className="text-[8px] font-black text-brand-600 uppercase italic">Role Impact Indicator</p>
                   <div className="mt-2 h-1 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${(exec.skill/50)*100}%` }} />
                   </div>
                </div>
             </Section>
          ))}
       </div>
       <div className="col-span-4 space-y-6">
          <Section title="Human Capital Analysis" icon={GraduationCap}>
             <div className="space-y-4">
                <div className="p-4 bg-surface-50 rounded-2xl border border-dashed text-center">
                   <p className="text-[8px] font-bold text-surface-400 uppercase">Collective Skill Points</p>
                   <p className="text-3xl font-black text-brand-600">{Object.values(state.board).reduce((s: number, e: any) => s + (e.skill || 0), 0)} Pts</p>
                </div>
                <div className="p-5 bg-brand-600 text-white rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Training ROI Simulator</p>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[8px] font-bold uppercase opacity-60">Avg Cost / Pt</p>
                            <p className="text-xl font-black font-mono">$${(trainingROI.cost/1000).toFixed(1)}K</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-bold uppercase opacity-60">Payback Period</p>
                            <p className="text-xl font-black font-mono text-brand-200">{(trainingROI.cost / (trainingROI.dailySaving || 1)).toFixed(1)} Days</p>
                         </div>
                      </div>
                   </div>
                   <div className="relative z-10 pt-4 border-t border-white/10 flex justify-between items-center text-[8px] font-bold uppercase">
                      <span>Daily Efficiency Gain:</span>
                      <span className="text-econ-green text-[10px] font-black">+$${(trainingROI.dailySaving/1000).toFixed(1)}K</span>
                   </div>
                   <Zap size={80} className="absolute -bottom-4 -right-4 text-white/5 pointer-events-none rotate-12" />
                </div>
                <div className="p-4 bg-surface-900 text-white rounded-2xl">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black uppercase text-brand-400">Executive Longevity</span>
                      <span className="text-[8px] font-bold uppercase text-econ-green">Stable</span>
                   </div>
                   <p className="text-[10px] leading-relaxed opacity-60 italic">
                      Based on board age, retirement projected in {65 - Math.round(Object.values(state.board).reduce((s: number, e: any) => s + (e.age || 0), 0) / 4)} years.
                   </p>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}

function FinanceView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-12 gap-6">
       <div className="col-span-4 space-y-6">
          <Section title="Balance Sheet Settings" icon={Wallet} action={<ModuleLink active={state.moduleSettings.financeLinked} onClick={() => setState({...state, moduleSettings: {...state.moduleSettings, financeLinked: !state.moduleSettings.financeLinked}})} />}>
             <div className="space-y-4">
                <div>
                   <p className="text-[8px] font-bold text-surface-400 uppercase mb-1">Estimated Daily Profit</p>
                   <input type="number" value={state.settings.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="w-full bg-surface-50 border-none rounded p-3 text-lg font-black font-mono focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                   <p className="text-[8px] font-bold text-surface-400 uppercase mb-1">Current Corporate Debt</p>
                   <input type="number" value={state.debt.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="w-full bg-surface-50 border-none rounded p-3 text-lg font-black font-mono focus:ring-1 focus:ring-brand-500" />
                </div>
             </div>
          </Section>
       </div>
       <div className="col-span-8 space-y-6">
          <Section title="Cashflow Waterfall" icon={BarChart2}>
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                   <CashItem label="Projected Gross Revenue" value={`$${(state.settings.estDailyProfit/1000).toFixed(1)}K`} type="neutral" />
                   <CashItem label="Executive Salaries" value={`-$${(core.dailyWages/1000).toFixed(1)}K`} type="negative" />
                   <CashItem label="Admin Overhead Drag" value={`-${(core.actualAO*100).toFixed(1)}%`} type="negative" />
                   <div className="h-px bg-surface-100 my-4" />
                   <CashItem label="Daily Net Flow" value={`$${(core.netDaily/1000).toFixed(1)}K`} type="positive" bold />
                </div>
                <div className="bg-surface-50 rounded-2xl border border-dashed flex flex-col items-center justify-center">
                   <p className="text-[8px] font-black text-surface-400 uppercase mb-2">Accounting Safety</p>
                   <p className="text-2xl font-black font-mono text-econ-green">$${(core.taxThreshold/1_000_000).toFixed(1)}M</p>
                   <p className="text-[8px] font-bold text-surface-300 uppercase mt-1">Daily Exemption Remaining</p>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}

function LogisticsView({ state, setState, core, audit, fileInputRef }: any) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  return (
    <div className="grid grid-cols-12 gap-6">
       <div className="col-span-4 space-y-6">
          <Section title="Warehouse Manifest" icon={Package} action={<ModuleLink active={state.moduleSettings.logisticsLinked} onClick={() => setState({...state, moduleSettings: {...state.moduleSettings, logisticsLinked: !state.moduleSettings.logisticsLinked}})} />}>
             <div className="flex gap-2 mb-4 relative">
                {!showClearConfirm ? (
                   <button onClick={() => setShowClearConfirm(true)} className="flex-1 py-2 bg-surface-50 hover:bg-econ-red/10 hover:text-econ-red border rounded-xl text-[8px] font-black uppercase transition-all">Clear All</button>
                ) : (
                   <div className="flex-1 flex gap-1 animate-in slide-in-from-top-1 duration-200">
                      <button onClick={() => { setState({...state, inventory: []}); setShowClearConfirm(false); }} className="flex-1 py-2 bg-econ-red text-white rounded-xl text-[8px] font-black uppercase">Confirm</button>
                      <button onClick={() => setShowClearConfirm(false)} className="px-2 py-2 bg-surface-200 text-surface-600 rounded-xl text-[8px] font-black uppercase">X</button>
                   </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-[8px] font-black uppercase hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20">Import Data</button>
             </div>
             <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {RESOURCES.slice(0, 30).map(r => {
                   const item = state.inventory.find(i => i.id === r.id);
                   return (
                      <div key={r.id} className="flex justify-between items-center p-3 bg-white border rounded-xl group hover:border-brand-500 transition-all shadow-sm">
                         <span className="text-[10px] font-black uppercase italic text-surface-900">{r.name}</span>
                         <input type="number" value={item?.qty || ""} onChange={(e) => { const qty = Number(e.target.value); const nextInv = [...state.inventory.filter(i => i.id !== r.id)]; if (qty > 0) nextInv.push({ id: r.id, qty }); setState({ ...state, inventory: nextInv }); }} placeholder="0" className="w-20 bg-surface-50 border-none rounded p-1 text-[10px] font-black text-center focus:ring-1 focus:ring-brand-500" />
                      </div>
                   )
                })}
             </div>
          </Section>
       </div>
       <div className="col-span-8 space-y-6">
          <Section title="Supply Chain Auditor" icon={AlertTriangle}>
             <div className="p-8 bg-surface-900 text-white rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2">Liquid Asset Valuation</p>
                   <p className="text-5xl font-black font-mono italic tracking-tighter">$${(core.inventoryValue/1000).toFixed(1)}K</p>
                   <div className="mt-8 flex gap-4">
                      <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl">
                         <p className="text-[8px] font-bold uppercase opacity-40 mb-1">Vertical Health</p>
                         <p className="text-lg font-black font-mono text-econ-green">{audit.health.toFixed(1)}%</p>
                      </div>
                      <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl">
                         <p className="text-[8px] font-bold uppercase opacity-40 mb-1">Storage Burn (Est)</p>
                         <p className="text-lg font-black font-mono text-econ-amber">-${(state.inventory.length * 12.5).toFixed(0)}/d</p>
                      </div>
                   </div>
                </div>
                <Ship size={140} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
             </div>
          </Section>
       </div>
    </div>
  );
}

function RiskView({ state, core, phase, retail }: any) {
  const beta = useMemo(() => {
    const totalLevels = core.totalLevels || 1;
    let base = (totalLevels / 100) + 0.5;
    if (phase === 'Boom') base *= 1.2;
    if (phase === 'Recession') base *= 0.85;
    return base;
  }, [core.totalLevels, phase]);

  return (
    <div className="grid grid-cols-12 gap-6">
       <div className="col-span-8 space-y-6">
          <Section title="Market Momentum Matrix" icon={Target} sub="Phase Awareness" subVal={phase.toUpperCase()}>
             <div className="grid grid-cols-4 gap-4">
                {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 16).map(res => {
                   const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
                   const baseSat = retailItem?.[1]?.saturation || 1.0;
                   // Simco Logic: Saturation feels lower in Boom, higher in Recession
                   const effSat = phase === 'Boom' ? baseSat * 0.8 : phase === 'Recession' ? baseSat * 1.2 : baseSat;

                   return (
                      <div key={res.id} className="p-4 bg-white border rounded-xl flex flex-col items-center text-center space-y-2 group hover:bg-surface-900 hover:text-white transition-all shadow-sm">
                         <p className="text-[9px] font-black uppercase italic truncate w-full group-hover:text-brand-400">{res.name}</p>
                         <div className={`text-sm font-black font-mono ${effSat < 0.8 ? 'text-econ-green' : effSat > 1.2 ? 'text-econ-red' : 'text-econ-amber'}`}>
                            {effSat.toFixed(2)}
                         </div>
                         <div className="w-full h-1 bg-surface-100 rounded-full">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (1/effSat)*50)}%` }} />
                         </div>
                         <span className="text-[7px] font-bold uppercase opacity-40">Eff. Saturation</span>
                      </div>
                   )
                })}
             </div>
          </Section>
       </div>
       <div className="col-span-4 space-y-6">
          <Section title="Volatility Stress Test" icon={TrendingDown}>
             <div className="space-y-4">
                <div className="p-6 bg-econ-red/5 border border-econ-red/10 rounded-2xl text-center">
                   <TrendingDown className="text-econ-red mx-auto mb-4" size={32} />
                   <p className="text-[10px] font-black uppercase text-econ-red italic">Portfolio Beta Impact</p>
                   <p className="text-4xl font-black font-mono text-econ-red mt-2">
                      {core.totalLevels > 0 ? (-(core.totalLevels / 100) * 12.5).toFixed(0) : 0}%
                   </p>
                   <p className="text-[8px] font-bold text-surface-400 uppercase mt-4">Simulated for -10% Market Correction</p>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between p-3 bg-white border rounded-xl">
                      <span className="text-[9px] font-bold text-surface-400 uppercase">Liquidity Buffer</span>
                      <span className="text-[9px] font-black">
                         {core.netDaily > 0 ? (core.totalValuation / core.netDaily).toFixed(1) : '∞'} Days
                      </span>
                   </div>
                   <div className="flex justify-between p-3 bg-white border rounded-xl">
                      <span className="text-[9px] font-bold text-surface-400 uppercase">Leverage Health</span>
                      <span className={`text-[9px] font-black ${core.coverageRatio > 10 ? 'text-econ-green' : 'text-econ-amber'}`}>
                         {core.coverageRatio > 10 ? 'OPTIMAL' : 'MONITOR'}
                      </span>
                   </div>
                   <div className="p-3 bg-surface-50 border border-dashed rounded-xl">
                      <p className="text-[8px] font-bold text-surface-400 uppercase mb-1 text-center">Phase Multiplier</p>
                      <p className="text-xs font-black text-center font-mono text-brand-600">x{beta > 1 ? beta.toFixed(2) : '1.00'}</p>
                   </div>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${active ? 'bg-brand-600 text-white shadow-lg scale-105' : 'text-surface-400 hover:text-surface-900 hover:bg-surface-50'}`}>
       <Icon size={14} /> {label}
       {active && <motion.div layoutId="tab-highlight" className="absolute inset-0 bg-white/10" />}
    </button>
  );
}

function Section({ title, icon: Icon, children, action, sub, subVal }: any) {
  return (
    <div className="bg-white border border-surface-200 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-xl hover:border-brand-500/20 transition-all">
       <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-surface-50 flex items-center justify-center text-brand-600 border group-hover:bg-brand-600 group-hover:text-white transition-all">
                <Icon size={18} />
             </div>
             <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-surface-900 italic">{title}</h3>
                {sub && <p className="text-[7px] font-bold text-surface-400 uppercase tracking-widest mt-0.5">{sub}: {subVal}</p>}
             </div>
          </div>
          {action}
       </div>
       <div className="flex-1">{children}</div>
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="p-6 bg-white border border-surface-200 rounded-2xl shadow-sm relative overflow-hidden group hover:border-brand-500 transition-all">
       <Icon size={48} className={`absolute -right-4 -top-4 opacity-5 ${color} group-hover:opacity-10 transition-opacity`} />
       <p className="text-[8px] font-black uppercase text-surface-400 tracking-widest mb-1">{label}</p>
       <p className={`text-2xl font-black font-mono tracking-tighter ${color}`}>{value}</p>
       <p className="text-[8px] font-bold text-surface-300 uppercase mt-4">{sub}</p>
    </div>
  );
}

function HeaderMetric({ label, value, color }: any) {
  return (
    <div className="px-5 py-3 bg-white rounded-xl border flex flex-col items-center">
       <span className="text-[8px] font-black text-surface-400 uppercase tracking-widest mb-1">{label}</span>
       <span className={`text-lg font-black font-mono tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}

function DockMetric({ label, value }: any) {
  return (
    <div className="flex flex-col">
       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{label}</span>
       <span className="text-[10px] font-black text-white font-mono">{value}</span>
    </div>
  );
}

function DockToggle({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-start group text-left">
       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{label}</span>
       <div className="flex items-center gap-2 mt-0.5">
          {!active ? <Link2Off size={12} className="text-econ-red" /> : <Link size={12} className="text-brand-400" />}
          <span className={`text-[10px] font-black font-mono ${active ? 'text-brand-400' : 'text-econ-red'}`}>{active ? 'CONNECTED' : 'DE-ATTACHED'}</span>
       </div>
    </button>
  );
}

function ModuleLink({ active, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-2 rounded-lg transition-all ${active ? 'text-brand-600 bg-brand-50 hover:bg-brand-100' : 'text-surface-300 hover:text-econ-red hover:bg-econ-red/5'}`} title={active ? "Linked to Global Calculations" : "Detached from Global Calculations"}>
       {active ? <Link size={16} /> : <Link2Off size={16} />}
    </button>
  );
}

function CashItem({ label, value, type, bold }: any) {
  const color = type === 'positive' ? 'text-econ-green' : type === 'negative' ? 'text-econ-red' : 'text-surface-900';
  return (
    <div className="flex justify-between items-center py-2 border-b border-surface-50 last:border-0">
       <span className="text-[9px] font-bold text-surface-400 uppercase italic">{label}</span>
       <span className={`font-mono font-black ${color} ${bold ? 'text-lg' : 'text-xs'}`}>{value}</span>
    </div>
  );
}

function PhaseDot({ phase }: { phase: string }) {
  const colors: Record<string, string> = {
    Expansion: "bg-econ-green", Boom: "bg-econ-green",
    Stagnation: "bg-econ-amber", Normal: "bg-brand-500",
    Recession: "bg-econ-red",
    Recovery: "bg-brand-500",
    Volatile: "bg-econ-purple"
  };
  return <span className={`w-2 h-2 rounded-full ring-4 ring-offset-0 ${colors[phase] ?? "bg-surface-400"} ${colors[phase]?.replace('bg-', 'ring-')}/20`} />;
}
