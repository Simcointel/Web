import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2, Package, DollarSign, ArrowLeft,
  Search, Target, TrendingDown, Ship,
  LayoutDashboard, HardHat, Trash2, Upload, Download, CheckCircle2,
  Users, AlertCircle, Clock, Zap, Calculator, Wallet, BarChart3,
  Briefcase, AlertTriangle, Globe, Layers, Microscope
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, RESOURCES, CONSTRUCTION_MATERIALS } from "../data/simco_static";
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
      try {
        const parsed = JSON.parse(content);
        if (parsed.activeTab) { setState(parsed); setNotification({ msg: "System Sync Complete", type: "success" }); return; }
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
    }
  };

  if (mLoading && !margins) return <LoadingState text="Booting Enterprise Suite..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1440px] mx-auto pb-20">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-surface-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-surface-900 shadow-lg">
                <Briefcase size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tight italic">Workstation.<span className="text-brand-600">Enterprise</span></h1>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[10px] font-black uppercase text-surface-400 tracking-widest">OS v6.80</span>
                   <div className="px-1.5 py-0.5 bg-brand-50 dark:bg-brand-900/20 rounded text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase border border-brand-100 dark:border-brand-800">Operational</div>
                </div>
             </div>
          </div>

          <nav className="flex bg-white dark:bg-surface-900 p-1 rounded-lg shadow-sm border border-surface-200 dark:border-surface-800">
             <WorkstationTab active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} label="CMD" icon={LayoutDashboard} />
             <WorkstationTab active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} label="OPS" icon={HardHat} />
             <WorkstationTab active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} label="EXEC" icon={Users} />
             <WorkstationTab active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} label="FIN" icon={DollarSign} />
             <WorkstationTab active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} label="LOG" icon={Ship} />
             <WorkstationTab active={state.activeTab === 'retail'} onClick={() => setState({...state, activeTab: 'retail'})} label="RET" icon={Target} />
             <WorkstationTab active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="RSK" icon={TrendingDown} />
          </nav>
       </div>

       <main className="min-h-[50vh]">
          {renderTab()}
       </main>

       {/* Control Bar */}
       <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-[90]">
          <div className="bg-surface-900/95 dark:bg-white/95 text-white dark:text-surface-900 backdrop-blur-lg p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 dark:border-surface-200">
             <div className="flex gap-8 px-4 border-r border-white/10 dark:border-surface-200">
                <GlobalMetric label="Market Value" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} />
                <GlobalMetric label="Daily Yield" value={`$${(core.netDaily/1000).toFixed(1)}K/d`} />
                <GlobalMetric label="Efficiency" value={`${((1 - core.actualAO)*100).toFixed(1)}%`} />
             </div>
             <div className="flex items-center gap-3 px-4">
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary !bg-transparent !text-current border-current !py-1.5"><Upload size={14} className="mr-2"/> Sync</button>
                <button onClick={() => { const data = JSON.stringify(state); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'simco_intel_backup.json'; a.click(); }} className="btn btn-primary !bg-current !text-surface-900 dark:!text-white !py-1.5"><Download size={14} className="mr-2"/> Backup</button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
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

