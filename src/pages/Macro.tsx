import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine, AreaChart, Area
} from "recharts";

export function MacroPage() {
  const [realm, setRealm] = useState(0);
  const { data: latest, loading: lLoading, error: lError, refresh: lRefresh } = useDataRepoPoll(() => dataRepo.fetchMacroLatest(realm), 60000, [realm]);
  const { data: history, loading: hLoading } = useDataRepoPoll(() => dataRepo.fetchMacroHistory(realm, 120), 120000, [realm]);
  const { data: indexes, loading: iLoading } = useDataRepoPoll(() => dataRepo.fetchMacroIndexes(realm, 200), 120000, [realm]);
  const { data: inflation, loading: infLoading } = useDataRepoPoll(() => dataRepo.fetchMacroInflation(realm, 200), 120000, [realm]);
  const { data: phases } = useDataRepoPoll(() => dataRepo.fetchMacroPhases(realm), 120000, [realm]);

  const [refOverride, setRefOverride] = useState(0);

  const refPrice = useMemo(() => {
    if (refOverride > 0) return refOverride;
    if (indexes?.indexes?.length) return indexes.indexes[0].cpi ?? 0;
    return 0;
  }, [refOverride, indexes]);

  // Filter phases to show roughly one per 7 days or only major transitions
  const filteredPhases = useMemo(() => {
    if (!phases?.phases) return [];

    const sorted = phases.phases.slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
    const result = [];
    let lastDate = null;

    for (const p of sorted) {
      const d = new Date(p.startDate);
      // If first or more than 6 days since last added
      if (!lastDate || (lastDate.getTime() - d.getTime()) >= (6 * 24 * 60 * 60 * 1000)) {
        result.push(p);
        lastDate = d;
      }
    }
    return result;
  }, [phases]);

  if (lLoading && !latest) return <LoadingState text="Loading macro data..." />;
  if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;

  const latestH = latest?.latestHistory;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mb-2 inline-block">
            Macro Statistics
          </span>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Economic Indicators</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Historical and real-time performance of the realm-wide economy.
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

      <Section title="Latest Snapshot">
        <CardGrid cols={4}>
          <StatCard title="Companies Value" value={latestH?.companiesValue != null ? fmt(latestH.companiesValue) : "-"} subtitle={latestH?.date ? new Date(latestH.date).toLocaleDateString() : undefined} color="border-l-brand-500" />
          <StatCard title="Active Companies" value={latestH?.activeCompanies ?? "-"} color="border-l-econ-green" />
          <StatCard title="Bonds Sold" value={latestH?.bondsSold != null ? fmt(latestH.bondsSold) : "-"} color="border-l-econ-purple" />
          <StatCard title="Total Buildings" value={latestH?.totalBuildings ?? "-"} color="border-l-econ-amber" />
        </CardGrid>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {history?.history && history.history.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-surface-900 dark:text-white mb-6">Valuation & Output</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(indexes?.indexes ? history.history.map((h) => {
                  const ix = indexes.indexes.find((i: any) => i.date === h.date);
                  return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
                }) : history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() })))}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="companiesValue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVal)" name="Companies Value" strokeWidth={2} />
                  <Line type="monotone" dataKey="gdp" stroke="#10b981" strokeWidth={2} dot={false} name="GDP" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {history?.history && history.history.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-surface-900 dark:text-white mb-6">Market Activity</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="activeCompanies" stroke="#10b981" strokeWidth={2} dot={false} name="Active Companies" />
                  <Line type="monotone" dataKey="totalBuildings" stroke="#f59e0b" strokeWidth={2} dot={false} name="Total Buildings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {indexes?.indexes && indexes.indexes.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-surface-900 dark:text-white mb-6">Price Indexes</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={indexes.indexes.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="cpi" stroke="#0ea5e9" strokeWidth={2} dot={false} name="CPI" />
                  <Line type="monotone" dataKey="coreCpi" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Core CPI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {inflation?.inflation && inflation.inflation.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-surface-900 dark:text-white mb-6">Inflation Dynamics</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inflation.inflation.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Line type="monotone" dataKey="cpiRate" stroke="#0ea5e9" strokeWidth={2} dot={false} name="CPI Rate" />
                  <Line type="monotone" dataKey="coreCpiRate" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Core CPI Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {phases && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
            <h3 className="font-bold text-surface-900 dark:text-white uppercase text-xs tracking-widest">Weekly Regime History</h3>
            <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
              Current: <span className="font-bold text-brand-600 dark:text-brand-400">{phases.currentPhase}</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 dark:bg-surface-800/30 text-[10px] font-bold uppercase tracking-wider text-surface-400">
                <tr>
                  <th className="px-6 py-3">Phase</th>
                  <th className="px-6 py-3 text-right">Start Date</th>
                  <th className="px-6 py-3 text-right">End Date</th>
                  <th className="px-6 py-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filteredPhases.map((p, i) => (
                  <tr key={i} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 font-semibold text-surface-900 dark:text-white">
                        <PhaseDot phase={p.phase} />
                        {p.phase}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-surface-500 dark:text-surface-400 tabular-nums">
                      {new Date(p.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-surface-500 dark:text-surface-400 tabular-nums">
                      {p.endDate ? new Date(p.endDate).toLocaleDateString() : "Present"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-surface-900 dark:text-white tabular-nums">
                      {p.days}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
  const colors: Record<string, string> = {
    Expansion: "bg-econ-green",
    Stagnation: "bg-econ-amber",
    Recession: "bg-econ-red",
    Recovery: "bg-brand-500",
    Volatile: "bg-econ-purple"
  };
  return <span className={`w-2 h-2 rounded-full ring-4 ring-offset-0 ${colors[phase] ?? "bg-surface-400"} ${colors[phase]?.replace('bg-', 'ring-')}/20`} />;
}
