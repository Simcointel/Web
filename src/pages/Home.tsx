import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { MiniSparkline } from "../components/MiniSparkline";
import { motion } from "framer-motion";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useCallback, useMemo } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { RealmDashboard } from "../types/api";
import { Link } from "../router";
import {
  Activity, TrendingUp, Shield, AlertCircle,
  ChevronRight, Zap, Globe,
  BarChart3, Layers, LayoutGrid
} from "lucide-react";

export function HomePage() {
  const [realm, setRealm] = useSharedRealm();
  const { data: dashState, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: alerts } = useDataRepoPoll(() => dataRepo.fetchDashboardAlerts(realm), 60000, [realm]);
  const connected = useSseConnected();

  useSseEvent("alert_generated", useCallback(() => { refresh(); }, [refresh]));

  const loadingOrError = useMemo(() => {
    if (loading && !dashState) return <LoadingState text="Synthesizing..." />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    return null;
  }, [loading, dashState, error, refresh]);

  const ds: RealmDashboard | undefined = realm != null ? (dashState as any)?.[String(realm)] : undefined;

  if (loadingOrError) return loadingOrError;
  const scores = ds?.scores;
  const regime = ds?.regime;

  const sparkData = scores ? [scores.eh, scores.ms, scores.st, scores.ip, scores.sr] : [];
  const alertList = alerts ? (Array.isArray(alerts) ? alerts : (alerts as any).events ?? []).slice(0, 4) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
          <div>
             <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
                Simco<span className="text-brand-600">Intel</span>
             </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-100 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-surface-300'}`} />
                <span className="text-xs font-bold uppercase tracking-wide">{connected ? 'Node Connected' : 'Offline'}</span>
             </div>
             <select
               value={realm}
               onChange={(e) => setRealm(Number(e.target.value))}
               className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-1.5 text-sm font-bold uppercase"
             >
               <option value={0}>REALM 0</option>
               <option value={1}>REALM 1</option>
             </select>
          </div>
       </div>

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <ColorfulStat title="Economic Health" value={scores?.eh} icon={Activity} color="text-brand-600" border="border-brand-600" />
          <ColorfulStat title="Market Sentiment" value={scores?.ms} icon={TrendingUp} color="text-violet-600" border="border-violet-600" />
          <ColorfulStat title="System Stability" value={scores?.st} icon={Shield} color="text-emerald-600" border="border-emerald-600" />
          <ColorfulStat title="Risk Assessment" value={scores?.sr} icon={AlertCircle} color="text-rose-600" border="border-rose-600" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
             <div className="card h-full flex flex-col border-surface-200 dark:border-surface-800 !shadow-none">
                <div className="p-10 flex flex-col items-center justify-center flex-1 text-center bg-surface-50 dark:bg-surface-900/50 rounded-t-xl">
                   <span className="text-xs font-bold uppercase tracking-[0.2em] text-surface-500 mb-4">Current Economic Regime</span>
                   <h2 className={`text-5xl font-bold uppercase tracking-tight ${regime?.na === "Expansion" ? 'text-emerald-600' : regime?.na === "Recession" ? 'text-rose-600' : 'text-brand-600'}`}>
                      {regime?.na ?? "Neutral"}
                   </h2>
                </div>
                <Link to="/macro" className="p-4 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between hover:bg-surface-50 transition-all group rounded-b-xl">
                   <span className="text-sm font-bold text-surface-700 dark:text-surface-300">View Macro Analysis</span>
                   <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform text-brand-600" />
                </Link>
             </div>
          </div>

          <div className="lg:col-span-8">
             <div className="card h-full flex flex-col border-surface-200 dark:border-surface-800 !shadow-none">
                <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                   <h3 className="text-sm font-bold uppercase text-surface-500">Live Event Log</h3>
                   <Link to="/alerts" className="text-xs font-bold text-brand-600 hover:underline">Full History</Link>
                </div>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                   {alertList.length > 0 ? alertList.map((a: any) => (
                      <div key={a.id} className="px-6 py-4 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                         <div className="flex-1 min-w-0">
                            <p className="font-bold text-surface-900 dark:text-white truncate text-base">{a.ti}</p>
                            <p className="text-xs text-surface-400 mt-0.5">{new Date(a.ts).toLocaleString()}</p>
                         </div>
                         <div className="shrink-0"><SeverityBadge severity={a.se} /></div>
                      </div>
                   )) : (
                      <div className="py-20 text-center text-surface-300 font-bold text-sm">No recent events detected.</div>
                   )}
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <HomeTool to="/corporate-suite" title="CORP SUITE" icon={Zap} color="bg-brand-500" />
          <HomeTool to="/profit-margins" title="PROFIT MATRIX" icon={TrendingUp} color="bg-emerald-500" />
          <HomeTool to="/production-flow" title="FLOW VISUAL" icon={LayoutGrid} color="bg-violet-500" />
       </div>
    </div>
  );
}

function ColorfulStat({ title, value, icon: Icon, color, border }: any) {
   return (
      <div className={`card p-6 flex items-center justify-between border-l-4 ${border} !shadow-none`}>
         <div>
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500 block mb-1">{title}</span>
            <span className="text-3xl font-bold tabular-nums leading-none">{value ?? '--'}</span>
         </div>
         <div className={`${color}`}>
            <Icon size={28} />
         </div>
      </div>
   );
}

function HomeTool({ to, title, icon: Icon, color }: { to: string; title: string; icon: any; color: string }) {
   return (
      <Link to={to} className={`card p-6 group hover:border-brand-600 transition-all !shadow-none border-surface-200 dark:border-surface-800`}>
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
               <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-surface-800 dark:text-white">{title}</h3>
         </div>
      </Link>
   );
}
