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
import { useTheme } from "../hooks/useTheme";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, RESOURCES, CONSTRUCTION_MATERIALS } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { LoadingState } from "../components/States";
import { useNavigate } from "../router";
import { useSharedRealm } from "../hooks/useSharedRealm";

// --- Types & Defaults ---
interface Executive {
  name: string;
  management: number;
  accounting: number;
  communication: number;
  science: number;
}

interface MapItem { id: string; level: number; }
interface InventoryItem { id: number; qty: number; }

interface SuiteStateV6 {
  activeTab: 'command' | 'ops' | 'exec' | 'finance' | 'logistics' | 'risk' | 'retail';
  globalSync: boolean;
  map: MapItem[];
  board: {
    coo: Executive; cfo: Executive; cmo: Executive; cto: Executive;
    cooApp: Executive; cfoApp: Executive; cmoApp: Executive; ctoApp: Executive;
  };
  inventory: InventoryItem[];
  settings: {
    prodBonus: number; realm: number; estDailyProfit: number;
    whatIfLevel: number;
    // Calc specific fields
    bankLevel: number;
    cash: number;
    bondsSold: number;
    bondsOwned: number;
    profileSalesBonus: number;
    recreationalBuildings: number;
    patentStartingQuality: number;
    patentTargetQuality: number;
    researchUnitCost: number;
    retailResourceId: number;
  };
  debt: { current: number; rate: number; };
  moduleSettings: {
    opsLinked: boolean; execLinked: boolean; financeLinked: boolean;
    logisticsLinked: boolean; riskLinked: boolean;
  };
  showStaff?: boolean;
  // theme removed as we use useTheme hook
}

const EMPTY_EXEC: Executive = { name: "", management: 0, accounting: 0, communication: 0, science: 0 };

const DEFAULT_STATE: SuiteStateV6 = {
  activeTab: 'command',
  globalSync: true,
  map: [],
  board: {
    coo: EMPTY_EXEC, cfo: EMPTY_EXEC, cmo: EMPTY_EXEC, cto: EMPTY_EXEC,
    cooApp: EMPTY_EXEC, cfoApp: EMPTY_EXEC, cmoApp: EMPTY_EXEC, ctoApp: EMPTY_EXEC,
  },
  inventory: [],
  settings: {
    prodBonus: 12, realm: 0, estDailyProfit: 250000, whatIfLevel: 0,
    bankLevel: 0, cash: 0, bondsSold: 0, bondsOwned: 0,
    profileSalesBonus: 0, recreationalBuildings: 0,
    patentStartingQuality: 0, patentTargetQuality: 1, researchUnitCost: 179,
    retailResourceId: 24
  },
  debt: { current: 2000000, rate: 0.5 },
  moduleSettings: {
    opsLinked: true, execLinked: true, financeLinked: true,
    logisticsLinked: true, riskLinked: true
  }
};

