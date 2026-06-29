import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useCorporateState } from '../features/corporate/hooks/useCorporateState';
import { useSharedRealm } from '../hooks/useSharedRealm';
import { useDataRepoPoll } from '../hooks/useDataRepo';
import * as dataRepo from '../services/dataRepo';
import { LoadingState } from '../components/States';
import {
  Briefcase, LayoutDashboard, HardHat, Users,
  DollarSign, Ship, Target, BarChart3, TrendingDown,
  Upload, Download, Moon, Sun, CheckCircle2, AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Link } from '../router';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { cn } from '../utils/cn';

// Feature Views
import { CommandView } from '../features/corporate/components/CommandView';
import { OperationsView } from '../features/corporate/components/OperationsView';
import { ExecutiveView } from '../features/corporate/components/ExecutiveView';
import { FinanceView } from '../features/corporate/components/FinanceView';
import { LogisticsView } from '../features/corporate/components/LogisticsView';
import { RetailView } from '../features/corporate/components/RetailView';
import { RiskView } from '../features/corporate/components/RiskView';
import { LedgerView } from '../features/corporate/components/LedgerView';

export function CorporateSuitePage() {
  const { state, setState, core } = useCorporateState();
  const [realm] = useSharedRealm();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const { data: dash } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: margins, loading: mLoading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 60000, [realm]);
  const { data: retail } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (mLoading && !margins) return <LoadingState text="Syncing Enterprise Data..." />;

  const economyPhase = (dash as any)?.[String(realm)]?.regime?.na || 'Normal';

  const inventoryValue = useMemo(() => {
    if (!margins?.resources) return 0;
    return state.inventory.reduce((sum, item) => {
      const price = (margins.resources as any[])?.find(m => m.id === item.id)?.outputVwap || 0;
      return sum + (price * item.qty);
    }, 0);
  }, [state.inventory, margins]);

  const totalValuation = core.totalValuation + inventoryValue;

  const tabs = [
    { id: 'command', label: 'CMD', icon: LayoutDashboard, color: 'text-sky-600' },
    { id: 'ops', label: 'OPS', icon: HardHat, color: 'text-emerald-600' },
    { id: 'exec', label: 'EXEC', icon: Users, color: 'text-amber-600' },
    { id: 'finance', label: 'FIN', icon: DollarSign, color: 'text-violet-600' },
    { id: 'logistics', label: 'LOG', icon: Ship, color: 'text-indigo-600' },
    { id: 'retail', label: 'RET', icon: Target, color: 'text-rose-600' },
    { id: 'ledger', label: 'BOOK', icon: BarChart3, color: 'text-teal-600' },
    { id: 'risk', label: 'RSK', icon: TrendingDown, color: 'text-slate-600' },
  ];

  const currentTab = tabs.find(t => t.id === state.activeTab) || tabs[0];

  const renderTab = () => {
     switch(state.activeTab) {
        case 'command': return <CommandView core={core} phase={economyPhase} margins={margins} inventoryValue={inventoryValue} />;
        case 'ops': return <OperationsView state={state} setState={setState} core={core} />;
        case 'exec': return <ExecutiveView state={state} setState={setState} core={core} />;
        case 'finance': return <FinanceView state={state} setState={setState} core={core} />;
        case 'logistics': return <LogisticsView state={state} setState={setState} core={core} />;
        case 'retail': return <RetailView state={state} setState={setState} retail={retail} />;
        case 'risk': return <RiskView phase={economyPhase} retail={retail} />;
        case 'ledger': return <LedgerView state={state} />;
        default: return (
           <Card className="min-h-[50vh] border-dashed border-2 opacity-50 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                 <currentTab.icon size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold">Module Under Reconstruction</h3>
              <p className="text-slate-500 max-w-md mx-auto mt-2">
                 We are currently rebuilding the {(state.activeTab as string).toUpperCase()} module with the new professional design language for long-term sustainability.
              </p>
           </Card>
        );
     }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
         const rows = content.split('\n').map(r => r.split(',').map(c => c.replace(/"/g, '').trim()));
         if (rows[0].includes('Date') && rows[0].includes('Amount')) {
            const amountIdx = rows[0].indexOf('Amount');
            let total = 0;
            rows.slice(1).forEach(row => { if (row[amountIdx]) total += parseFloat(row[amountIdx]) || 0; });
            setState({ ...state, settings: { ...state.settings, estDailyProfit: total / 7 } });
            setNotification({ msg: `Parsed $${(total/1_000_000).toFixed(2)}M in Receipts`, type: "success" });
         }
         return;
      }
      try {
        const parsed = JSON.parse(content);
        setState({ ...state, ...parsed });
        setNotification({ msg: "System Sync Complete", type: "success" });
      } catch (err) {
        setNotification({ msg: "Sync Failed", type: "error" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="secondary" size="sm" className="rounded-full w-9 h-9 p-0">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-900/20">
                <Briefcase size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase tracking-tight">Workstation.<span className="text-sky-600">Enterprise</span></h1>
                <div className="flex items-center gap-2">
                   <Badge variant="success" dot className="text-[9px]">SYSTEMS_ONLINE</Badge>
                   <Badge variant="neutral" className="text-[9px]">REALM_{realm}</Badge>
                </div>
             </div>
          </div>
        </div>

        <nav className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setState({ ...state, activeTab: tab.id as any })}
               className={cn(
                 'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                 state.activeTab === tab.id
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
               )}
             >
               <tab.icon size={16} className={cn(state.activeTab === tab.id ? tab.color : 'text-slate-400')} />
               {tab.label}
             </button>
           ))}
        </nav>
      </div>

      <main>
          {renderTab()}
      </main>

      {/* Persistent Global Metrics Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50">
         <div className="glass-ui p-3 rounded-2xl shadow-2xl flex items-center justify-between border-t border-white/20">
            <div className="flex items-center gap-8 px-6 border-r border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
               <Metric label="VALUATION" value={`$${(totalValuation/1_000_000).toFixed(2)}M`} />
               <Metric label="DAILY_YIELD" value={`$${(core.netDaily/1000).toFixed(1)}K`} />
               <Metric label="EFFICIENCY" value={`${((1 - core.actualAO)*100).toFixed(1)}%`} />
            </div>
            <div className="flex items-center gap-3 px-4 shrink-0">
               <Button variant="ghost" size="sm" onClick={toggleTheme} className="rounded-full w-10 h-10 p-0">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
               </Button>
               <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
               <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="hidden sm:inline-flex">
                  <Upload size={14} className="mr-2" /> Sync
               </Button>
               <Button variant="primary" size="sm" onClick={() => {
                  const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `simcointel_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
               }}>
                  <Download size={14} className="mr-2" /> Backup
               </Button>
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json,.csv" />
            </div>
         </div>
      </div>

      {notification && (
        <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right">
           <Badge variant={notification.type === 'success' ? 'success' : 'error'} className="py-2 px-4 shadow-xl border-2">
              {notification.type === 'success' ? <CheckCircle2 size={16} className="mr-2" /> : <AlertTriangle size={16} className="mr-2" />}
              {notification.msg}
           </Badge>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string, value: string }) {
   return (
      <div className="flex flex-col shrink-0">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</span>
         <span className="text-xl font-black tracking-tighter tabular-nums leading-none">{value}</span>
      </div>
   );
}
