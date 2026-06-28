import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2, Package, DollarSign, ArrowLeft,
  Search, Target, TrendingDown, Ship,
  LayoutDashboard, HardHat, Trash2, Upload, Download, CheckCircle2,
  Users, AlertCircle, Clock, Zap, Calculator, Wallet, BarChart3,
  Briefcase, AlertTriangle, Globe, Layers, Microscope,
  Sun, Moon, TrendingUp
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, RESOURCES, CONSTRUCTION_MATERIALS } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { LoadingState } from "../components/States";
import { useNavigate, Link } from "../router";
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
  activeTab: 'command' | 'ops' | 'exec' | 'finance' | 'logistics' | 'risk' | 'retail' | 'ledger';
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
  ledger: any[];
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
  },
  ledger: []
};

const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

export function CorporateSuitePage() {
  const { theme, toggleTheme } = useTheme();
  const [realm] = useSharedRealm();
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
        moduleSettings: { ...DEFAULT_STATE.moduleSettings, ...parsed.moduleSettings },
        ledger: parsed.ledger || []
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
    const effMap = state.map;
    const effBoard = state.board;
    const effProfit = n(state.settings.estDailyProfit);

    const totalLevels = effMap.reduce((s, i) => s + n(i.level), 0) + n(state.settings.whatIfLevel);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);

    const effMan = getEff(effBoard.coo.management, [effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management, effBoard.cooApp.management, effBoard.cfoApp.management, effBoard.cmoApp.management, effBoard.ctoApp.management]);
    const effAcc = getEff(effBoard.cfo.accounting, [effBoard.coo.accounting, effBoard.cmo.accounting, effBoard.cto.accounting, effBoard.cooApp.accounting, effBoard.cfoApp.accounting, effBoard.cmoApp.accounting, effBoard.cto.accounting]);
    const effCom = getEff(effBoard.cmo.communication, [effBoard.coo.communication, effBoard.cfo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmoApp.communication, effBoard.ctoApp.communication]);
    const effSci = getEff(effBoard.cto.science, [effBoard.coo.science, effBoard.cfo.science, effBoard.cmo.science, effBoard.cooApp.science, effBoard.cfoApp.science, effBoard.cmo.science, effBoard.cto.science]);

    const actualAO = rawAO * (1 - (effMan * 0.01));
    const baseTaxThreshold = 3000000 + (effAcc * 500000);
    const taxThreshold = baseTaxThreshold * (1 + (state.settings.bankLevel * 0.05));

    const salesSpeedBonus = (effCom * 0.01) + (state.settings.profileSalesBonus * 0.01);
    const patentProb = 0.0179 + (effSci * 0.0015);

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
      totalLevels, actualAO, rawAO, taxThreshold, salesSpeedBonus, patentProb,
      dailyWages, inventoryValue, mapValue, dailyInterest, effMan, effAcc, effCom, effSci,
      estimatedDailyTax, coverageRatio,
      totalValuation: inventoryValue + mapValue + (effProfit * 30),
      netDaily: effProfit - dailyInterest - estimatedDailyTax - (dailyWages * actualAO)
    };
  }, [state, margins]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
         const rows = content.split('\n').map(r => r.split(',').map(c => c.replace(/"/g, '').trim()));
         // Detect SimCompanies Receipts CSV
         if (rows[0].includes('Date') && rows[0].includes('Amount')) {
            const amountIdx = rows[0].indexOf('Amount');
            const dataIdx = rows[0].indexOf('Date');
            const detailIdx = rows[0].indexOf('Details');

            let total = 0;
            rows.slice(1).forEach(row => {
               if (row[amountIdx]) total += parseFloat(row[amountIdx]) || 0;
            });

            setNotification({ msg: `Parsed $${(total/1_000_000).toFixed(2)}M in Receipts`, type: "success" });
            setState(prev => ({ ...prev, settings: { ...prev.settings, estDailyProfit: total / 7 } })); // Heuristic average
         }
         return;
      }
      try {
        const parsed = JSON.parse(content);
        if (parsed.activeTab || parsed.board) { setState(prev => ({...prev, ...parsed})); setNotification({ msg: "System Sync Complete", type: "success" }); return; }
      } catch (err) { setNotification({ msg: "Restore Failed", type: "error" }); }
    };
    reader.readAsText(file);
  };

  const renderTab = () => {
    switch(state.activeTab) {
      case 'command': return <CommandView state={state} core={core} phase={economyPhase} margins={margins} />;
      case 'ops': return <OperationsView state={state} core={core} setState={setState} />;
      case 'exec': return <ExecutiveView state={state} core={core} setState={setState} />;
      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;
      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} />;
      case 'retail': return <RetailView state={state} core={core} setState={setState} retail={retail} />;
      case 'risk': return <RiskView core={core} phase={economyPhase} retail={retail} />;
      case 'ledger': return <LedgerView state={state} setState={setState} />;
    }
  };

  if (mLoading && !margins) return <LoadingState text="Booting Enterprise Suite..." />;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1440px] mx-auto pb-16 relative">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-800/50 pb-2">
          <div className="flex items-center gap-3">
             <Link to="/" className="w-8 h-8 bg-surface-100 dark:bg-surface-800 rounded flex items-center justify-center text-surface-400 hover:text-brand-500 transition-colors">
                <ArrowLeft size={16} />
             </Link>
             <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Briefcase size={16} />
             </div>
             <div>
                <h1 className="text-sm font-black uppercase tracking-tight italic leading-tight">Sync.<span className="text-brand-600">Suite</span></h1>
                <div className="flex items-center gap-1.5">
                   <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">REALM {realm}</div>
                </div>
             </div>
          </div>

          <nav className="flex bg-surface-50 dark:bg-surface-900/50 p-0.5 rounded-md border border-surface-100 dark:border-surface-800">
             <WorkstationTab active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} label="CMD" icon={LayoutDashboard} color="bg-brand-500" />
             <WorkstationTab active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} label="OPS" icon={HardHat} color="bg-emerald-500" />
             <WorkstationTab active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} label="EXEC" icon={Users} color="bg-amber-500" />
             <WorkstationTab active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} label="FIN" icon={DollarSign} color="bg-violet-500" />
             <WorkstationTab active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} label="LOG" icon={Ship} color="bg-indigo-500" />
             <WorkstationTab active={state.activeTab === 'retail'} onClick={() => setState({...state, activeTab: 'retail'})} label="RET" icon={Target} color="bg-rose-500" />
             <WorkstationTab active={state.activeTab === 'ledger'} onClick={() => setState({...state, activeTab: 'ledger'})} label="BOOK" icon={BarChart3} color="bg-teal-500" />
             <WorkstationTab active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="RSK" icon={TrendingDown} color="bg-surface-500" />
          </nav>
       </div>

       <main className="min-h-[50vh]">
          {renderTab()}
       </main>

       {/* Control Bar */}
       <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-full max-w-2xl px-2 z-[90]">
          <div className="bg-surface-900/95 dark:bg-white text-white dark:text-surface-900 backdrop-blur-md p-1.5 rounded-lg shadow-2xl flex items-center justify-between border border-white/5 dark:border-surface-100">
             <div className="flex gap-6 px-3 border-r border-white/10 dark:border-surface-100">
                <GlobalMetric label="VALUE" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} />
                <GlobalMetric label="YIELD" value={`$${(core.netDaily/1000).toFixed(1)}K`} />
                <GlobalMetric label="EFF" value={`${((1 - core.actualAO)*100).toFixed(0)}%`} />
             </div>
             <div className="flex items-center gap-2 px-3">
                <button onClick={toggleTheme} className="w-8 h-8 rounded border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                   {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn !bg-transparent !text-current border !border-white/20 dark:!border-surface-200 !py-1"><Upload size={12} className="mr-1"/> Sync</button>
                <button onClick={() => { const data = JSON.stringify(state); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'simco_intel_backup.json'; a.click(); }} className="btn !bg-brand-500 !text-white !py-1"><Download size={12} className="mr-1"/> Backup</button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json,.csv" />
             </div>
          </div>
       </div>

       {notification && (
         <div className="fixed top-20 right-6 z-[100] animate-in slide-in-from-right duration-300">
            <div className={`px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 border-2 ${notification.type === 'success' ? 'bg-econ-green text-white border-white/20' : 'bg-econ-red text-white border-white/20'}`}>
               {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
               <span className="font-black uppercase tracking-widest text-xs">{notification.msg}</span>
            </div>
         </div>
       )}
    </div>
  );
}

