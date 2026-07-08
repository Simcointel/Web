import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";

interface PhaseRecord {
  phase: string;
  startDate: string;
  endDate: string | null;
  days: number;
}

function fmtDuration(days: number): string {
  if (days <= 1) return `${days} day`;
  if (days < 7) return `${days} days`;
  const w = Math.floor(days / 7);
  const d = days % 7;
  if (d === 0) return `${w} week${w > 1 ? 's' : ''}`;
  return `${w} week${w > 1 ? 's' : ''} ${d} day${d > 1 ? 's' : ''}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function MacroPage() {
  useEffect(() => { document.title = "Macro Intel - SimcoIntel"; }, []);

  const [realm, setRealm] = useSharedRealm();
  const { data: latest, loading: lLoading, error: lError, refresh: lRefresh } = useDataRepoPoll(() => dataRepo.fetchMacroLatest(realm), 60000, [realm]);
  const { data: history } = useDataRepoPoll(() => dataRepo.fetchMacroHistory(realm, 120), 120000, [realm]);
  const { data: indexes } = useDataRepoPoll(() => dataRepo.fetchMacroIndexes(realm, 200), 120000, [realm]);
  const { data: phases } = useDataRepoPoll(() => dataRepo.fetchMacroPhases(realm), 120000, [realm]);

  const filteredPhases = useMemo<PhaseRecord[]>(() => {
    if (!phases?.phases) return [];
    const sorted = (phases.phases as PhaseRecord[]).slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
    const result: PhaseRecord[] = [];
    let lastDate: Date | null = null;
    for (const p of sorted) {
      const d = new Date(p.startDate);
      if (!lastDate || (lastDate.getTime() - d.getTime()) >= (6 * 24 * 60 * 60 * 1000)) {
        result.push(p);
        lastDate = d;
      }
    }
    return result;
  }, [phases]);

  if (lLoading && !latest) return <LoadingState text="Loading macro..." />;
  if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;

  const h = latest?.latestHistory;
  const phasesList = filteredPhases;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between border-b border-surface-200 pb-3">
        <h1 className="text-lg font-bold">Macro Intelligence (R{realm})</h1>
        <select value={realm} onChange={e => setRealm(Number(e.target.value))} className="border border-surface-300 px-3 py-1.5 rounded-lg text-sm font-bold outline-none"><option value={0}>R0</option><option value={1}>R1</option></select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Box label="Total System Value" value={h?.companiesValue != null ? `$${fmt(h.companiesValue)}` : "-"} />
        <Box label="Active Entities" value={h?.activeCompanies?.toLocaleString() ?? "-"} />
        <Box label="Bonds Outstanding" value={h?.bondsSold != null ? fmt(h.bondsSold) : "-"} />
        <Box label="Total Facilities" value={h?.totalBuildings?.toLocaleString() ?? "-"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {history?.history && history.history.length > 0 && (
          <ChartPanel title="Market Value & GDP">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={(indexes?.indexes ? history.history.map(h => {
                const ix = indexes.indexes.find(i => i.date === h.date);
                return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
              }) : history.history.map(h => ({ ...h, d: new Date(h.date).toLocaleDateString() })))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="companiesValue" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} name="Total Value" />
                <Area type="monotone" dataKey="totalBuildings" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} name="Total Facilities" />
                <Line type="monotone" dataKey="gdp" stroke="#10b981" strokeWidth={2} dot={false} name="GDP Index" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        {indexes?.indexes && indexes.indexes.length > 0 && (
          <ChartPanel title="Price Indexes (CPI & Core)">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={indexes.indexes.map(h => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="cpi" stroke="#ef4444" strokeWidth={2} dot={false} name="CPI" />
                <Line type="monotone" dataKey="coreCpi" stroke="#f59e0b" strokeWidth={2} dot={false} name="Core Index" />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>

      {phasesList.length > 0 && (
        <div className="border border-surface-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-surface-50 border-b border-surface-100 flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-surface-500">Phase Registry</span>
            <span className="text-xs font-bold text-brand-600 uppercase">Current: {phases?.currentPhase}</span>
          </div>
          <table className="w-full text-left">
            <thead className="text-xs font-bold uppercase text-surface-400 bg-surface-50/50 border-b border-surface-100">
              <tr><th className="px-4 py-2">Phase</th><th className="px-4 py-2 text-right">Start</th><th className="px-4 py-2 text-right">End</th><th className="px-4 py-2 text-right">Duration</th></tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {phasesList.map((p, i) => (
                <tr key={i} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-2 font-bold">{p.phase}</td>
                  <td className="px-4 py-2 text-right text-surface-500">{p.startDate}</td>
                  <td className="px-4 py-2 text-right text-surface-500">{p.endDate || 'Active'}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtDuration(p.days)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string | number }) {
  return <div className="border border-surface-200 rounded-lg p-4 text-center"><p className="text-xs font-bold text-surface-500 uppercase mb-1">{label}</p><p className="text-xl font-bold">{value}</p></div>;
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border border-surface-200 rounded-lg"><div className="px-4 py-2 bg-surface-50 border-b border-surface-100 text-xs font-bold uppercase text-surface-500">{title}</div><div className="p-4">{children}</div></div>;
}
