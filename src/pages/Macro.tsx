import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export function MacroPage() {
  const [realm, setRealm] = useState(0);
  const { data: latest, loading: lLoading, error: lError, refresh: lRefresh } = useDataRepoPoll(() => dataRepo.fetchMacroLatest(realm), 60000, [realm]);
  const { data: history, loading: hLoading } = useDataRepoPoll(() => dataRepo.fetchMacroHistory(realm, 120), 120000, [realm]);
  const { data: indexes, loading: iLoading } = useDataRepoPoll(() => dataRepo.fetchMacroIndexes(realm, 200), 120000, [realm]);
  const { data: inflation, loading: infLoading } = useDataRepoPoll(() => dataRepo.fetchMacroInflation(realm, 200), 120000, [realm]);
  const { data: phases } = useDataRepoPoll(() => dataRepo.fetchMacroPhases(realm), 120000, [realm]);

  if (lLoading) return <LoadingState text="Loading macro data..." />;
  if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;

  const latestH = latest?.latestHistory;
  const latestI = latest?.latestIndexes;
  const latestInf = latest?.latestInflation;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Macro Economy</h1>
          <p className="text-sm text-gray-500 mt-0.5">Realm-level economic indicators, history, and phase analysis</p>
        </div>
        <select
          value={realm}
          onChange={(e) => setRealm(Number(e.target.value))}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700"
        >
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <Section title="Latest State">
        <CardGrid cols={4}>
          <StatCard title="Companies Value" value={latestH?.companiesValue != null ? fmt(latestH.companiesValue) : "-"} subtitle={latestH?.date ? new Date(latestH.date).toLocaleDateString() : undefined} color="border-l-blue-500" />
          <StatCard title="Active Companies" value={latestH?.activeCompanies ?? "-"} color="border-l-green-500" />
          <StatCard title="Bonds Sold" value={latestH?.bondsSold != null ? fmt(latestH.bondsSold) : "-"} color="border-l-purple-500" />
          <StatCard title="Total Buildings" value={latestH?.totalBuildings ?? "-"} color="border-l-amber-500" />
        </CardGrid>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {history?.history && history.history.length > 0 && (
          <Section title="Companies Value &amp; GDP History">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={(indexes?.indexes ? history.history.map((h) => {
                  const ix = indexes.indexes.find((i: any) => i.date === h.date);
                  return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
                }) : history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() })))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="companiesValue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Companies Value" />
                  <Line type="monotone" dataKey="gdp" stroke="#059669" strokeWidth={2} dot={false} name="GDP" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {history?.history && history.history.length > 0 && (
          <Section title="Active Companies &amp; Buildings">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="activeCompanies" stroke="#059669" strokeWidth={2} dot={false} name="Active Companies" />
                  <Line type="monotone" dataKey="totalBuildings" stroke="#d97706" strokeWidth={2} dot={false} name="Total Buildings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {indexes?.indexes && indexes.indexes.length > 0 && (
          <Section title="Price Indexes (CPI, Core CPI)">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={indexes.indexes.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpi" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPI" />
                  <Line type="monotone" dataKey="coreCpi" stroke="#7c3aed" strokeWidth={2} dot={false} name="Core CPI" />
                  <Line type="monotone" dataKey="gdp" stroke="#059669" strokeWidth={2} dot={false} name="GDP" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {inflation?.inflation && inflation.inflation.length > 0 && (
          <Section title="Inflation Rates">
            <div className="card p-5">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inflation.inflation.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cpiRate" fill="#3b82f6" name="CPI Rate" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="coreCpiRate" fill="#7c3aed" name="Core CPI Rate" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}
      </div>

      {phases && (
        <Section title="Phase History" subtitle={`Current: ${phases.currentPhase} (${phases.totalDays} days tracked)`}>
          <div className="card divide-y divide-gray-100">
            {phases.phases.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <PhaseDot phase={p.phase} />
                  <span className="font-medium text-gray-900">{p.phase}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(p.startDate).toLocaleDateString()} &ndash; {p.endDate ? new Date(p.endDate).toLocaleDateString() : "Present"}
                  <span className="ml-2 text-gray-400">({p.days}d)</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PhaseDot({ phase }: { phase: string }) {
  const colors: Record<string, string> = { Expansion: "bg-econ-green", Stagnation: "bg-econ-amber", Recession: "bg-econ-red", Recovery: "bg-blue-500", Volatile: "bg-purple-500" };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[phase] ?? "bg-gray-400"}`} />;
}