export function CorporateSuitePage() {
  const { theme, toggleTheme } = useTheme();
  const [realm, setRealm] = useSharedRealm();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const { data: dash } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);

  const [state, setState] = useState<SuiteStateV6>(() => {
    const saved = localStorage.getItem("simco_suite_v6");
    if (!saved) return DEFAULT_STATE;
    try {
      const parsed = JSON.parse(saved);
      // Deep merge with DEFAULT_STATE to handle migrations/missing fields
      return {
        ...DEFAULT_STATE,
        ...parsed,
        board: { ...DEFAULT_STATE.board, ...parsed.board },
        settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
        moduleSettings: { ...DEFAULT_STATE.moduleSettings, ...parsed.moduleSettings }
      };
    } catch (e) {
      return DEFAULT_STATE;
    }
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
    const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    const effMap = state.moduleSettings.opsLinked ? state.map : DEFAULT_STATE.map;
    const effBoard = state.moduleSettings.execLinked ? state.board : DEFAULT_STATE.board;
    const effProfit = n(state.moduleSettings.financeLinked ? state.settings.estDailyProfit : DEFAULT_STATE.settings.estDailyProfit);

    const totalLevels = effMap.reduce((s, i) => s + n(i.level), 0) + n(state.moduleSettings.opsLinked ? state.settings.whatIfLevel : 0);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    // Effective Skills (Simco logic: Primary + floor((Sum of others)/4))
    const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);

    const effMan = getEff(effBoard.coo.management, [effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management, effBoard.cooApp.management, effBoard.cfoApp.management, effBoard.cmoApp.management, effBoard.ctoApp.management]);
    const effAcc = getEff(effBoard.cfo.accounting, [effBoard.coo.accounting, effBoard.cmo.accounting, effBoard.cto.accounting, effBoard.cooApp.accounting, effBoard.cfoApp.accounting, effBoard.cmoApp.accounting, effBoard.ctoApp.accounting]);
    const effCom = getEff(effBoard.cmo.communication, [effBoard.coo.communication, effBoard.cfo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmoApp.communication, effBoard.ctoApp.communication]);
    const effSci = getEff(effBoard.cto.science, [effBoard.coo.science, effBoard.cfo.science, effBoard.cmo.science, effBoard.cooApp.science, effBoard.cfoApp.science, effBoard.cmoApp.science, effBoard.ctoApp.science]);

    const actualAO = rawAO * (1 - (effMan * 0.01));
    const baseTaxThreshold = 3000000 + (effAcc * 500000);
    const taxThreshold = baseTaxThreshold * (1 + (state.settings.bankLevel * 0.05)); // Bank level adds 5%?

    const salesSpeedBonus = (effCom * 0.01) + (state.settings.profileSalesBonus * 0.01);
    const patentProb = 0.0179 + (effSci * 0.0015);
    // Actually image: 51 Science -> 9.44% Patent Prob.
    // 51 * 0.15 = 7.65. 9.44 - 7.65 = 1.79.
    // Base is likely around 2%.

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
      case 'ops': return <OperationsView state={state} core={core} setState={setState} theme={theme} />;
      case 'exec': return <ExecutiveView state={state} core={core} setState={setState} />;
      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;
      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} margins={margins} audit={audit} fileInputRef={fileInputRef} />;
      case 'retail': return <RetailView state={state} core={core} setState={setState} retail={retail} theme={theme} />;
      case 'risk': return <RiskView state={state} core={core} phase={economyPhase} retail={retail} theme={theme} />;
    }
  };

  if (mLoading && !margins) return <LoadingState text="Booting Terminal..." />;

  return (
    <div className="mx-auto p-4 lg:p-6 bg-surface-950 min-h-screen relative">
      <AnimatePresence>
         {notification && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
               <div className={`px-6 py-3 rounded-[1.5rem] shadow-2xl flex items-center gap-3 border ${notification.type === 'success' ? 'bg-econ-green text-white border-econ-green' : 'bg-econ-red text-white border-econ-red'}`}>
                  {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span className="text-xs font-black uppercase tracking-widest">{notification.msg}</span>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <header className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-6">
           <div>
              <div className="flex items-center gap-2 text-brand-500 font-black text-[10px] uppercase tracking-[0.3em] mb-1">
                 <Globe size={14} /> Corporate Command
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                Simco<span className="text-brand-500">Terminal</span> <span className="text-[10px] font-mono non-italic opacity-40">V6.0</span>
              </h1>
           </div>

           <nav className="flex items-center bg-surface-900 border border-white/10 rounded-[1.5rem] p-1 gap-1 shadow-sm ml-8">
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
           <HeaderMetric label="Net Cashflow" value={`$${(core.netDaily/1000).toFixed(1)}K/d`} color="text-brand-500" />
           <div className="h-10 w-px bg-white/10" />
           <button onClick={() => navigate('/')} className="p-3 text-white/40 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
        </div>
      </header>

      <main className="min-h-[700px]">
         <AnimatePresence mode="wait">
            <motion.div key={state.activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
               {renderTab()}
            </motion.div>
         </AnimatePresence>
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-8 z-50">
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
           <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-600/10 flex items-center justify-center text-brand-500 mb-8 border border-brand-500/20 shadow-xl shadow-brand-500/10">
              <Building2 size={40} />
           </div>
           <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Initialize Terminal</h2>
           <p className="text-white/40 max-w-md text-center leading-relaxed font-medium mb-12">
              Your corporate workspace is currently empty. To begin economic analysis, upload your game data or manually add facilities.
           </p>
           <div className="grid grid-cols-2 gap-6 w-full max-w-xl">
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 p-8 bg-surface-900 border border-white/10 rounded-[2rem] hover:border-brand-500 hover:shadow-2xl transition-all group">
                 <div className="p-4 bg-white/5 rounded-[1.5rem] text-brand-500 group-hover:bg-gradient-to-br from-brand-500 to-brand-600 group-hover:text-white transition-colors">
                    <Upload size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-white">Import Data</p>
                    <p className="text-[10px] text-white/20 mt-1 uppercase font-bold">CSV/JSON Exports</p>
                 </div>
              </button>
              <button onClick={() => setState({...state, activeTab: 'ops'})} className="flex flex-col items-center gap-4 p-8 bg-surface-900 border border-white/10 rounded-[2rem] hover:border-brand-500 hover:shadow-2xl transition-all group">
                 <div className="p-4 bg-white/5 rounded-[1.5rem] text-brand-500 group-hover:bg-gradient-to-br from-brand-500 to-brand-600 group-hover:text-white transition-colors">
                    <UserPlus size={24} />
                 </div>
                 <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-white">Manual Entry</p>
                    <p className="text-[10px] text-white/20 mt-1 uppercase font-bold">Build from scratch</p>
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
                <Kpi label="Enterprise Value" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} sub={`Liquid: $${(core.inventoryValue/1000).toFixed(1)}K`} icon={TrendingUp} color="text-brand-500" />
                <Kpi label="Daily Net Flow" value={`$${(core.netDaily/1000).toFixed(1)}K`} sub="Post-Tax/AO" icon={DollarSign} color="text-econ-green" />
                <Kpi label="Admin Overhead" value={`${(core.actualAO*100).toFixed(2)}%`} sub={`${core.totalLevels} Active Levels`} icon={BarChart3} color="text-econ-red" />
             </div>
             <div className="mt-6 flex items-center gap-3 bg-white/5 p-4 rounded-[1.5rem] border border-dashed border-white/10 text-white/40">
                <PhaseDot phase={phase} />
                <div>
                   <p className="text-[10px] font-black uppercase text-white tracking-widest">Regime Awareness: {phase}</p>
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
                         <span className="text-white/40">{cat}</span>
                         <span className="text-white">{lvls} Lvls</span>
                         </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-br from-brand-500 to-brand-600" style={{ width: `${(lvls / (core.totalLevels || 1)) * 100}%` }} />
                         </div>
                      </div>
                   )) : (
                   <div className="py-10 text-center text-white/10 text-[10px] font-black uppercase italic">No Infrastructure Data</div>
                   )}
                </div>
             </Section>
          <Section title="Financial Projections" icon={LineIcon} action={<button onClick={() => setState({...state, activeTab: 'finance'})} className="text-[8px] font-black uppercase text-brand-500 hover:text-brand-400">View All</button>}>
                <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                   <span className="text-[9px] font-bold text-white/40 uppercase">7D Growth Est.</span>
                      <span className="text-xs font-black font-mono text-econ-green">+$${(core.netDaily * 7 / 1000).toFixed(1)}K</span>
                   </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                   <span className="text-[9px] font-bold text-white/40 uppercase">30D Forecast</span>
                   <span className="text-xs font-black font-mono text-brand-500">+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M</span>
                   </div>
                </div>
             </Section>
          </div>
       </div>
       <div className="col-span-4 space-y-6">
          <Section title="Facility Project Pipeline" icon={Calculator} action={<button onClick={() => setState({...state, activeTab: 'ops'})} className="text-[8px] font-black uppercase text-brand-500 hover:text-brand-400">View All</button>}>
             <div className="space-y-4">
                {state.map.slice(0, 4).map((m: any, i: number) => {
                   const b = BUILDINGS.find(bu => bu.id === m.id);
                   return (
                      <div key={i} className="p-4 bg-white/5 border border-dashed border-white/10 rounded-[1.5rem]">
                         <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black uppercase text-brand-500 truncate max-w-[120px]">{b?.name || 'Building'}</p>
                            <span className="text-[8px] font-black bg-white/5 text-white/40 px-2 py-0.5 rounded border border-white/5">LVL {m.level}</span>
                         </div>
                         <div className="flex justify-between items-end">
                            <span className="text-[8px] font-bold text-white/20 uppercase">Daily Wages: $${(m.level * (b?.wages || 0) * 24 / 1000).toFixed(1)}K</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase">AO Contrib: ${((m.level / 170) * 100).toFixed(2)}%</span>
                         </div>
                      </div>
                   );
                })}
                {state.map.length === 0 && <div className="py-20 text-center text-white/10 text-[10px] font-black uppercase italic">Add facilities in Operations</div>}
             </div>
          </Section>
       </div>
    </div>
  );
}

