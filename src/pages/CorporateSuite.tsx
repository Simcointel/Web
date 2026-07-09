import React, { useState, useMemo, useEffect } from "react";
import {
  DollarSign, ArrowLeft, TrendingDown, Ship,
  LayoutDashboard, HardHat, Upload, Download, CheckCircle2,
  Users, BarChart3, Briefcase, AlertTriangle,
  Sun, Moon
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import { BUILDINGS, RESOURCES, CONSTRUCTION_MATERIALS } from "../data/simco_static";
import * as dataRepo from "../services/dataRepo";
import { LoadingState } from "../components/States";
import { useNavigate, Link } from "../router";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Section } from "../components/Layout";
import type { SuiteStateV6, MapItem } from "./corporate-suite/types";
import type { DashboardMap, ProfitMarginsResponse } from "../types/api";
import type { CompanyData } from "../services/dataRepo";
import { DEFAULT_STATE, n } from "./corporate-suite/types";
import { WorkstationTab, GlobalMetric, LedgerView } from "./corporate-suite/components";
import { CommandView } from "./corporate-suite/CommandView";
import { OperationsView } from "./corporate-suite/OperationsView";
import { ExecutiveView } from "./corporate-suite/ExecutiveView";
import { FinanceView } from "./corporate-suite/FinanceView";
import { LogisticsView } from "./corporate-suite/LogisticsView";
import { RiskView } from "./corporate-suite/RiskView";
import { RankingsView } from "./corporate-suite/RankingsView";
import { BondsView } from "./corporate-suite/BondsView";

