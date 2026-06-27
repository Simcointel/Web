import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Package, DollarSign, ArrowLeft,
  Search, Target, TrendingDown, Ship,
  LayoutDashboard, HardHat, Link, Link2Off, Trash2, Upload, Download, CheckCircle2,
  Users, UserPlus, AlertCircle, Clock, Zap, Calculator, Wallet, BarChart3, PieChart,
  Briefcase, AlertTriangle, Globe, Layers
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, RESOURCES } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { LoadingState } from "../components/States";
import { useNavigate } from "../router";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Section } from "../components/Layout";

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

const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

export function CorporateSuitePage() {
  const { theme } = useTheme();
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

  const core = useMemo(() => {
    const effMap = state.moduleSettings.opsLinked ? state.map : DEFAULT_STATE.map;
    const effBoard = state.moduleSettings.execLinked ? state.board : DEFAULT_STATE.board;
    const effProfit = n(state.moduleSettings.financeLinked ? state.settings.estDailyProfit : DEFAULT_STATE.settings.estDailyProfit);

    const totalLevels = effMap.reduce((s, i) => s + n(i.level), 0) + n(state.moduleSettings.opsLinked ? state.settings.whatIfLevel : 0);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);

    const effMan = getEff(effBoard.coo.management, [effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management, effBoard.cooApp.management, effBoard.cfoApp.management, effBoard.cmoApp.management, effBoard.ctoApp.management]);
    const effAcc = getEff(effBoard.cfo.accounting, [effBoard.coo.accounting, effBoard.cmo.accounting, effBoard.cto.accounting, effBoard.cooApp.accounting, effBoard.cfoApp.accounting, effBoard.cmoApp.accounting, effBoard.ctoApp.accounting]);
    const effCom = getEff(effBoard.cmo.communication, [effBoard.coo.communication, effBoard.cfo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmoApp.communication, effBoard.cto.communication]);
    const effSci = getEff(effBoard.cto.science, [effBoard.coo.science, effBoard.cfo.science, effBoard.cmo.science, effBoard.cooApp.science, effBoard.cfoApp.science, effBoard.cmo.science, effBoard.cto.science]);

    const actualAO = rawAO * (1 - (effMan * 0.01));
    const baseTaxThreshold = 3000000 + (effAcc * 500000);
    const taxThreshold = baseTaxThreshold * (1 + (state.settings.bankLevel * 0.05));

    const salesSpeedBonus = (effCom * 0.01) + (state.settings.profileSalesBonus * 0.01);

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
      dailyWages, inventoryValue, mapValue, dailyInterest,
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
          if (parsed.activeTab) { setState(parsed); setNotification({ msg: "State Synchronized", type: "success" }); return; }
        } catch (err) { setNotification({ msg: "Parse Failed", type: "error" }); }
      }
    };
    reader.readAsText(file);
  };

  const renderTab = () => {
    switch(state.activeTab) {
      case 'command': return <CommandView state={state} core={core} phase={economyPhase} setState={setState} margins={margins} dash={dash} realm={realm} />;
      case 'ops': return <OperationsView state={state} core={core} setState={setState} />;
      case 'exec': return <ExecutiveView state={state} core={core} setState={setState} />;
      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;
      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} audit={audit} fileInputRef={fileInputRef} />;
      case 'retail': return <RetailView state={state} core={core} setState={setState} retail={retail} />;
      case 'risk': return <RiskView state={state} core={core} phase={economyPhase} retail={retail} />;
    }
  };

  if (mLoading && !margins) return <LoadingState text="Initializing Suite..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 gradient-brand rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand-500/30">
                <Briefcase size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-black text-surface-900 dark:text-white uppercase italic tracking-tighter">
                   Corporate<span className="text-brand-600">.Workstation</span>
                </h1>
                <div className="flex items-center gap-4 mt-1">
                   <span className="text-xs font-black uppercase text-surface-400 tracking-widest">Enterprise OS v6.5</span>
                   <div className="flex items-center gap-1.5 px-3 py-0.5 bg-brand-50 dark:bg-brand-900/20 rounded-full border border-brand-100 dark:border-brand-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-brand-600 dark:text-brand-400">Live Link</span>
                   </div>
                </div>
             </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-surface-900 p-1.5 rounded-[1.5rem] shadow-soft border border-surface-200/50 dark:border-surface-800">
             <SuiteTab active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} label="Command" icon={LayoutDashboard} />
             <SuiteTab active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} label="Operations" icon={HardHat} color="text-blue-500" />
             <SuiteTab active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} label="Executive" icon={Users} color="text-amber-500" />
             <SuiteTab active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} label="Finance" icon={DollarSign} color="text-emerald-500" />
             <SuiteTab active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} label="Logistics" icon={Ship} color="text-indigo-500" />
             <SuiteTab active={state.activeTab === 'retail'} onClick={() => setState({...state, activeTab: 'retail'})} label="Retail" icon={Target} color="text-rose-500" />
             <SuiteTab active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="Risk" icon={TrendingDown} color="text-purple-500" />
          </nav>
       </header>

       <main className="min-h-[600px]">
          {renderTab()}
       </main>

       <footer className="sticky bottom-6 mx-auto max-w-4xl bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-surface-200 dark:border-surface-800 flex items-center justify-between z-50 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-8 px-6 border-r border-surface-200 dark:border-surface-800">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-surface-400 tracking-widest">Enterprise Valuation</span>
                <span className="text-xl font-black italic tracking-tighter text-surface-900 dark:text-white tabular-nums">${(core.totalValuation/1_000_000).toFixed(2)}M</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-surface-400 tracking-widest">Daily Burn</span>
                <span className="text-xl font-black italic tracking-tighter text-red-500 tabular-nums">-${(core.dailyWages/1000).toFixed(1)}K</span>
             </div>
          </div>
          <div className="flex items-center gap-4 px-6">
             <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary !px-4 !py-2"><Upload size={16} className="mr-2" /> Sync</button>
             <button onClick={() => { const data = JSON.stringify(state); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'simcointel_suite.json'; a.click(); }} className="btn btn-primary !px-4 !py-2"><Download size={16} className="mr-2" /> Backup</button>
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
          </div>
       </footer>

       {notification && (
         <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 ${notification.type === 'success' ? 'bg-econ-green text-white border-white/20' : 'bg-econ-red text-white border-white/20'}`}>
               {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
               <span className="font-black uppercase tracking-widest text-sm">{notification.msg}</span>
            </div>
         </div>
       )}
    </div>
  );
}

function CommandView({ state, core, phase, setState, margins, dash, realm }: any) {
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    state.map.forEach((m: any) => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (b) counts[(b as any).type || 'Other'] = (counts[(b as any).type || 'Other'] || 0) + m.level;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [state.map]);

  const marketAlerts = useMemo(() => {
    if (!margins?.resources) return [];
    return (margins.resources as any[])
      .filter(r => Math.abs(r.marginDelta || 0) > 5)
      .slice(0, 5)
      .map(r => ({ name: r.name, delta: r.marginDelta, price: r.outputVwap }));
  }, [margins]);

  const dashboardAlerts = (dash as any)?.[String(realm)]?.alerts || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <CommandKpi label="Daily Cashflow" value={`$${(core.netDaily/1000).toFixed(1)}K`} sub="Post-Tax/AO Estimate" icon={Wallet} color="bg-emerald-500" />
             <CommandKpi label="Admin Burden" value={`${(core.actualAO*100).toFixed(2)}%`} sub={`${core.totalLevels} Active Facilities`} icon={BarChart3} color="bg-rose-500" />
             <CommandKpi label="Market Phase" value={phase.toUpperCase()} sub="Global Logic Multiplier" icon={Globe} color="bg-brand-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="card p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-surface-400">Infrastructure</h3>
                   <button onClick={() => setState({...state, activeTab: 'ops'})} className="text-xs font-black text-brand-600 uppercase hover:underline">Manage</button>
                </div>
                <div className="space-y-4">
                   {categories.map(([cat, lvls]) => (
                      <div key={cat} className="space-y-2">
                         <div className="flex justify-between text-xs font-black uppercase italic tracking-tighter">
                            <span className="text-surface-600">{cat}</span>
                            <span>{lvls} Lvls</span>
                         </div>
                         <div className="h-2 bg-surface-50 dark:bg-surface-800 rounded-full overflow-hidden border border-surface-100 dark:border-surface-700">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(lvls / (core.totalLevels || 1)) * 100}%` }} className="h-full gradient-brand" />
                         </div>
                      </div>
                   ))}
                   {categories.length === 0 && <div className="py-12 text-center opacity-30 italic font-bold">No facilities established.</div>}
                </div>
             </div>

             <div className="card p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-surface-400">Volatility Feed</h3>
                <div className="space-y-1">
                   {marketAlerts.map((a, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 rounded-xl transition-colors border-b border-surface-50 dark:border-surface-800 last:border-0">
                         <span className="text-xs font-black uppercase italic tracking-tighter">{a.name}</span>
                         <div className="flex gap-4 items-center tabular-nums">
                            <span className="text-[10px] font-bold text-surface-400">${a.price.toFixed(2)}</span>
                            <span className={`text-xs font-black ${a.delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                               {a.delta > 0 ? '▲' : '▼'}{Math.abs(a.delta).toFixed(1)}%
                            </span>
                         </div>
                      </div>
                   ))}
                   {marketAlerts.length === 0 && <div className="py-12 text-center opacity-20 uppercase font-black tracking-widest text-[10px]">Market Stability High</div>}
                </div>
             </div>
          </div>
       </div>

       <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 bg-surface-900 text-white relative overflow-hidden group">
             <div className="absolute -right-8 -top-8 text-white/5 group-hover:scale-110 transition-transform duration-700">
                <Target size={180} />
             </div>
             <div className="relative z-10 space-y-8">
                <div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-400 mb-6 italic">Strategic Vector</h3>
                   <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10"><Clock size={20} className="text-brand-400" /></div>
                      <div>
                         <p className="text-lg font-black uppercase italic leading-tight tracking-tighter">Cycle Estimation</p>
                         <p className="text-xs text-white/60 font-semibold mt-1">Next shift possible in 2.4 days.</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                   <CheckItem label="C-Suite Staffed" active={Object.values(state.board).some((e: any) => e.management > 0)} light />
                   <CheckItem label="Inventory Valued" active={state.inventory.length > 0} light />
                   <CheckItem label="Debt Structured" active={state.debt.current > 0} light />
                   <CheckItem label="Node Synchronized" active={state.globalSync} light />
                </div>
             </div>
          </div>
          {dashboardAlerts > 0 && (
             <div className="card p-6 bg-red-600/5 border-2 border-red-600/20 text-red-600 animate-pulse">
                <div className="flex items-center gap-3">
                   <AlertCircle size={20} />
                   <span className="font-black uppercase tracking-widest text-xs">{dashboardAlerts} Active Node Anomalies</span>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}

function OperationsView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
       <div className="lg:col-span-5 space-y-8">
          <Section title="Asset Management" icon={HardHat} subtitle="Facility configuration and scaling.">
             <div className="space-y-4">
                <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="w-full btn btn-primary !rounded-2xl !py-4 shadow-xl"><UserPlus size={18} className="mr-2" /> Add New Facility</button>
                <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                   {state.map.map((m: any, i: number) => {
                      const b = BUILDINGS.find(bu => bu.id === m.id);
                      return (
                        <div key={i} className="card p-4 flex items-center gap-4 group hover:shadow-xl hover:-translate-y-0.5 border-l-4 border-l-blue-500 transition-all">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">#{i+1}</div>
                           <div className="flex-1">
                              <select
                                value={m.id}
                                onChange={(e) => { const n = [...state.map]; n[i].id = e.target.value; setState({...state, map: n}); }}
                                className="bg-transparent border-none p-0 text-sm font-black uppercase focus:ring-0 w-full"
                              >
                                 {BUILDINGS.map(b => <option key={b.id} value={b.id} className="bg-white dark:bg-surface-950">{b.name}</option>)}
                              </select>
                              <p className="text-[10px] font-bold text-surface-400 uppercase mt-0.5 tracking-widest">{b?.type}</p>
                           </div>
                           <div className="flex items-center gap-3 bg-surface-50 dark:bg-surface-800 rounded-xl px-4 py-2 border border-surface-100 dark:border-surface-700">
                              <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Lvl</span>
                              <input
                                type="number"
                                value={m.level}
                                onChange={(e) => { const n = [...state.map]; n[i].level = Number(e.target.value); setState({...state, map: n}); }}
                                className="w-10 bg-transparent border-none p-0 text-sm text-center font-black outline-none focus:ring-0"
                              />
                           </div>
                           <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className="p-2 text-surface-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      )
                   })}
                   {state.map.length === 0 && <div className="py-20 text-center opacity-30 italic font-bold">No active facilities.</div>}
                </div>
             </div>
          </Section>
       </div>

       <div className="lg:col-span-7 space-y-8">
          <Section title="Resource Logistics" icon={Package} subtitle="Construction material analysis.">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-8 bg-blue-600 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                   <HardHat size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-blue-200">Expansion Value</h3>
                   <div className="flex items-end gap-2">
                      <span className="text-5xl font-black italic tracking-tighter tabular-nums">${(state.map.reduce((s: number, m: any) => s + (BUILDINGS.find(b => b.id === m.id)?.cost || 0) * (m.level || 1), 0)/1000).toFixed(1)}K</span>
                   </div>
                   <p className="text-xs font-bold text-blue-100 mt-4 opacity-60 uppercase italic tracking-widest">Aggregate Net Worth contribution.</p>
                </div>
                <div className="card p-8 space-y-6">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-surface-400">Facility Health</h3>
                   <div className="space-y-4">
                      <HealthMetric label="Production Coverage" val="94%" color="bg-emerald-500" />
                      <HealthMetric label="Worker Efficiency" val="100%" color="bg-emerald-500" />
                      <HealthMetric label="Expansion Cap" val="Low" color="bg-amber-500" />
                   </div>
                </div>
             </div>
          </Section>

          <Section title="What-If Expansion" icon={Layers} subtitle="Simulate massive scaling impact.">
             <div className="card p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                   <div>
                      <p className="text-[10px] font-black text-brand-600 uppercase italic tracking-widest mb-2">Simulated Levels</p>
                      <p className="text-5xl font-black text-surface-900 dark:text-white tabular-nums tracking-tighter">+{state.settings.whatIfLevel} <span className="text-xl opacity-30 non-italic">Lvls</span></p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-red-500 uppercase italic tracking-widest mb-2">Efficiency Drag</p>
                      <p className="text-3xl font-black text-red-600 tabular-nums">{(core.actualAO*100).toFixed(2)}%</p>
                   </div>
                </div>
                <input
                   type="range" min="0" max="500" step="5"
                   value={state.settings.whatIfLevel}
                   onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})}
                   className="w-full h-3 bg-surface-100 dark:bg-surface-800 rounded-full appearance-none cursor-pointer accent-brand-500"
                />
             </div>
          </Section>
       </div>
    </div>
  );
}

function ExecutiveView({ state, setState }: any) {
  const [pasteData, setPasteData] = useState("");
  const handlePaste = () => {
    const lines = pasteData.split('\n');
    const newBoard = { ...state.board };
    let cur: any = null;
    lines.forEach(l => {
      const t = l.trim();
      if (['COO', 'CFO', 'CMO', 'CTO'].includes(t)) cur = t.toLowerCase();
      else if (t.includes('Management:')) { if (cur) newBoard[cur].management = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Accounting:')) { if (cur) newBoard[cur].accounting = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Communication:')) { if (cur) newBoard[cur].communication = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Science:')) { if (cur) newBoard[cur].science = parseInt(t.split(':')[1]) || 0; }
    });
    setState({ ...state, board: newBoard });
    setPasteData("");
  };

  const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);
  const effMan = getEff(state.board.coo.management, [state.board.cfo.management, state.board.cmo.management, state.board.cto.management, state.board.cooApp.management, state.board.cfoApp.management, state.board.cmoApp.management, state.board.ctoApp.management]);
  const effAcc = getEff(state.board.cfo.accounting, [state.board.coo.accounting, state.board.cmo.accounting, state.board.cto.accounting, state.board.cooApp.accounting, state.board.cfoApp.accounting, state.board.cmoApp.accounting, state.board.ctoApp.accounting]);
  const effCom = getEff(state.board.cmo.communication, [state.board.coo.communication, state.board.cfo.communication, state.board.cto.communication, state.board.cooApp.communication, state.board.cfoApp.communication, state.board.cmo.communication, state.board.cto.communication]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 space-y-6 border-l-4 border-l-amber-500">
             <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest">
                <Zap size={18} /> System Integration
             </div>
             <p className="text-xs font-semibold text-surface-500 leading-relaxed">Paste raw executive data from SimCompanies to batch update all skill nodes simultaneously.</p>
             <textarea
               value={pasteData}
               onChange={(e) => setPasteData(e.target.value)}
               className="w-full h-48 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl p-4 text-xs font-mono focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-inner"
               placeholder="COO Management: 20..."
             />
             <button onClick={handlePaste} className="w-full btn btn-primary !bg-amber-600 !hover:bg-amber-700 !rounded-2xl !py-4 shadow-amber-600/20 shadow-xl tracking-widest uppercase">Process Board Data</button>
          </div>
       </div>

       <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <SkillCard label="Operational Efficiency" value={effMan} sub="Admin Reduction Impact" color="from-amber-400 to-amber-600" />
             <SkillCard label="Accounting Rigor" value={effAcc} sub="Tax Threshold Impact" color="from-emerald-400 to-emerald-600" />
             <SkillCard label="Sales Velocity" value={effCom} sub="Consumer Throughput" color="from-indigo-400 to-indigo-600" />
          </div>

          <div className="card p-8">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-surface-400 mb-8">Executive Board Grid</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MiniExec role="COO" data={state.board.coo} />
                <MiniExec role="CFO" data={state.board.cfo} />
                <MiniExec role="CMO" data={state.board.cmo} />
                <MiniExec role="CTO" data={state.board.cto} />
             </div>
          </div>
       </div>
    </div>
  );
}

function FinanceView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
       <div className="lg:col-span-4 space-y-6">
          <Section title="Profit Node" icon={DollarSign} subtitle="Revenue configuration.">
             <div className="card p-8 space-y-8 border-l-4 border-l-emerald-500">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest">Est. Daily Profit</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black">$</span>
                      <input type="number" value={state.settings.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-2xl p-4 pl-8 text-2xl font-black italic tracking-tighter tabular-nums" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest">Corporate Debt</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-black">$</span>
                      <input type="number" value={state.debt.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-2xl p-4 pl-8 text-2xl font-black italic tracking-tighter tabular-nums text-red-500" />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="card p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-surface-400">Cashflow Synthesis</h3>
                <div className="space-y-4">
                   <CashItem label="Net Margin Forecast" value={`$${(core.netDaily/1000).toFixed(1)}K`} type="positive" />
                   <CashItem label="Admin Overhead Drag" value={`-${(core.actualAO*100).toFixed(1)}%`} type="negative" />
                   <CashItem label="Tax Threshold" value={`$${(core.taxThreshold/1_000_000).toFixed(2)}M`} type="neutral" />
                </div>
             </div>
             <div className="card p-8 bg-emerald-600 text-white relative overflow-hidden">
                <Wallet size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200 mb-8">Asset Liquidity</h3>
                <p className="text-5xl font-black italic tracking-tighter tabular-nums">${(core.inventoryValue/1000).toFixed(1)}K</p>
                <p className="text-xs font-bold text-emerald-100 mt-4 opacity-60 uppercase italic tracking-widest">Current Warehouse Valuation.</p>
             </div>
          </div>
       </div>
    </div>
  );
}

function LogisticsView({ state, setState, audit, fileInputRef }: any) {
  const [q, setQ] = useState("");
  const filteredRes = useMemo(() => RESOURCES.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-brand rounded-2xl flex items-center justify-center text-white"><Package size={20} /></div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">Manifest</h3>
             </div>
             <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder="Search Resource..." className="input !pl-12 !py-2.5" />
             </div>
             <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {filteredRes.slice(0, 30).map(r => {
                   const item = state.inventory.find(i => i.id === r.id);
                   return (
                     <div key={r.id} className="flex justify-between items-center p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 rounded-xl transition-colors group">
                        <span className="text-xs font-black uppercase italic tracking-tighter text-surface-600">{r.name}</span>
                        <input
                          type="number"
                          value={item?.qty || ""}
                          onChange={(e) => {
                             const v = Number(e.target.value);
                             const next = [...state.inventory.filter(i => i.id !== r.id)];
                             if (v > 0) next.push({ id: r.id, qty: v });
                             setState({...state, inventory: next});
                          }}
                          className="w-20 bg-surface-100 dark:bg-surface-800 border-none rounded-lg p-1.5 text-xs text-center font-black outline-none focus:ring-2 focus:ring-brand-500"
                        />
                     </div>
                   )
                })}
             </div>
          </div>
       </div>
       <div className="lg:col-span-8 flex flex-col items-center justify-center text-center p-12 card border-dashed opacity-40">
          <Ship size={120} className="mb-8" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Logistics Node Locked</h2>
          <p className="text-sm font-semibold max-w-md mt-4">Connect real-time warehouse data feed via API or JSON upload to unlock vertical health auditing and storage burn analysis.</p>
       </div>
    </div>
  );
}

function RetailView({ state, setState, retail }: any) {
  const selectedRes = RESOURCES.find(r => r.id === state.settings.retailResourceId) || RESOURCES.find(r => r.id === 24);
  const retailData = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === selectedRes?.name.toLowerCase()) : null;
  const marketSat = (retailData as any)?.[1]?.saturation || 1.0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 space-y-8 border-l-4 border-l-rose-500">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-surface-400">Target Selector</h3>
             <select
               value={state.settings.retailResourceId}
               onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})}
               className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-2xl p-4 text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
             >
                {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                   <option key={r.id} value={r.id}>{r.name}</option>
                ))}
             </select>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-xs font-black uppercase text-surface-400">Market Saturation</span>
                   <span className={`text-2xl font-black italic tracking-tighter ${marketSat > 1.2 ? 'text-red-500' : 'text-green-500'}`}>{marketSat.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (1/marketSat)*50)}%` }} className={`h-full ${marketSat > 1.2 ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
             </div>
          </div>
       </div>
       <div className="lg:col-span-8 card border-dashed opacity-20 flex flex-col items-center justify-center p-20">
          <PieChart size={120} />
          <h2 className="text-xl font-black uppercase italic mt-6">Simulation Node Offline</h2>
       </div>
    </div>
  );
}

function RiskView({ phase, retail }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
       <div className="lg:col-span-12 space-y-8">
          <Section title="Sentiment Mapping" icon={TrendingDown} subtitle="Global market pressure analysis.">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 18).map(res => {
                   const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
                   const sat = retailItem?.[1]?.saturation || 1.0;
                   return (
                     <div key={res.id} className="card p-4 text-center group card-hover border-l-4 border-l-purple-500">
                        <span className="block text-[10px] font-black text-surface-400 uppercase truncate mb-2">{res.name}</span>
                        <span className={`text-xl font-black italic tracking-tighter tabular-nums ${sat < 1 ? 'text-green-500' : 'text-red-500'}`}>{sat.toFixed(2)}</span>
                        <div className="mt-4 h-1 bg-surface-50 dark:bg-surface-800 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (1/sat)*50)}%` }} className={`h-full ${sat < 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                     </div>
                   )
                })}
             </div>
          </Section>
       </div>
    </div>
  );
}

function SuiteTab({ active, onClick, label, icon: Icon, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-3
        ${active
          ? "bg-surface-900 text-white dark:bg-white dark:text-surface-950 shadow-xl scale-105"
          : `bg-white dark:bg-surface-900 text-surface-400 dark:text-surface-500 hover:text-surface-900 dark:hover:text-white`}
      `}
    >
       <Icon size={16} className={active ? '' : color} /> {label}
    </button>
  );
}

