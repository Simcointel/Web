import { useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid, Tooltip as UITooltip } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";

const CATEGORIES = ["raw-materials", "energy-fuel", "agriculture", "manufacturing", "technology", "construction", "services-finance"];
const CATEGORY_LABELS: Record<string, string> = {
  "raw-materials": "Raw Materials", "energy-fuel": "Energy & Fuel", "agriculture": "Agriculture",
  "manufacturing": "Manufacturing", "technology": "Technology", "construction": "Construction", "services-finance": "Services & Finance",
};
const CATEGORY_COLORS: Record<string, string> = {
  "raw-materials": "#0ea5e9", "energy-fuel": "#ef4444", "agriculture": "#10b981",
  "manufacturing": "#8b5cf6", "technology": "#f59e0b", "construction": "#ec4899", "services-finance": "#06b6d4",
};

function getDirection(dir: unknown) {
  if (typeof dir === "string") {
    if (dir.includes("up") || dir.includes("Up")) return { arrow: "\u2191", color: "text-econ-green" };
    if (dir.includes("down") || dir.includes("Down")) return { arrow: "\u2193", color: "text-econ-red" };
  }
  return { arrow: "\u2192", color: "text-surface-400" };
}

export function ForecastsPage() {
  const [realm, setRealm] = useState(0);
  const connected = useSseConnected();
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchForecast(realm), 120000, [realm]);
  useSseEvent("pipeline_forecast_complete", useCallback(() => refresh(), [refresh]));

  const seriesList = useMemo(() => {
    if (!data) return [];
    return CATEGORIES.filter((c) => data[c]).map((c) => ({ key: c, label: CATEGORY_LABELS[c] ?? c, color: CATEGORY_COLORS[c] ?? "#6b7280", ...data[c] }));
  }, [data]);

  const forecastChart = useMemo(() => {
    if (seriesList.length === 0) return [];
    const points: Record<string, { t: string; v: number }[]> = {};
    for (const s of seriesList) {
      points[s.key] = s.fc ?? [];
    }
    const maxLen = Math.max(...Object.values(points).map((p) => p.length));
    const result: Record<string, unknown>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, unknown> = { idx: i };
      for (const [k, pts] of Object.entries(points)) {
        if (pts[i]) { row[k] = pts[i].v; row[k + "_t"] = pts[i].t; }
      }
      result.push(row);
    }
    return result;
  }, [seriesList]);

  const inflationSeries = seriesList.find((s) => s.key === "agriculture" || s.key === "raw-materials");
  const avgReliability = seriesList.length > 0 ? seriesList.reduce((a, s) => a + (s.reliability ?? 0), 0) / seriesList.length : 0;

  if (loading && !data) return <LoadingState text="Generating forecasts..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!data) return <EmptyState message="No forecast data available" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mb-2 inline-block">
            Predictive Analytics
          </span>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Forecast Engine</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Projections across all economic sectors using high-fidelity simulations.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-surface-900 p-1.5 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
          <label className="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase ml-2">Realm</label>
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-surface-50 dark:bg-surface-800 border-none rounded-lg text-sm font-semibold px-4 py-1.5 focus:ring-2 focus:ring-brand-500 dark:text-white"
          >
            <option value={0}>Realm 0</option>
            <option value={1}>Realm 1</option>
          </select>
        </div>
      </div>

      <Section title="Next-Period Outlook" subtitle="Predicted values for the immediate upcoming cycle">
        <CardGrid cols={4}>
          {seriesList.slice(0, 4).map((s) => {
            const d = getDirection(s.trend);
            return (
              <StatCard key={s.key} title={s.label}
                value={s.fc?.[0]?.v != null ? fmt(s.fc[0].v) : "-"}
                subtitle={`${s.direction?.toUpperCase()} (${((s.reliability ?? 0) * 100).toFixed(0)}% CONF)`}
                trend={d.arrow === "\u2191" ? 1 : d.arrow === "\u2193" ? -1 : 0}
                color={`border-l-[${s.color}]`}
                icon={d.arrow === "\u2191" ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
              />
            );
          })}
        </CardGrid>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 card p-6">
           <h3 className="font-bold text-surface-900 dark:text-white mb-6">Aggregate Sector Trajectory</h3>
           <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="idx" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  {seriesList.map((s) => (
                    <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} name={s.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="card p-6">
              <h3 className="font-bold text-surface-900 dark:text-white mb-4">Confidence Distribution</h3>
              <div className="space-y-4">
                {seriesList.map((s) => (
                  <div key={s.key}>
                    <div className="flex justify-between text-[10px] font-bold text-surface-500 uppercase mb-1">
                      <span>{s.label}</span>
                      <span>{((s.reliability ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${((s.reliability ?? 0) * 100).toFixed(0)}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="card p-6 bg-brand-600 text-white border-none shadow-lg shadow-brand-600/20">
              <h3 className="font-bold mb-2">Simulation Accuracy</h3>
              <div className="text-4xl font-black mb-1">{(avgReliability * 100).toFixed(1)}%</div>
              <p className="text-xs text-brand-100 mb-4 uppercase font-bold tracking-widest">Mean Confidence Score</p>
              <div className="text-xs opacity-80 leading-relaxed">
                 Aggregate reliability is calculated from historical prediction convergence and data variance. High confidence suggests stable production cycles.
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {seriesList.map((s) => {
          const d = getDirection(s.trend);
          const latest = s.fc?.[0];
          const prev = s.fc?.[1];
          const pctChange = latest && prev && prev.v ? (((latest.v - prev.v) / prev.v) * 100).toFixed(1) : null;
          return (
            <div key={s.key} className="card p-5 group hover:border-brand-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-100 dark:bg-surface-800" style={{ color: s.color }}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <span className={`text-xs font-bold font-mono ${d.color}`}>{d.arrow} {pctChange ? `${pctChange}%` : ""}</span>
              </div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-1 uppercase tracking-tight">{s.label}</h3>
              <div className="text-xl font-black text-surface-900 dark:text-white mb-4">{latest?.v != null ? fmt(latest.v) : "-"}</div>
              <div className="flex items-center justify-between text-[10px] font-bold text-surface-400 uppercase">
                <span>Rel: {((s.reliability ?? 0) * 100).toFixed(0)}%</span>
                <span>Vol: {(s.volatility ?? 0).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(2);
}
