import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState } from "../components/States";

export function IntelligencePage() {
  const [realm, setRealm] = useState(0);
  const [search, setSearch] = useState("");
  const { data: momentum, loading: momLoading } = useDataRepoPoll(() => dataRepo.fetchMomentum(realm), 60000, [realm]);
  const { data: volatility, loading: volLoading } = useDataRepoPoll(() => dataRepo.fetchVolatility(realm), 60000, [realm]);
  const { data: regimes, loading: regLoading } = useDataRepoPoll(() => dataRepo.fetchRegimes(realm), 60000, [realm]);
  const { data: sectors, loading: secLoading } = useDataRepoPoll(() => dataRepo.fetchSectors(realm), 60000, [realm]);

  const realmKey = momentum ? Object.keys(momentum)[0] : String(realm);
  const mom = momentum?.[realmKey];
  const vol = volatility?.[realmKey];
  const reg = regimes?.[realmKey];
  const secList = sectors?.[realmKey];

  const filteredSectors = useMemo(() => {
    if (!secList) return [];
    if (!search) return secList;
    return secList.filter(s =>
      s.sector.toLowerCase().includes(search.toLowerCase()) ||
      s.leader.toLowerCase().includes(search.toLowerCase())
    );
  }, [secList, search]);

  if (momLoading && volLoading && regLoading && secLoading) return <LoadingState text="Synthesizing intelligence..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mb-2 inline-block">
            Market Signals
          </span>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Market Intelligence</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Deep analysis of market regimes, sector momentum, and volatility patterns.
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

      <CardGrid cols={4}>
        <StatCard title="Overall Momentum" value={mom?.momentum != null ? mom.momentum.toFixed(3) : "-"}
          trend={mom ? (mom.momentum >= 0 ? 1 : -1) : undefined}
          color="border-l-brand-500" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        <StatCard title="System Volatility" value={vol?.volatility != null ? vol.volatility.toFixed(3) : "-"}
          subtitle={vol?.classification?.toUpperCase()} color="border-l-econ-amber" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard title="Regime Status" value={reg?.regime ?? "-"}
          subtitle={reg?.confidence ? `CONFIDENCE: ${reg.confidence}%` : undefined} color="border-l-econ-purple" icon="M9.663 17h4.673M12 3v1" />
        <StatCard title="Active Sectors" value={secList?.length ?? 0}
          color="border-l-econ-green" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" />
      </CardGrid>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50 flex flex-wrap items-center justify-between gap-4">
           <h3 className="font-bold text-surface-900 dark:text-white">Sector Intelligence Matrix</h3>
           <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search sectors or leaders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 dark:text-white w-64"
              />
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-800/30 text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-200 dark:border-surface-800">
                <th className="px-6 py-4">Sector Category</th>
                <th className="px-6 py-4 text-right">Relative Strength</th>
                <th className="px-6 py-4 text-right">Momentum Vector</th>
                <th className="px-6 py-4 text-right">Current Leader</th>
                <th className="px-6 py-4 text-right">Risk/Volatility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {filteredSectors.map((s, i) => (
                <tr key={i} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group">
                  <td className="px-6 py-4">
                     <div className="font-bold text-surface-900 dark:text-white">{s.sector}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StrengthBadge value={s.strength} />
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-surface-700 dark:text-surface-300">
                    {s.momentum > 0 ? "+" : ""}{s.momentum.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-[10px] font-bold text-surface-600 dark:text-surface-400">
                      {s.leader}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <StrengthBadge value={s.volatility} reverse />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSectors.length === 0 && (
             <div className="py-20 text-center text-surface-400 font-medium">
                No sectors match your search parameters
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StrengthBadge({ value, reverse = false }: { value: number; reverse?: boolean }) {
  const positive = value >= 0.5;
  const neutral = value >= 0.2;

  let colorClass = "";
  if (reverse) {
    colorClass = value >= 0.7 ? "text-econ-red" : value >= 0.4 ? "text-econ-amber" : "text-econ-green";
  } else {
    colorClass = value >= 0.6 ? "text-econ-green" : value >= 0.3 ? "text-econ-amber" : "text-econ-red";
  }

  return (
    <div className="flex flex-col items-end">
       <span className={`font-mono font-bold ${colorClass}`}>
         {(value * 100).toFixed(1)}%
       </span>
       <div className="w-16 h-1 bg-surface-100 dark:bg-surface-800 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full ${colorClass.replace('text-', 'bg-')}`}
            style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
          />
       </div>
    </div>
  );
}