function CommandKpi({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card p-6 relative overflow-hidden group border-b-4 border-b-surface-100 dark:border-b-surface-800">
       <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
          <Icon size={100} />
       </div>
       <div className="flex items-start justify-between">
          <div className="space-y-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 block italic">{label}</span>
             <span className="text-3xl font-black italic tracking-tighter text-surface-900 dark:text-white tabular-nums">{value}</span>
             <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">{sub}</p>
          </div>
          <div className={`p-4 rounded-2xl ${color} text-white shadow-xl shadow-surface-900/10`}>
             <Icon size={24} />
          </div>
       </div>
    </div>
  );
}

function SkillCard({ label, value, sub, color }: any) {
  return (
    <div className={`p-8 rounded-[2rem] bg-gradient-to-br ${color} text-white shadow-2xl relative overflow-hidden group`}>
       <Zap size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-white/60 italic">{label}</h4>
       <div className="flex items-end gap-2">
          <span className="text-5xl font-black italic tracking-tighter tabular-nums">{value}</span>
          <span className="text-xl font-bold opacity-40 mb-1 tracking-widest uppercase">Pts</span>
       </div>
       <p className="text-[10px] font-bold mt-4 uppercase italic text-white/50 tracking-widest">{sub}</p>
    </div>
  );
}

