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

  if (loading) return <LoadingState text="Loading dashboard..." />;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Economic Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="hidden sm:inline">Dashboard</span> &middot; Realm {realm} &middot; {connected ? "Live" : "Polling"}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs ${connected ? "text-econ-green" : "text-gray-400"}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-econ-green" : "bg-gray-300"}`} />
          {connected ? "Connected" : "Offline"}
        </span>
        <select value={realm} onChange={(e) => setRealm(Number(e.target.value))}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <Section title="Composite Scores" subtitle="Five key economic health indicators (0–100)">
        <CardGrid cols={5}>
          <StatCard title="Economic Health" value={scores?.eh ?? "-"} color="border-l-blue-500" icon={"\u2302"} />
          <StatCard title="Market Sentiment" value={scores?.ms ?? "-"} color="border-l-purple-500" icon={"\u2605"} />
          <StatCard title="Stability" value={scores?.st ?? "-"} color="border-l-green-500" icon={"\u2696"} />
          <StatCard title="Inflation Pressure" value={scores?.ip ?? "-"} color="border-l-amber-500" icon={"\u2191"} />
          <StatCard title="Systemic Risk" value={scores?.sr ?? "-"} color="border-l-red-500" icon={"\u26A0"} />
        </CardGrid>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="Score Breakdown">
            <div className="card p-5 space-y-3">
              <ScoreBar value={scores?.eh ?? 0} label="Economic Health" color="bg-blue-500" />
              <ScoreBar value={scores?.ms ?? 0} label="Market Sentiment" color="bg-purple-500" />
              <ScoreBar value={scores?.st ?? 0} label="Stability" color="bg-green-500" />
              <ScoreBar value={scores?.ip ?? 0} label="Inflation Pressure" color="bg-amber-500" />
              <ScoreBar value={scores?.sr ?? 0} label="Systemic Risk" color="bg-red-500" />
            </div>
          </Section>
        </div>

        <div>
          <Section title="Current Regime">
            <div className="card p-5 text-center">
              <div className={`text-3xl font-bold mb-1 ${regime?.na === "Expansion" ? "text-econ-green" : regime?.na === "Recession" ? "text-econ-red" : regime?.na === "Recovery" ? "text-blue-600" : "text-econ-amber"}`}>
                {regime?.na ?? "-"}
              </div>
              <div className="text-sm text-gray-500 mb-3">Confidence: {regime?.sc ?? "-"}%</div>
              <MiniSparkline data={sparkData} color="#3b82f6" />
              <div className="text-[10px] text-gray-400 mt-2">Score distribution</div>
            </div>
          </Section>

          {topAlert && (
            <Section title="Latest Alert">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <SeverityBadge severity={topAlert.se} />
                  <span className="text-xs text-gray-500">{new Date(topAlert.ts).toLocaleString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{topAlert.ti}</p>
                {topAlert.de && <p className="text-xs text-gray-500 mt-1">{topAlert.de}</p>}
              </div>
            </Section>
          )}
        </div>
      </div>

      {alertList.length > 0 && (
        <Section title="Recent Alerts" subtitle="Latest 5 events across all realms">
          <div className="card divide-y divide-gray-100">
            {alertList.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <SeverityBadge severity={a.se} />
                <span className="text-gray-500 text-xs w-16 shrink-0">{new Date(a.ts).toLocaleDateString()}</span>
                <span className="text-gray-400 text-xs w-16 shrink-0">{a.ca}</span>
                <span className="text-gray-900 truncate">{a.ti}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