function CommandView({ core, phase, margins }: any) {
  const marketAlerts = useMemo(() => {
    if (!margins?.resources) return [];
    return (margins.resources as any[]).filter(r => Math.abs(r.marginDelta || 0) > 5).slice(0, 4);
  }, [margins]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
             <KPICard label="Liquid Stock" value={`$${(core.inventoryValue/1000).toFixed(1)}K`} sub="Current Warehouse" icon={Package} />
             <KPICard label="Fixed Assets" value={`$${(core.mapValue/1_000_000).toFixed(2)}M`} sub={`${core.totalLevels} Active Lvls`} icon={Building2} />
             <KPICard label="Market Regime" value={phase.toUpperCase()} sub="Global Modifier" icon={Globe} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="card">
                <div className="px-5 py-3 border-b border-surface-50 dark:border-surface-800 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 italic">Volatility Stream</span>
                </div>
                <div className="p-3 space-y-1">
                   {marketAlerts.map((r: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-all border-b border-surface-50 dark:border-surface-800 last:border-0">
                         <span className="text-xs font-black uppercase tracking-tight">{r.name}</span>
                         <div className="flex gap-4 items-center">
                            <span className="text-[10px] font-mono font-bold text-surface-400">${r.outputVwap.toFixed(2)}</span>
                            <span className={`text-xs font-black tabular-nums ${r.marginDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                               {r.marginDelta > 0 ? '▲' : '▼'}{Math.abs(r.marginDelta).toFixed(1)}%
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="card p-6 flex flex-col justify-center space-y-6">
                <div className="flex justify-between items-end border-b border-surface-50 dark:border-surface-800 pb-4">
                   <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">30-Day Growth</span>
                   <span className="text-2xl font-black italic tracking-tighter text-brand-600">+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">7-Day Delta</span>
                   <span className="text-xl font-black italic tracking-tighter text-emerald-500">+$${(core.netDaily * 7 / 1000).toFixed(1)}K</span>
                </div>
             </div>
          </div>
       </div>

       <div className="md:col-span-4 space-y-6">
          <div className="card bg-surface-900 text-white p-6 relative overflow-hidden group shadow-xl">
             <Target size={120} className="absolute -right-8 -top-8 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-400 mb-6 italic">Strategic Checklist</h3>
             <div className="space-y-4">
                <CheckItem label="C-Suite Personnel" active={core.effMan > 0} light />
                <CheckItem label="Warehouse Valued" active={core.inventoryValue > 0} light />
                <CheckItem label="Debt Managed" active={core.dailyInterest > 0} light />
                <CheckItem label="Economic Linkage" active={true} light />
             </div>
          </div>
          <div className="card p-6">
             <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-brand-500" />
                <h3 className="text-xs font-black uppercase tracking-widest italic">Cycle Projection</h3>
             </div>
             <p className="text-[11px] font-bold text-surface-500 leading-relaxed uppercase tracking-tight">
                Current regime stability at 84%. Next transition forecast within 2.4 days. Monitor consumer saturation metrics.
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
       <div className="md:col-span-5 space-y-5">
          <Section title="Asset Registry" icon={Building2}>
             <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="w-full btn btn-secondary !py-3 !rounded-xl mb-4 border-dashed border-2 hover:border-brand-600 uppercase font-black text-[10px] tracking-widest">+ Register Facility</button>
             <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {state.map.map((m: any, i: number) => (
                   <div key={i} className="card p-3 flex items-center gap-4 hover:border-brand-500 transition-all border-l-4 border-l-brand-600 shadow-sm">
                      <div className="flex-1">
                         <select value={m.id} onChange={(e) => { const n = [...state.map]; n[i].id = e.target.value; setState({...state, map: n}); }} className="bg-transparent border-none p-0 text-xs font-black uppercase w-full outline-none italic tracking-tight">
                            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                         <p className="text-[9px] font-black text-surface-400 uppercase tracking-widest mt-0.5">Station #{i+1}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-lg border border-surface-100 dark:border-surface-700">
                         <span className="text-[9px] font-black opacity-30 tracking-widest">LVL</span>
                         <input type="number" value={m.level} onChange={(e) => { const n = [...state.map]; n[i].level = Number(e.target.value); setState({...state, map: n}); }} className="w-8 bg-transparent border-none p-0 text-sm font-black text-center outline-none tabular-nums" />
                      </div>
                      <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className="p-1.5 text-surface-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                   </div>
                ))}
             </div>
          </Section>
       </div>
       <div className="md:col-span-7 space-y-6">
          <Section title="Expansion Logistics" icon={HardHat} subtitle="Aggregate resource requirement matrix.">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-brand-600 text-white p-6 relative overflow-hidden shadow-xl">
                   <HardHat size={100} className="absolute -right-6 -bottom-6 opacity-10" />
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-brand-200 italic">Liquid Requirement</h3>
                   <span className="text-4xl font-black italic tracking-tighter tabular-nums">${(constructionTotals[0]/1000).toFixed(1)}K</span>
                   <p className="text-[10px] font-bold text-brand-100 mt-4 uppercase tracking-widest opacity-60 italic leading-relaxed">Required capital for existing infrastructure scaling.</p>
                </div>
                <div className="card p-5 space-y-4">
                   <h3 className="text-[10px] font-black uppercase text-surface-400 tracking-widest italic">Resource Manifest</h3>
                   <div className="space-y-2">
                      {[101, 102, 108, 111, 110].map(id => (
                        <div key={id} className="flex justify-between items-center py-1.5 border-b border-surface-50 dark:border-surface-800 last:border-0">
                           <span className="text-[10px] font-black uppercase italic text-surface-600">{CONSTRUCTION_MATERIALS.find(m => m.id === id)?.name}</span>
                           <span className="text-xs font-black tabular-nums">{constructionTotals[id]?.toLocaleString()} Units</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </Section>
          <Section title="What-If Simulator" icon={Layers}>
             <div className="card p-6 space-y-6">
                <div className="flex justify-between items-end gap-6">
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-brand-600 uppercase italic tracking-widest mb-1">Simulated Scaling</p>
                      <p className="text-4xl font-black italic tracking-tighter">+{state.settings.whatIfLevel} <span className="text-lg opacity-20 non-italic">Levels</span></p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-red-500 uppercase italic tracking-widest mb-1">Resultant AO Drag</p>
                      <p className="text-2xl font-black tabular-nums text-red-600">{(core.actualAO*100).toFixed(2)}%</p>
                   </div>
                </div>
                <input type="range" min="0" max="500" step="5" value={state.settings.whatIfLevel} onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})} className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full appearance-none cursor-pointer accent-brand-600" />
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
    alert("Board Integrated Successfully");
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <SkillNode label="Management" value={core.effMan} icon={Zap} sub="AO SUPPRESSION" color="text-amber-500" />
          <SkillNode label="Accounting" value={core.effAcc} icon={DollarSign} sub="TAX THRESHOLD" color="text-emerald-500" />
          <SkillNode label="Communication" value={core.effCom} icon={Globe} sub="SALES VELOCITY" color="text-indigo-500" />
          <SkillNode label="Science" value={core.effSci} icon={Microscope} sub="PATENT ODDS" color="text-rose-500" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ExecCard role="COO" data={state.board.coo} onChange={(d: any) => setState({...state, board: {...state.board, coo: d}})} />
                <ExecCard role="COO Apprentice" data={state.board.cooApp} onChange={(d: any) => setState({...state, board: {...state.board, cooApp: d}})} isApp />
                <ExecCard role="CFO" data={state.board.cfo} onChange={(d: any) => setState({...state, board: {...state.board, cfo: d}})} />
                <ExecCard role="CFO Apprentice" data={state.board.cfoApp} onChange={(d: any) => setState({...state, board: {...state.board, cfoApp: d}})} isApp />
                <ExecCard role="CMO" data={state.board.cmo} onChange={(d: any) => setState({...state, board: {...state.board, cmo: d}})} />
                <ExecCard role="CMO Apprentice" data={state.board.cmoApp} onChange={(d: any) => setState({...state, board: {...state.board, cmoApp: d}})} isApp />
                <ExecCard role="CTO" data={state.board.cto} onChange={(d: any) => setState({...state, board: {...state.board, cto: d}})} />
                <ExecCard role="CTO Apprentice" data={state.board.ctoApp} onChange={(d: any) => setState({...state, board: {...state.board, ctoApp: d}})} isApp />
             </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="card p-6 border-l-4 border-l-amber-600 bg-amber-50/20 dark:bg-amber-900/10 shadow-lg">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-4 italic">Quick board Sync</h3>
                <p className="text-[10px] font-bold text-surface-500 leading-relaxed mb-4 uppercase tracking-tight">Paste entire executive page content to update primary and apprentice skill nodes.</p>
                <textarea value={pasteData} onChange={(e) => setPasteData(e.target.value)} className="input !bg-white dark:!bg-surface-950 !h-32 font-mono text-[10px] mb-4" placeholder="COO Management: 20..." />
                <button onClick={handlePaste} className="w-full btn btn-primary !bg-amber-600 !hover:bg-amber-700 !rounded-xl !py-3 tracking-widest uppercase font-black">Synchronize Board</button>
             </div>

             <div className="card p-5 space-y-4">
                <div className="flex items-center gap-2">
                   <Calculator size={18} className="text-brand-500" />
                   <h3 className="text-xs font-black uppercase tracking-widest italic">R&D Analytics</h3>
                </div>
                <div className="space-y-3 pt-3 border-t border-surface-50 dark:border-surface-800">
                   <ForecastLine label="Patent Probability" value={`${(core.patentProb*100).toFixed(2)}%`} />
                   <ForecastLine label="Science Speed" value={`${(core.effSci * 2).toFixed(0)}%`} />
                   <div className="flex justify-between items-center bg-surface-50 dark:bg-surface-800 px-3 py-1.5 rounded-lg">
                      <span className="text-[10px] font-black uppercase opacity-40">Target Quality</span>
                      <input type="number" value={state.settings.patentTargetQuality} onChange={(e) => setState({...state, settings: {...state.settings, patentTargetQuality: Number(e.target.value)}})} className="w-10 bg-transparent border-none text-right font-black outline-none p-0 text-sm" />
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
       <div className="md:col-span-4 space-y-5">
          <Section title="Config Node" icon={Wallet}>
             <div className="card p-6 space-y-6 border-l-4 border-l-emerald-600 shadow-lg">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest italic">Forecast Daily Profit</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-black">$</span>
                      <input type="number" value={state.settings.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="input !text-xl !font-black !pl-8 !bg-surface-50 dark:!bg-surface-800 border-none !rounded-xl" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest italic">Current Liabilities</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-black">$</span>
                      <input type="number" value={state.debt.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="input !text-xl !font-black !pl-8 !bg-surface-50 dark:!bg-surface-800 border-none !rounded-xl !text-rose-600" />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 italic">Tax Engine</h3>
             <div className="space-y-4">
                <ForecastLine label="Accounting Safety" value={`$${(core.taxThreshold/1_000_000).toFixed(2)}M`} />
                <ForecastLine label="Daily Threshold" value={`$${(core.taxThreshold/30/1000).toFixed(1)}K`} />
                <ForecastLine label="Daily Tax Est." value={`-$${(core.estimatedDailyTax/1000).toFixed(1)}K`} red />
             </div>
          </div>
          <div className="card p-6 space-y-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 italic">Operating Margin</h3>
             <div className="space-y-4">
                <ForecastLine label="Facility Wages" value={`-$${(core.dailyWages * core.actualAO / 1000).toFixed(1)}K`} red />
                <ForecastLine label="Debt Servicing" value={`-$${(core.dailyInterest / 1000).toFixed(1)}K`} red />
                <ForecastLine label="Net Daily Yield" value={`+$${(core.netDaily/1000).toFixed(1)}K`} green />
             </div>
          </div>
       </div>
    </div>
  );
}

function LogisticsView({ state, setState, fileInputRef }: any) {
  const [q, setQ] = useState("");
  const filteredRes = useMemo(() => RESOURCES.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
       <div className="lg:col-span-4 space-y-5">
          <div className="card p-5 flex flex-col h-[65vh] shadow-xl">
             <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter Manifest..." className="input !pl-10 !py-2 uppercase font-black text-xs !bg-surface-50 dark:!bg-surface-800 border-none" />
             </div>
             <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                {filteredRes.slice(0, 80).map(r => {
                   const item = state.inventory.find(i => i.id === r.id);
                   return (
                      <div key={r.id} className="flex justify-between items-center p-2.5 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg group transition-all">
                         <span className="text-[11px] font-black uppercase italic text-surface-600">{r.name}</span>
                         <input type="number" value={item?.qty || ""} onChange={(e) => { const v = Number(e.target.value); const next = [...state.inventory.filter(i => i.id !== r.id)]; if (v > 0) next.push({ id: r.id, qty: v }); setState({...state, inventory: next}); }} className="w-16 bg-surface-100 dark:bg-surface-900 border-none rounded-md p-1.5 text-[10px] font-black text-center tabular-nums" />
                      </div>
                   )
                })}
             </div>
          </div>
       </div>
       <div className="lg:col-span-8 flex flex-col items-center justify-center card border-dashed opacity-10 p-12">
          <Ship size={120} className="mb-6" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-center">Logistics Node<br/>Requires Data Link</h2>
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
       <div className="md:col-span-4 space-y-5">
          <div className="card p-6 border-l-4 border-l-indigo-600 shadow-lg">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-6 italic">Consumer Entity Select</h3>
             <select value={state.settings.retailResourceId} onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})} className="input !bg-surface-50 dark:!bg-surface-800 border-none uppercase font-black italic mb-6 !py-3">
                {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                   <option key={r.id} value={r.id}>{r.name}</option>
                ))}
             </select>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black uppercase text-surface-400 italic">Market Saturation</span>
                   <span className={`text-2xl font-black italic tracking-tighter tabular-nums ${marketSat > 1.2 ? 'text-red-500' : 'text-emerald-500'}`}>{marketSat.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (1/marketSat)*50)}%` }} className={`h-full ${marketSat > 1.2 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </div>
             </div>
          </div>
       </div>
       <div className="md:col-span-8 card p-12 flex flex-col items-center justify-center opacity-10 border-dashed">
          <Target size={120} />
          <h2 className="text-xl font-black uppercase italic mt-6">Retail Sandbox Offline</h2>
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

function WorkstationTab({ active, onClick, label, icon: Icon }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-900 shadow-lg scale-105' : 'text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
       <Icon size={14} /> {label}
    </button>
  );
}

function GlobalMetric({ label, value }: any) {
  return (
    <div className="flex flex-col">
       <span className="text-[9px] font-black uppercase opacity-60 tracking-tight leading-tight mb-0.5 italic">{label}</span>
       <span className="text-lg font-black italic tracking-tighter tabular-nums leading-tight">{value}</span>
    </div>
  );
}

function KPICard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="card p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all shadow-sm">
       <div className="w-10 h-10 bg-surface-50 dark:bg-surface-800 rounded-xl flex items-center justify-center text-brand-600 mb-4 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-inner">
          <Icon size={20} />
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1 italic">{label}</span>
       <span className="text-xl font-black tabular-nums italic">{value}</span>
       <p className="text-[9px] font-bold text-surface-300 mt-2 uppercase tracking-tighter">{sub}</p>
    </div>
  );
}

function SkillNode({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card p-6 flex flex-col items-center text-center border-b-4 border-current shadow-lg" style={{color: color.replace('text-', '')} as any}>
       <div className="flex items-center gap-2 mb-4">
          <Icon size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-surface-900 dark:text-white italic">{label}</span>
       </div>
       <span className="text-3xl font-black italic tracking-tighter text-surface-900 dark:text-white tabular-nums">{value}</span>
       <span className="text-[9px] font-black uppercase opacity-40 mt-4 tracking-[0.3em] italic">{sub}</span>
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