function OperationsView({ state, setState, core, theme }: any) {
  const [targetLevels, setTargetLevels] = React.useState<Record<number, number>>({});

  const constructionTotals = useMemo(() => {
    const totals: Record<number, number> = { 101: 0, 102: 0, 108: 0, 111: 0, 110: 0, 0: 0 }; // 0 for Cash

    state.map.forEach((m: any) => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (!b) return;
      const target = targetLevels[state.map.indexOf(m)] || m.level;
      if (target <= m.level) return;

      for (let l = m.level; l < target; l++) {
        const multiplier = l === 0 ? 1 : l;
        b.resources.forEach((r: any) => {
          if (r.id !== 109) { // Remove Windows from logic as requested
            totals[r.id] = (totals[r.id] || 0) + (r.qty * multiplier);
          }
        });
        totals[0] += b.cost * (l <= 1 ? 1 : l); // Cash cost approx
      }
    });
    return totals;
  }, [state.map, targetLevels]);

  const updateTarget = (idx: number, lvl: number) => {
    setTargetLevels(prev => ({ ...prev, [idx]: Math.max(state.map[idx].level, lvl) }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
       <div className="md:col-span-5 lg:col-span-4 space-y-8">
          <Section title="Asset Registry" icon={Building2} action={<ModuleLink active={state.moduleSettings.opsLinked} onClick={() => setState({...state, moduleSettings: {...state.moduleSettings, opsLinked: !state.moduleSettings.opsLinked}})} theme={theme} />}>
             <div className="space-y-6">
                <div className={`flex justify-between items-center p-6 rounded-[1.5rem] border border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-surface-50 border-surface-200'}`}>
                   <div className="text-center flex-1 border-r border-dashed border-surface-200 dark:border-white/10">
                      <p className={`text-[9px] font-bold uppercase mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Cumulative Levels</p>
                      <p className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{core.totalLevels}</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className={`text-[9px] font-bold uppercase mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Daily Expenditure</p>
                      <p className="text-2xl font-black font-mono text-econ-red">$${(core.dailyWages/1000).toFixed(1)}K</p>
                   </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                   {state.map.map((m: any, i: number) => (
                      <div key={i} className={`flex flex-col gap-4 p-4 border rounded-[1.5rem] transition-all shadow-sm group ${theme === 'dark' ? 'bg-black/40 border-white/5 hover:border-brand-500' : 'bg-white border-surface-200 hover:border-brand-500'}`}>
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold ${theme === 'dark' ? 'bg-white/5 text-white/20' : 'bg-surface-100 text-surface-400'}`}>#{i+1}</div>
                            <select value={m.id} onChange={(e) => { const next = [...state.map]; next[i].id = e.target.value; setState({...state, map: next}); }} className={`flex-1 bg-transparent border-none text-[11px] font-black uppercase focus:ring-0 p-0 ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>
                               {BUILDINGS.map(b => <option key={b.id} value={b.id} className={theme === 'dark' ? 'bg-surface-900 text-white' : 'bg-white text-surface-900'}>{b.name}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                               <p className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-surface-400'}`}>Lvl</p>
                               <input type="number" value={m.level} onChange={(e) => { const next = [...state.map]; next[i].level = Number(e.target.value); setState({...state, map: next}); }} className={`w-14 h-10 border-none rounded-xl text-center text-xs font-black focus:ring-2 focus:ring-brand-500/50 ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-surface-100 text-surface-900'}`} />
                            </div>
                            <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className={`p-2 transition-all rounded-lg ${theme === 'dark' ? 'text-white/10 hover:text-econ-red hover:bg-econ-red/10' : 'text-surface-300 hover:text-econ-red hover:bg-econ-red/10'}`}><Trash2 size={16} /></button>
                         </div>
                         <div className={`pt-3 border-t flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-surface-50'}`}>
                            <p className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-surface-400'}`}>Construction Target</p>
                            <div className="flex items-center gap-3">
                               <button onClick={() => updateTarget(i, (targetLevels[i] || m.level) - 1)} className={`w-6 h-6 rounded-lg flex items-center justify-center border ${theme === 'dark' ? 'border-white/10 text-white/40' : 'border-surface-200 text-surface-400'}`}>-</button>
                               <span className={`text-xs font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{targetLevels[i] || m.level}</span>
                               <button onClick={() => updateTarget(i, (targetLevels[i] || m.level) + 1)} className={`w-6 h-6 rounded-lg flex items-center justify-center border ${theme === 'dark' ? 'border-white/10 text-white/40' : 'border-surface-200 text-surface-400'}`}>+</button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
                <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className={`w-full py-5 border-2 border-dashed rounded-[1.5rem] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${theme === 'dark' ? 'border-white/10 text-white/40 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-500/5' : 'border-surface-200 text-surface-400 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-500/5'}`}>
                   <UserPlus size={18} /> Append New Infrastructure
                </button>
             </div>
          </Section>
       </div>
       <div className="md:col-span-7 lg:col-span-8 space-y-10">
          <Section title="Construction Logistics Hub" icon={HardHat}>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Aggregate Requirements for Upgrades</p>
                   <div className="grid grid-cols-1 gap-3">
                      {[101, 102, 108, 111, 110].map(id => {
                        const qty = constructionTotals[id] || 0;
                        const material = CONSTRUCTION_MATERIALS.find(m => m.id === id);
                        return (
                          <div key={id} className={`flex justify-between items-center p-5 border rounded-2xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-surface-50 border-surface-200'}`}>
                             <div className="flex flex-col">
                                <span className={`text-[11px] font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>{material?.name}</span>
                                <span className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-surface-400'}`}>Unit ID: {id}</span>
                             </div>
                             <div className="text-right">
                                <span className={`text-xl font-black font-mono ${qty > 0 ? 'text-brand-500' : (theme === 'dark' ? 'text-white/10' : 'text-surface-200')}`}>{qty.toLocaleString()}</span>
                                <p className={`text-[8px] font-bold uppercase ${theme === 'dark' ? 'text-white/20' : 'text-surface-400'}`}>Units Needed</p>
                             </div>
                          </div>
                        )
                      })}
                   </div>
                </div>
                <div className="space-y-8">
                   <div className={`p-8 rounded-[2rem] border transition-all text-center ${theme === 'dark' ? 'bg-brand-500/5 border-brand-500/20' : 'bg-brand-50 border-brand-100'}`}>
                      <p className="text-xs font-black text-brand-500 uppercase italic tracking-widest mb-4">Total Estimated Liquid Capital</p>
                      <p className={`text-6xl font-black font-mono tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>$${(constructionTotals[0]/1000).toFixed(1)}<span className="text-2xl opacity-40 ml-1 text-brand-500">K</span></p>
                      <p className={`text-[10px] font-bold uppercase mt-6 ${theme === 'dark' ? 'text-white/30' : 'text-surface-400'}`}>Based on standard reference values and 0% scrap return.</p>
                   </div>
                   <div className={`p-6 rounded-2xl border border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-surface-50 border-surface-200'}`}>
                      <h4 className={`text-[10px] font-black uppercase mb-4 tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-surface-600'}`}>Strategic Logistics Advice</h4>
                      <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>
                         For massive expansions ({">"}50 levels), consider sourcing <span className="text-brand-500 font-bold">Construction Units</span> via contract to avoid exchange fees.
                         Ensure your <span className="text-econ-amber font-bold">CFO</span> is at high level to minimize accounting fees when holding large quantities of building materials.
                      </p>
                   </div>
                </div>
             </div>
          </Section>

          <Section title="Expansion Scenario Simulator" icon={Layers}>
             <div className={`p-10 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-brand-500/5 border-brand-500/10' : 'bg-brand-50 border-brand-100'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
                   <div>
                      <p className="text-xs font-black text-brand-500 uppercase italic tracking-widest mb-2">Simulated Infrastructure Growth</p>
                      <p className={`text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>+{state.settings.whatIfLevel} <span className="text-2xl opacity-40">Lvls</span></p>
                   </div>
                   <div className="text-left sm:text-right">
                      <p className={`text-[10px] font-bold uppercase mb-2 ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Resultant Efficiency Drag</p>
                      <p className="text-2xl font-black font-mono text-econ-red">{(core.actualAO*100).toFixed(2)}%</p>
                   </div>
                </div>
                <input
                   type="range" min="0" max="500" step="10"
                   value={state.settings.whatIfLevel}
                   onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})}
                   className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
             </div>
          </Section>
       </div>
    </div>
  );
}

function ExecutiveView({ state, setState, core }: any) {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteData, setPasteData] = useState("");
  const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const handlePaste = () => {
    const lines = pasteData.split('\n');
    const newBoard = { ...state.board };

    // Simple heuristic parser for SimCompanies Executive page copy-paste
    let currentExec: any = null;
    const roles = ['COO', 'CFO', 'CMO', 'CTO'];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (roles.includes(trimmed)) {
        currentExec = trimmed.toLowerCase();
      } else if (trimmed.includes('Management:')) {
        if (currentExec) newBoard[currentExec].management = parseInt(trimmed.split(':')[1]) || 0;
      } else if (trimmed.includes('Accounting:')) {
        if (currentExec) newBoard[currentExec].accounting = parseInt(trimmed.split(':')[1]) || 0;
      } else if (trimmed.includes('Communication:')) {
        if (currentExec) newBoard[currentExec].communication = parseInt(trimmed.split(':')[1]) || 0;
      } else if (trimmed.includes('Science:')) {
        if (currentExec) newBoard[currentExec].science = parseInt(trimmed.split(':')[1]) || 0;
      }
    });

    setState({ ...state, board: newBoard });
    setShowPasteModal(false);
    setPasteData("");
  };

  const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);

  const effMan = getEff(state.board.coo.management, [state.board.cfo.management, state.board.cmo.management, state.board.cto.management, state.board.cooApp.management, state.board.cfoApp.management, state.board.cmoApp.management, state.board.ctoApp.management]);
  const effAcc = getEff(state.board.cfo.accounting, [state.board.coo.accounting, state.board.cmo.accounting, state.board.cto.accounting, state.board.cooApp.accounting, state.board.cfoApp.accounting, state.board.cmoApp.accounting, state.board.ctoApp.accounting]);
  const effCom = getEff(state.board.cmo.communication, [state.board.coo.communication, state.board.cfo.communication, state.board.cto.communication, state.board.cooApp.communication, state.board.cfoApp.communication, state.board.cmoApp.communication, state.board.ctoApp.communication]);
  const effSci = getEff(state.board.cto.science, [state.board.coo.science, state.board.cfo.science, state.board.cmo.science, state.board.cooApp.science, state.board.cfoApp.science, state.board.cmoApp.science, state.board.ctoApp.science]);

  return (
    <div className="space-y-6 pb-20">
      {/* Quick Fill Header */}
      <div className="bg-surface-900 rounded-[2rem] p-6 border border-white/5">
        <h2 className="text-econ-amber text-[10px] font-black uppercase tracking-[0.2em] mb-4">Executive Skills Quick Fill</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <button onClick={() => setShowPasteModal(true)} className="bg-econ-green text-white py-3 rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all">Paste Executive Data</button>
          <button onClick={() => setState({...state, board: DEFAULT_STATE.board})} className="bg-surface-600 text-white py-3 rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all">Clear Executives</button>
          <button onClick={() => setState(DEFAULT_STATE)} className="bg-econ-red text-white py-3 rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all">Clear All</button>
        </div>
        <p className="text-[8px] text-econ-amber opacity-60 font-medium leading-relaxed">
          To easily add your executives from the game, go to the <span className="underline">Executives Page</span> and select all your executives including staff, copy and then paste using Paste button.<br/>
          Clear Executives – Removes all executive and staff data while keeping your calculation inputs (building levels, cash, etc.).<br/>
          Clear All – Resets everything on the page to default values.
        </p>
      </div>

      {/* Total Effective Skills */}
      <div className="bg-surface-900 rounded-[2rem] p-6 border border-white/5">
        <h2 className="text-econ-amber text-center text-[10px] font-black uppercase tracking-[0.2em] mb-6">Total Effective Skill Points</h2>
        <div className="grid grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-white/40 text-[8px] font-black uppercase mb-1">Management</p>
            <p className="text-white text-2xl font-black font-mono">{effMan}</p>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-[8px] font-black uppercase mb-1">Accounting</p>
            <p className="text-white text-2xl font-black font-mono">{effAcc}</p>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-[8px] font-black uppercase mb-1">Communication</p>
            <p className="text-white text-2xl font-black font-mono">{effCom}</p>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-[8px] font-black uppercase mb-1">Science</p>
            <p className="text-white text-2xl font-black font-mono text-brand-400">{effSci}</p>
          </div>
        </div>
      </div>

      <div className="bg-econ-amber/10 border border-econ-amber/20 p-3 rounded-xl">
        <p className="text-econ-amber text-[8px] font-black italic">Tip: You can drag and drop executives to rearrange their positions.</p>
      </div>

      {/* Executives Grid */}
      <div className="grid grid-cols-4 gap-6">
        <ExecCard role="COO" data={state.board.coo} onChange={(d: any) => setState({...state, board: {...state.board, coo: d}})} />
        <ExecCard role="CFO" data={state.board.cfo} onChange={(d: any) => setState({...state, board: {...state.board, cfo: d}})} />
        <ExecCard role="CMO" data={state.board.cmo} onChange={(d: any) => setState({...state, board: {...state.board, cmo: d}})} />
        <ExecCard role="CTO" data={state.board.cto} onChange={(d: any) => setState({...state, board: {...state.board, cto: d}})} />

        <ExecCard role="COO Apprentice" data={state.board.cooApp} onChange={(d: any) => setState({...state, board: {...state.board, cooApp: d}})} />
        <ExecCard role="CFO Apprentice" data={state.board.cfoApp} onChange={(d: any) => setState({...state, board: {...state.board, cfoApp: d}})} />
        <ExecCard role="CMO Apprentice" data={state.board.cmoApp} onChange={(d: any) => setState({...state, board: {...state.board, cmoApp: d}})} />
        <ExecCard role="CTO Apprentice" data={state.board.ctoApp} onChange={(d: any) => setState({...state, board: {...state.board, ctoApp: d}})} />
      </div>

      {/* Staff Slots */}
      <motion.div initial={false} className="bg-surface-900 rounded-[1.5rem] border border-white/5 overflow-hidden">
        <button
          onClick={() => setState({...state, showStaff: !state.showStaff})}
          className="w-full p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all border-b border-white/5"
        >
          <span className="text-econ-amber text-[10px] font-black uppercase tracking-widest">Staff Slots</span>
          <TrendingDown size={14} className={`text-white/40 transition-transform ${state.showStaff ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {state.showStaff && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="px-4 pb-4 grid grid-cols-6 gap-4"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-black/20 border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 group hover:border-econ-amber/40 transition-all">
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-econ-amber transition-all">
                      <UserPlus size={14} />
                   </div>
                   <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Slot {i+1}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Calculators */}
      <div className="grid grid-cols-4 gap-6">
        <CalcBox title="1. Admin Overhead % Calculation">
           <div className="space-y-4">
              <p className="text-[8px] text-white/40 leading-relaxed uppercase">Calculates Admin Overhead based on building levels and executive reduction.</p>
              <Input label="Total Building Levels:" value={core.totalLevels} readOnly />
              <div className="space-y-1 pt-2">
                 <p className="text-[8px] font-bold text-white/60">Initial Admin Overhead: <span className="text-white">{(core.rawAO*100).toFixed(2)}%</span></p>
                 <p className="text-[8px] font-bold text-white/60">Executive Reduction: <span className="text-white">{(effMan).toFixed(2)}%</span></p>
                 <p className="text-[8px] font-bold text-white/60">Final Admin Overhead: <span className="text-econ-red">{(core.actualAO*100).toFixed(2)}%</span></p>
              </div>
           </div>
        </CalcBox>

        <CalcBox title="2. Accounting Fee Threshold & Tax">
           <div className="space-y-4">
              <p className="text-[8px] text-white/40 leading-relaxed uppercase">Calculates the cash threshold before tax and the resulting daily tax fee.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Bank Level (0-40):" value={state.settings.bankLevel} onChange={(v) => setState({...state, settings: {...state.settings, bankLevel: v}})} />
              </div>
              <Input label="Total Cash:" value={state.settings.cash} onChange={(v) => setState({...state, settings: {...state.settings, cash: v}})} />
              <Input label="Bonds Sold Value:" value={state.settings.bondsSold} onChange={(v) => setState({...state, settings: {...state.settings, bondsSold: v}})} />
              <Input label="Bonds Owned Value:" value={state.settings.bondsOwned} onChange={(v) => setState({...state, settings: {...state.settings, bondsOwned: v}})} />

              <div className="grid grid-cols-2 gap-2 pt-2 text-[8px] font-bold uppercase">
                <div className="text-white/40">Max Cash Limit: <br/><span className="text-white">${core.taxThreshold.toLocaleString()}</span></div>
                <div className="text-white/40">Cash Headroom: <br/><span className="text-white">${Math.max(0, core.taxThreshold - state.settings.cash).toLocaleString()}</span></div>
                <div className="text-white/40">Excessive Cash: <br/><span className="text-white">${Math.max(0, state.settings.cash - core.taxThreshold).toLocaleString()}</span></div>
                <div className="text-white/40">Final Tax Fee: <br/><span className="text-econ-red">${(Math.max(0, state.settings.cash - core.taxThreshold) * 0.005).toLocaleString()}</span></div>
              </div>
           </div>
        </CalcBox>

        <CalcBox title="3. Sales Speed & Rating Bonus">
           <div className="space-y-4">
              <p className="text-[8px] text-white/40 leading-relaxed uppercase">Calculates the final sales speed bonus and the impact on restaurant ratings.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Your Profile Sales Bonus:" value={state.settings.profileSalesBonus} onChange={(v) => setState({...state, settings: {...state.settings, profileSalesBonus: v}})} />
                <Input label="Recreational Buildings (0-3):" value={state.settings.recreationalBuildings} onChange={(v) => setState({...state, settings: {...state.settings, recreationalBuildings: v}})} />
              </div>
              <div className="space-y-1 pt-2">
                 <p className="text-[8px] font-bold text-white/60 uppercase">Final Sales Speed: <span className="text-econ-red">{(core.salesSpeedBonus*100).toFixed(0)}%</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase">Resto Rating Bonus (Execs): <span className="text-white">0.00%</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase">Resto Rating Bonus (Other): <span className="text-white">0.00%</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase text-econ-amber">Total Rating Bonus: 0.00%</p>
              </div>
           </div>
        </CalcBox>

        <CalcBox title="4. Patent Probability & Research Cost">
           <div className="space-y-4">
              <p className="text-[8px] text-white/40 leading-relaxed uppercase">Calculates patent probability and the research units/cost needed for quality upgrades.</p>
              <div className="grid grid-cols-3 gap-2">
                <Input label="Starting Quality:" value={state.settings.patentStartingQuality} onChange={(v) => setState({...state, settings: {...state.settings, patentStartingQuality: v}})} />
                <Input label="Target Quality:" value={state.settings.patentTargetQuality} onChange={(v) => setState({...state, settings: {...state.settings, patentTargetQuality: v}})} />
                <Input label="Research Unit Cost:" value={state.settings.researchUnitCost} onChange={(v) => setState({...state, settings: {...state.settings, researchUnitCost: v}})} />
              </div>
              <div className="space-y-1 pt-2">
                 <p className="text-[8px] font-bold text-white/60 uppercase">Final Patent Probability: <span className="text-white">{(core.patentProb*100).toFixed(2)}%</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase">Research Production Speed Bonus: <span className="text-econ-red">{(effSci * 2).toFixed(0)}%</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase">Patents Needed: <span className="text-white">{((state.settings.patentTargetQuality ** 2) * 500).toLocaleString()}</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase">Research Units: <span className="text-white">{(Math.round(((state.settings.patentTargetQuality ** 2) * 500) / core.patentProb)).toLocaleString()}</span></p>
                 <p className="text-[8px] font-bold text-white/60 uppercase text-econ-amber">Total Research Cost: ${(Math.round(((state.settings.patentTargetQuality ** 2) * 500) / core.patentProb) * state.settings.researchUnitCost).toLocaleString()}</p>
              </div>
           </div>
        </CalcBox>
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-900 border border-white/20 rounded-[2rem] p-8 max-w-2xl w-full">
            <h3 className="text-econ-amber text-xs font-black uppercase mb-4">Paste Executive Data</h3>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full h-64 bg-black/50 border border-white/10 rounded-[1.5rem] p-4 text-xs font-mono text-white mb-6 focus:ring-1 focus:ring-econ-amber outline-none"
              placeholder="Paste text from SimCompanies Executives page here..."
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowPasteModal(false)} className="px-6 py-2 text-[10px] font-black uppercase text-white/40">Cancel</button>
              <button onClick={handlePaste} className="bg-econ-green text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase">Parse & Fill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExecCard({ role, data, onChange }: any) {
  const handleChange = (field: string, val: any) => {
    onChange({ ...data, [field]: val });
  };

  return (
    <div className="bg-surface-900 border border-white/5 rounded-[1.5rem] p-4 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-econ-amber text-[9px] font-black uppercase tracking-widest">{role}</span>
        <input
          placeholder="Executive Name"
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="bg-black/20 border-none rounded px-2 py-1 text-[8px] font-mono text-white/40 text-right w-24 outline-none focus:text-white transition-colors"
        />
      </div>

      <div className="space-y-2">
        <ExecSkill label="Management" value={data.management} onChange={(v) => handleChange('management', v)} />
        <ExecSkill label="Accounting" value={data.accounting} onChange={(v) => handleChange('accounting', v)} />
        <ExecSkill label="Communication" value={data.communication} onChange={(v) => handleChange('communication', v)} />
        <ExecSkill label="Science" value={data.science} onChange={(v) => handleChange('science', v)} />
      </div>
    </div>
  );
}

function ExecSkill({ label, value, onChange }: any) {
  return (
    <div className="flex justify-between items-center bg-black/20 rounded p-2">
      <span className="text-[8px] font-bold text-white/40 uppercase">{label}</span>
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => {
           const val = parseInt(e.target.value);
           onChange(isNaN(val) ? 0 : val);
        }}
        className="w-12 bg-transparent border-none text-right text-[10px] font-black font-mono text-white p-0 focus:ring-0"
      />
    </div>
  );
}

function CalcBox({ title, children }: any) {
  return (
    <div className="bg-surface-900 border border-white/5 rounded-[1.5rem] p-6">
      <h3 className="text-econ-amber text-[9px] font-black uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, readOnly }: any) {
  return (
    <div className="space-y-1.5">
      <p className="text-[8px] font-bold text-white/40 uppercase">{label}</p>
      <input
        type="number"
        value={value ?? 0}
        readOnly={readOnly}
        onChange={(e) => {
           const val = parseInt(e.target.value);
           onChange?.(isNaN(val) ? 0 : val);
        }}
        className="w-full bg-surface-950/40 border border-white/5 rounded p-2 text-[10px] font-black font-mono text-white focus:ring-1 focus:ring-brand-500 outline-none"
      />
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
                   <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Estimated Daily Profit</p>
                   <input type="number" value={state.settings.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="w-full bg-white/5 border border-white/5 rounded p-3 text-lg font-black font-mono text-white focus:ring-1 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                   <p className="text-[8px] font-bold text-white/40 uppercase mb-1">Current Corporate Debt</p>
                   <input type="number" value={state.debt.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="w-full bg-white/5 border border-white/5 rounded p-3 text-lg font-black font-mono text-white focus:ring-1 focus:ring-brand-500 outline-none" />
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
                   <div className="h-px bg-white/5 my-4" />
                   <CashItem label="Daily Net Flow" value={`$${(core.netDaily/1000).toFixed(1)}K`} type="positive" bold />
                </div>
                <div className="bg-white/5 rounded-[1.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center">
                   <p className="text-[8px] font-black text-white/40 uppercase mb-2">Accounting Safety</p>
                   <p className="text-2xl font-black font-mono text-econ-green">$${(core.taxThreshold/1_000_000).toFixed(1)}M</p>
                   <p className="text-[8px] font-bold text-white/20 uppercase mt-1">Daily Exemption Remaining</p>
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
                   <button onClick={() => setShowClearConfirm(true)} className="flex-1 py-2 bg-white/5 hover:bg-econ-red/10 hover:text-econ-red border border-white/10 text-white/40 rounded-xl text-[8px] font-black uppercase transition-all">Clear All</button>
                ) : (
                   <div className="flex-1 flex gap-1 animate-in slide-in-from-top-1 duration-200">
                      <button onClick={() => { setState({...state, inventory: []}); setShowClearConfirm(false); }} className="flex-1 py-2 bg-econ-red text-white rounded-xl text-[8px] font-black uppercase">Confirm</button>
                      <button onClick={() => setShowClearConfirm(false)} className="px-2 py-2 bg-white/20 text-white rounded-xl text-[8px] font-black uppercase">X</button>
                   </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-[8px] font-black uppercase hover:bg-gradient-to-br from-brand-500 to-brand-600 transition-all shadow-lg shadow-brand-500/20">Import Data</button>
             </div>
             <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {RESOURCES.slice(0, 30).map(r => {
                   const item = state.inventory.find(i => i.id === r.id);
                   return (
                      <div key={r.id} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-xl group hover:border-brand-500 transition-all shadow-sm">
                         <span className="text-[10px] font-black uppercase italic text-white">{r.name}</span>
                         <input type="number" value={item?.qty || ""} onChange={(e) => { const qty = Number(e.target.value); const nextInv = [...state.inventory.filter(i => i.id !== r.id)]; if (qty > 0) nextInv.push({ id: r.id, qty }); setState({ ...state, inventory: nextInv }); }} placeholder="0" className="w-20 bg-white/5 border-none rounded p-1 text-[10px] font-black text-center text-white focus:ring-1 focus:ring-brand-500" />
                      </div>
                   )
                })}
             </div>
          </Section>
       </div>
       <div className="col-span-8 space-y-6">
          <Section title="Supply Chain Auditor" icon={AlertTriangle}>
             <div className="p-8 bg-surface-950 text-white rounded-[2rem] relative overflow-hidden border border-white/5">
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-2">Liquid Asset Valuation</p>
                   <p className="text-5xl font-black font-mono italic tracking-tighter">$${(core.inventoryValue/1000).toFixed(1)}K</p>
                   <div className="mt-8 flex gap-4">
                      <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-[1.5rem]">
                         <p className="text-[8px] font-bold uppercase opacity-40 mb-1">Vertical Health</p>
                         <p className="text-lg font-black font-mono text-econ-green">{audit.health.toFixed(1)}%</p>
                      </div>
                      <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-[1.5rem]">
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

function RetailView({ state, setState, core, retail, theme }: any) {
  const [calc, setCalc] = React.useState({
    cost: 0,
    price: 0,
    quality: 0
  });

  const selectedRes = RESOURCES.find(r => r.id === state.settings.retailResourceId) || RESOURCES.find(r => r.id === 24);
  const retailData = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === selectedRes?.name.toLowerCase()) : null;
  const marketSat = (retailData as any)?.[1]?.saturation || 1.0;
  const marketPrice = (retailData as any)?.[1]?.price || 0;

  // Simple Retail logic for simulator
  // Profit = Price - Cost - (Wages / UnitsPerHour)
  // Units/hr depends on Saturation and Bonus
  // This is a simplified model for the UI
  const unitsPerHourBase = 10; // Placeholder base
  const unitsPerHour = unitsPerHourBase * (1 + core.salesSpeedBonus) / (marketSat || 1);
  const hourlyProfit = (calc.price - calc.cost) * unitsPerHour - (100 / unitsPerHour); // 100 as placeholder wage

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
       <div className="xl:col-span-4 space-y-8">
          <Section title="Product Selection" icon={Search}>
             <div className="space-y-6">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Target Consumer Good</p>
                <select
                  value={state.settings.retailResourceId}
                  onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})}
                  className={`w-full h-14 border rounded-2xl px-6 text-sm font-black uppercase focus:ring-4 focus:ring-brand-500/20 outline-none appearance-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-surface-50 border-surface-200 text-surface-900'}`}
                >
                   {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                      <option key={r.id} value={r.id} className={theme === 'dark' ? 'bg-surface-900' : 'bg-white'}>{r.name}</option>
                   ))}
                </select>
                <div className={`p-6 rounded-2xl border border-dashed transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-surface-50 border-surface-200'}`}>
                   <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Market Saturation</span>
                      <span className={`text-sm font-black font-mono ${marketSat > 1.2 ? 'text-econ-red' : 'text-econ-green'}`}>{marketSat.toFixed(2)}</span>
                   </div>
                   <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, (1/marketSat)*50)}%` }} />
                   </div>
                </div>
             </div>
          </Section>

          <Section title="Profitability Simulator" icon={Calculator}>
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <p className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Sourcing Cost</p>
                      <input type="number" value={calc.cost} onChange={(e) => setCalc({...calc, cost: Number(e.target.value)})} className={`w-full h-12 border rounded-xl px-4 text-xs font-black font-mono outline-none ${theme === 'dark' ? 'bg-black/20 border-white/5 text-white' : 'bg-surface-50 border-surface-200 text-surface-900'}`} />
                   </div>
                   <div className="space-y-2">
                      <p className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>Retail Price</p>
                      <input type="number" value={calc.price} onChange={(e) => setCalc({...calc, price: Number(e.target.value)})} className={`w-full h-12 border rounded-xl px-4 text-xs font-black font-mono outline-none ${theme === 'dark' ? 'bg-black/20 border-white/5 text-white' : 'bg-surface-50 border-surface-200 text-surface-900'}`} />
                   </div>
                </div>
                <div className={`p-6 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-brand-500/5 border-brand-500/10' : 'bg-brand-50 border-brand-100'}`}>
                   <p className="text-[10px] font-black text-brand-500 uppercase italic mb-4">Estimated PPHPL</p>
                   <p className={`text-4xl font-black font-mono ${hourlyProfit > 0 ? 'text-econ-green' : 'text-econ-red'}`}>
                      $${hourlyProfit.toFixed(2)}
                   </p>
                   <p className={`text-[9px] font-bold uppercase mt-4 ${theme === 'dark' ? 'text-white/20' : 'text-surface-400'}`}>Profit Per Hour Per Building Level</p>
                </div>
             </div>
          </Section>
       </div>

       <div className="xl:col-span-8 space-y-8">
          <Section title="Retail Market Intelligence" icon={TrendingUp}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Kpi label="Avg Market Price" value={`$${marketPrice.toFixed(2)}`} sub="Realm-wide average" icon={DollarSign} color="text-brand-500" theme={theme} />
                <Kpi label="Effective Demand" value={`${(1/marketSat).toFixed(2)}x`} sub="Saturation Inverse" icon={Activity} color="text-econ-green" theme={theme} />
                <Kpi label="Sales Speed Bonus" value={`${(core.salesSpeedBonus*100).toFixed(1)}%`} sub="From Execs & Recreational" icon={Zap} color="text-econ-amber" theme={theme} />
             </div>

             <div className={`mt-10 p-8 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-surface-950 border-white/5' : 'bg-white border-surface-100 shadow-lg'}`}>
                <h4 className={`text-xs font-black uppercase mb-8 tracking-widest ${theme === 'dark' ? 'text-white' : 'text-surface-900'}`}>Retail Expansion Guidance</h4>
                <div className="space-y-4">
                   {[
                     { t: "Inventory Turnover", v: "High velocity detected in current regime.", c: "text-econ-green" },
                     { t: "Price Sensitivity", v: "Elastic demand: small price drops yield high volume.", c: "text-brand-500" },
                     { t: "Strategic Advice", v: "Vertical integration with electronics recommended.", c: "text-econ-amber" }
                   ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-surface-50 border-surface-100'}`}>
                         <div className={`w-2 h-2 rounded-full mt-1.5 ${item.c.replace('text-', 'bg-')}`} />
                         <div>
                            <p className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-white/60' : 'text-surface-700'}`}>{item.t}</p>
                            <p className={`text-[11px] mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-surface-500'}`}>{item.v}</p>
                         </div>
                      </div>
                   ))}
                </div>
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
                      <div key={res.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center text-center space-y-2 group hover:bg-brand-600 hover:text-white transition-all shadow-sm">
                         <p className="text-[9px] font-black uppercase italic truncate w-full text-white group-hover:text-white">{res.name}</p>
                         <div className={`text-sm font-black font-mono ${effSat < 0.8 ? 'text-econ-green' : effSat > 1.2 ? 'text-econ-red' : 'text-econ-amber'}`}>
                            {effSat.toFixed(2)}
                         </div>
                         <div className="w-full h-1 bg-white/10 rounded-full">
                            <div className="h-full bg-gradient-to-br from-brand-500 to-brand-600 rounded-full" style={{ width: `${Math.min(100, (1/effSat)*50)}%` }} />
                         </div>
                         <span className="text-[7px] font-bold uppercase text-white/20">Eff. Saturation</span>
                      </div>
                   )
                })}
             </div>
          </Section>
       </div>
       <div className="col-span-4 space-y-6">
          <Section title="Volatility Stress Test" icon={TrendingDown}>
             <div className="space-y-4">
                <div className="p-6 bg-econ-red/5 border border-econ-red/10 rounded-[1.5rem] text-center">
                   <TrendingDown className="text-econ-red mx-auto mb-4" size={32} />
                   <p className="text-[10px] font-black uppercase text-econ-red italic">Portfolio Beta Impact</p>
                   <p className="text-4xl font-black font-mono text-econ-red mt-2">
                      {core.totalLevels > 0 ? (-(core.totalLevels / 100) * 12.5).toFixed(0) : 0}%
                   </p>
                   <p className="text-[8px] font-bold text-white/40 uppercase mt-4">Simulated for -10% Market Correction</p>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Liquidity Buffer</span>
                      <span className="text-[9px] font-black text-white">
                         {core.netDaily > 0 ? (core.totalValuation / core.netDaily).toFixed(1) : '∞'} Days
                      </span>
                   </div>
                   <div className="flex justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Leverage Health</span>
                      <span className={`text-[9px] font-black ${core.coverageRatio > 10 ? 'text-econ-green' : 'text-econ-amber'}`}>
                         {core.coverageRatio > 10 ? 'OPTIMAL' : 'MONITOR'}
                      </span>
                   </div>
                   <div className="p-3 bg-white/5 border border-dashed border-white/10 rounded-xl">
                      <p className="text-[8px] font-bold text-white/40 uppercase mb-1 text-center">Phase Multiplier</p>
                      <p className="text-xs font-black text-center font-mono text-brand-500">x{beta > 1 ? beta.toFixed(2) : '1.00'}</p>
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
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${active ? 'bg-brand-600 text-white shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
       <Icon size={14} /> {label}
       {active && <motion.div layoutId="tab-highlight" className="absolute inset-0 bg-white/10" />}
    </button>
  );
}

function Section({ title, icon: Icon, children, action, sub, subVal }: any) {
  return (
    <div className="bg-surface-900 border border-white/5 rounded-[2rem] p-6 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-xl hover:border-brand-500/20 transition-all">
       <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-500 border border-white/5 group-hover:bg-brand-600 group-hover:text-white transition-all">
                <Icon size={18} />
             </div>
             <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.1em] text-white italic">{title}</h3>
                {sub && <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{sub}: {subVal}</p>}
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
    <div className="p-6 bg-surface-900 border border-white/5 rounded-[1.5rem] shadow-sm relative overflow-hidden group hover:border-brand-500 transition-all">
       <Icon size={48} className={`absolute -right-4 -top-4 opacity-5 ${color} group-hover:opacity-10 transition-opacity`} />
       <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">{label}</p>
       <p className={`text-2xl font-black font-mono tracking-tighter ${color}`}>{value}</p>
       <p className="text-[8px] font-bold text-white/20 uppercase mt-4">{sub}</p>
    </div>
  );
}

