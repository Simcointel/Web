import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import type { CycleData } from "../types/api";

const PHASE_COLORS: Record<string, string> = {
  expansion: "#059669", stagnation: "#d97706", recession: "#dc2626",
  recovery: "#3b82f6", volatile: "#7c3aed", contraction: "#b91c1c",
};
const PHASE_NAMES: Record<string, string> = {
  expansion: "Expansion", stagnation: "Stagnation", recession: "Recession",
  recovery: "Recovery", volatile: "Volatile", contraction: "Contraction",
};

export function CyclesPage() {
  const [realm, setRealm] = useState(0);
  const connected = useSseConnected();
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchCycles(realm), 120000, [realm]);
  useSseEvent("pipeline_forecast_complete", () => refresh());

  const phase = data?.current;
  const phaseColor = PHASE_COLORS[phase?.phase ?? ""] ?? "#6b7280";
  const phaseName = PHASE_NAMES[phase?.phase ?? ""] ?? phase?.phase ?? "Unknown";

  if (loading) return <LoadingState text="Analyzing cycle data..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!data) return <EmptyState message="No cycle data available" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Economic Cycle</h1>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-econ-green" : "bg-gray-300"}`} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Market cycle phase detection and transition analysis</p>
        </div>
        <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="Current Cycle Phase">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: phaseColor + "22", border: `4px solid ${phaseColor}` }}>
                <span className="text-3xl font-bold font-mono" style={{ color: phaseColor }}>
                  {phaseName.charAt(0)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ color: phaseColor }}>{phaseName}</h2>
              <p className="text-sm text-gray-500 mb-4">Confidence: {((phase?.confidence ?? 0) * 100).toFixed(0)}%</p>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Duration</div>
                  <div className="font-mono font-semibold text-gray-900">{phase?.duration ?? 0}d</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Intensity</div>
                  <div className="font-mono font-semibold text-gray-900">{(phase?.intensity ?? 0).toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">Stability</div>
                  <div className="font-mono font-semibold text-gray-900">{(data.stability * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <Section title="Transition Probabilities">
          <div className="card p-5 space-y-2">
            {data.transitions.length === 0 ? (
              <p className="text-sm text-gray-400">No transition data yet</p>
            ) : data.transitions.slice(0, 6).map((t, i) => {
              const fromColor = PHASE_COLORS[t.from] ?? "#6b7280";
              const toColor = PHASE_COLORS[t.to] ?? "#6b7280";
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fromColor }} />
                  <span className="text-gray-700 text-xs">{PHASE_NAMES[t.from] ?? t.from}</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: toColor }} />
                  <span className="text-gray-700 text-xs">{PHASE_NAMES[t.to] ?? t.to}</span>
                  <span className="ml-auto font-mono text-xs font-semibold">{(t.probability * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {data.history.length > 0 && (
        <Section title="Cycle Timeline" subtitle="Historical phase transitions">
          <div className="card overflow-hidden">
            <div className="relative px-6 py-8">
              <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gray-200" />
              <div className="relative flex items-center justify-between">
                {data.history.map((h, i) => {
                  const c = PHASE_COLORS[h.phase] ?? "#6b7280";
                  const isLast = i === data.history.length - 1;
                  return (
                    <div key={i} className="flex flex-col items-center text-center" style={{ flex: 1 }}>
                      <div className={`w-4 h-4 rounded-full border-2 border-white mb-2 ${isLast ? "ring-2" : ""}`} style={{ backgroundColor: c }} />
                      <span className="text-xs font-medium text-gray-900">{PHASE_NAMES[h.phase] ?? h.phase}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {h.startDate ? new Date(h.startDate).toLocaleDateString() : ""}
                        {h.endDate ? " - " + new Date(h.endDate).toLocaleDateString() : " (Current)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Cycle Strength">
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Stability</span>
                  <span>{(data.stability * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(data.stability * 100).toFixed(0)}%` }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Intensity</span>
                  <span>{(data.intensity ?? 0).toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${Math.min((data.intensity ?? 0) * 50, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="What This Means">
          <div className="card p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              The economy is currently in <strong>{phaseName}</strong> phase with {((phase?.confidence ?? 0) * 100).toFixed(0)}% confidence.
              This phase has persisted for {phase?.duration ?? 0} days with an intensity of {(phase?.intensity ?? 0).toFixed(2)}.
              Market stability is rated at {(data.stability * 100).toFixed(0)}%.
              {data.stability > 0.7 ? " The cycle is relatively stable with low probability of near-term phase change." :
               data.stability > 0.4 ? " Moderate stability — some transition risk exists." :
               " Low stability — a phase transition may be approaching."}
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
