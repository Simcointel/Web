import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { ScoreBar } from "../components/ScoreBar";
import { MiniSparkline } from "../components/MiniSparkline";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useState, useCallback } from "react";
import type { RealmDashboard } from "../types/api";
import { Link } from "../router";
import { Briefcase, Factory, ShoppingCart, Construction, Users, Activity, TrendingUp, Shield, BarChart3, AlertCircle } from "lucide-react";

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
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 dark:border-surface-800 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white text-sm">SI</div>
            SimcoIntel Terminal
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm font-medium">
            Professional suite for economic analysis and corporate operations.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${connected ? "text-econ-green border-econ-green/20 bg-econ-green/5" : "text-surface-400 border-surface-200"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-econ-green" : "bg-surface-300"}`} />
            {connected ? "System Active" : "Offline / Historical"}
          </div>
          <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
            <select
              value={realm}
              onChange={(e) => setRealm(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-bold px-3 py-1 focus:ring-0 dark:text-white uppercase"
            >
              <option value={0}>Realm 0</option>
              <option value={1}>Realm 1</option>
            </select>
          </div>
        </div>
      </div>

      <Section title="Corporate Operations" subtitle="Analysis tools and operational simulators">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/company-tools" className="group">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600">
                  <Briefcase size={18} />
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-tight">Financials</span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">Statement analysis & cashflow tracking</p>
            </div>
          </Link>
          <Link to="/company-tools" className="group">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-econ-green/10 rounded-lg text-econ-green">
                  <Factory size={18} />
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-tight">Production</span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">Sourcing costs & pipeline optimization</p>
            </div>
          </Link>
          <Link to="/company-tools" className="group">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-econ-purple/10 rounded-lg text-econ-purple">
                  <ShoppingCart size={18} />
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-tight">Retail</span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">Sales velocity & revenue projection</p>
            </div>
          </Link>
          <Link to="/company-tools" className="group">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-econ-amber/10 rounded-lg text-econ-amber">
                  <Construction size={18} />
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-tight">Construction</span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">Building costs & expansion ROI</p>
            </div>
          </Link>
          <Link to="/company-tools" className="group">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-econ-red/10 rounded-lg text-econ-red">
                  <Users size={18} />
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-tight">Executives</span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">Board skill impact & threshold calcs</p>
            </div>
          </Link>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Section title="Market Indicators" subtitle="Composite indices for the current economic operating environment">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Market Health" value={scores?.eh ?? "-"} color="border-l-brand-500" icon={<Activity size={16} />} />
              <StatCard title="Sentiment" value={scores?.ms ?? "-"} color="border-l-econ-purple" icon={<TrendingUp size={16} />} />
              <StatCard title="Stability" value={scores?.st ?? "-"} color="border-l-econ-green" icon={<Shield size={16} />} />
              <StatCard title="Volatility" value={scores?.sr ?? "-"} color="border-l-econ-red" icon={<AlertCircle size={16} />} />
            </div>
          </Section>

          <div className="card overflow-hidden">
             <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-wider">Historical System Logs</h3>
                <Link to="/alerts" className="text-[10px] font-bold text-brand-600 uppercase hover:underline">View All</Link>
             </div>
             <div className="divide-y divide-surface-100 dark:divide-surface-800">
               {alertList.length > 0 ? alertList.map((a) => (
                  <div key={a.id} className="flex items-start gap-4 px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="mt-1"><SeverityBadge severity={a.se} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-surface-400 uppercase tracking-tight">{a.ca}</span>
                        <span className="text-[10px] text-surface-400 font-mono">{new Date(a.ts).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{a.ti}</p>
                      {a.de && <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-1">{a.de}</p>}
                    </div>
                  </div>
                )) : (
                  <div className="px-6 py-12 text-center text-surface-400 text-sm">No recent activity detected</div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="card p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-surface-200 dark:bg-surface-800"></div>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-4">Economic Regime Status</span>
            <div className={`text-4xl font-bold mb-2 tracking-tighter ${regime?.na === "Expansion" ? "text-econ-green" : regime?.na === "Recession" ? "text-econ-red" : regime?.na === "Recovery" ? "text-brand-600" : "text-econ-amber"}`}>
              {regime?.na?.toUpperCase() ?? "NEUTRAL"}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-300 mb-8 font-mono">
              CONFIDENCE_LEVEL: {regime?.sc ?? "0"}%
            </div>
            <div className="w-full h-16">
              <MiniSparkline data={sparkData} color={regime?.na === "Expansion" ? "#10b981" : "#3b82f6"} />
            </div>
            <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mt-4">Composite Factor Distribution</p>
          </div>

          {topAlert && (
            <div className="card overflow-hidden border-l-4 border-l-econ-red">
              <div className="bg-econ-red/5 px-6 py-4 border-b border-surface-200 dark:border-surface-800">
                <h3 className="font-bold text-econ-red text-sm uppercase tracking-wider">System Alert</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono text-surface-400">{new Date(topAlert.ts).toLocaleString()}</span>
                </div>
                <p className="text-base font-bold text-surface-900 dark:text-white leading-tight mb-2">{topAlert.ti}</p>
                {topAlert.de && <p className="text-sm text-surface-600 dark:text-surface-400">{topAlert.de}</p>}
                <Link to="/signals" className="mt-4 inline-block text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest hover:underline">
                  View Analysis &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
