import React, { useState, useMemo, useEffect } from "react";

import {

  DollarSign, ArrowLeft, TrendingDown, Ship, Target,

  LayoutDashboard, HardHat, Upload, Download, CheckCircle2,

  Users, BarChart3, Briefcase, AlertTriangle,

  Sun, Moon

} from "lucide-react";

import { useTheme } from "../hooks/useTheme";

import { useSharedRealm } from "../hooks/useSharedRealm";

import { BUILDINGS, RESOURCES, CONSTRUCTION_MATERIALS } from "../data/simco_static";

import { LoadingState } from "../components/States";

import { useNavigate, Link } from "../router";

import { Section } from "../components/Layout";
import * as dataRepo from "../services/dataRepo";
import type { SuiteStateV6, MapItem, SuiteViewProps } from "./corporate-suite/types";

import type { DashboardMap, ProfitMarginsResponse } from "../types/api";

import type { CompanyData } from "../services/dataRepo";

import { DEFAULT_STATE, n } from "./corporate-suite/types";

import { WorkstationTab, GlobalMetric, LedgerView } from "./corporate-suite/components";

import { CommandView } from "./corporate-suite/CommandView";

import { OperationsView } from "./corporate-suite/OperationsView";

import { ExecutiveView } from "./corporate-suite/ExecutiveView";

import { FinanceView } from "./corporate-suite/FinanceView";

import { LogisticsView } from "./corporate-suite/LogisticsView";

import { RetailView } from "./corporate-suite/RetailView";

import { RiskView } from "./corporate-suite/RiskView";

import { RankingsView } from "./corporate-suite/RankingsView";

import { BondsView } from "./corporate-suite/BondsView";



import { PageHeader, MetricBox } from "../components/ui/Common";

import { usePageTitleKey } from "../hooks/usePageTitle";

import { useDashboardState, useProfitMargins, useRetailData } from "../hooks/useDataQueries";

import { fmtNumber, fmtPct, fmtCurrency } from "../utils/formatters";
import { Building2, Landmark, PiggyBank } from "lucide-react";



