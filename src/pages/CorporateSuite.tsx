import React, { useState, useEffect, useRef } from "react";

import { DollarSign, ArrowLeft, TrendingDown, Ship, Target, LayoutDashboard, HardHat, Upload, Download, CheckCircle2, Users, BarChart3, Briefcase, AlertTriangle, Sun, Moon, Key, Store } from "lucide-react";

import { useTheme } from "@hooks/useTheme";
import { useSharedRealm } from "@hooks/useSharedRealm";
import { BUILDINGS } from "@data/simco_static";
import { LoadingState } from "@components/States";
import { Link } from "@router";
import * as dataRepo from "@services/dataRepo";
import type { DashboardMap, ProfitMarginsResponse, RetailData } from "../types/api";
import { requestExtensionData, isExtensionAvailable, getPairingCode } from "@services/extensionBridge";
import { fmtPct, fmtCurrency } from "@utils/formatters";

import { PageHeader } from "@components/ui/Common";
import { usePageTitleKey } from "@hooks/usePageTitle";
import { useDashboardState, useProfitMargins, useRetailData } from "@hooks/useDataQueries";

import { CorporateSuiteProvider, useCorporateSuite } from "./corporate-suite/CorporateSuiteContext";
import { CommandView } from "./corporate-suite/CommandView";
import { OperationsView } from "./corporate-suite/OperationsView";
import { ExecutiveView } from "./corporate-suite/ExecutiveView";
import { FinanceView } from "./corporate-suite/FinanceView";
import { LogisticsView } from "./corporate-suite/LogisticsView";
import { RetailView } from "./corporate-suite/RetailView";
import { RiskView } from "./corporate-suite/RiskView";
import { RankingsView } from "./corporate-suite/RankingsView";
import { BondsView } from "./corporate-suite/BondsView";
import type { SuiteViewProps, SuiteStateV6 } from "./corporate-suite/types";

const TABS: Array<{ id: string; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'command', label: 'Command', icon: LayoutDashboard },
  { id: 'ops', label: 'Operations', icon: HardHat },
  { id: 'exec', label: 'Executive', icon: Briefcase },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'logistics', label: 'Logistics', icon: Ship },
  { id: 'retail', label: 'Retail', icon: Store },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
  { id: 'rankings', label: 'Rankings', icon: BarChart3 },
  { id: 'bonds', label: 'Bonds', icon: DollarSign },
];

function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-surface-200 dark:border-surface-800" aria-label="Corporate Suite views">
      {TABS.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`px-3 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg ${
            activeTab === tab.id
              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
          }`}
        >
          <tab.icon size={12} /> {tab.label}
        </button>
      ))}
    </div>
  );
}

