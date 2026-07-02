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
    abundance: number;
    researchBonus: number;
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
    retailResourceId: 24,
    abundance: 100,
    researchBonus: 0
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

    // Building profits
    const buildingProfits = effMap.map(m => {
       const b = BUILDINGS.find(bu => bu.id === m.id);
       if (!b) return { name: 'Unknown', profit: 0 };

       const res = RESOURCES.find(r => r.buildingId === b.id); // Simplification: assume 1 primary resource per building
       const mRes = (margins?.resources as any[])?.find(r => r.id === res?.id);

       if (!mRes || !res) return { name: b.name, profit: 0 };

       const isExtraction = ["O", "M", "Q"].includes(String(b.id));
       const isResearch = ["p", "b", "c", "h", "s", "a", "f", "y"].includes(String(b.id));

       const effProdBonus = isResearch ? 0 : state.settings.prodBonus;
       const effResBonus = isResearch ? state.settings.researchBonus : 0;

       let unitsPh = (res.basePh || 0) * (1 + (effProdBonus + effResBonus) / 100);
       if (isExtraction) unitsPh *= (state.settings.abundance / 100);

       const wagesPh = (b.wages || 0) * (1 + actualAO);
       const inputCostPh = mRes.inputCostPerHour;

       const totalCostPh = inputCostPh + wagesPh + (mRes.transportPerHour || 0);
       const revenuePh = unitsPh * mRes.outputVwap;
       const netProfitPh = (revenuePh - totalCostPh) * m.level;

       return { name: b.name, profit: netProfitPh, level: m.level };
    });

    const result = {
      totalLevels, actualAO, rawAO, taxThreshold, salesSpeedBonus, patentProb,
      dailyWages, inventoryValue, mapValue, dailyInterest, effMan, effAcc, effCom, effSci,
      estimatedDailyTax, coverageRatio, buildingProfits,
      totalValuation: inventoryValue + mapValue + (effProfit * 30),
      netDaily: effProfit - dailyInterest - estimatedDailyTax - (dailyWages * actualAO)
    };

    // Side effect to sync metrics
    const metrics = {
       prodBonus: state.settings.prodBonus,
       actualAO: result.actualAO,
       abundance: state.settings.abundance,
       researchBonus: state.settings.researchBonus
    };
    localStorage.setItem("simco_suite_metrics", JSON.stringify(metrics));

    return result;
  }, [state, margins]);

  useEffect(() => {
    localStorage.setItem("simco_suite_v6", JSON.stringify(state));
  }, [state]);

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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-24 relative text-sm">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
          <div className="flex items-center gap-4">
             <Link to="/" className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center text-surface-500 hover:text-brand-600 transition-colors">
                <ArrowLeft size={18} />
             </Link>
             <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Briefcase size={18} />
             </div>
             <div>
                <h1 className="text-xl font-bold leading-tight tracking-tight">Sync.<span className="text-brand-600">Suite</span></h1>
                <div className="flex items-center gap-1.5">
                   <div className="text-xs font-bold text-emerald-600 uppercase">Realm {realm}</div>
                </div>
             </div>
          </div>

          <nav className="flex bg-surface-100 dark:bg-surface-900 p-1 rounded-lg border border-surface-200 dark:border-surface-800 overflow-x-auto scrollbar-hide">
             <WorkstationTab active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} label="COMMAND" icon={LayoutDashboard} color="bg-brand-600" />
             <WorkstationTab active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} label="OPS" icon={HardHat} color="bg-emerald-600" />
             <WorkstationTab active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} label="EXEC" icon={Users} color="bg-amber-600" />
             <WorkstationTab active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} label="FINANCE" icon={DollarSign} color="bg-violet-600" />
             <WorkstationTab active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} label="LOGISTICS" icon={Ship} color="bg-indigo-600" />
             <WorkstationTab active={state.activeTab === 'retail'} onClick={() => setState({...state, activeTab: 'retail'})} label="RETAIL" icon={Target} color="bg-rose-600" />
             <WorkstationTab active={state.activeTab === 'ledger'} onClick={() => setState({...state, activeTab: 'ledger'})} label="LEDGER" icon={BarChart3} color="bg-teal-600" />
             <WorkstationTab active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="RISK" icon={TrendingDown} color="bg-surface-600" />
          </nav>
       </div>

       <main className="min-h-[50vh]">
          {renderTab()}
       </main>

       {/* Control Bar */}
       <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-[90]">
          <div className="bg-white dark:bg-surface-900 text-surface-900 dark:text-white p-2.5 rounded-xl shadow-2xl flex items-center justify-between border border-surface-200 dark:border-surface-800">
             <div className="flex gap-8 px-6 border-r border-surface-200 dark:border-surface-800">
                <GlobalMetric label="Total Valuation" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} />
                <GlobalMetric label="Net Daily Yield" value={`$${(core.netDaily/1000).toFixed(1)}K`} />
                <GlobalMetric label="Map Efficiency" value={`${((1 - core.actualAO)*100).toFixed(0)}%`} />
             </div>
             <div className="flex items-center gap-3 px-4">
                <button onClick={toggleTheme} title="Toggle Theme" className="w-10 h-10 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                   {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn !bg-white dark:!bg-surface-800 !text-current border border-surface-300 dark:border-surface-700 !px-4 !py-2"><Upload size={14} className="mr-2"/> Sync</button>
                <button onClick={() => { const data = JSON.stringify(state); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'simco_intel_backup.json'; a.click(); }} className="btn !bg-brand-600 !text-white !px-4 !py-2 shadow-sm font-bold"><Download size={14} className="mr-2"/> Backup</button>
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
    return (margins.resources as any[]).filter(r => Math.abs(r.marginDelta || 0) > 5).slice(0, 5);
  }, [margins]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <KPICard label="Warehouse Value" value={`$${(core.inventoryValue/1000).toFixed(1)}K`} sub="Current Inventory" icon={Package} />
             <KPICard label="Asset Valuation" value={`$${(core.mapValue/1_000_000).toFixed(2)}M`} sub={`${core.totalLevels} Facility Levels`} icon={Building2} />
             <KPICard label="Market Regime" value={phase} sub="Global Environment" icon={Globe} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="card !shadow-none border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                   <h3 className="text-sm font-bold uppercase text-surface-500">Market Volatility</h3>
                </div>
                <div className="divide-y divide-surface-50 dark:divide-surface-800">
                   {marketAlerts.map((r: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all">
                         <span className="font-bold text-surface-800 dark:text-surface-200">{r.name}</span>
                         <div className="flex gap-4 items-center">
                            <span className="font-medium text-surface-400">${r.outputVwap.toFixed(2)}</span>
                            <span className={`font-bold tabular-nums ${r.marginDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {r.marginDelta > 0 ? '↑' : '↓'} {Math.abs(r.marginDelta).toFixed(1)}%
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="card p-6 flex flex-col justify-center space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
                <div className="flex justify-between items-end border-b border-surface-100 dark:border-surface-800 pb-4">
                   <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">30D Forecast</span>
                   <span className="text-2xl font-bold text-brand-600">+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">7D Projection</span>
                   <span className="text-xl font-bold text-emerald-600">+$${(core.netDaily * 7 / 1000).toFixed(1)}K</span>
                </div>
             </div>
          </div>
       </div>

       <div className="md:col-span-4 space-y-6">
          <div className="card bg-brand-600 text-white p-6 !shadow-none border-none">
             <h3 className="text-sm font-bold uppercase tracking-widest mb-6 opacity-80">Strategic Integration</h3>
             <div className="space-y-4">
                <CheckItem label="EXECUTIVE BOARD" active={core.effMan > 0} light />
                <CheckItem label="WAREHOUSE SYNC" active={core.inventoryValue > 0} light />
                <CheckItem label="DEBT MANAGEMENT" active={core.dailyInterest > 0} light />
                <CheckItem label="ECONOMY SYNC" active={true} light />
             </div>
          </div>
          <div className="card p-6 border-surface-200 dark:border-surface-800 !shadow-none">
             <div className="flex items-center gap-3 mb-3">
                <Clock size={20} className="text-brand-600" />
                <h3 className="text-sm font-bold uppercase text-surface-500">Economic Cycle</h3>
             </div>
             <p className="text-base font-bold text-surface-800 dark:text-surface-200">
                Phase stability is high (84%). Expected transition in 2.4 days.
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-5 space-y-6">
          <Section title="Facility Management" icon={Building2} color="text-emerald-600">
             <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="w-full btn !bg-emerald-600 text-white !py-3 mb-4 shadow-sm font-bold">+ Register New Building</button>
             <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {state.map.map((m: any, i: number) => (
                   <div key={i} className="card p-3 flex items-center gap-4 hover:border-emerald-600/30 transition-all border-l-4 border-emerald-600 !shadow-none border-surface-200 dark:border-surface-800">
                      <div className="flex-1">
                         <select value={m.id} onChange={(e) => { const n = [...state.map]; n[i].id = e.target.value; setState({...state, map: n}); }} className="bg-transparent border-none p-0 font-bold uppercase w-full outline-none text-sm">
                            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                         <p className="text-xs text-surface-400 font-medium mt-1">Instance Ref: {i+1}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-900 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-800">
                         <span className="text-[10px] font-bold text-surface-400 uppercase">LVL</span>
                         <input type="number" value={m.level} onChange={(e) => { const n = [...state.map]; n[i].level = Number(e.target.value); setState({...state, map: n}); }} className="w-8 bg-transparent border-none p-0 text-sm font-bold text-center outline-none" />
                      </div>
                      <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className="p-2 text-surface-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                   </div>
                ))}
             </div>
          </Section>
       </div>
       <div className="md:col-span-7 space-y-6">
          <Section title="Construction Logistics" icon={HardHat} color="text-emerald-600">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-emerald-600 text-white p-6 relative overflow-hidden !shadow-none border-none">
                   <HardHat size={80} className="absolute -right-6 -bottom-6 opacity-10" />
                   <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-80">Total Capital Required</h3>
                   <span className="text-4xl font-bold tabular-nums leading-none">${(constructionTotals[0]/1000).toFixed(1)}K</span>
                </div>
                <div className="card p-6 space-y-3 !shadow-none border-surface-200 dark:border-surface-800">
                   <div className="space-y-2">
                      {[101, 102, 108, 111, 110].map(id => (
                        <div key={id} className="flex justify-between items-center text-sm border-b border-surface-100 dark:border-surface-800 pb-2 last:border-0">
                           <span className="font-medium text-surface-500">{CONSTRUCTION_MATERIALS.find(m => m.id === id)?.name}</span>
                           <span className="font-bold tabular-nums">{constructionTotals[id]?.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </Section>

          <Section title="Economic Outlook & Scaling" icon={Zap} color="text-emerald-600">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Production Bonus</span>
                         <div className="flex items-center gap-1">
                            <input type="number" value={state.settings.prodBonus} onChange={(e) => setState({...state, settings: {...state.settings, prodBonus: Number(e.target.value)}})} className="w-16 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 font-bold text-emerald-600 outline-none" />
                            <span className="text-emerald-600 font-bold">%</span>
                         </div>
                      </div>
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Admin Overhead</span>
                         <span className="text-xl font-bold text-rose-600 block mt-1">{(core.actualAO*100).toFixed(1)}%</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 pt-4 border-t border-surface-100 dark:border-surface-800">
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Resource Abundance</span>
                         <div className="flex items-center gap-1">
                            <input type="number" value={state.settings.abundance} onChange={(e) => setState({...state, settings: {...state.settings, abundance: Number(e.target.value)}})} className="w-16 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 font-bold text-brand-600 outline-none" />
                            <span className="text-brand-600 font-bold">%</span>
                         </div>
                      </div>
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Research Bonus</span>
                         <div className="flex items-center gap-1">
                            <input type="number" value={state.settings.researchBonus} onChange={(e) => setState({...state, settings: {...state.settings, researchBonus: Number(e.target.value)}})} className="w-16 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 font-bold text-amber-600 outline-none" />
                            <span className="text-amber-600 font-bold">%</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Scaling Simulation</p>
                         <p className="text-3xl font-bold">+{state.settings.whatIfLevel} <span className="text-sm text-surface-400">Levels</span></p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-rose-500 uppercase mb-1">Projected AO</p>
                         <p className="text-xl font-bold tabular-nums text-rose-600">{(core.actualAO*100).toFixed(1)}%</p>
                      </div>
                   </div>
                   <input type="range" min="0" max="500" step="5" value={state.settings.whatIfLevel} onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})} className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                </div>
             </div>
          </Section>

          <Section title="Profit Contribution Breakdown" icon={TrendingUp} color="text-emerald-600">
             <div className="card overflow-hidden !shadow-none border-surface-200 dark:border-surface-800">
                <table className="w-full text-sm">
                   <thead>
                      <tr className="text-surface-500 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                         <th className="text-left px-6 py-3 font-bold uppercase text-xs">Building Type</th>
                         <th className="text-center px-6 py-3 font-bold uppercase text-xs">Lvl</th>
                         <th className="text-right px-6 py-3 font-bold uppercase text-xs">Est. Profit/H</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                      {core.buildingProfits.map((p: any, i: number) => (
                         <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                            <td className="px-6 py-4 font-medium">{p.name}</td>
                            <td className="px-6 py-4 text-center text-surface-400 font-bold">{p.level}</td>
                            <td className={`px-6 py-4 text-right font-bold ${p.profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${p.profit.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
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
    <div className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <SkillNode label="Management" value={core.effMan} icon={Zap} sub="AO Reduction" color="text-amber-600" />
          <SkillNode label="Accounting" value={core.effAcc} icon={DollarSign} sub="Tax Threshold" color="text-emerald-600" />
          <SkillNode label="Communication" value={core.effCom} icon={Globe} sub="Sales Speed" color="text-indigo-600" />
          <SkillNode label="Science" value={core.effSci} icon={Microscope} sub="Patent Odds" color="text-rose-600" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ExecCard role="Chief Operating Officer" data={state.board.coo} onChange={(d: any) => setState({...state, board: {...state.board, coo: d}})} />
                <ExecCard role="COO Apprentice" data={state.board.cooApp} onChange={(d: any) => setState({...state, board: {...state.board, cooApp: d}})} isApp />
                <ExecCard role="Chief Financial Officer" data={state.board.cfo} onChange={(d: any) => setState({...state, board: {...state.board, cfo: d}})} />
                <ExecCard role="CFO Apprentice" data={state.board.cfoApp} onChange={(d: any) => setState({...state, board: {...state.board, cfoApp: d}})} isApp />
                <ExecCard role="Chief Marketing Officer" data={state.board.cmo} onChange={(d: any) => setState({...state, board: {...state.board, cmo: d}})} />
                <ExecCard role="CMO Apprentice" data={state.board.cmoApp} onChange={(d: any) => setState({...state, board: {...state.board, cmoApp: d}})} isApp />
                <ExecCard role="Chief Technical Officer" data={state.board.cto} onChange={(d: any) => setState({...state, board: {...state.board, cto: d}})} />
                <ExecCard role="CTO Apprentice" data={state.board.ctoApp} onChange={(d: any) => setState({...state, board: {...state.board, ctoApp: d}})} isApp />
             </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="card p-6 border-surface-200 dark:border-surface-800 !shadow-none">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-4">Board Intelligence Sync</h3>
                <p className="text-xs text-surface-500 mb-4 font-medium leading-relaxed">Paste the raw text from your Executives page to instantly update skills.</p>
                <textarea value={pasteData} onChange={(e) => setPasteData(e.target.value)} className="w-full h-32 p-3 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 outline-none mb-4" placeholder="COO Management: 20..." />
                <button onClick={handlePaste} className="w-full btn !bg-amber-600 text-white !py-3 font-bold uppercase text-sm">Apply Sync</button>
             </div>

             <div className="card p-6 space-y-6 border-surface-200 dark:border-surface-800 !shadow-none">
                <div className="flex items-center gap-2">
                   <Calculator size={18} className="text-amber-600" />
                   <h3 className="text-sm font-bold uppercase text-surface-500">R&D Impact Analysis</h3>
                </div>
                <div className="space-y-4 text-sm">
                   <ForecastLine label="Patent Probability" value={`${(core.patentProb*100).toFixed(1)}%`} />
                   <ForecastLine label="Research Speed" value={`${(core.effSci * 2).toFixed(0)}%`} />
                   <ForecastLine label="Retail Sales Bonus" value={`+${(core.salesSpeedBonus * 100).toFixed(1)}%`} />
                   <div className="flex justify-between items-center pt-2 border-t border-surface-50 dark:border-surface-800">
                      <span className="font-bold text-surface-500 uppercase text-xs">Target Quality</span>
                      <input type="number" value={state.settings.patentTargetQuality} onChange={(e) => setState({...state, settings: {...state.settings, patentTargetQuality: Number(e.target.value)}})} className="w-12 bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-right font-bold py-1 px-2 rounded-md outline-none focus:ring-1 focus:ring-amber-500" />
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-4 space-y-6">
          <Section title="Fiscal Parameters" icon={Wallet} color="text-violet-600">
             <div className="card p-6 space-y-6 border-l-4 border-violet-600 !shadow-none border-surface-200 dark:border-surface-800">
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-surface-500">Estimated Daily Profit</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 font-bold text-lg">$</span>
                      <input type="number" value={state.settings.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg py-3 pl-8 pr-4 text-xl font-bold outline-none focus:ring-1 focus:ring-violet-600" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-surface-500">Total Liabilities (Debt)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-600 font-bold text-lg">$</span>
                      <input type="number" value={state.debt.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg py-3 pl-8 pr-4 text-xl font-bold !text-rose-600 outline-none focus:ring-1 focus:ring-rose-600" />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
             <h3 className="text-sm font-bold uppercase text-violet-600">Tax Engine Analysis</h3>
             <div className="space-y-4">
                <ForecastLine label="Annual Tax-Free Limit" value={`$${(core.taxThreshold/1_000_000).toFixed(2)}M`} />
                <ForecastLine label="Daily Threshold" value={`$${(core.taxThreshold/30/1000).toFixed(1)}K`} />
                <ForecastLine label="Estimated Daily Tax" value={`-$${(core.estimatedDailyTax/1000).toFixed(1)}K`} red />
             </div>
          </div>
          <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
             <h3 className="text-sm font-bold uppercase text-violet-600">Net Margin Breakdown</h3>
             <div className="space-y-4">
                <ForecastLine label="AO Wage Impact" value={`-$${(core.dailyWages * core.actualAO / 1000).toFixed(1)}K`} red />
                <ForecastLine label="Daily Interest Expense" value={`-$${(core.dailyInterest / 1000).toFixed(1)}K`} red />
                <ForecastLine label="Total Net Daily Yield" value={`+$${(core.netDaily/1000).toFixed(1)}K`} green />
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
       <div className="lg:col-span-4 space-y-6">
          <Section title="Warehouse Inventory" icon={Package} color="text-indigo-600">
             <div className="card p-4 flex flex-col h-[70vh] !shadow-none border-surface-200 dark:border-surface-800">
                <div className="relative mb-4">
                   <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                   <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-indigo-600 outline-none" />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
                   {filteredRes.slice(0, 100).map(r => {
                      const item = state.inventory.find(i => i.id === r.id);
                      return (
                         <div key={r.id} className="flex justify-between items-center py-2.5 px-2 hover:bg-surface-50 dark:hover:bg-surface-900 transition-all">
                            <span className="font-bold text-surface-700 dark:text-surface-300">{r.name}</span>
                            <input type="number" value={item?.qty || ""} onChange={(e) => { const v = Number(e.target.value); const next = [...state.inventory.filter(i => i.id !== r.id)]; if (v > 0) next.push({ id: r.id, qty: v }); setState({...state, inventory: next}); }} className="w-20 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded px-2 py-1 text-sm font-bold text-right outline-none focus:ring-1 focus:ring-indigo-600" />
                         </div>
                      )
                   })}
                </div>
             </div>
          </Section>
       </div>
       <div className="lg:col-span-8 space-y-6">
          <Section title="Logistics Assessment" icon={Ship} color="text-indigo-600">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 border-l-4 border-indigo-600 !shadow-none border-surface-200 dark:border-surface-800">
                   <span className="text-xs font-bold text-surface-500 block mb-2 uppercase tracking-wide">Current Stock Liquidity</span>
                   <span className="text-4xl font-bold text-indigo-600">${(core.inventoryValue/1000).toFixed(1)}K</span>
                </div>
                <div className="card p-6 border-l-4 border-indigo-600 !shadow-none border-surface-200 dark:border-surface-800">
                   <span className="text-xs font-bold text-surface-500 block mb-2 uppercase tracking-wide">Estimated Transport Units</span>
                   <span className="text-4xl font-bold text-indigo-600">{Math.ceil(core.inventoryValue/500).toLocaleString()} <span className="text-lg opacity-40 font-medium">Req</span></span>
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-4 space-y-6">
          <Section title="Retail Engine" icon={Target} color="text-rose-600">
             <div className="card p-6 border-l-4 border-rose-600 !shadow-none border-surface-200 dark:border-surface-800">
                <label className="text-xs font-bold text-surface-500 block mb-3 uppercase">Inventory Selection</label>
                <select value={state.settings.retailResourceId} onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg py-2.5 px-4 font-bold text-sm outline-none focus:ring-1 focus:ring-rose-600 mb-6">
                   {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                   ))}
                </select>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-surface-400 uppercase">Market Saturation</span>
                      <span className={`text-3xl font-bold ${marketSat > 1.2 ? 'text-rose-600' : 'text-emerald-600'}`}>{marketSat.toFixed(2)}</span>
                   </div>
                   <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (1/marketSat)*50)}%` }} className={`h-full ${marketSat > 1.2 ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border-t-4 border-rose-600 !shadow-none border-surface-200 dark:border-surface-800">
             <span className="text-sm font-bold text-surface-500 block mb-3 uppercase tracking-wide">Velocity Sales Model</span>
             <p className="text-base font-medium text-surface-600 dark:text-surface-300 leading-relaxed">
                A market saturation of <span className="font-bold text-brand-600">{marketSat.toFixed(2)}</span> indicates {marketSat < 1 ? "optimal conditions for aggressive retail expansion" : "a highly competitive landscape requiring premium quality to maintain margins"}.
             </p>
          </div>
       </div>
    </div>
  );
}

function RiskView({ phase, retail }: any) {
  return (
    <div className="card p-10 !shadow-none border-surface-200 dark:border-surface-800">
       <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-surface-500 mb-10 text-center">Global Market Sentiment & Risk Matrix</h3>
       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 24).map(res => {
             const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
             const sat = retailItem?.[1]?.saturation || 1.0;
             return (
               <div key={res.id} className="card p-5 text-center border-b-4 border-indigo-600 !shadow-none border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-brand-900/10 transition-all">
                  <span className="block text-xs font-bold uppercase text-surface-400 truncate mb-3">{res.name}</span>
                  <span className={`text-2xl font-bold tabular-nums ${sat < 1 ? 'text-emerald-600' : 'text-rose-600'}`}>{sat.toFixed(2)}</span>
               </div>
             )
          })}
       </div>
    </div>
  );
}

function WorkstationTab({ active, onClick, label, icon: Icon, color }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${active ? `${color} text-white shadow-sm` : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'}`}>
       <Icon size={16} /> {label}
    </button>
  );
}

function GlobalMetric({ label, value }: any) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] font-bold uppercase text-surface-400 leading-none mb-1">{label}</span>
       <span className="text-lg font-bold tabular-nums leading-none">{value}</span>
    </div>
  );
}