function MiniExec({ role, data }: any) {
  return (
    <div className="card p-5 space-y-4 hover:border-amber-500/50 transition-all border-dashed">
       <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-amber-600 italic">{role}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-surface-200" />
       </div>
       <div className="space-y-2">
          <SkillLine label="MAN" val={data.management} />
          <SkillLine label="ACC" val={data.accounting} />
          <SkillLine label="COM" val={data.communication} />
          <SkillLine label="SCI" val={data.science} />
       </div>
    </div>
  );
}

function SkillLine({ label, val }: any) {
   return (
      <div className="flex justify-between items-center bg-surface-50 dark:bg-surface-800 rounded-lg px-2 py-1 border border-surface-100 dark:border-surface-700">
         <span className="text-[8px] font-black text-surface-400">{label}</span>
         <span className="text-[10px] font-black italic tabular-nums">{val}</span>
      </div>
   );
}

function HealthMetric({ label, val, color }: any) {
   return (
      <div className="flex items-center justify-between">
         <span className="text-[10px] font-black uppercase text-surface-500 italic">{label}</span>
         <div className="flex items-center gap-3">
            <span className="text-xs font-black tabular-nums tracking-tighter">{val}</span>
            <div className={`w-2 h-2 rounded-full ${color}`} />
         </div>
      </div>
   );
}

function CashItem({ label, value, type }: any) {
   const c = type === 'positive' ? 'text-green-500' : type === 'negative' ? 'text-red-500' : 'text-surface-600';
   return (
      <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800 last:border-0">
         <span className="text-xs font-bold text-surface-500 uppercase italic tracking-tighter">{label}</span>
         <span className={`text-sm font-black italic tabular-nums ${c}`}>{value}</span>
      </div>
   );
}

function CheckItem({ label, active, light }: any) {
  return (
    <div className="flex items-center gap-4 py-1">
       <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${active ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/10 bg-white/5'}`}>
          {active && <CheckCircle2 size={12} className="text-white" />}
       </div>
       <span className={`text-[11px] font-black uppercase italic tracking-widest ${active ? (light ? 'text-white' : 'text-surface-900') : 'text-white/20'}`}>{label}</span>
    </div>
  );
}