function CorporateSuiteInner() {
  usePageTitleKey('corporateSuite');

  const { theme, toggleTheme } = useTheme();
  const [realm] = useSharedRealm();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debugData, setDebugData] = useState<Record<string, unknown> | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showPairingCode, setShowPairingCode] = useState(false);
  const [pairingCode, setPairingCode] = useState('');

  const { data: dash } = useDashboardState();
  const { data: margins, loading: mLoading } = useProfitMargins(60000);
  const { data: retail } = useRetailData();

  const { state, setState, core, isSyncing, notification, setNotification, onSync, onImportFromExtension, onShowPairingCode } = useCorporateSuite();

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        setState(prev => ({ ...prev, ...parsed, board: { ...prev.board, ...(parsed.board || {}) }, settings: { ...prev.settings, ...(parsed.settings || {}) }, ledger: parsed.ledger || [] }));
        setNotification({ msg: "State imported successfully", type: 'success' });
      } catch {
        setNotification({ msg: "Invalid JSON file", type: 'error' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simco-suite-${state.companyId || 'state'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFromExtension = async () => {
    // isSyncing is from context, we can't set it directly
    setNotification({ msg: "Requesting data from extension...", type: 'success' });
    try {
      const available = await isExtensionAvailable();
      if (!available) throw new Error("Extension not responding");
      const data = await requestExtensionData();
      if (!data) throw new Error("No data received");
      setState(prev => ({
        ...prev,
        companyId: data.companyId ?? prev.companyId,
        companyName: data.companyName ?? prev.companyName,
        companyLogo: (data.companyLogo && typeof data.companyLogo === 'string') ? data.companyLogo : prev.companyLogo,
        companyLevel: data.companyLevel ?? prev.companyLevel,
        companyRank: data.companyRank ?? prev.companyRank,
        companyValue: data.companyValue ?? prev.companyValue,
        apiAO: data.apiAO ?? prev.apiAO,
        workers: data.workers ?? prev.workers,
        governmentTier: (typeof data.governmentTier === 'number') ? data.governmentTier : prev.governmentTier,
        extraSlots: (typeof data.extraSlots === 'number') ? data.extraSlots : prev.extraSlots,
        onlineStatus: (data.onlineStatus && typeof data.onlineStatus === 'string') ? data.onlineStatus : prev.onlineStatus,
        lastSynced: new Date().toISOString(),
      }));
      setNotification({ msg: "Extension data imported!", type: 'success' });
    } catch (err) {
      setNotification({ msg: err instanceof Error ? err.message : "Sync failed", type: 'error' });
    }
  };

  const handleShowPairingCode = () => {
    setPairingCode(getPairingCode());
    setShowPairingCode(true);
  };

  const viewComponents: Record<string, React.ComponentType<SuiteViewProps>> = {
    command: CommandView,
    ops: OperationsView,
    exec: ExecutiveView,
    finance: FinanceView,
    logistics: LogisticsView,
    retail: RetailView,
    risk: RiskView,
    rankings: RankingsView,
    bonds: BondsView,
  };

  const ActiveView = viewComponents[state.activeTab] || CommandView;

  const handleTabChange = (id: string) => {
    setState(prev => ({ ...prev, activeTab: id as SuiteStateV6['activeTab'] }));
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Corporate Suite"
        subtitle="Company management dashboard"
        icon={<LayoutDashboard size={18} />}
        iconBg="bg-violet-100 dark:bg-violet-900/30"
        iconColor="text-violet-600"
        realm={realm}
        onRealmChange={() => {}}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-surface-400">Lv</span>
          <span className="font-bold text-violet-600">{state.companyLevel || "—"}</span>
          <span className="text-[10px] font-bold uppercase text-surface-400 ml-2">Rank</span>
          <span className="font-bold text-violet-600">#{state.companyRank || "—"}</span>
        </div>
      </PageHeader>

      <TabBar activeTab={state.activeTab} onTabChange={handleTabChange} />

      <div className="flex gap-2 mb-4">
        <button onClick={handleExport} className="px-3 py-1.5 text-xs font-bold uppercase bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">Export State</button>
        <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileImport} className="hidden" id="file-import" />
        <label htmlFor="file-import" className="px-3 py-1.5 text-xs font-bold uppercase bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer">Import State</label>
        <button onClick={handleImportFromExtension} disabled={isSyncing} className="px-3 py-1.5 text-xs font-bold uppercase bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50">{isSyncing ? "Syncing..." : "Sync Extension"}</button>
        <button onClick={handleShowPairingCode} className="px-3 py-1.5 text-xs font-bold uppercase bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">Pairing Code</button>
        <button onClick={toggleTheme} className="px-3 py-1.5 text-xs font-bold uppercase bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}</button>
        <button onClick={() => { setDebugData({ state, core, margins: margins?.resources?.length, retail: retail?.retail?.size }); setShowDebug(true); }} className="px-3 py-1.5 text-xs font-bold uppercase bg-surface-100 dark:bg-surface-800 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">Debug</button>
      </div>

      {notification && (
        <div className={`px-4 py-3 rounded-xl text-sm font-bold ${notification.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700'} animate-slide-down`}>
          {notification.msg}
        </div>
      )}

      <div role="tabpanel" id={`panel-${state.activeTab}`} aria-labelledby={`tab-${state.activeTab}`}>
        <ActiveView
          state={state}
          setState={setState}
          core={core}
          margins={margins}
          retail={retail}
          phase={(dash as DashboardMap | undefined)?.[String(realm)]?.regime?.na || 'Normal'}
          onSync={onSync}
          isSyncing={isSyncing}
          setNotification={setNotification}
          onImportFromExtension={handleImportFromExtension}
          onShowPairingCode={handleShowPairingCode}
        />
      </div>

      {showPairingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPairingCode(false)}>
          <div className="bg-white dark:bg-surface-950 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Extension Pairing Code</h3>
            <div className="font-mono text-xl font-bold text-center bg-surface-100 dark:bg-surface-800 rounded-lg p-4 mb-4">{pairingCode}</div>
            <button onClick={() => setShowPairingCode(false)} className="w-full py-2 bg-brand-600 text-white rounded-lg font-bold">Close</button>
          </div>
        </div>
      )}

      {showDebug && debugData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDebug(false)}>
          <div className="bg-white dark:bg-surface-950 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Debug Data</h3><button onClick={() => setShowDebug(false)}>×</button></div>
            <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(debugData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function CorporateSuitePage() {
  const [realm] = useSharedRealm();
  const { data: dash } = useDashboardState();
  const { data: margins } = useProfitMargins(60000);
  const { data: retail } = useRetailData();

  return (
    <CorporateSuiteProvider margins={margins} retail={retail} dash={dash} realm={realm}>
      <CorporateSuiteInner />
    </CorporateSuiteProvider>
  );
}