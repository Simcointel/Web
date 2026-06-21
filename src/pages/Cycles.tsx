import { useState, useMemo, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { StatCard } from "../components/StatCard";

const PHASE_COLORS: Record<string, string> = {
  expansion: "bg-econ-green", stagnation: "bg-econ-amber", recession: "bg-econ-red",
  recovery: "bg-brand-500", volatile: "bg-econ-purple", contraction: "bg-econ-red",
};
const PHASE_NAMES: Record<string, string> = {
  expansion: "Expansion", stagnation: "Stagnation", recession: "Recession",
  recovery: "Recovery", volatile: "Volatile", contraction: "Contraction",
};

export function CyclesPage() {
  const [realm, setRealm] = useState(0);
  const connected = useSseConnected();
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchCycles(realm), 120000, [realm]);
  useSseEvent("pipeline_forecast_complete", useCallback(() => refresh(), [refresh]));

  const phase = data?.current;
  const phaseKey = phase?.phase?.toLowerCase() ?? "";
  const phaseColorClass = PHASE_COLORS[phaseKey] ?? "bg-surface-400";
  const phaseName = PHASE_NAMES[phaseKey] ?? phase?.phase ?? "Neutral";

  if (loading && !data) return <LoadingState text="Calculating cycles..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!data) return <EmptyState message="Cycle analysis currently unavailable" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mb-2 inline-block">
            Market Dynamics
          </span>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">Economic Cycles</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Systemic phase detection and long-term transition probabilities.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
           <div className="card p-8 flex flex-col items-center text-center relative overflow-hidden h-full">
              <div className={`absolute top-0 left-0 w-full h-1 ${phaseColorClass}`}></div>
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-6">Current Detection</span>

              <div className={`w-32 h-32 rounded-full mb-6 flex items-center justify-center border-4 ${phaseColorClass.replace('bg-', 'border-')} ${phaseColorClass.replace('bg-', 'bg-')}/10 shadow-lg shadow-black/5`}>
                <span className={`text-5xl font-black ${phaseColorClass.replace('bg-', 'text-')}`}>
                  {phaseName.charAt(0)}
                </span>
              </div>

              <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-2">{phaseName}</h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-600 dark:text-surface-300 mb-8">
                {((phase?.confidence ?? 0) * 100).toFixed(0)}% Confidence
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                   <div className="text-[10px] font-bold text-surface-400 uppercase mb-1">Duration</div>
                   <div className="text-xl font-mono font-bold text-surface-900 dark:text-white">{phase?.duration ?? 0}d</div>
                </div>
                <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800">
                   <div className="text-[10px] font-bold text-surface-400 uppercase mb-1">Intensity</div>
                   <div className="text-xl font-mono font-bold text-surface-900 dark:text-white">{(phase?.intensity ?? 0).toFixed(2)}</div>
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50">
                 <h3 className="font-bold text-surface-900 dark:text-white">Transition Matrix</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.transitions.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-surface-400 text-sm italic">No probabilistic data available for this realm</div>
                ) : data.transitions.map((t: any, i: number) => {
                  const fromColor = PHASE_COLORS[t.from.toLowerCase()] ?? "bg-surface-400";
                  const toColor = PHASE_COLORS[t.to.toLowerCase()] ?? "bg-surface-400";
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${fromColor}`}></div>
                         <span className="text-xs font-bold text-surface-600 dark:text-surface-400 uppercase">{PHASE_NAMES[t.from.toLowerCase()] ?? t.from}</span>
                         <span className="text-surface-300">&rarr;</span>
                         <div className={`w-2 h-2 rounded-full ${toColor}`}></div>
                         <span className="text-xs font-bold text-surface-900 dark:text-white uppercase">{PHASE_NAMES[t.to.toLowerCase()] ?? t.to}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-brand-600 dark:text-brand-400">{(t.probability * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card p-6">
                 <h3 className="font-bold text-surface-900 dark:text-white mb-4">Cycle Stability</h3>
                 <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-surface-500 uppercase mb-1">
                        <span>Current Phase Stability</span>
                        <span>{(data.stability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-econ-green rounded-full transition-all duration-1000" style={{ width: `${(data.stability * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                       {data.stability > 0.7 ? "The current cycle is highly stable with low risk of immediate phase transition." :
                        data.stability > 0.4 ? "Market shows moderate stability; surveillance of leading indicators is recommended." :
                        "High transition risk detected. Prepare for systemic regime shift."}
                    </p>
                 </div>
              </div>
              <div className="card p-6">
                 <h3 className="font-bold text-surface-900 dark:text-white mb-4">Phase History</h3>
                 <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2">
                    {data.history.slice().reverse().map((h: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-800 last:border-0">
                         <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${PHASE_COLORS[h.phase.toLowerCase()] ?? "bg-surface-400"}`}></div>
                            <span className="text-xs font-bold text-surface-900 dark:text-white uppercase">{PHASE_NAMES[h.phase.toLowerCase()] ?? h.phase}</span>
                         </div>
                         <span className="text-[10px] font-mono text-surface-400">{h.startDate ? new Date(h.startDate).toLocaleDateString() : "Unknown"}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
