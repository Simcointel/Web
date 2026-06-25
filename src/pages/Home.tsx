import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { MiniSparkline } from "../components/MiniSparkline";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useState, useCallback } from "react";
import type { RealmDashboard } from "../types/api";
import { Link } from "../router";
import { Briefcase, Factory, ShoppingCart, Construction, Users, Activity, TrendingUp, Shield, AlertCircle } from "lucide-react";

export function HomePage() {
  const [realm, setRealm] = useState(0);
  const { data: dashState, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: alerts } = useDataRepoPoll(() => dataRepo.fetchDashboardAlerts(realm), 60000, [realm]);
  const connected = useSseConnected();

  useSseEvent("alert_generated", useCallback(() => { refresh(); }, [refresh]));

  if (loading && !dashState) return <LoadingState text="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const ds: RealmDashboard | undefined = realm != null ? (dashState as any)?.[String(realm)] : undefined;
  const scores = ds?.scores;
  const regime = ds?.regime;

  const sparkData = scores ? [scores.eh, scores.ms, scores.st, scores.ip, scores.sr] : [];

  const alertList = alerts
    ? (Array.isArray(alerts) ? alerts : (alerts as any).events ?? []).slice(0, 5)
    : [];

  const topAlert = alertList[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-6">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white text-[10px]">SI</div>
            SimcoIntel Terminal
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-0.5 text-xs font-medium">
            Professional suite for economic analysis and corporate operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${connected ? "text-econ-green border-econ-green/20 bg-econ-green/5" : "text-surface-400 border-surface-200"}`}>
            {connected ? "ACTIVE" : "OFFLINE"}
          </div>
          <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-0.5 rounded-lg border">
            <select
              value={realm}
              onChange={(e) => setRealm(Number(e.target.value))}
              className="bg-transparent border-none text-[10px] font-bold px-2 py-0.5 focus:ring-0 dark:text-white uppercase"
            >
              <option value={0}>Realm 0</option>
              <option value={1}>Realm 1</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Link to="/corporate-suite" className="group">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-lg hover:border-brand-500 transition-all cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-md text-brand-600">
                <Briefcase size={14} />
              </div>
              <span className="text-[10px] font-bold text-surface-900 dark:text-white uppercase tracking-wider">Financials</span>
            </div>
            <p className="text-[9px] text-surface-500 dark:text-surface-400 leading-tight">Statement analysis & cashflow tracking</p>
          </div>
        </Link>
        <Link to="/corporate-suite" className="group">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-lg hover:border-brand-500 transition-all cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-econ-green/10 rounded-md text-econ-green">
                <Factory size={14} />
              </div>
              <span className="text-[10px] font-bold text-surface-900 dark:text-white uppercase tracking-wider">Production</span>
            </div>
            <p className="text-[9px] text-surface-500 dark:text-surface-400 leading-tight">Sourcing costs & pipeline optimization</p>
          </div>
        </Link>
        <Link to="/corporate-suite" className="group">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-lg hover:border-brand-500 transition-all cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-econ-purple/10 rounded-md text-econ-purple">
                <ShoppingCart size={14} />
              </div>
              <span className="text-[10px] font-bold text-surface-900 dark:text-white uppercase tracking-wider">Retail</span>
            </div>
            <p className="text-[9px] text-surface-500 dark:text-surface-400 leading-tight">Sales velocity & revenue projection</p>
          </div>
        </Link>
        <Link to="/corporate-suite" className="group">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-lg hover:border-brand-500 transition-all cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-econ-amber/10 rounded-md text-econ-amber">
                <Construction size={14} />
              </div>
              <span className="text-[10px] font-bold text-surface-900 dark:text-white uppercase tracking-wider">Construction</span>
            </div>
            <p className="text-[9px] text-surface-500 dark:text-surface-400 leading-tight">Building costs & expansion ROI</p>
          </div>
        </Link>
        <Link to="/corporate-suite" className="group">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-lg hover:border-brand-500 transition-all cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-econ-red/10 rounded-md text-econ-red">
                <Users size={14} />
              </div>
              <span className="text-[10px] font-bold text-surface-900 dark:text-white uppercase tracking-wider">Executives</span>
            </div>
            <p className="text-[9px] text-surface-500 dark:text-surface-400 leading-tight">Board skill impact & threshold calcs</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Market Indicators">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Health" value={scores?.eh ?? "-"} color="border-l-brand-500" icon={<Activity size={12} />} />
              <StatCard title="Sentiment" value={scores?.ms ?? "-"} color="border-l-econ-purple" icon={<TrendingUp size={12} />} />
              <StatCard title="Stability" value={scores?.st ?? "-"} color="border-l-econ-green" icon={<Shield size={12} />} />
              <StatCard title="Volatility" value={scores?.sr ?? "-"} color="border-l-econ-red" icon={<AlertCircle size={12} />} />
            </div>
          </Section>

          <div className="card overflow-hidden">
             <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                <h3 className="text-xs font-bold text-surface-900 dark:text-white uppercase tracking-wider">System Logs</h3>
                <Link to="/alerts" className="text-[9px] font-bold text-brand-600 uppercase hover:underline">View All</Link>
             </div>
             <div className="divide-y divide-surface-100 dark:divide-surface-800">
               {alertList.length > 0 ? alertList.map((a) => (
                  <div key={a.id} className="flex items-start gap-4 px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="mt-0.5"><SeverityBadge severity={a.se} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">{a.ca}</span>
                        <span className="text-[9px] text-surface-400 font-mono">{new Date(a.ts).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate">{a.ti}</p>
                    </div>
                  </div>
                )) : (
                  <div className="px-5 py-12 text-center text-surface-400 text-xs uppercase font-bold tracking-widest opacity-30">No activity detected</div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col items-center text-center border-t-2 border-t-brand-600">
            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest mb-4">Regime Status</span>
            <div className={`text-3xl font-black mb-1 tracking-tighter ${regime?.na === "Expansion" ? "text-econ-green" : regime?.na === "Recession" ? "text-econ-red" : regime?.na === "Recovery" ? "text-brand-600" : "text-econ-amber"}`}>
              {regime?.na?.toUpperCase() ?? "NEUTRAL"}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-[10px] font-bold text-surface-600 dark:text-surface-300 mb-6 font-mono">
              CONF: {regime?.sc ?? "0"}%
            </div>
            <div className="w-full h-12 opacity-50">
              <MiniSparkline data={sparkData} color={regime?.na === "Expansion" ? "#10b981" : "#3b82f6"} />
            </div>
          </div>

          {topAlert && (
            <div className="card overflow-hidden border-l-2 border-l-econ-red bg-econ-red/[0.01]">
              <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-800">
                <h3 className="font-bold text-econ-red text-[10px] uppercase tracking-wider">Critical Alert</h3>
              </div>
              <div className="p-5">
                <p className="text-xs font-bold text-surface-900 dark:text-white leading-snug mb-1">{topAlert.ti}</p>
                <p className="text-[10px] text-surface-500 dark:text-surface-400 line-clamp-2">{topAlert.de}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