export function CorporateSuitePage() {

  usePageTitleKey('corporateSuite');



  const { theme, toggleTheme } = useTheme();

  const [realm] = useSharedRealm();

  const navigate = useNavigate();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  const [debugData, setDebugData] = useState<Record<string, unknown> | null>(null);

  const [showDebug, setShowDebug] = useState(false);



  const { data: dash } = useDashboardState();

  const { data: margins, loading: mLoading } = useProfitMargins(60000);

  const { data: retail } = useRetailData();



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

         const rows = content.split('\n').map(r => r.split(',').map(c => c.replace(/\"/g, '').trim())).filter(r => r.length > 1);

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
      case 'boardroom': return <BoardRoomView state={state} core={core} setState={setState} />;

      case 'finance': return <FinanceView state={state} core={core} setState={setState} />;

      case 'logistics': return <LogisticsView state={state} core={core} setState={setState} />;

      case 'retail': return <RetailView state={state} core={core} setState={setState} retail={retail} />;

      case 'risk': return <RiskView core={core} phase={economyPhase} retail={retail} state={state} setState={setState} />;

      case 'rankings': return <RankingsView />;

      case 'bonds': return <BondsView />;

      case 'ledger': return <LedgerView state={state} />;

      default: return <CommandView state={state} core={core} phase={economyPhase} margins={margins} onSync={syncCompany} isSyncing={isSyncing} setState={setState} />;

    }

  };



  if (mLoading && !margins) return <LoadingState text="Booting Enterprise Suite..." />;



  return (

    <div className="space-y-6 animate-slide-up max-w-7xl mx-auto pb-24 relative text-sm">

       <PageHeader

         title="Sync.Suite"

         subtitle="Enterprise Command & Control"

         icon={<Briefcase size={18} />}

         iconBg="bg-brand-600"

         iconColor="text-white"

         realm={realm}

         onRealmChange={() => {}}

       >

         <Link to="/" className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center text-surface-500 hover:text-brand-600 transition-colors">

           <ArrowLeft size={18} />

         </Link>

       </PageHeader>



       <nav className="flex bg-surface-100 dark:bg-surface-900 p-1 rounded-lg border border-surface-200 dark:border-surface-800 overflow-x-auto scrollbar-hide">

           <WorkstationTab active={state.activeTab === 'command'} onClick={() => setState({...state, activeTab: 'command'})} label="COMMAND" icon={LayoutDashboard} color="bg-brand-600" />

           <WorkstationTab active={state.activeTab === 'ops'} onClick={() => setState({...state, activeTab: 'ops'})} label="OPS" icon={HardHat} color="bg-emerald-600" />

           <WorkstationTab active={state.activeTab === 'exec'} onClick={() => setState({...state, activeTab: 'exec'})} label="EXEC" icon={Users} color="bg-amber-600" />
          <WorkstationTab active={state.activeTab === 'boardroom'} onClick={() => setState({...state, activeTab: 'boardroom'})} label="BOARD" icon={Briefcase} color="bg-amber-700" />

           <WorkstationTab active={state.activeTab === 'finance'} onClick={() => setState({...state, activeTab: 'finance'})} label="FINANCE" icon={DollarSign} color="bg-violet-600" />

           <WorkstationTab active={state.activeTab === 'logistics'} onClick={() => setState({...state, activeTab: 'logistics'})} label="LOGISTICS" icon={Ship} color="bg-indigo-600" />

           <WorkstationTab active={state.activeTab === 'retail'} onClick={() => setState({...state, activeTab: 'retail'})} label="RETAIL" icon={Target} color="bg-rose-600" />

           <WorkstationTab active={state.activeTab === 'ledger'} onClick={() => setState({...state, activeTab: 'ledger'})} label="LEDGER" icon={BarChart3} color="bg-teal-600" />

           <WorkstationTab active={state.activeTab === 'risk'} onClick={() => setState({...state, activeTab: 'risk'})} label="RISK" icon={TrendingDown} color="bg-surface-600" />

           <WorkstationTab active={state.activeTab === 'rankings'} onClick={() => setState({...state, activeTab: 'rankings'})} label="RANKINGS" icon={BarChart3} color="bg-amber-600" />

           <WorkstationTab active={state.activeTab === 'bonds'} onClick={() => setState({...state, activeTab: 'bonds'})} label="BONDS" icon={DollarSign} color="bg-indigo-600" />

        </nav>




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

// ============================================================================
// Board Room (merged from BoardRoom.tsx into Corporate Suite)
// ============================================================================

type BoardRoomTab = 'execs' | 'eva' | 'bonds';

function BoardRoomView({ state, core, setState }: SuiteViewProps) {
  const [tab, setTab] = useState<BoardRoomTab>('execs');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-900 rounded-xl p-1 w-fit">
        {(['execs', 'eva', 'bonds'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
            {t === 'execs' ? 'Executive Optimizer' : t === 'eva' ? 'EVA Tracker' : 'Bonds Calculator'}
          </button>
        ))}
      </div>

      {tab === 'execs' && <BoardExecsTab state={state} setState={setState} />}
      {tab === 'eva' && <EvaTab />}
      {tab === 'bonds' && <BondsTab />}
    </div>
  );
}

interface ExecSkills { management: number; accounting: number; communication: number; science: number }

function eff(v: number): number {
  if (v <= 60) return v;
  if (v <= 80) return 60 + (v - 60) / 2;
  return 70 + (v - 80) / 4;
}

function calcAO(totalBldgLevels: number, cooMgmt: number, cfoMgmt: number, cmoMgmt: number, ctoMgmt: number): number {
  const rawAO = (totalBldgLevels - 1) / 170;
  const totalMgmt = eff(cooMgmt) + Math.floor((eff(cfoMgmt) + eff(cmoMgmt) + eff(ctoMgmt)) / 4);
  return Math.max(0, rawAO - rawAO * (totalMgmt / 100));
}

function calcTaxThreshold(accMax: number): number { return 3_000_000 + accMax * 5_500_000; }
function calcDailyTax(profit: number, threshold: number, bankLevel: number): number {
  const dailyThreshold = threshold / 30;
  if (profit <= dailyThreshold) return 0;
  return (profit - dailyThreshold) * Math.max(0.05, 0.07 - bankLevel * 0.001);
}
function calcSalesSpeed(commSum: number): number { return commSum / 3; }
function calcPatentProb(sciMax: number): number { return 6.25 + sciMax * 0.0625; }
function calcResearchCost(sciAvg: number, targetQ: number, startQ: number): number {
  if (targetQ <= startQ) return 0;
  return (targetQ - startQ) * 50 * Math.max(1, 10 - sciAvg * 0.5);
}
function calcEVA(annualProfit: number, investedCapital: number, waccPct: number): number {
  if (investedCapital <= 0) return 0;
  const roic = (annualProfit / investedCapital) * 100;
  return roic - waccPct;
}

function BoardExecsTab({ state, setState }: { state: SuiteStateV6; setState: React.Dispatch<React.SetStateAction<SuiteStateV6>> }) {
  const board = state.board;
  const totalBldgLevels = state.settings?.whatIfLevel || 50;
  const bankLevel = state.settings?.bankLevel || 0;
  const dailyProfit = state.settings?.estDailyProfit || 500000;

  const effBoard = board;
  const effMgmt = eff(effBoard.coo.management) + eff(effBoard.cfo.management) + eff(effBoard.cmo.management) + eff(effBoard.cto.management);
  const effAccMax = Math.max(eff(effBoard.coo.accounting), eff(effBoard.cfo.accounting), eff(effBoard.cmo.accounting), eff(effBoard.cto.accounting));
  const effCommSum = eff(effBoard.coo.communication) + eff(effBoard.cfo.communication) + eff(effBoard.cmo.communication) + eff(effBoard.cto.communication);
  const effSciMax = Math.max(eff(effBoard.coo.science), eff(effBoard.cfo.science), eff(effBoard.cmo.science), eff(effBoard.cto.science));
  const effSciAvg = (eff(effBoard.coo.science) + eff(effBoard.cfo.science) + eff(effBoard.cmo.science) + eff(effBoard.cto.science)) / 4;

  const rawAO = (totalBldgLevels - 1) / 170;
  const aoPct = calcAO(totalBldgLevels, effBoard.coo.management, effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management);
  const taxThreshold = calcTaxThreshold(effAccMax);
  const dailyTax = calcDailyTax(dailyProfit, taxThreshold, bankLevel);
  const salesSpeed = calcSalesSpeed(effCommSum);
  const patentProb = calcPatentProb(effSciMax);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Your Board</h2>
        {(['coo', 'cfo', 'cmo', 'cto'] as const).map(role => {
          const data = board[role];
          const labels: Record<string, string> = { coo: 'COO', cfo: 'CFO', cmo: 'CMO', cto: 'CTO' };
          const colors: Record<string, string> = { coo: 'border-l-brand-500', cfo: 'border-l-emerald-500', cmo: 'border-l-amber-500', cto: 'border-l-violet-500' };
          return (
            <div key={role} className={`card p-4 border-l-4 ${colors[role]}`}>
              <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">{labels[role]}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {(["management", "accounting", "communication", "science"] as const).map(f => (
                  <div key={f}>
                    <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block mb-0.5">{f.slice(0, 4)}</label>
                    <input type="number" min={0} max={100} value={data[f]}
                      onChange={e => setState({ ...state, board: { ...state.board, [role]: { ...data, [f]: Number(e.target.value) } } })}
                      className="w-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 px-2.5 py-1.5 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-brand-500/20" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Impact Analysis</h2>
        <div className="card p-4 border-l-4 border-l-brand-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">Admin Overhead</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Raw AO</span><span className="font-bold">{(rawAO * 100).toFixed(2)}%</span></div>
            <div className="flex justify-between"><span>Final AO</span><span className="font-bold text-brand-600">{aoPct.toFixed(2)}%</span></div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">Accounting & Tax</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Tax-free Threshold</span><span className="font-bold text-emerald-600">{fmtCurrency(taxThreshold)}</span></div>
            <div className="flex justify-between"><span>Est. Daily Tax</span><span className={`font-bold ${dailyTax > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtCurrency(dailyTax)}</span></div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">Sales Speed</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Sales Speed Bonus</span><span className="font-bold text-amber-600">+{salesSpeed.toFixed(2)}%</span></div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-violet-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">R&D Impact</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Patent Probability</span><span className="font-bold text-violet-600">{patentProb.toFixed(2)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaTab() {
  const [capital, setCapital] = useState(10_000_000);
  const [annualProfit, setAnnualProfit] = useState(2_500_000);
  const [wacc, setWacc] = useState(10);
  const eva = useMemo(() => {
    const roic = capital > 0 ? (annualProfit / capital) * 100 : 0;
    const spread = calcEVA(annualProfit, capital, wacc);
    const evaDollar = capital > 0 ? annualProfit - (capital * wacc / 100) : 0;
    return { roic, spread, evaDollar };
  }, [capital, annualProfit, wacc]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card p-5 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Company Metrics</h2>
        <div className="space-y-3">
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Invested Capital</label><input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} className="input" /></div>
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Annual Operating Profit</label><input type="number" value={annualProfit} onChange={e => setAnnualProfit(Number(e.target.value))} className="input" /></div>
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">WACC (%)</label><input type="number" min={0} max={50} step={0.5} value={wacc} onChange={e => setWacc(Number(e.target.value))} className="input" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="card p-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Results</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>ROIC</span><span className="font-bold">{fmtPct(eva.roic)}</span></div>
            <div className="flex justify-between"><span>WACC</span><span className="font-bold">{fmtPct(wacc)}</span></div>
            <div className="border-t border-surface-100 dark:border-surface-800 pt-2 mt-2"><div className="flex justify-between"><span>EVA Spread</span><span className={`font-bold ${eva.spread >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{eva.spread >= 0 ? '+' : ''}{fmtPct(eva.spread)}</span></div></div>
            <div className="flex justify-between"><span>Economic Value Added</span><span className={`font-bold ${eva.evaDollar >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCurrency(eva.evaDollar)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BondsTab() {
  const [faceValue, setFaceValue] = useState(1_000_000);
  const [couponRate, setCouponRate] = useState(7);
  const [marketYield, setMarketYield] = useState(9);
  const [years, setYears] = useState(5);
  const bondPrice = useMemo(() => {
    const coupon = faceValue * (couponRate / 100);
    const y = marketYield / 100;
    let pv = 0;
    for (let t = 1; t <= years; t++) pv += coupon / Math.pow(1 + y, t);
    pv += faceValue / Math.pow(1 + y, years);
    return pv;
  }, [faceValue, couponRate, marketYield, years]);
  const annualIncome = useMemo(() => faceValue * (couponRate / 100), [faceValue, couponRate]);
  const effectiveYield = bondPrice > 0 ? (annualIncome / bondPrice) * 100 : 0;
  const totalReturn = useMemo(() => {
    const coupons = annualIncome * years;
    return coupons + (faceValue - bondPrice);
  }, [annualIncome, years, faceValue, bondPrice]);
  const priceStatus = bondPrice > faceValue ? "premium" : bondPrice < faceValue ? "discount" : "par";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card p-5 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Bond Parameters</h2>
        <div className="space-y-3">
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Face Value</label><input type="number" value={faceValue} onChange={e => setFaceValue(Number(e.target.value))} className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Coupon Rate (%)</label><input type="number" min={0} max={30} step={0.1} value={couponRate} onChange={e => setCouponRate(Number(e.target.value))} className="input" /></div>
            <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Market Yield (%)</label><input type="number" min={0} max={30} step={0.1} value={marketYield} onChange={e => setMarketYield(Number(e.target.value))} className="input" /></div>
          </div>
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Years to Maturity</label><input type="number" min={1} max={30} value={years} onChange={e => setYears(Math.max(1, Math.min(30, Number(e.target.value))))} className="input" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="card p-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Pricing & Return</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Bond Price</span><span className={`font-bold ${priceStatus === "premium" ? 'text-amber-600' : priceStatus === "discount" ? 'text-emerald-600' : ''}`}>{fmtCurrency(bondPrice)} ({priceStatus})</span></div>
            <div className="flex justify-between"><span>Annual Coupon</span><span className="font-bold">{fmtCurrency(annualIncome)}</span></div>
            <div className="flex justify-between"><span>Effective Yield</span><span className="font-bold">{fmtPct(effectiveYield)}</span></div>
            <div className="border-t border-surface-100 dark:border-surface-800 pt-2 mt-2"><div className="flex justify-between"><span>{years}-Year Total Return</span><span className="font-bold text-brand-600">{fmtCurrency(totalReturn)}</span></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