function KPICard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="card p-6 flex flex-col items-center text-center !shadow-none border-surface-200 dark:border-surface-800 group">
       <div className="w-12 h-12 bg-surface-50 dark:bg-surface-900 rounded-xl flex items-center justify-center text-brand-600 mb-4 group-hover:scale-105 transition-transform">
          <Icon size={24} />
       </div>
       <span className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">{label}</span>
       <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
       <p className="text-xs font-medium text-surface-500 mt-2 truncate w-full">{sub}</p>
    </div>
  );
}

function SkillNode({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className={`card p-6 flex flex-col items-center text-center border-t-4 border-current shadow-sm ${color}`}>
       <div className="flex items-center gap-2 mb-3">
          <Icon size={18} />
          <span className="text-sm font-bold uppercase tracking-wide text-surface-900 dark:text-white">{label}</span>
       </div>
       <span className="text-3xl font-bold text-surface-900 dark:text-white tabular-nums leading-none">{value}</span>
       <span className="text-xs font-semibold uppercase opacity-40 mt-3 tracking-wide">{sub}</span>
    </div>
  );
}

function ExecCard({ role, data, onChange, isApp }: any) {
  return (
    <div className={`card p-6 space-y-6 border-l-4 !shadow-none border-surface-200 dark:border-surface-800 transition-all ${isApp ? 'border-l-surface-300 dark:border-l-surface-600 opacity-80' : 'border-l-brand-600'}`}>
       <div className="flex items-center justify-between">
          <span className={`text-sm font-bold uppercase tracking-wide ${isApp ? 'text-surface-500' : 'text-brand-600'}`}>{role}</span>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <SkillLineSmall label="Management" val={data.management} onChange={(v: any) => onChange({...data, management: v})} />
          <SkillLineSmall label="Accounting" val={data.accounting} onChange={(v: any) => onChange({...data, accounting: v})} />
          <SkillLineSmall label="Communication" val={data.communication} onChange={(v: any) => onChange({...data, communication: v})} />
          <SkillLineSmall label="Science" val={data.science} onChange={(v: any) => onChange({...data, science: v})} />
       </div>
    </div>
  );
}

function SkillLineSmall({ label, val, onChange }: any) {
  return (
    <div className="flex flex-col bg-surface-50 dark:bg-surface-900 px-4 py-3 rounded-lg border border-surface-100 dark:border-surface-800">
       <span className="text-[10px] font-bold text-surface-400 uppercase mb-1">{label}</span>
       <input type="number" value={val} onChange={(e) => onChange(Number(e.target.value))} className="bg-transparent border-none p-0 text-lg font-bold outline-none tabular-nums" />
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
