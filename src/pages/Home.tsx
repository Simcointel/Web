import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { MiniSparkline } from "../components/MiniSparkline";
import { motion } from "framer-motion";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useCallback } from "react";
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

  if (loading && !dashState) return <LoadingState text="Synthesizing..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const ds: RealmDashboard | undefined = realm != null ? (dashState as any)?.[String(realm)] : undefined;
  const scores = ds?.scores;
  const regime = ds?.regime;

  const sparkData = scores ? [scores.eh, scores.ms, scores.st, scores.ip, scores.sr] : [];
  const alertList = alerts ? (Array.isArray(alerts) ? alerts : (alerts as any).events ?? []).slice(0, 4) : [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div>
             <h1 className="text-2xl font-black text-surface-900 dark:text-white tracking-tight uppercase italic">
                Simco<span className="text-brand-500">.Matrix</span>
             </h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-surface-50 dark:bg-surface-900 rounded border border-surface-100 dark:border-surface-800">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-surface-300'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">{connected ? 'ACTIVE' : 'OFFLINE'}</span>
             </div>
             <select
               value={realm}
               onChange={(e) => setRealm(Number(e.target.value))}
               className="bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded px-2 py-1 text-[10px] font-black uppercase tracking-widest"
             >
               <option value={0}>REALM 0</option>
               <option value={1}>REALM 1</option>
             </select>
          </div>
       </div>

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ColorfulStat title="HEALTH" value={scores?.eh} icon={Activity} color="bg-brand-500" />
          <ColorfulStat title="SENTIMENT" value={scores?.ms} icon={TrendingUp} color="bg-violet-500" />
          <ColorfulStat title="STABILITY" value={scores?.st} icon={Shield} color="bg-emerald-500" />
          <ColorfulStat title="RISK" value={scores?.sr} icon={AlertCircle} color="bg-rose-500" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
             <div className="card h-full flex flex-col relative overflow-hidden card-vibrant">
                <div className="p-4 flex flex-col items-center justify-center flex-1 text-center">
                   <span className="text-[9px] font-black uppercase tracking-widest text-surface-400 mb-2">REGIME</span>
                   <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${regime?.na === "Expansion" ? 'text-emerald-500' : regime?.na === "Recession" ? 'text-rose-500' : 'text-brand-500'}`}>
                      {regime?.na ?? "Neutral"}
                   </h2>
                   <div className="mt-4 w-full h-8 opacity-20 text-brand-500">
                      <MiniSparkline data={sparkData} color="currentColor" />
                   </div>
                </div>
                <Link to="/macro" className="p-2 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between hover:bg-brand-500 hover:text-white transition-all group">
                   <span className="text-[8px] font-black uppercase tracking-widest">DETAILS</span>
                   <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
             </div>
          </div>

          <div className="lg:col-span-8 text-xs">
             <div className="card h-full flex flex-col border-t-2 border-t-violet-500 shadow-[0_4px_20px_-2px_rgba(139,92,246,0.1)]">
                <div className="px-3 py-1.5 border-b border-surface-50 dark:border-surface-800/50 flex items-center justify-between">
                   <h3 className="text-[9px] font-black uppercase tracking-widest text-surface-400">EVENT_STREAM</h3>
                   <Link to="/alerts" className="text-[8px] font-black text-violet-500 uppercase">VIEW ALL</Link>
                </div>
                <div className="divide-y divide-surface-50 dark:divide-surface-800">
                   {alertList.length > 0 ? alertList.map((a: any) => (
                      <div key={a.id} className="px-3 py-2 flex items-center gap-3 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors group">
                         <div className="w-1 h-1 rounded-full bg-violet-500/30 group-hover:bg-violet-500 group-hover:scale-125 transition-all" />
                         <div className="flex-1 min-w-0">
                            <p className="font-bold text-surface-900 dark:text-white truncate uppercase tracking-tight italic">{a.ti}</p>
                         </div>
                         <div className="text-[8px] font-black text-surface-400 uppercase">{new Date(a.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         <div className="shrink-0 scale-75 origin-right"><SeverityBadge severity={a.se} /></div>
                      </div>
                   )) : (
                      <div className="py-10 text-center opacity-10 uppercase font-black text-[9px]">IDLE</div>
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

function ColorfulStat({ title, value, icon: Icon, color }: any) {
   return (
      <div className="card p-3 flex items-center justify-between group overflow-hidden relative">
         <div>
            <span className="text-[8px] font-black uppercase tracking-widest text-surface-400 block">{title}</span>
            <span className="text-xl font-black italic tracking-tighter tabular-nums leading-none">{value ?? '--'}</span>
         </div>
         <div className={`w-8 h-8 rounded flex items-center justify-center ${color} text-white shadow-lg`}>
            <Icon size={16} />
         </div>
      </div>
   );
}

function HomeTool({ to, title, icon: Icon, color }: { to: string; title: string; icon: any; color: string }) {
   return (
      <Link to={to} className={`card p-3 group hover:border-brand-500 transition-all`}>
         <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
               <Icon size={16} />
            </div>
            <h3 className="text-xs font-black uppercase italic tracking-widest dark:text-white">{title}</h3>
         </div>
      </Link>
   );
}
