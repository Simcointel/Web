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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              Overview
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${connected ? "text-econ-green" : "text-surface-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-econ-green animate-pulse" : "bg-surface-300"}`} />
              {connected ? "Live System" : "Historical View"}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 max-w-2xl">
            Real-time monitoring of economic stability, market sentiment, and systemic risk factors across Simco realms.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-surface-900 p-1.5 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <label className="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase ml-2">Realm</label>
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-surface-50 dark:bg-surface-800 border-none rounded-lg text-sm font-semibold px-4 py-1.5 focus:ring-2 focus:ring-brand-500 dark:text-white"
          >
            <option value={0}>Global 0</option>
            <option value={1}>Sandbox 1</option>
          </select>
        </div>
      </div>

      <Section title="Economic Vitality" subtitle="Primary health indicators for the current operating environment">
        <CardGrid cols={5}>
          <StatCard title="Economic Health" value={scores?.eh ?? "-"} color="border-l-brand-500" icon={"\u2302"} />
          <StatCard title="Market Sentiment" value={scores?.ms ?? "-"} color="border-l-econ-purple" icon={"\u2605"} />
          <StatCard title="Stability" value={scores?.st ?? "-"} color="border-l-econ-green" icon={"\u2696"} />
          <StatCard title="Inflation Pressure" value={scores?.ip ?? "-"} color="border-l-econ-amber" icon={"\u2191"} />
          <StatCard title="Systemic Risk" value={scores?.sr ?? "-"} color="border-l-econ-red" icon={"\u26A0"} />
        </CardGrid>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="card overflow-hidden">
             <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                <h3 className="font-bold text-surface-900 dark:text-white">Health Composition</h3>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                      <span className="text-[10px] font-bold text-surface-400 uppercase">Current</span>
                   </div>
                </div>
             </div>
             <div className="p-8 space-y-6">
                <ScoreBar value={scores?.eh ?? 0} label="Economic Health" color="bg-brand-500" />
                <ScoreBar value={scores?.ms ?? 0} label="Market Sentiment" color="bg-econ-purple" />
                <ScoreBar value={scores?.st ?? 0} label="Stability" color="bg-econ-green" />
                <ScoreBar value={scores?.ip ?? 0} label="Inflation Pressure" color="bg-econ-amber" />
                <ScoreBar value={scores?.sr ?? 0} label="Systemic Risk" color="bg-econ-red" />
             </div>
          </div>

          <div className="card overflow-hidden">
             <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800">
                <h3 className="font-bold text-surface-900 dark:text-white">Recent Activity</h3>
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
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-econ-green to-econ-amber"></div>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-4">Current Economic Regime</span>
            <div className={`text-4xl font-black mb-2 tracking-tighter ${regime?.na === "Expansion" ? "text-econ-green" : regime?.na === "Recession" ? "text-econ-red" : regime?.na === "Recovery" ? "text-brand-600" : "text-econ-amber"}`}>
              {regime?.na ?? "Neutral"}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-300 mb-8">
              {regime?.sc ?? "0"}% Confidence
            </div>
            <div className="w-full h-16">
              <MiniSparkline data={sparkData} color={regime?.na === "Expansion" ? "#10b981" : "#3b82f6"} />
            </div>
            <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mt-4">Composite Factor Distribution</p>
          </div>

          {topAlert && (
            <div className="card overflow-hidden border-l-4 border-l-econ-red">
              <div className="bg-econ-red/5 px-6 py-4 border-b border-surface-200 dark:border-surface-800">
                <h3 className="font-bold text-econ-red text-sm uppercase tracking-wider">Critical Alert</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono text-surface-400">{new Date(topAlert.ts).toLocaleString()}</span>
                </div>
                <p className="text-base font-bold text-surface-900 dark:text-white leading-tight mb-2">{topAlert.ti}</p>
                {topAlert.de && <p className="text-sm text-surface-600 dark:text-surface-400">{topAlert.de}</p>}
                <button className="mt-4 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest hover:underline">
                  Investigate Signal &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
