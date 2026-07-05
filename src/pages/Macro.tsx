import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from "recharts";

interface PhaseRecord {
  phase: string;
  startDate: string;
  endDate: string | null;
  days: number;
}

export function MacroPage() {
  useEffect(() => {
    document.title = "Macro Intel - SimcoIntel";
  }, []);

  const [realm, setRealm] = useSharedRealm();
  const { data: latest, loading: lLoading, error: lError, refresh: lRefresh } = useDataRepoPoll(() => dataRepo.fetchMacroLatest(realm), 60000, [realm]);
  const { data: history } = useDataRepoPoll(() => dataRepo.fetchMacroHistory(realm, 120), 120000, [realm]);
  const { data: indexes } = useDataRepoPoll(() => dataRepo.fetchMacroIndexes(realm, 200), 120000, [realm]);
  const { data: inflation } = useDataRepoPoll(() => dataRepo.fetchMacroInflation(realm, 200), 120000, [realm]);
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

  const content = useMemo(() => {
    if (lLoading && !latest) return <LoadingState text="SYNC_MACRO..." />;
    if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;
    return null;
  }, [lLoading, latest, lError, lRefresh]);

  const latestH = latest?.latestHistory;

  if (content) return content;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-xl font-bold italic tracking-tight">Macro Intelligence (R{realm})</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-bold px-3 py-1.5 rounded-lg outline-none"
          >
            <option value={0}>R0</option>
            <option value={1}>R1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <MacroBox label="Total System Value" value={latestH?.companiesValue != null ? `$${(latestH.companiesValue / 1_000_000_000).toFixed(2)}B` : "-"} />
         <MacroBox label="Active Entities" value={latestH?.activeCompanies?.toLocaleString() ?? "-"} />
         <MacroBox label="Bonds Outstanding" value={latestH?.bondsSold != null ? fmt(latestH.bondsSold) : "-"} />
         <MacroBox label="Total Facilities" value={latestH?.totalBuildings?.toLocaleString() ?? "-"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {history?.history && history.history.length > 0 && (
          <ChartPanel title="Market Valuation & GDP Trends">
             <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={(indexes?.indexes ? history.history.map((h) => {
                  const ix = indexes.indexes.find((i: any) => i.date === h.date);
                  return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
                }) : history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() })))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
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
                <LineChart data={indexes.indexes.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="cpi" stroke="#ef4444" strokeWidth={2} dot={false} name="CPI" />
                  <Line type="monotone" dataKey="coreCpi" stroke="#f59e0b" strokeWidth={2} dot={false} name="Core Index" />
                </LineChart>
             </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>

      <div className="card !shadow-none border-surface-200 dark:border-surface-800 overflow-hidden">
         <div className="px-6 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
            <h3 className="font-bold uppercase text-xs text-surface-500 tracking-wider">Historical Regime Registry</h3>
            <span className="text-xs font-bold text-brand-600 uppercase">Status: {phases?.currentPhase}</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="text-xs font-bold uppercase text-surface-400 bg-surface-50/50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-800">
                  <tr>
                     <th className="px-6 py-3">Economic Phase</th>
                     <th className="px-6 py-3 text-right">Start Date</th>
                     <th className="px-6 py-3 text-right">End Date</th>
                     <th className="px-6 py-3 text-right">Duration</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredPhases.map((p, i) => (
                     <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                        <td className="px-6 py-4 font-bold text-surface-800 dark:text-surface-200">{p.phase}</td>
                        <td className="px-6 py-4 text-right text-surface-500">{p.startDate}</td>
                        <td className="px-6 py-4 text-right text-surface-500">{p.endDate || 'Active'}</td>
                        <td className="px-6 py-4 text-right font-bold">{p.days} Days</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function MacroBox({ label, value }: { label: string; value: string | number }) {
   return (
      <div className="card p-6 text-center border-surface-200 dark:border-surface-800 !shadow-none">
         <p className="text-xs font-bold text-surface-500 uppercase mb-2 tracking-wide">{label}</p>
         <p className="text-2xl font-bold tabular-nums">{value}</p>
      </div>
   );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
   return (
      <div className="card !shadow-none border-surface-200 dark:border-surface-800">
         <div className="px-6 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 uppercase font-bold text-xs text-surface-500 tracking-wider">{title}</div>
         <div className="p-6">{children}</div>
      </div>
   );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
