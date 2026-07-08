import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { MiniSparkline } from "../components/MiniSparkline";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useMemo, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { RealmDashboard, DashboardMap, EventsResponse, NormalizedEvent } from "../types/api";
import { Link } from "../router";
import type { ComponentType } from "react";
import {
  Activity, TrendingUp, Shield, AlertCircle,
  ChevronRight, Zap, Globe,
  BarChart3, LayoutGrid, Calculator, HardHat,
  Store, Building2, Zap as ZapIcon
} from "lucide-react";

export function HomePage() {
  useEffect(() => { document.title = "SimcoIntel - Economic Intelligence"; }, []);

  const [realm, setRealm] = useSharedRealm();
  const { data: dashState, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: alerts } = useDataRepoPoll(() => dataRepo.fetchDashboardAlerts(realm), 60000, [realm]);
  const loadingOrError = useMemo(() => {
    if (loading && !dashState) return <LoadingState text="Synthesizing..." />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    return null;
  }, [loading, dashState, error, refresh]);

  const dashMap = dashState as DashboardMap | undefined;
  const ds: RealmDashboard | undefined = realm != null ? dashMap?.[String(realm)] : undefined;

  if (loadingOrError) return loadingOrError;
  const scores = ds?.scores;
  const regime = ds?.regime;

  const sparkData = scores ? [scores.eh, scores.ms, scores.st, scores.ip, scores.sr] : [];
  const alertList: NormalizedEvent[] = alerts
    ? (alerts as EventsResponse).events?.slice(0, 4) ?? []
    : [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Simco<span className="text-brand-600">Intel</span>
          </h1>
          <p className="text-xs text-surface-400 font-semibold mt-0.5">Economic Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wide">60s</span>
          </div>
          <select value={realm} onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none focus:ring-1 focus:ring-brand-500/20">
            <option value={0}>REALM 0</option>
            <option value={1}>REALM 1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Economic Health" value={scores?.eh} icon={Activity} color="text-brand-600" bg="bg-brand-50 dark:bg-brand-900/10" />
        <KPI title="Market Sentiment" value={scores?.ms} icon={TrendingUp} color="text-violet-600" bg="bg-violet-50 dark:bg-violet-900/10" />
        <KPI title="System Stability" value={scores?.st} icon={Shield} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/10" />
        <KPI title="Risk Assessment" value={scores?.sr} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50 dark:bg-rose-900/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <div className="card h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-4">Current Regime</span>
              <h2 className={`text-5xl font-black uppercase tracking-tight ${
                regime?.na === "Expansion" ? 'text-emerald-600' :
                regime?.na === "Recession" ? 'text-rose-600' :
                'text-brand-600'
              }`}>
                {regime?.na ?? "Neutral"}
              </h2>
              {scores && <Sparkline data={sparkData} className="mt-6 opacity-30" />}
            </div>
            <Link to="/macro" className="px-6 py-3.5 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group">
              <span className="text-xs font-bold text-surface-600 dark:text-surface-400">Macro Analysis</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-brand-600" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="card h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-surface-500 tracking-wider">Recent Events</h3>
              <Link to="/alerts" className="text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors">View all</Link>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {alertList.length > 0 ? alertList.map((a) => (
                <div key={a.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-surface-900 dark:text-white truncate text-sm">{a.ti}</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">{new Date(a.ts).toLocaleString()}</p>
                  </div>
                  <SeverityBadge severity={a.se} />
                </div>
              )) : (
                <div className="py-16 text-center text-surface-300 dark:text-surface-600 font-bold text-sm">No recent events</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <NavTile to="/corporate-suite" title="Corporate Suite" icon={Zap} color="bg-brand-500" />
        <NavTile to="/market-intel" title="Market Intel" icon={BarChart3} color="bg-indigo-500" />
        <NavTile to="/board-room" title="Board Room" icon={Building2} color="bg-amber-500" />
        <NavTile to="/profit-margins" title="Profit Margins" icon={TrendingUp} color="bg-emerald-500" />
        <NavTile to="/profit-calculator" title="Profit Calc" icon={Calculator} color="bg-cyan-500" />
        <NavTile to="/retail-calculator" title="Retail Calc" icon={Store} color="bg-rose-500" />
        <NavTile to="/construction-calculator" title="Construction" icon={HardHat} color="bg-orange-500" />
        <NavTile to="/xp-calculator" title="XP Calculator" icon={ZapIcon} color="bg-yellow-500" />
      </div>
    </div>
  );
}

function KPI({ title, value, icon: Icon, color, bg }: { title: string; value: number | undefined; icon: ComponentType<{ size: number }>; color: string; bg: string }) {
   return (
     <div className={`kpi-card card flex items-center gap-4 ${bg}`}>
       <div className="flex-1 min-w-0">
         <span className="metric-label block mb-1">{title}</span>
         <span className="metric-value">{value ?? '--'}</span>
       </div>
       <div className={`${color} shrink-0`}>
         <Icon size={24} />
       </div>
     </div>
   );
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full h-6 ${className || ''}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function NavTile({ to, title, icon: Icon, color }: { to: string; title: string; icon: ComponentType<{ size: number }>; color: string }) {
   return (
     <Link to={to} className="card p-4 flex items-center gap-3 hover:border-brand-500/50 transition-all group">
       <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon size={20} />
       </div>
       <span className="text-sm font-bold text-surface-800 dark:text-white">{title}</span>
     </Link>
   );
}
