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

  if (loading && !dashState) return <LoadingState text="Synthesizing Market Intelligence..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const ds: RealmDashboard | undefined = realm != null ? (dashState as any)?.[String(realm)] : undefined;
  const scores = ds?.scores;
  const regime = ds?.regime;

  const sparkData = scores ? [scores.eh, scores.ms, scores.st, scores.ip, scores.sr] : [];
  const alertList = alerts ? (Array.isArray(alerts) ? alerts : (alerts as any).events ?? []).slice(0, 6) : [];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
       {/* 1. Dynamic Header */}
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-surface-200 dark:border-surface-800">
          <div>
             <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
                <Globe size={14} /> Global Command Node
             </div>
             <h1 className="text-4xl font-black text-surface-900 dark:text-white tracking-tight uppercase italic">
                Intelligence<span className="text-brand-600">.Matrix</span>
             </h1>
             <p className="text-surface-500 font-bold text-sm mt-1 uppercase tracking-tight">Real-time economic synthesis for Realm {realm}</p>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-surface-900 p-2 rounded-2xl shadow-soft border border-surface-200/50 dark:border-surface-800">
             <div className="flex flex-col items-end px-4 border-r border-surface-200 dark:border-surface-800">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${connected ? 'bg-econ-green animate-pulse' : 'bg-surface-300'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{connected ? 'Node Active' : 'Offline'}</span>
                </div>
                <span className="text-[9px] font-bold text-surface-400 uppercase tracking-tighter mt-0.5">Integrity: {connected ? '100%' : '0%'}</span>
             </div>
             <select
               value={realm}
               onChange={(e) => setRealm(Number(e.target.value))}
               className="bg-surface-50 dark:bg-surface-800 border-none rounded-xl text-xs font-black px-6 py-2 focus:ring-2 focus:ring-brand-500 uppercase tracking-widest"
             >
               <option value={0}>R0</option>
               <option value={1}>R1</option>
             </select>
          </div>
       </div>

       {/* 2. Top Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ColorfulStat title="Econ Health" value={scores?.eh} icon={Activity} color="from-brand-500 to-brand-700" />
          <ColorfulStat title="Sentiment" value={scores?.ms} icon={TrendingUp} color="from-econ-purple to-purple-700" />
          <ColorfulStat title="Stability" value={scores?.st} icon={Shield} color="from-econ-green to-emerald-700" />
          <ColorfulStat title="Volatility" value={scores?.sr} icon={AlertCircle} color="from-econ-red to-rose-700" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 3. Regime State Panel */}
          <div className="lg:col-span-4 space-y-6">
             <div className="card h-full overflow-hidden flex flex-col relative group">
                <div className={`absolute top-0 left-0 right-0 h-1.5 gradient-brand opacity-50 group-hover:opacity-10 transition-opacity`} />
                <div className="p-8 flex flex-col items-center justify-center flex-1 text-center">
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-surface-400 mb-6 italic">Current Regime</span>
                   <div className="relative mb-6">
                      <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                      <h2 className={`text-5xl font-black italic uppercase tracking-tighter relative ${regime?.na === "Expansion" ? 'text-econ-green' : regime?.na === "Recession" ? 'text-econ-red' : 'text-brand-600'}`}>
                         {regime?.na ?? "Neutral"}
                      </h2>
                   </div>
                   <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-surface-50 dark:bg-surface-800 rounded-full border border-surface-200 dark:border-surface-700">
                      <Zap size={14} className="text-brand-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-surface-700 dark:text-surface-300">Confidence: {regime?.sc}%</span>
                   </div>
                   <div className="mt-10 w-full h-16 opacity-30">
                      <MiniSparkline data={sparkData} color="currentColor" />
                   </div>
                </div>
                <Link to="/macro" className="p-4 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between group-hover:bg-brand-600 group-hover:text-white transition-all">
                   <span className="text-[10px] font-black uppercase tracking-widest">Macro Analysis</span>
                   <ChevronRight size={16} />
                </Link>
             </div>
          </div>

          {/* 4. Event Log */}
          <div className="lg:col-span-8">
             <div className="card h-full flex flex-col">
                <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600 dark:text-brand-400">
                         <BarChart3 size={18} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Real-time Stream</h3>
                   </div>
                   <Link to="/alerts" className="text-[10px] font-black text-brand-600 uppercase hover:underline">Full Log</Link>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-surface-100 dark:divide-surface-800 scrollbar-hide">
                   {alertList.length > 0 ? alertList.map((a: any) => (
                      <div key={a.id} className="p-5 flex items-center gap-6 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
                         <div className="w-10 h-10 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover:bg-brand-500 group-hover:text-white transition-all border border-surface-200 dark:border-surface-700">
                            <Layers size={16} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                               <span className="text-[9px] font-black uppercase tracking-widest text-surface-400">{a.ca}</span>
                               <span className="w-1 h-1 rounded-full bg-surface-300" />
                               <span className="text-[9px] font-bold text-surface-400">{new Date(a.ts).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm font-bold text-surface-900 dark:text-white truncate uppercase tracking-tight italic">{a.ti}</p>
                         </div>
                         <div className="shrink-0"><SeverityBadge severity={a.se} /></div>
                      </div>
                   )) : (
                      <div className="py-20 text-center opacity-20 uppercase font-black tracking-widest text-xs italic">Idle State Node</div>
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* 5. Tool Access */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HomeTool to="/corporate-suite" title="Executive Suite" sub="Simulate operational strategy and skill impact." icon={Zap} color="bg-brand-500" />
          <HomeTool to="/profit-margins" title="Profit Matrix" sub="Interactive price and margin analysis database." icon={TrendingUp} color="bg-econ-green" />
          <HomeTool to="/production-flow" title="Supply Chains" sub="Recursive visualization of production tiers." icon={LayoutGrid} color="bg-econ-purple" />
       </div>
    </div>
  );
}

function ColorfulStat({ title, value, icon: Icon, color }: any) {
   return (
      <div className="card p-6 flex items-center justify-between group overflow-hidden relative border-none">
         <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <Icon size={120} />
         </div>
         <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2 block">{title}</span>
            <span className="text-3xl font-black italic tracking-tighter tabular-nums">{value ?? '--'}</span>
         </div>
         <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
            <Icon size={24} />
         </div>
      </div>
   );
}

function HomeTool({ to, title, sub, icon: Icon, color }: { to: string; title: string; sub: string; icon: any; color: string }) {
   return (
      <Link to={to} className={`card p-8 group hover:shadow-2xl transition-all border-l-4 border-l-transparent hover:border-l-brand-500`}>
         <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[2rem] ${color} text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
               <Icon size={32} />
            </div>
            <div className="flex-1">
               <h3 className="text-lg font-black uppercase italic tracking-tighter dark:text-white">{title}</h3>
               <p className="text-xs font-semibold text-surface-500 mt-1 leading-relaxed">{sub}</p>
            </div>
         </div>
      </Link>
   );
}