function LedgerView({ state }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
       <div className="md:col-span-8">
          <Section title="LEDGER_STREAM" icon={BarChart3} color="text-teal-500">
             <div className="card h-[60vh] flex flex-col items-center justify-center border-dashed opacity-20">
                <Download size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Game CSV to populate</p>
             </div>
          </Section>
       </div>
       <div className="md:col-span-4 space-y-3">
          <Section title="STAT_EXTRACT" icon={TrendingUp} color="text-teal-500">
             <div className="card p-4 border-l-2 border-teal-500">
                <span className="text-[9px] font-black text-surface-400 block mb-2 uppercase">EST_DAILY_PROFIT</span>
                <span className="text-2xl font-black italic tracking-tighter text-teal-600">${(state.settings.estDailyProfit/1000).toFixed(1)}K</span>
             </div>
          </Section>
       </div>
    </div>
  );
}

function CommandView({ core, phase, margins }: any) {
  const marketAlerts = useMemo(() => {
    if (!margins?.resources) return [];
    return (margins.resources as any[]).filter(r => Math.abs(r.marginDelta || 0) > 5).slice(0, 4);
  }, [margins]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
       <div className="md:col-span-8 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <KPICard label="STOCK" value={`$${(core.inventoryValue/1000).toFixed(1)}K`} sub="Current Warehouse" icon={Package} />
             <KPICard label="ASSETS" value={`$${(core.mapValue/1_000_000).toFixed(2)}M`} sub={`${core.totalLevels} Active Lvls`} icon={Building2} />
             <KPICard label="REGIME" value={phase.toUpperCase()} sub="Global Modifier" icon={Globe} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
             <div className="card">
                <div className="px-3 py-1.5 border-b border-surface-50 dark:border-surface-800/50 flex items-center justify-between">
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-surface-400">VOLATILITY</span>
                </div>
                <div className="p-1 space-y-0.5">
                   {marketAlerts.map((r: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-1.5 hover:bg-brand-50 dark:hover:bg-brand-900/10 rounded transition-all">
                         <span className="text-[10px] font-black uppercase tracking-tight truncate w-24">{r.name}</span>
                         <div className="flex gap-3 items-center">
                            <span className="text-[9px] font-mono font-bold text-surface-400">${r.outputVwap.toFixed(2)}</span>
                            <span className={`text-[9px] font-black tabular-nums ${r.marginDelta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                               {r.marginDelta > 0 ? '▲' : '▼'}{Math.abs(r.marginDelta).toFixed(0)}%
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="card p-4 flex flex-col justify-center space-y-3">
                <div className="flex justify-between items-end border-b border-surface-50 dark:border-surface-800 pb-2">
                   <span className="text-[8px] font-black text-surface-400 uppercase tracking-widest">30D GROWTH</span>
                   <span className="text-xl font-black italic tracking-tighter text-brand-500">+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-[8px] font-black text-surface-400 uppercase tracking-widest">7D DELTA</span>
                   <span className="text-lg font-black italic tracking-tighter text-emerald-500">+$${(core.netDaily * 7 / 1000).toFixed(1)}K</span>
                </div>
             </div>
          </div>
       </div>

       <div className="md:col-span-4 space-y-3">
          <div className="card bg-brand-500 text-white p-4 relative overflow-hidden group">
             <Target size={80} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
             <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-white/80">STRATEGIC SYNC</h3>
             <div className="space-y-2">
                <CheckItem label="C-SUITE" active={core.effMan > 0} light />
                <CheckItem label="STOCK" active={core.inventoryValue > 0} light />
                <CheckItem label="DEBT" active={core.dailyInterest > 0} light />
                <CheckItem label="ECON" active={true} light />
             </div>
          </div>
          <div className="card p-4">
             <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-brand-500" />
                <h3 className="text-[9px] font-black uppercase tracking-widest text-surface-400">CYCLE</h3>
             </div>
             <p className="text-[10px] font-bold text-surface-500 leading-tight uppercase">
                Stability at 84%. Forecast: 2.4 days to transition.
             </p>
          </div>
       </div>
    </div>
  );
}

function OperationsView({ state, setState, core }: any) {
  const constructionTotals = useMemo(() => {
    const totals: Record<number, number> = { 101: 0, 102: 0, 108: 0, 111: 0, 110: 0, 0: 0 };
    state.map.forEach((m: any) => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (!b) return;
      totals[0] += b.cost * (m.level <= 1 ? 1 : m.level);
      b.resources.forEach((r: any) => {
         if (r.id !== 109) totals[r.id] = (totals[r.id] || 0) + (r.qty * (m.level || 1));
      });
    });
    return totals;
  }, [state.map]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
       <div className="md:col-span-5 space-y-3">
          <Section title="FACILITIES" icon={Building2} color="text-emerald-500">
             <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="w-full btn !bg-emerald-500 text-white !py-2 mb-3 shadow-lg shadow-emerald-500/20 uppercase font-black text-[9px]">+ REGISTER</button>
             <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
                {state.map.map((m: any, i: number) => (
                   <div key={i} className="card p-2 flex items-center gap-3 hover:border-emerald-500/50 transition-all border-l-2 border-emerald-500">
                      <div className="flex-1">
                         <select value={m.id} onChange={(e) => { const n = [...state.map]; n[i].id = e.target.value; setState({...state, map: n}); }} className="bg-transparent border-none p-0 text-[10px] font-black uppercase w-full outline-none truncate">
                            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                         <p className="text-[8px] font-black text-surface-400 uppercase tracking-tighter mt-0.5">ID: {i+1}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface-50 dark:bg-surface-950 px-2 py-1 rounded">
                         <span className="text-[8px] font-black opacity-30">LVL</span>
                         <input type="number" value={m.level} onChange={(e) => { const n = [...state.map]; n[i].level = Number(e.target.value); setState({...state, map: n}); }} className="w-6 bg-transparent border-none p-0 text-xs font-black text-center outline-none" />
                      </div>
                      <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className="p-1 text-surface-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                   </div>
                ))}
             </div>
          </Section>
       </div>
       <div className="md:col-span-7 space-y-3">
          <Section title="LOGISTICS" icon={HardHat} color="text-emerald-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="card bg-emerald-500 text-white p-4 relative overflow-hidden">
                   <HardHat size={60} className="absolute -right-4 -bottom-4 opacity-10" />
                   <h3 className="text-[9px] font-black uppercase tracking-widest mb-4 text-emerald-100">CASH REQ</h3>
                   <span className="text-3xl font-black italic tracking-tighter tabular-nums leading-none">${(constructionTotals[0]/1000).toFixed(1)}K</span>
                </div>
                <div className="card p-3 space-y-2">
                   {/* Simplified resource list */}
                   <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[101, 102, 108, 111, 110].map(id => (
                        <div key={id} className="flex justify-between items-center text-[9px] border-b border-surface-50 dark:border-surface-800 pb-0.5 last:border-0">
                           <span className="font-black text-surface-400 truncate w-16">{CONSTRUCTION_MATERIALS.find(m => m.id === id)?.name}</span>
                           <span className="font-black tabular-nums">{constructionTotals[id]?.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </Section>
          <Section title="SIMULATOR" icon={Layers} color="text-emerald-500">
             <div className="card p-4 space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[9px] font-black text-emerald-500 uppercase leading-none mb-1">SCALING</p>
                      <p className="text-3xl font-black italic tracking-tighter">+{state.settings.whatIfLevel} <span className="text-sm opacity-20">LVLS</span></p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-rose-500 uppercase leading-none mb-1">AO DRAG</p>
                      <p className="text-xl font-black tabular-nums text-rose-600">{(core.actualAO*100).toFixed(1)}%</p>
                   </div>
                </div>
                <input type="range" min="0" max="500" step="5" value={state.settings.whatIfLevel} onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})} className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full appearance-none cursor-pointer accent-emerald-500" />
             </div>
          </Section>
       </div>
    </div>
  );
}

function ExecutiveView({ state, setState, core }: any) {
  const [pasteData, setPasteData] = useState("");
  const handlePaste = () => {
    const lines = pasteData.split('\n');
    const newBoard = { ...state.board };
    let cur: keyof typeof state.board | null = null;
    lines.forEach(l => {
      const t = l.trim();
      if (['COO', 'CFO', 'CMO', 'CTO'].includes(t)) cur = t.toLowerCase() as keyof typeof state.board;
      else if (t.includes('Management:')) { if (cur) newBoard[cur].management = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Accounting:')) { if (cur) newBoard[cur].accounting = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Communication:')) { if (cur) newBoard[cur].communication = parseInt(t.split(':')[1]) || 0; }
      else if (t.includes('Science:')) { if (cur) newBoard[cur].science = parseInt(t.split(':')[1]) || 0; }
    });
    setState({ ...state, board: newBoard });
    setPasteData("");
    alert("Board Integrated Successfully");
  };

  return (
    <div className="space-y-3">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkillNode label="MAN" value={core.effMan} icon={Zap} sub="AO" color="text-amber-500" />
          <SkillNode label="ACC" value={core.effAcc} icon={DollarSign} sub="TAX" color="text-emerald-500" />
          <SkillNode label="COM" value={core.effCom} icon={Globe} sub="SPEED" color="text-indigo-500" />
          <SkillNode label="SCI" value={core.effSci} icon={Microscope} sub="PATENT" color="text-rose-500" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pb-8">
          <div className="lg:col-span-8 space-y-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ExecCard role="COO" data={state.board.coo} onChange={(d: any) => setState({...state, board: {...state.board, coo: d}})} />
                <ExecCard role="COO APP" data={state.board.cooApp} onChange={(d: any) => setState({...state, board: {...state.board, cooApp: d}})} isApp />
                <ExecCard role="CFO" data={state.board.cfo} onChange={(d: any) => setState({...state, board: {...state.board, cfo: d}})} />
                <ExecCard role="CFO APP" data={state.board.cfoApp} onChange={(d: any) => setState({...state, board: {...state.board, cfoApp: d}})} isApp />
                <ExecCard role="CMO" data={state.board.cmo} onChange={(d: any) => setState({...state, board: {...state.board, cmo: d}})} />
                <ExecCard role="CMO APP" data={state.board.cmoApp} onChange={(d: any) => setState({...state, board: {...state.board, cmoApp: d}})} isApp />
                <ExecCard role="CTO" data={state.board.cto} onChange={(d: any) => setState({...state, board: {...state.board, cto: d}})} />
                <ExecCard role="CTO APP" data={state.board.ctoApp} onChange={(d: any) => setState({...state, board: {...state.board, ctoApp: d}})} isApp />
             </div>
          </div>
          <div className="lg:col-span-4 space-y-3">
             <div className="card p-4 border-t-2 border-amber-500 bg-amber-500/5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-2">QUICK SYNC</h3>
                <textarea value={pasteData} onChange={(e) => setPasteData(e.target.value)} className="input !h-24 !bg-white dark:!bg-surface-950 font-mono text-[9px] mb-2" placeholder="COO Management: 20..." />
                <button onClick={handlePaste} className="w-full btn !bg-amber-500 text-white !py-2 font-black uppercase">SYNC BOARD</button>
             </div>

             <div className="card p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                   <Calculator size={14} className="text-amber-500" />
                   <h3 className="text-[9px] font-black uppercase text-surface-400">R&D</h3>
                </div>
                <div className="space-y-1 text-[10px]">
                   <ForecastLine label="PATENT" value={`${(core.patentProb*100).toFixed(1)}%`} />
                   <ForecastLine label="SCI SPEED" value={`${(core.effSci * 2).toFixed(0)}%`} />
                   <ForecastLine label="SALES SPEED" value={`+${(core.salesSpeedBonus * 100).toFixed(1)}%`} />
                   <div className="flex justify-between items-center pt-1">
                      <span className="font-black text-surface-400">TARGET Q</span>
                      <input type="number" value={state.settings.patentTargetQuality} onChange={(e) => setState({...state, settings: {...state.settings, patentTargetQuality: Number(e.target.value)}})} className="w-8 bg-surface-50 dark:bg-surface-950 text-right font-black outline-none rounded" />
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function FinanceView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
       <div className="md:col-span-4 space-y-3">
          <Section title="FISCAL" icon={Wallet} color="text-violet-500">
             <div className="card p-4 space-y-4 border-l-2 border-violet-500">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-surface-400">PROFIT/DAY</label>
                   <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-violet-500 font-black text-xs">$</span>
                      <input type="number" value={state.settings.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="input !text-lg !pl-5 !bg-surface-50 dark:!bg-surface-950 border-none" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-surface-400">LIABILITIES</label>
                   <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-500 font-black text-xs">$</span>
                      <input type="number" value={state.debt.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="input !text-lg !pl-5 !bg-surface-50 dark:!bg-surface-950 border-none !text-rose-600" />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="card p-4 space-y-4">
             <h3 className="text-[9px] font-black uppercase text-violet-500">TAX ENGINE</h3>
             <div className="space-y-2 text-xs">
                <ForecastLine label="SAFETY" value={`$${(core.taxThreshold/1_000_000).toFixed(2)}M`} />
                <ForecastLine label="THRESHOLD" value={`$${(core.taxThreshold/30/1000).toFixed(1)}K`} />
                <ForecastLine label="DAILY TAX" value={`-$${(core.estimatedDailyTax/1000).toFixed(1)}K`} red />
             </div>
          </div>
          <div className="card p-4 space-y-4">
             <h3 className="text-[9px] font-black uppercase text-violet-500">MARGINS</h3>
             <div className="space-y-2 text-xs">
                <ForecastLine label="WAGES" value={`-$${(core.dailyWages * core.actualAO / 1000).toFixed(1)}K`} red />
                <ForecastLine label="DEBT" value={`-$${(core.dailyInterest / 1000).toFixed(1)}K`} red />
                <ForecastLine label="NET YIELD" value={`+$${(core.netDaily/1000).toFixed(1)}K`} green />
             </div>
          </div>
       </div>
    </div>
  );
}

function LogisticsView({ state, setState, core }: any) {
  const [q, setQ] = useState("");
  const filteredRes = useMemo(() => RESOURCES.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
       <div className="lg:col-span-4 space-y-3">
          <Section title="WAREHOUSE" icon={Package} color="text-indigo-500">
             <div className="card p-2 flex flex-col h-[60vh]">
                <div className="relative mb-2">
                   <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-400" />
                   <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="FILTER..." className="input !pl-7 !py-1 !text-[10px]" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-hide">
                   {filteredRes.slice(0, 100).map(r => {
                      const item = state.inventory.find(i => i.id === r.id);
                      return (
                         <div key={r.id} className="flex justify-between items-center p-1.5 hover:bg-surface-50 dark:hover:bg-surface-800 rounded transition-all">
                            <span className="text-[10px] font-black uppercase truncate w-32">{r.name}</span>
                            <input type="number" value={item?.qty || ""} onChange={(e) => { const v = Number(e.target.value); const next = [...state.inventory.filter(i => i.id !== r.id)]; if (v > 0) next.push({ id: r.id, qty: v }); setState({...state, inventory: next}); }} className="w-12 bg-surface-100 dark:bg-surface-950 border-none rounded p-1 text-[9px] font-black text-center" />
                         </div>
                      )
                   })}
                </div>
             </div>
          </Section>
       </div>
       <div className="lg:col-span-8 space-y-3">
          <Section title="LOGISTICS_OVERVIEW" icon={Ship} color="text-indigo-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="card p-4 border-l-2 border-indigo-500">
                   <span className="text-[9px] font-black text-surface-400 block mb-2">STOCK_VALUE</span>
                   <span className="text-3xl font-black italic tracking-tighter text-indigo-500">${(core.inventoryValue/1000).toFixed(1)}K</span>
                </div>
                <div className="card p-4 border-l-2 border-indigo-500">
                   <span className="text-[9px] font-black text-surface-400 block mb-2">DAILY_LOG_REQ</span>
                   <span className="text-3xl font-black italic tracking-tighter text-indigo-500">{Math.ceil(core.inventoryValue/500).toLocaleString()} <span className="text-sm opacity-20">U</span></span>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}

function RetailView({ state, setState, retail }: any) {
  const selectedRes = RESOURCES.find(r => r.id === state.settings.retailResourceId) || RESOURCES.find(r => r.id === 24);
  const retailData = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === selectedRes?.name.toLowerCase()) : null;
  const marketSat = (retailData as any)?.[1]?.saturation || 1.0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
       <div className="md:col-span-4 space-y-3">
          <Section title="RETAIL_ENGINE" icon={Target} color="text-rose-500">
             <div className="card p-4 border-l-2 border-rose-500">
                <label className="text-[9px] font-black text-surface-400 block mb-2 uppercase">ITEM_SELECT</label>
                <select value={state.settings.retailResourceId} onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})} className="input border-none !bg-surface-50 dark:!bg-surface-950 uppercase font-black mb-4">
                   {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                   ))}
                </select>
                <div className="space-y-2">
                   <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-surface-400 uppercase">SATURATION</span>
                      <span className={`text-2xl font-black italic tracking-tighter ${marketSat > 1.2 ? 'text-rose-500' : 'text-emerald-500'}`}>{marketSat.toFixed(2)}</span>
                   </div>
                   <div className="h-1 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (1/marketSat)*50)}%` }} className={`h-full ${marketSat > 1.2 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4 border-t-2 border-rose-500">
             <span className="text-[9px] font-black text-surface-400 block mb-2 uppercase">SALES_MODEL</span>
             <p className="text-[10px] font-bold text-surface-600 dark:text-surface-300 leading-tight">
                Modeled velocity at 0.22 weights indicates high ROI for current saturation.
             </p>
          </div>
       </div>
    </div>
  );
}

function RiskView({ phase, retail }: any) {
  return (
    <div className="card p-8">
       <h3 className="text-xs font-black uppercase tracking-[0.3em] text-surface-400 mb-8 italic">Real-time Regime Sentiment Matrix</h3>
       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 24).map(res => {
             const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
             const sat = retailItem?.[1]?.saturation || 1.0;
             return (
               <div key={res.id} className="card p-4 text-center border-b-4 border-indigo-600 shadow-md hover:-translate-y-1 transition-all">
                  <span className="block text-[10px] font-black uppercase text-surface-400 truncate mb-2">{res.name}</span>
                  <span className={`text-xl font-black tabular-nums italic ${sat < 1 ? 'text-emerald-500' : 'text-red-500'}`}>{sat.toFixed(2)}</span>
               </div>
             )
          })}
       </div>
    </div>
  );
}

function WorkstationTab({ active, onClick, label, icon: Icon, color }: any) {
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5 ${active ? `${color} text-white shadow-lg` : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
       <Icon size={12} /> {label}
    </button>
  );
}

function GlobalMetric({ label, value }: any) {
  return (
    <div className="flex flex-col">
       <span className="text-[8px] font-black uppercase opacity-50 tracking-tighter leading-none mb-0.5">{label}</span>
       <span className="text-sm font-black italic tracking-tighter tabular-nums leading-none">{value}</span>
    </div>
  );
}

function KPICard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="card p-3 flex flex-col items-center text-center group hover:border-brand-500/50">
       <div className="w-8 h-8 bg-surface-50 dark:bg-surface-800 rounded flex items-center justify-center text-brand-500 mb-2 group-hover:scale-110 transition-transform">
          <Icon size={16} />
       </div>
       <span className="text-[9px] font-black uppercase tracking-widest text-surface-400 mb-0.5">{label}</span>
       <span className="text-lg font-black tabular-nums italic leading-none">{value}</span>
       <p className="text-[8px] font-bold text-surface-300 mt-1 uppercase truncate w-full">{sub}</p>
    </div>
  );
}

function SkillNode({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className={`card p-3 flex flex-col items-center text-center border-t-2 border-current shadow-md shadow-current/5 ${color}`}>
       <div className="flex items-center gap-1.5 mb-2">
          <Icon size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest text-surface-900 dark:text-white italic">{label}</span>
       </div>
       <span className="text-2xl font-black italic tracking-tighter text-surface-900 dark:text-white tabular-nums leading-none">{value}</span>
       <span className="text-[8px] font-black uppercase opacity-30 mt-2 tracking-widest">{sub}</span>
    </div>
  );
}

function ExecCard({ role, data, onChange, isApp }: any) {
  return (
    <div className={`card p-6 space-y-6 border-l-4 transition-all ${isApp ? 'border-l-surface-300 dark:border-l-surface-700 opacity-80 scale-95 hover:opacity-100 hover:scale-100' : 'border-l-brand-600 shadow-lg'}`}>
       <div className="flex items-center justify-between">
          <span className={`text-[11px] font-black uppercase italic tracking-widest ${isApp ? 'text-surface-400' : 'text-brand-600'}`}>{role}</span>
          <div className="flex gap-1.5">
             <div className="w-2 h-2 rounded-full bg-brand-500" />
             <div className="w-2 h-2 rounded-full bg-brand-500 opacity-20" />
          </div>
       </div>
       <div className="grid grid-cols-2 gap-3">
          <SkillLineSmall label="MAN" val={data.management} onChange={(v: any) => onChange({...data, management: v})} />
          <SkillLineSmall label="ACC" val={data.accounting} onChange={(v: any) => onChange({...data, accounting: v})} />
          <SkillLineSmall label="COM" val={data.communication} onChange={(v: any) => onChange({...data, communication: v})} />
          <SkillLineSmall label="SCI" val={data.science} onChange={(v: any) => onChange({...data, science: v})} />
       </div>
    </div>
  );
}

function SkillLineSmall({ label, val, onChange }: any) {
  return (
    <div className="flex justify-between items-center bg-surface-50 dark:bg-surface-800 px-4 py-2 rounded-xl border border-surface-100 dark:border-surface-700 hover:border-brand-500 transition-colors">
       <span className="text-[10px] font-black text-surface-400">{label}</span>
       <input type="number" value={val} onChange={(e) => onChange(Number(e.target.value))} className="w-10 bg-transparent border-none p-0 text-sm font-black text-right outline-none tabular-nums" />
    </div>
  );
}

function ForecastLine({ label, value, red, green }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-surface-50 dark:border-surface-800 last:border-0">
       <span className="text-[11px] font-black uppercase text-surface-500 italic tracking-tight">{label}</span>
       <span className={`text-base font-black tabular-nums italic ${red ? 'text-red-600' : green ? 'text-emerald-500' : 'text-surface-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

function CheckItem({ label, active, light }: any) {
  return (
    <div className="flex items-center gap-5 py-2">
       <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${active ? 'bg-emerald-500 border-emerald-500 shadow-lg' : 'border-white/20 bg-white/5'}`}>
          {active && <CheckCircle2 size={14} className="text-white" />}
       </div>
       <span className={`text-[12px] font-black uppercase italic tracking-widest ${active ? (light ? 'text-white' : 'text-surface-900') : 'text-white/20'}`}>{label}</span>
    </div>
  );
}
