import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useMemo, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { RealmDashboard, DashboardMap } from "../types/api";
import { Link } from "../router";
import type { ComponentType } from "react";
import {
  Activity, TrendingUp, Shield, AlertCircle,
  ChevronRight, Zap,
  BarChart3, LayoutGrid, Calculator, HardHat,
  Store, Building2, Zap as ZapIcon,
  Clock, Sparkles
} from "lucide-react";

import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { useDashboardState } from "../hooks/useDataQueries";
import { fmtNumber } from "../utils/formatters";

export function HomePage() {
  usePageTitleKey('home');

  const [realm, setRealm] = useSharedRealm();
  const { data: dashState, loading, error, refresh } = useDashboardState();

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

  const kpis = [
    { title: "Economic Health", value: scores?.eh, color: "text-brand-600" },
    { title: "Market Sentiment", value: scores?.ms, color: "text-violet-600" },
    { title: "System Stability", value: scores?.st, color: "text-emerald-600" },
    { title: "Risk Assessment", value: scores?.sr, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={<><span className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">Simco<span className="text-brand-600">Intel</span></span> <span className="text-xs text-surface-400 font-semibold mt-0.5">Economic Intelligence Dashboard</span></>}
        realm={realm}
        onRealmChange={setRealm}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wide">60s</span>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <MetricBox key={k.title} label={k.title} value={k.value ?? '--'} className={k.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <div className="card h-full flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950">
              <span className="stat-label mb-4">Current Regime</span>
              <h2 className={`text-5xl font-black uppercase tracking-tight ${
                regime?.na === "Expansion" ? 'text-emerald-600' :
                regime?.na === "Recession" ? 'text-rose-600' :
                'text-brand-600'
              }`}>
                {regime?.na ?? "Neutral"}
              </h2>
              {scores && (
                <div className="mt-6 w-full max-w-[180px] opacity-30">
                  <Sparkline data={sparkData} />
                </div>
              )}
              {regime?.sc !== undefined && (
                <span className="mt-3 text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                  Score: {regime.sc.toFixed(1)}
                </span>
              )}
            </div>
            <Link to="/macro" className="px-6 py-3.5 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-all group">
              <span className="text-xs font-bold text-surface-600 dark:text-surface-400">Full Macro Analysis</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-brand-600" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="card h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-surface-400" />
                <h3 className="text-xs font-bold uppercase text-surface-500 tracking-wider">Activity Feed</h3>
              </div>
              <Link to="/alerts" className="text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors">View all</Link>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                <Sparkles size={22} className="text-surface-300 dark:text-surface-600" />
              </div>
              <p className="text-sm font-bold text-surface-300 dark:text-surface-600">No recent activity</p>
              <p className="text-xs text-surface-400 mt-1 max-w-xs">Market events, regime changes, and system alerts will appear here</p>
              <div className="mt-5 flex gap-2">
                <Link to="/macro" className="btn btn-secondary">Macro View</Link>
                <Link to="/alerts" className="btn btn-secondary">Alert Logs</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid size={14} className="text-surface-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Quick Access</h3>
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
    <Link to={to} className="card p-4 flex items-center gap-3 hover:border-brand-500/50 hover:ring-1 hover:ring-brand-500/10 transition-all group">
      <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all`}>
        <Icon size={20} />
      </div>
      <span className="text-sm font-bold text-surface-800 dark:text-white">{title}</span>
    </Link>
  );
}