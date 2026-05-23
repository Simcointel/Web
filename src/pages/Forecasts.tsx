import { useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area,
} from "recharts";
import type { ForecastSeries } from "../types/api";

const CATEGORIES = ["raw-materials", "energy-fuel", "agriculture", "manufacturing", "technology", "construction", "services-finance"];
const CATEGORY_LABELS: Record<string, string> = {
  "raw-materials": "Raw Materials", "energy-fuel": "Energy & Fuel", "agriculture": "Agriculture",
  "manufacturing": "Manufacturing", "technology": "Technology", "construction": "Construction", "services-finance": "Services & Finance",
};
const CATEGORY_COLORS: Record<string, string> = {
  "raw-materials": "#d97706", "energy-fuel": "#dc2626", "agriculture": "#059669",
  "manufacturing": "#3b82f6", "technology": "#7c3aed", "construction": "#ea580c", "services-finance": "#0891b2",
};

function getDirection(dir: unknown) {
  if (typeof dir === "string") {
    if (dir.includes("up") || dir.includes("Up")) return { arrow: "\u2191", color: "text-econ-green" };
    if (dir.includes("down") || dir.includes("Down")) return { arrow: "\u2193", color: "text-econ-red" };
  }
  return { arrow: "\u2192", color: "text-gray-400" };
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

  if (loading) return <LoadingState text="Loading forecasts..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!data) return <EmptyState message="No forecast data available" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Forecasts</h1>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-econ-green" : "bg-gray-300"}`} title={connected ? "Live" : "Disconnected"} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Predictive projections across all economic categories</p>
        </div>
        <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <Section title="Macro Forecast Overview" subtitle="Next-period predicted values and direction">
        <CardGrid cols={4}>
          {seriesList.slice(0, 4).map((s) => {
            const d = getDirection(s.trend);
            return (
              <StatCard key={s.key} title={s.label}
                value={s.fc?.[0]?.v != null ? fmt(s.fc[0].v) : "-"}
                subtitle={`${d.arrow} ${s.direction} (${((s.reliability ?? 0) * 100).toFixed(0)}% confidence)`}
              />
            );
          })}
        </CardGrid>
      </Section>

      {forecastChart.length > 0 && (
        <Section title="Sector Forecast Comparison" subtitle="Projected values across all sectors">
          <div className="card p-5">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="idx" tick={{ fontSize: 10 }} label={{ value: "Period", position: "insideBottom", offset: -5 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {seriesList.map((s) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} name={s.label} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      <Section title="Sector Forecast Grid" subtitle="Detailed forecast per sector">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((s) => {
            const d = getDirection(s.trend);
            const latest = s.fc?.[0];
            const prev = s.fc?.[1];
            const pctChange = latest && prev && prev.v ? (((latest.v - prev.v) / prev.v) * 100).toFixed(1) : null;
            return (
              <div key={s.key} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{s.label}</h3>
                  <span className={`text-xs font-mono ${d.color}`}>{d.arrow} {pctChange ? `${pctChange}%` : ""}</span>
                </div>
                <div className="text-2xl font-bold font-mono text-gray-900 mb-2">{latest?.v != null ? fmt(latest.v) : "-"}</div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Reliability: {((s.reliability ?? 0) * 100).toFixed(0)}%</span>
                  <span>Volatility: {(s.volatility ?? 0).toFixed(2)}</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${((s.reliability ?? 0) * 100).toFixed(0)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2 capitalize">{s.direction}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {inflationSeries && (
        <Section title="Inflation Outlook" subtitle="CPI/inflation sector forecast trajectory">
          <div className="card p-5">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={(inflationSeries.fc ?? []).map((p, i) => ({ ...p, idx: i }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke={inflationSeries.color} fill={inflationSeries.color + "22"} strokeWidth={2} name="Projected" />
              </AreaChart>
            </ResponsiveContainer>
            <ExplainText>
              This sector tracks price and availability trends. The forecast uses Holt-Winters exponential smoothing with
              volatility-adjusted confidence bands. Reliability of {(inflationSeries.reliability * 100).toFixed(0)}%
              reflects historical forecast accuracy for this category.
            </ExplainText>
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Forecast Confidence" subtitle="Reliability scores per sector">
          <div className="card p-5">
            <div className="space-y-3">
              {seriesList.map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{s.label}</span>
                    <span>{((s.reliability ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${((s.reliability ?? 0) * 100).toFixed(0)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Reliability is derived from volatility, historical accuracy, and data recency. Higher = more trustworthy.
              Average: {(avgReliability * 100).toFixed(0)}%.
            </p>
          </div>
        </Section>

        <Section title="Forecast Accuracy" subtitle="Directional accuracy and historical performance">
          <div className="card p-5">
            <div className="text-center py-6">
              <div className="text-4xl font-bold font-mono text-gray-900 mb-2">{(avgReliability * 100).toFixed(0)}%</div>
              <p className="text-sm text-gray-500">Average forecast confidence</p>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              {seriesList.slice(0, 4).map((s) => (
                <div key={s.key} className="flex justify-between text-xs">
                  <span className="text-gray-600">{s.label}</span>
                  <span className="text-gray-900 font-mono">
                    {s.fc?.[0]?.v != null ? fmt(s.fc[0].v) : "-"} &rarr; {s.direction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(2);
}

function ExplainText({ children }: { children: ReactNode }) {
  return <details className="mt-3 text-xs text-gray-400"><summary className="cursor-pointer hover:text-gray-600">Why this forecast?</summary>{children}</details>;
}
