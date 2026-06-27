import React, { useState, useMemo, useEffect } from "react";
import {
  Building2, Package, DollarSign, ArrowLeft,
  Search, Target, TrendingDown, Ship,
  LayoutDashboard, HardHat, Link, Link2Off, Trash2, Upload, Download, CheckCircle2,
  Users, UserPlus, AlertCircle, Clock
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
    const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

    const effMap = state.moduleSettings.opsLinked ? state.map : DEFAULT_STATE.map;
    const effBoard = state.moduleSettings.execLinked ? state.board : DEFAULT_STATE.board;
    const effProfit = n(state.moduleSettings.financeLinked ? state.settings.estDailyProfit : DEFAULT_STATE.settings.estDailyProfit);

    const totalLevels = effMap.reduce((s, i) => s + n(i.level), 0) + n(state.moduleSettings.opsLinked ? state.settings.whatIfLevel : 0);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);

    const effMan = getEff(effBoard.coo.management, [effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management, effBoard.cooApp.management, effBoard.cfoApp.management, effBoard.cmoApp.management, effBoard.ctoApp.management]);
    const effAcc = getEff(effBoard.cfo.accounting, [effBoard.coo.accounting, effBoard.cmo.accounting, effBoard.cto.accounting, effBoard.cooApp.accounting, effBoard.cfoApp.accounting, effBoard.cmoApp.accounting, effBoard.ctoApp.accounting]);
    const effCom = getEff(effBoard.cmo.communication, [effBoard.coo.communication, effBoard.cfo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmoApp.communication, effBoard.ctoApp.communication]);
    const effSci = getEff(effBoard.cto.science, [effBoard.coo.science, effBoard.cfo.science, effBoard.cmo.science, effBoard.cooApp.science, effBoard.cfoApp.science, effBoard.cmoApp.science, effBoard.ctoApp.science]);

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
    };
    reader.readAsText(file);
  };

  const renderTab = () => {
    switch(state.activeTab) {
      case 'command': return <CommandView state={state} core={core} phase={economyPhase} setState={setState} fileInputRef={fileInputRef} margins={margins} dash={dash} realm={realm} />;
      case 'ops': return <OperationsView state={state} core={core} setState={setState} />;
      case 'exec': return <ExecutiveView state={state} core={core} setState={setState} />;
      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;
      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} audit={audit} fileInputRef={fileInputRef} />;
      case 'retail': return <RetailView state={state} core={core} setState={setState} retail={retail} />;
      case 'risk': return <RiskView state={state} core={core} phase={economyPhase} retail={retail} />;
    }
  };

  if (mLoading && !margins) return <LoadingState text="BOOTING_TERMINAL..." />;

  return (
    <div className="bg-white dark:bg-surface-950 min-h-screen text-surface-900 dark:text-white font-mono text-xs overflow-x-hidden">
      {/* Mini Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-3 py-1.5 border ${notification.type === 'success' ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-950' : 'bg-red-600 text-white'} flex items-center gap-2 font-bold uppercase tracking-tighter`}>
           {notification.type === 'success' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
           {notification.msg}
        </div>
      )}

      {/* Top Header - High Density */}
      <header className="border-b border-surface-200 dark:border-surface-900 flex items-center justify-between px-4 py-2 bg-surface-50 dark:bg-surface-950/50">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
              <span className="font-black uppercase tracking-tighter text-sm">SimcoIntel.<span className="text-surface-400">Terminal</span></span>
              <span className="text-[10px] opacity-30">v6.4.2</span>
           </div>
           <nav className="flex gap-px bg-surface-200 dark:bg-surface-900 border border-surface-200 dark:border-surface-900">
              <TabBtn active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} label="CMD" />
              <TabBtn active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} label="OPS" />
              <TabBtn active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} label="EXEC" />
              <TabBtn active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} label="FIN" />
              <TabBtn active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} label="LOG" />
              <TabBtn active={state.activeTab === 'retail'} onClick={() => setState({...state, activeTab: 'retail'})} label="RET" />
              <TabBtn active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="RSK" />
           </nav>
        </div>

        <div className="flex items-center gap-6">
           <HeaderMetric label="ADMIN" value={`${(core.actualAO*100).toFixed(2)}%`} />
           <HeaderMetric label="NET_FLOW" value={`$${(core.netDaily/1000).toFixed(1)}K/d`} />
           <HeaderMetric label="PHASE" value={economyPhase.toUpperCase()} />
           <button onClick={() => navigate('/')} className="hover:opacity-60 transition-opacity"><ArrowLeft size={16} /></button>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-[1800px] mx-auto">
         {renderTab()}
      </main>

      {/* Persistent Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-surface-200 dark:border-surface-900 bg-surface-50 dark:bg-surface-950 px-4 py-1 flex justify-between items-center z-50">
         <div className="flex gap-6 opacity-60 font-bold uppercase tracking-tighter text-[9px]">
            <span>Realm: R{realm}</span>
            <span>Enterprise: ${(core.totalValuation/1_000_000).toFixed(2)}M</span>
            <span>Sync: {state.globalSync ? 'ONLINE' : 'LOCAL'}</span>
         </div>
         <div className="flex gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="hover:underline">Import</button>
            <button onClick={() => {}} className="hover:underline">Export</button>
         </div>
         <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
      </footer>
    </div>
  );
}

function CommandView({ state, core, phase, setState, margins, dash, realm }: any) {
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    state.map.forEach((m: any) => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (b) counts[(b as any).category || 'Other'] = (counts[(b as any).category || 'Other'] || 0) + m.level;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [state.map]);

  const marketAlerts = useMemo(() => {
    if (!margins?.resources) return [];
    return (margins.resources as any[])
      .filter(r => Math.abs(r.marginDelta || 0) > 5)
      .slice(0, 5)
      .map(r => ({
         name: r.name,
         delta: r.marginDelta,
         price: r.outputVwap
      }));
  }, [margins]);

  const dashboardAlerts = (dash as any)?.[String(realm)]?.alerts || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-8 space-y-6">
          <div className="grid grid-cols-4 gap-4">
             <DataBox label="Enterprise Value" value={`$${(core.totalValuation/1_000_000).toFixed(2)}M`} sub={`Liquid: $${(core.inventoryValue/1000).toFixed(1)}K`} />
             <DataBox label="Daily Cashflow" value={`$${(core.netDaily/1000).toFixed(1)}K`} sub="Post-Tax Estimate" />
             <DataBox label="Admin Burden" value={`${(core.actualAO*100).toFixed(2)}%`} sub={`${core.totalLevels} Active Lvls`} />
             <DataBox label="Market Phase" value={phase.toUpperCase()} sub="Global Modifier" />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="border border-surface-200 dark:border-surface-900">
                <div className="bg-surface-100 dark:bg-surface-900 px-3 py-1 border-b border-surface-200 dark:border-surface-900 flex justify-between">
                   <span className="font-black uppercase tracking-widest text-[10px]">Infrastructure Distribution</span>
                   <button onClick={() => setState({...state, activeTab: 'ops'})} className="text-[10px] hover:underline">Edit</button>
                </div>
                <div className="p-4 space-y-4">
                   {categories.map(([cat, lvls]) => (
                      <div key={cat} className="grid grid-cols-12 items-center gap-4">
                         <span className="col-span-3 opacity-60 uppercase text-[10px] truncate">{cat}</span>
                         <div className="col-span-7 h-2 bg-surface-100 dark:bg-surface-900 overflow-hidden border border-surface-200 dark:border-surface-800">
                            <div className="h-full bg-surface-900 dark:bg-white" style={{ width: `${(lvls / (core.totalLevels || 1)) * 100}%` }} />
                         </div>
                         <span className="col-span-2 text-right font-bold">{lvls}</span>
                      </div>
                   ))}
                   {categories.length === 0 && <div className="text-center py-10 opacity-30 italic uppercase">No active facilities</div>}
                </div>
             </div>

             <div className="border border-surface-200 dark:border-surface-900">
                <div className="bg-surface-100 dark:bg-surface-900 px-3 py-1 border-b border-surface-200 dark:border-surface-900 flex justify-between">
                   <span className="font-black uppercase tracking-widest text-[10px]">Market Volatility Feed</span>
                </div>
                <div className="p-4 space-y-3">
                   {marketAlerts.map((a, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-surface-100 dark:border-surface-900 last:border-0">
                         <span className="uppercase font-bold">{a.name}</span>
                         <div className="flex gap-4 items-center">
                            <span className="opacity-40 tabular-nums">${a.price.toFixed(2)}</span>
                            <span className={`font-black tabular-nums ${a.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                               {a.delta > 0 ? '▲' : '▼'}{Math.abs(a.delta).toFixed(1)}%
                            </span>
                         </div>
                      </div>
                   ))}
                   {marketAlerts.length === 0 && <div className="text-center py-6 opacity-20 uppercase">No major shifts</div>}
                </div>
             </div>
          </div>
       </div>

       <div className="md:col-span-4 space-y-6">
          <div className="border border-surface-200 dark:border-surface-900">
             <div className="bg-surface-100 dark:bg-surface-900 px-3 py-1 border-b border-surface-200 dark:border-surface-900">
                <span className="font-black uppercase tracking-widest text-[10px]">Strategic Alerts</span>
             </div>
             <div className="p-4 space-y-4">
                {dashboardAlerts > 0 && (
                   <div className="flex items-start gap-3 p-3 bg-red-600/5 border border-red-600/20 text-red-600">
                      <AlertCircle size={16} className="shrink-0" />
                      <div>
                         <p className="font-black uppercase">Market Disruption</p>
                         <p className="text-[9px] font-bold opacity-70">Detected {dashboardAlerts} system anomalies in current realm cycle.</p>
                      </div>
                   </div>
                )}
                <div className="flex items-start gap-3 p-3 bg-surface-900 text-white dark:bg-white dark:text-surface-950 border border-surface-200">
                   <Clock size={16} className="shrink-0" />
                   <div>
                      <p className="font-black uppercase">Cycle Estimate</p>
                      <p className="text-[9px] font-bold opacity-70">Next possible regime shift in 2.4 days based on historical stability.</p>
                   </div>
                </div>
                <div className="p-4 border border-surface-200 dark:border-surface-900 space-y-3">
                   <span className="block font-black uppercase text-[10px] opacity-40">Asset Checklist</span>
                   <CheckItem label="C-Suite Staffed" active={Object.values(state.board).some((e: any) => e.management > 0)} />
                   <CheckItem label="Inventory Valued" active={state.inventory.length > 0} />
                   <CheckItem label="Debt Managed" active={state.debt.current > 0} />
                   <CheckItem label="Realm Synced" active={state.globalSync} />
                </div>
             </div>
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
    });
    return totals;
  }, [state.map]);

  return (
    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-5 border border-surface-200 dark:border-surface-900">
          <div className="bg-surface-100 dark:bg-surface-900 px-3 py-1 border-b border-surface-200 dark:border-surface-900 flex justify-between items-center">
             <span className="font-black uppercase text-[10px]">Facility Manager</span>
             <button onClick={() => setState({...state, map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]})} className="hover:underline text-[10px]">+ Add</button>
          </div>
          <div className="max-h-[700px] overflow-y-auto p-2 space-y-1">
             {state.map.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-surface-50 dark:bg-surface-900/50 p-1.5 border border-surface-200 dark:border-surface-900">
                   <span className="opacity-30 w-4 text-[9px]">{i+1}</span>
                   <select
                     value={m.id}
                     onChange={(e) => { const n = [...state.map]; n[i].id = e.target.value; setState({...state, map: n}); }}
                     className="bg-transparent border-none p-0 text-[10px] font-bold uppercase flex-1 outline-none focus:ring-0"
                   >
                      {BUILDINGS.map(b => <option key={b.id} value={b.id} className="bg-white dark:bg-surface-950">{b.name}</option>)}
                   </select>
                   <div className="flex items-center border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
                      <span className="px-1 text-[8px] opacity-50 font-bold border-r border-surface-200 dark:border-surface-800">LVL</span>
                      <input
                        type="number"
                        value={m.level}
                        onChange={(e) => { const n = [...state.map]; n[i].level = Number(e.target.value); setState({...state, map: n}); }}
                        className="w-10 bg-transparent border-none p-1 text-[10px] text-center font-black outline-none focus:ring-0"
                      />
                   </div>
                   <button onClick={() => setState({...state, map: state.map.filter((_: any, idx: number) => idx !== i)})} className="p-1 hover:text-red-500 opacity-30 hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                </div>
             ))}
             {state.map.length === 0 && <div className="text-center py-20 opacity-30 uppercase text-[9px] tracking-widest">No Active Projects</div>}
          </div>
       </div>

       <div className="col-span-7 space-y-6">
          <div className="border border-surface-200 dark:border-surface-900 p-4">
             <span className="block font-black uppercase text-[10px] mb-4 opacity-40">Capital Requirements</span>
             <div className="flex items-end gap-2">
                <span className="text-4xl font-black tabular-nums">${(constructionTotals[0]/1000).toFixed(1)}K</span>
                <span className="mb-1 opacity-40 uppercase font-bold text-[10px]">Est. Infrastructure Value</span>
             </div>
          </div>
       </div>
    </div>
  );
}

function ExecutiveView({ state, setState }: any) {
  const [pasteData, setPasteData] = useState("");
  const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const handlePaste = () => {
    const lines = pasteData.split('\n');
    const newBoard = { ...state.board };
    let currentExec: any = null;
    const roles = ['COO', 'CFO', 'CMO', 'CTO'];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (roles.includes(trimmed)) currentExec = trimmed.toLowerCase();
      else if (trimmed.includes('Management:')) { if (currentExec) newBoard[currentExec].management = parseInt(trimmed.split(':')[1]) || 0; }
      else if (trimmed.includes('Accounting:')) { if (currentExec) newBoard[currentExec].accounting = parseInt(trimmed.split(':')[1]) || 0; }
      else if (trimmed.includes('Communication:')) { if (currentExec) newBoard[currentExec].communication = parseInt(trimmed.split(':')[1]) || 0; }
      else if (trimmed.includes('Science:')) { if (currentExec) newBoard[currentExec].science = parseInt(trimmed.split(':')[1]) || 0; }
    });

    setState({ ...state, board: newBoard });
    setPasteData("");
  };

  const getEff = (primary: number, others: number[]) => n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);
  const effMan = getEff(state.board.coo.management, [state.board.cfo.management, state.board.cmo.management, state.board.cto.management, state.board.cooApp.management, state.board.cfoApp.management, state.board.cmoApp.management, state.board.ctoApp.management]);
  const effAcc = getEff(state.board.cfo.accounting, [state.board.coo.accounting, state.board.cmo.accounting, state.board.cto.accounting, state.board.cooApp.accounting, state.board.cfoApp.accounting, state.board.cmoApp.accounting, state.board.ctoApp.accounting]);
  const effCom = getEff(state.board.cmo.communication, [state.board.coo.accounting, state.board.cfo.accounting, state.board.cto.accounting, state.board.cooApp.accounting, state.board.cfoApp.accounting, state.board.cmoApp.accounting, state.board.ctoApp.accounting]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
       <div className="md:col-span-4 border border-surface-200 dark:border-surface-900 p-4 space-y-6">
          <span className="block font-black uppercase text-[10px] opacity-40">System Override</span>
          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            className="w-full h-40 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-900 p-2 text-[10px] outline-none"
            placeholder="Paste raw board data..."
          />
          <button onClick={handlePaste} className="w-full bg-surface-900 text-white dark:bg-white dark:text-surface-950 py-2 font-black uppercase tracking-widest text-[10px]">Execute Sync</button>
       </div>

       <div className="md:col-span-8 grid grid-cols-3 gap-px bg-surface-200 dark:bg-surface-900 border border-surface-200 dark:border-surface-900">
          <SkillBox label="Management" val={effMan} />
          <SkillBox label="Accounting" val={effAcc} />
          <SkillBox label="Communication" val={effCom} />
       </div>
    </div>
  );
}

function FinanceView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-4 border border-surface-200 dark:border-surface-900 p-4 space-y-6">
          <Input label="DAILY_PROFIT" val={state.settings.estDailyProfit} onChange={(v) => setState({...state, settings: {...state.settings, estDailyProfit: v}})} />
          <Input label="BANK_LVL" val={state.settings.bankLevel} onChange={(v) => setState({...state, settings: {...state.settings, bankLevel: v}})} />
       </div>
       <div className="col-span-8 grid grid-cols-2 gap-4">
          <div className="border border-surface-200 dark:border-surface-900 p-4">
             <span className="block font-black uppercase text-[10px] opacity-40 mb-2">Cash Threshold</span>
             <span className="text-2xl font-black font-mono tracking-tighter">${(core.taxThreshold/1_000_000).toFixed(1)}M</span>
          </div>
          <div className="border border-surface-200 dark:border-surface-900 p-4">
             <span className="block font-black uppercase text-[10px] opacity-40 mb-2">Net Cashflow</span>
             <span className="text-2xl font-black font-mono tracking-tighter text-green-600">${(core.netDaily/1000).toFixed(1)}K</span>
          </div>
       </div>
    </div>
  );
}

function LogisticsView({ state, setState, audit, fileInputRef }: any) {
  return (
    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-4 border border-surface-200 dark:border-surface-900">
          <div className="bg-surface-100 dark:bg-surface-900 px-3 py-1 border-b border-surface-200 dark:border-surface-900 flex justify-between items-center">
             <span className="font-black uppercase text-[10px]">Resource Manifest</span>
             <button onClick={() => fileInputRef.current?.click()} className="text-[10px] hover:underline">Import</button>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
             {RESOURCES.slice(0, 50).map(r => {
                const item = state.inventory.find(i => i.id === r.id);
                return (
                  <div key={r.id} className="flex justify-between items-center bg-surface-50 dark:bg-surface-900/50 p-1.5 border border-surface-200 dark:border-surface-900">
                     <span className="uppercase text-[10px] font-bold opacity-60">{r.name}</span>
                     <input
                       type="number"
                       value={item?.qty || ""}
                       onChange={(e) => {
                          const v = Number(e.target.value);
                          const next = [...state.inventory.filter(i => i.id !== r.id)];
                          if (v > 0) next.push({ id: r.id, qty: v });
                          setState({...state, inventory: next});
                       }}
                       className="w-20 bg-transparent border border-surface-200 dark:border-surface-800 text-right p-1 text-[10px] outline-none"
                     />
                  </div>
                )
             })}
          </div>
       </div>
       <div className="col-span-8 border border-surface-200 dark:border-surface-900 p-6 flex flex-col items-center justify-center text-center opacity-40">
          <Ship size={80} className="mb-4" />
          <span className="uppercase font-black text-sm">Logistics Terminal Locked</span>
          <span className="text-[10px] mt-2">Connect data feed to visualize supply chain health</span>
       </div>
    </div>
  );
}

function RetailView({ state, setState, retail }: any) {
  const selectedRes = RESOURCES.find(r => r.id === state.settings.retailResourceId) || RESOURCES.find(r => r.id === 24);
  const retailData = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === selectedRes?.name.toLowerCase()) : null;
  const marketSat = (retailData as any)?.[1]?.saturation || 1.0;

  return (
    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-4 space-y-6">
          <div className="border border-surface-200 dark:border-surface-900 p-4">
             <span className="block font-black uppercase text-[10px] opacity-40 mb-4">Consumer Target</span>
             <select
               value={state.settings.retailResourceId}
               onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})}
               className="w-full bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-900 p-2 text-[10px] font-black uppercase outline-none"
             >
                {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                   <option key={r.id} value={r.id}>{r.name}</option>
                ))}
             </select>
          </div>
          <div className="border border-surface-200 dark:border-surface-900 p-4">
             <span className="block font-black uppercase text-[10px] opacity-40 mb-2">Market Saturation</span>
             <span className={`text-2xl font-black font-mono ${marketSat > 1.2 ? 'text-red-500' : 'text-green-500'}`}>{marketSat.toFixed(2)}</span>
          </div>
       </div>
       <div className="col-span-8 border border-surface-200 dark:border-surface-900 p-6 flex flex-col items-center justify-center opacity-20">
          <LayoutDashboard size={64} />
          <span className="uppercase text-[10px] font-black mt-4">Simulation Grid Pending</span>
       </div>
    </div>
  );
}

function RiskView({ phase, retail }: any) {
  return (
    <div className="grid grid-cols-12 gap-8">
       <div className="col-span-12 border border-surface-200 dark:border-surface-900 p-4">
          <div className="bg-surface-100 dark:bg-surface-900 px-3 py-1 border-b border-surface-200 dark:border-surface-900 mb-6">
             <span className="font-black uppercase text-[10px]">Sentiment Mapping</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
             {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 18).map(res => {
                const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
                const sat = retailItem?.[1]?.saturation || 1.0;
                return (
                  <div key={res.id} className="p-2 border border-surface-200 dark:border-surface-800 text-center">
                     <span className="block text-[8px] opacity-50 uppercase truncate mb-1">{res.name}</span>
                     <span className={`text-[10px] font-bold ${sat < 1 ? 'text-green-500' : 'text-red-500'}`}>{sat.toFixed(2)}</span>
                  </div>
                )
             })}
          </div>
       </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase transition-colors ${active ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-950' : 'bg-white text-surface-400 dark:bg-surface-950 dark:text-surface-600 hover:text-surface-900 dark:hover:text-white'}`}
    >
       {label}
    </button>
  );
}

function HeaderMetric({ label, value }: any) {
  return (
    <div className="flex items-center gap-2">
       <span className="text-[9px] font-bold opacity-30 uppercase">{label}</span>
       <span className="font-black tracking-tighter">{value}</span>
    </div>
  );
}

function DataBox({ label, value, sub }: any) {
  return (
    <div className="border border-surface-200 dark:border-surface-900 p-4 bg-surface-50 dark:bg-surface-950">
       <span className="block text-[9px] font-bold opacity-40 uppercase mb-1">{label}</span>
       <span className="text-xl font-black font-mono tracking-tighter">{value}</span>
       <span className="block text-[8px] opacity-30 mt-1 uppercase font-bold">{sub}</span>
    </div>
  );
}

function SkillBox({ label, val }: any) {
  return (
    <div className="bg-white dark:bg-surface-950 p-6 flex flex-col items-center justify-center text-center">
       <span className="text-[10px] font-bold opacity-40 uppercase mb-2">{label}</span>
       <span className="text-3xl font-black font-mono">{val}</span>
    </div>
  );
}

function CheckItem({ label, active }: any) {
  return (
    <div className="flex items-center gap-3 py-1">
       <div className={`w-3 h-3 border ${active ? 'bg-surface-900 dark:bg-white border-surface-900 dark:border-white' : 'border-surface-200 dark:border-surface-800'}`} />
       <span className={`text-[10px] font-bold uppercase ${active ? 'opacity-100' : 'opacity-30'}`}>{label}</span>
    </div>
  );
}

function Input({ label, val, onChange }: any) {
  return (
    <div className="space-y-1">
       <span className="block text-[8px] font-bold opacity-40 uppercase">{label}</span>
       <input
         type="number"
         value={val}
         onChange={(e) => onChange(Number(e.target.value))}
         className="w-full bg-transparent border border-surface-200 dark:border-surface-800 p-2 text-[10px] font-black outline-none focus:border-surface-900 dark:focus:border-white"
       />
    </div>
  );
}