function HeaderMetric({ label, value, color }: any) {
  return (
    <div className="px-5 py-3 bg-surface-900 rounded-xl border border-white/5 flex flex-col items-center">
       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</span>
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
    <button onClick={onClick} className={`p-2 rounded-lg transition-all ${active ? 'text-brand-500 bg-gradient-to-br from-brand-500 to-brand-600/10 hover:bg-gradient-to-br from-brand-500 to-brand-600/20' : 'text-white/20 hover:text-econ-red hover:bg-econ-red/10'}`} title={active ? "Linked to Global Calculations" : "Detached from Global Calculations"}>
       {active ? <Link size={16} /> : <Link2Off size={16} />}
    </button>
  );
}

function CashItem({ label, value, type, bold }: any) {
  const color = type === 'positive' ? 'text-econ-green' : type === 'negative' ? 'text-econ-red' : 'text-white';
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
       <span className="text-[9px] font-bold text-white/40 uppercase italic">{label}</span>
       <span className={`font-mono font-black ${color} ${bold ? 'text-lg' : 'text-xs'}`}>{value}</span>
    </div>
  );
}

function PhaseDot({ phase }: { phase: string }) {
  const colors: Record<string, string> = {
    Expansion: "bg-econ-green", Boom: "bg-econ-green",
    Stagnation: "bg-econ-amber", Normal: "bg-gradient-to-br from-brand-500 to-brand-600",
    Recession: "bg-econ-red",
    Recovery: "bg-gradient-to-br from-brand-500 to-brand-600",
    Volatile: "bg-econ-purple"
  };
  return <span className={`w-2 h-2 rounded-full ring-4 ring-offset-0 ${colors[phase] ?? "bg-white/20"} ${colors[phase]?.replace('bg-', 'ring-')}/20`} />;
}