export function CorporateSuitePage() {
  useEffect(() => {
    document.title = "SimCo Intel - Corporate Suite";
  }, []);

  const { theme, toggleTheme } = useTheme();
  const [realm] = useSharedRealm();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugData, setDebugData] = useState<Record<string, unknown> | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const { data: dash } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);
  

  const [state, setState] = useState<SuiteStateV6>(() => {
    const saved = localStorage.getItem("simco_suite_v6");
    const base = { ...DEFAULT_STATE };
    if (!saved) return base;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...base,
        ...parsed,
        board: { ...base.board, ...(parsed.board || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) },
        ledger: parsed.ledger || []
      };
    } catch (e) {
      return base;
    }
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const economyPhase = (dash as DashboardMap | undefined)?.[String(realm)]?.regime?.na || 'Normal';

  const core = useMemo(() => {
    const s = state || DEFAULT_STATE;
    const settings = s.settings || DEFAULT_STATE.settings;
    const effMap = s.map || [];
    const effBoard = s.board || DEFAULT_STATE.board;

    const effProfit = n(settings.estDailyProfit);
    const totalLevels = effMap.reduce((sum, i) => sum + n(i.level), 0) + n(settings.whatIfLevel);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    const getEff = (primary: number, all: number[]) => {
      const sumOthers = all.reduce((acc, v) => acc + n(v), 0) - n(primary);
      return n(primary) + Math.floor(sumOthers / 4);
    };

    const allMan = [effBoard.coo.management, effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management, effBoard.cooApp.management, effBoard.cfoApp.management, effBoard.cmoApp.management, effBoard.ctoApp.management];
    const allAcc = [effBoard.coo.accounting, effBoard.cfo.accounting, effBoard.cmo.accounting, effBoard.cto.accounting, effBoard.cooApp.accounting, effBoard.cfoApp.accounting, effBoard.cmoApp.accounting, effBoard.ctoApp.accounting];
    const allCom = [effBoard.coo.communication, effBoard.cfo.communication, effBoard.cmo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmoApp.communication, effBoard.ctoApp.communication];
    const allSci = [effBoard.coo.science, effBoard.cfo.science, effBoard.cmo.science, effBoard.cto.science, effBoard.cooApp.science, effBoard.cfoApp.science, effBoard.cmoApp.science, effBoard.ctoApp.science];

    const effMan = getEff(effBoard.coo.management, allMan);
    const effAcc = getEff(effBoard.cfo.accounting, allAcc);
    const effCom = getEff(effBoard.cmo.communication, allCom);
    const effSci = getEff(effBoard.cto.science, allSci);

    const actualAO = rawAO * (1 - (effMan * 0.01));
    const baseTaxThreshold = 3000000 + (effAcc * 500000);
    const taxThreshold = baseTaxThreshold + (n(settings.bankLevel) * 50000 * effAcc);

    const salesSpeedBonus = (effCom / 3 / 100) + (n(settings.profileSalesBonus) * 0.01);
    const patentProb = 0.0625 + (effSci * 0.000625);

    const dailyWages = effMap.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      return sum + (n(item.level) * (b?.wages || 0) * 24);
    }, 0);

    const dailyInterest = n(s.debt?.current) * (n(s.debt?.rate) / 100);
    const taxableAmount = Math.max(0, effProfit - (taxThreshold / 30));
    const estimatedDailyTax = taxableAmount * 0.07;

    const inventoryValue = (s.inventory || []).reduce((sum, item) => {
      const mData = margins as ProfitMarginsResponse | undefined;
      const price = mData?.resources?.find(m => m.id === item.id)?.outputVwap || 0;
      return sum + (price * item.qty);
    }, 0);

    const mapValue = effMap.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      if (!b) return sum;
      let cost = 0;
      for(let l=1; l<=n(item.level); l++) cost += b.cost * (l <= 2 ? 1 : l-1);
      return sum + cost;
    }, 0);

    const coverageRatio = dailyInterest > 0 ? effProfit / dailyInterest : 100;

    const buildingProfits = effMap.map(m => {
       const b = BUILDINGS.find(bu => bu.id === m.id);
       if (!b) return { name: 'Unknown', profit: 0, level: m.level };

       const res = RESOURCES.find(r => r.buildingId === b.id);
       const mData = margins as ProfitMarginsResponse | undefined;
       const mRes = mData?.resources?.find(r => r.id === res?.id);

       if (!mRes || !res) return { name: b.name, profit: 0, level: m.level };

       const isExtraction = ["O", "M", "Q"].includes(String(b.id));
       const isResearch = ["p", "b", "c", "h", "s", "a", "f", "y"].includes(String(b.id));

       const effProdBonus = isResearch ? 0 : settings.prodBonus || 0;
       const effResBonus = isResearch ? settings.researchBonus || 0 : 0;

       let unitsPh = (res.basePh || 0) * (1 + (effProdBonus + effResBonus) / 100);
       if (isExtraction) unitsPh *= (n(settings.abundance) / 100);

       const wagesPh = (b.wages || 0) * (1 + actualAO);
       const inputCostPh = n(mRes.inputCostPerHour);

       const totalCostPh = inputCostPh + wagesPh + n(mRes.transportPerHour);
       const revenuePh = unitsPh * n(mRes.outputVwap);
       const netProfitPh = (revenuePh - totalCostPh) * n(m.level);

       return { name: b.name, profit: netProfitPh, level: m.level };
    });

    const result = {
      totalLevels, actualAO, rawAO, taxThreshold, salesSpeedBonus, patentProb,
      dailyWages, inventoryValue, mapValue, dailyInterest, effMan, effAcc, effCom, effSci,
      estimatedDailyTax, coverageRatio, buildingProfits,
      totalValuation: inventoryValue + mapValue + (effProfit * 30),
      netDaily: effProfit - dailyInterest - estimatedDailyTax - (dailyWages * actualAO)
    };

    const metrics = {
       prodBonus: settings.prodBonus,
       actualAO: result.actualAO,
       abundance: n(settings.abundance),
       researchBonus: n(settings.researchBonus)
    };
    localStorage.setItem("simco_suite_metrics", JSON.stringify(metrics));

    return result;
  }, [state, margins]);

  useEffect(() => {
    if (state) localStorage.setItem("simco_suite_v6", JSON.stringify(state));
  }, [state]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
         const rows = content.split('\n').map(r => r.split(',').map(c => c.replace(/"/g, '').trim())).filter(r => r.length > 1);
         if (!rows.length) return;
         const header = rows[0];
         const csvType = header.includes('Sales') && header.includes('COGS') ? 'income'
           : header.includes('Cash') && header.includes('Accounts Receivable') ? 'balance'
           : header.includes('All income') ? 'cashflow'
           : header.includes('Resource') && header.includes('Quality') && header.includes('Amount') ? 'warehouse'
           : header.includes('Date') && header.includes('Amount') ? 'receipts'
           : 'unknown';
         setState(prev => ({ ...prev, ledger: rows.slice(1), ledgerMeta: { type: csvType, header } }));
         if (csvType === 'receipts') {
            const amountIdx = header.indexOf('Amount');
            let total = 0;
            rows.slice(1).forEach(row => {
               if (row[amountIdx]) total += parseFloat(row[amountIdx]) || 0;
            });
            setNotification({ msg: `Parsed $${(total/1_000_000).toFixed(2)}M in Receipts`, type: "success" });
            setState(prev => ({ ...prev, settings: { ...prev.settings, estDailyProfit: total / 7 } }));
         } else {
            setNotification({ msg: `Imported ${csvType} CSV (${rows.length - 1} rows)`, type: "success" });
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

  const syncCompany = async (id: string) => {
    if (!id) return;
    setIsSyncing(true);
    try {
      setNotification({ msg: "Establishing secure link...", type: "success" });
      const companyData = await dataRepo.fetchCompanyData(id, realm);
      setDebugData(companyData as unknown as Record<string, unknown>);

      const buildings = companyData.infrastructure?.buildings ?? [];
      const newMap: MapItem[] = buildings
        .filter((b) => b?.kind)
        .map((b) => {
          const apiLevel = n(b.level);
          const apiSize = n(b.size);

          let level = apiSize > 0 ? apiSize : (apiLevel > 0 ? apiLevel : 1);

          const busy = b.busy;
          if (busy && (busy.category === 'u' || busy.category === 'upgrading' || busy.category === 'upgrade')) {
             if (busy.upkeep === false) {
                level += 1;
             }
          }

          return {
            id: b.kind ?? "",
            level: Math.max(level, 1),
            instanceId: b.id,
          };
        });

      const inf = companyData.infrastructure;
      const pub = companyData.companyPublicInfo;
      const hist = companyData.history;

      setState(prev => ({
        ...prev,
        companyId: id,
        companyName: pub?.company,
        companyLogo: pub?.logo,
        companyLevel: pub?.level,
        companyRank: pub?.rank,
        companyValue: hist?.value,
        apiAO: inf?.administrationOverhead,
        workers: inf?.workers,
        governmentTier: companyData.governmentOrderTierIndex,
        extraSlots: pub?.extraBuildingSlots,
        onlineStatus: pub?.online,
        lastSynced: new Date().toLocaleTimeString(),
        map: newMap,
        debt: {
          ...prev.debt,
          current: hist?.bondsPayable ?? 0
        },
        settings: {
          ...prev.settings,
          prodBonus: 12 + (pub?.productionModifier ?? 0),
          profileSalesBonus: pub?.salesModifier ?? 0,
          recreationalBuildings: inf?.recreationBonus ?? 0,
        }
      }));

      setNotification({ msg: `Synchronized: ${pub?.company ?? id}`, type: "success" });
    } catch (e) {
      setNotification({ msg: "Connection Failed", type: "error" });
      setDebugData({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setIsSyncing(false);
    }
  };

  const renderTab = () => {
    if (!core || !state) return <LoadingState text="Syncing Engine..." />;
    switch(state.activeTab || 'command') {
      case 'command': return <CommandView state={state} core={core} phase={economyPhase} margins={margins} onSync={syncCompany} isSyncing={isSyncing} setState={setState} />;
      case 'ops': return <OperationsView state={state} core={core} setState={setState} />;
      case 'exec': return <ExecutiveView state={state} core={core} setState={setState} setNotification={setNotification} />;
      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;
      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} />;
      case 'risk': return <RiskView core={core} phase={economyPhase} retail={retail} />;
      case 'rankings': return <RankingsView />;
      case 'bonds': return <BondsView />;
      case 'ledger': return <LedgerView state={state} setState={setState} />;
      default: return <CommandView state={state} core={core} phase={economyPhase} margins={margins} onSync={syncCompany} isSyncing={isSyncing} setState={setState} />;
    }
  };

  if (mLoading && !margins) return <LoadingState text="Booting Enterprise Suite..." />;

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl mx-auto pb-24 relative text-sm">
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
                          <WorkstationTab active={state.activeTab === 'ledger'} onClick={() => setState({...state, activeTab: 'ledger'})} label="LEDGER" icon={BarChart3} color="bg-teal-600" />
              <WorkstationTab active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="RISK" icon={TrendingDown} color="bg-surface-600" />
              <WorkstationTab active={state.activeTab === 'rankings'} onClick={() => setState({...state, activeTab: 'rankings'})} label="RANKINGS" icon={BarChart3} color="bg-amber-600" />
              <WorkstationTab active={state.activeTab === 'bonds'} onClick={() => setState({...state, activeTab: 'bonds'})} label="BONDS" icon={DollarSign} color="bg-indigo-600" />
          </nav>
       </div>

       <main className="min-h-[50vh]">
          {renderTab()}
       </main>

       {/* Control Bar */}
       <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-[90]">
          <div className="bg-white dark:bg-surface-900 text-surface-900 dark:text-white p-2.5 rounded-xl shadow-2xl flex items-center justify-between border border-surface-200 dark:border-surface-800">
             <div className="flex gap-8 px-6 border-r border-surface-200 dark:border-surface-800">
                <GlobalMetric label="Total Valuation" value={core ? `$${(core.totalValuation/1_000_000).toFixed(2)}M` : '--'} />
                <GlobalMetric label="Net Daily Yield" value={core ? `$${(core.netDaily/1000).toFixed(1)}K` : '--'} />
                <GlobalMetric label="Map Efficiency" value={core ? `${((1 - core.actualAO)*100).toFixed(0)}%` : '--'} />
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
               {notification.type === 'error' && (
                 <button onClick={() => setShowDebug(true)} className="ml-2 text-[10px] underline">Debug</button>
               )}
            </div>
         </div>
       )}

       {showDebug && debugData && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
            <div className="bg-white dark:bg-surface-900 w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-surface-200 dark:border-surface-800">
               <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-950">
                  <h3 className="font-bold uppercase tracking-widest text-xs">Transmission Debug Log</h3>
                  <button onClick={() => setShowDebug(false)} className="p-2 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-lg transition-colors text-xs font-bold uppercase">Close</button>
               </div>
               <pre className="flex-1 overflow-auto p-6 text-[10px] font-mono leading-relaxed bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-brand-400">
                  {JSON.stringify(debugData, null, 2)}
               </pre>
            </div>
         </div>
       )}
    </div>
  );
}
