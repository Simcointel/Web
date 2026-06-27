import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { useMemo } from "react";
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

  if (lLoading && !latest) return <LoadingState text="SYNC_MACRO..." />;
  if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;

  const latestH = latest?.latestHistory;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono text-[10px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">Macro_Economic_Matrix_R{realm}</h1>
          <p className="text-[10px] text-surface-500 mt-0.5 font-bold uppercase opacity-60">Global_Financial_Aggregates</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={realm}
            onChange={(e) => setRealm(Number(e.target.value))}
            className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black px-2 py-1 outline-none uppercase"
          >
            <option value={0}>R0</option>
            <option value={1}>R1</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-200 dark:bg-surface-800 border border-surface-200 dark:border-surface-800">
         <MacroBox label="COMPANIES_VAL" value={latestH?.companiesValue != null ? fmt(latestH.companiesValue) : "-"} />
         <MacroBox label="ACTIVE_FIRMS" value={latestH?.activeCompanies ?? "-"} />
         <MacroBox label="BONDS_SOLD" value={latestH?.bondsSold != null ? fmt(latestH.bondsSold) : "-"} />
         <MacroBox label="TOTAL_ASSETS" value={latestH?.totalBuildings ?? "-"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {history?.history && history.history.length > 0 && (
          <ChartPanel title="Valuation_Output_Curve">
             <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={(indexes?.indexes ? history.history.map((h) => {
                  const ix = indexes.indexes.find((i: any) => i.date === h.date);
                  return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
                }) : history.history.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() })))}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', fontSize: '10px' }} />
                  <Area type="step" dataKey="companiesValue" stroke="#000" fill="#000" fillOpacity={0.05} name="Value" />
                  <Line type="monotone" dataKey="gdp" stroke="#000" strokeWidth={1} dot={false} name="GDP" />
                </AreaChart>
             </ResponsiveContainer>
          </ChartPanel>
        )}

        {indexes?.indexes && indexes.indexes.length > 0 && (
          <ChartPanel title="Price_Index_Stability">
             <ResponsiveContainer width="100%" height={240}>
                <LineChart data={indexes.indexes.map((h) => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                  <XAxis dataKey="d" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="cpi" stroke="#000" strokeWidth={1.5} dot={false} name="CPI" />
                  <Line type="monotone" dataKey="coreCpi" stroke="#888" strokeWidth={1.5} dot={false} name="CORE" />
                </LineChart>
             </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>

      <div className="border border-surface-200 dark:border-surface-800">
         <div className="px-3 py-1 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex justify-between">
            <span className="font-black uppercase text-[10px]">Weekly_Regime_Log</span>
            <span className="opacity-40 uppercase">Current: {phases?.currentPhase}</span>
         </div>
         <table className="w-full text-left">
            <thead className="text-[8px] font-black uppercase text-surface-400 border-b border-surface-200 dark:border-surface-800">
               <tr>
                  <th className="px-4 py-2">PHASE</th>
                  <th className="px-4 py-2 text-right">START</th>
                  <th className="px-4 py-2 text-right">END</th>
                  <th className="px-4 py-2 text-right">DURATION</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-900">
               {filteredPhases.map((p, i) => (
                  <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                     <td className="px-4 py-2 uppercase font-bold">{p.phase}</td>
                     <td className="px-4 py-2 text-right opacity-60">{p.startDate}</td>
                     <td className="px-4 py-2 text-right opacity-60">{p.endDate || 'ACTV'}</td>
                     <td className="px-4 py-2 text-right font-black">{p.days}D</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}

function MacroBox({ label, value }: { label: string; value: string | number }) {
   return (
      <div className="bg-white dark:bg-surface-950 p-4 text-center">
         <p className="text-[8px] font-bold opacity-40 uppercase mb-1">{label}</p>
         <p className="text-sm font-black">{value}</p>
      </div>
   );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
   return (
      <div className="border border-surface-200 dark:border-surface-800">
         <div className="px-2 py-1 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 uppercase font-black text-[9px] tracking-widest">{title}</div>
         <div className="p-4">{children}</div>
      </div>
   );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
