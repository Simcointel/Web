import { useState, useCallback } from "react";
import { useApi } from "../hooks/useApi";
import { useSseConnected } from "../hooks/useSse";
import { api } from "../services/api";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import type { SimulationResult, ScenarioInfo } from "../types/api";

const SECTOR_LABELS: Record<string, string> = {
  "raw-materials": "Raw Materials", "energy-fuel": "Energy & Fuel", "agriculture": "Agriculture",
  "manufacturing": "Manufacturing", "technology": "Technology", "construction": "Construction", "services-finance": "Services & Finance",
};

function ImpactBar({ label, value, maxAbs }: { label: string; value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
  const isNeg = value < 0;
  const color = isNeg ? "bg-econ-red" : "bg-econ-green";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-right text-gray-600 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
        <div className={`absolute top-0 h-3 rounded-full ${color}`}
          style={{ left: isNeg ? `${50 - pct / 2}%` : "50%", width: `${pct / 2}%` }} />
        <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-gray-300" />
      </div>
      <span className={`w-20 font-mono text-right ${isNeg ? "text-econ-red" : "text-econ-green"}`}>
        {value > 0 ? "+" : ""}{value.toFixed(2)}
      </span>
    </div>
  );
}

export function SimulationLabPage() {
  const [realm, setRealm] = useState(0);
  const [scenario, setScenario] = useState("");
  const [magnitude, setMagnitude] = useState(1.0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const connected = useSseConnected();

  const { data: scenarioList } = useApi(() => api.simulation.list(), []);

  const handleRun = useCallback(async () => {
    if (!scenario) return;
    setRunning(true);
    setRunError(null);
    try {
      const r = await api.simulation.run(realm, scenario, magnitude);
      setResult(r);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, [realm, scenario, magnitude]);

  const maxImpact = result ? Math.max(1, ...result.sectors.map((s) => Math.abs(s.impact))) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Simulation Lab</h1>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-econ-green" : "bg-gray-300"}`} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Run what-if scenarios to model economic shocks and recovery</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Realm</label>
            <select value={realm} onChange={(e) => setRealm(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
              <option value={0}>Realm 0</option>
              <option value={1}>Realm 1</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Scenario</label>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
              <option value="">-- Select --</option>
              {(scenarioList ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Magnitude ({magnitude.toFixed(1)}x)</label>
            <input type="range" min={0.1} max={3} step={0.1} value={magnitude}
              onChange={(e) => setMagnitude(parseFloat(e.target.value))}
              className="w-full mt-2" />
          </div>
          <div className="flex items-end">
            <button onClick={handleRun} disabled={!scenario || running}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {running ? "Running..." : "Run Simulation"}
            </button>
          </div>
        </div>
        {scenario && scenarioList && (
          <p className="text-xs text-gray-400 mt-3">
            {scenarioList.find((s) => s.id === scenario)?.description}
          </p>
        )}
      </div>

      {runError && <ErrorState message={runError} />}

      {result && (
        <>
          {result.ok === false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              Simulation completed with errors: {result.winners?.length === 0 && result.losers?.length === 0 ? "Check scenario parameters" : "Partial results available"}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Projected Regime</div>
              <div className="text-lg font-bold font-mono text-gray-900">{result.projectedRegime}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Total Impact</div>
              <div className={`text-lg font-bold font-mono ${result.totalImpact >= 0 ? "text-econ-green" : "text-econ-red"}`}>
                {result.totalImpact > 0 ? "+" : ""}{result.totalImpact.toFixed(2)}
              </div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Recovery Estimate</div>
              <div className="text-lg font-bold font-mono text-gray-900">{result.recoveryEstimateDays}d</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Contagion Spread</div>
              <div className="text-lg font-bold font-mono text-econ-amber">{result.contagionSpread.toFixed(2)}</div>
            </div>
          </div>

          <Section title="Sector Impact Breakdown">
            <div className="card p-5 space-y-2">
              {result.sectors.map((s) => (
                <ImpactBar key={s.sector} label={SECTOR_LABELS[s.sector] ?? s.sector} value={s.impact} maxAbs={maxImpact} />
              ))}
              <p className="text-xs text-gray-400 mt-2">Positive = benefiting, Negative = harmed. Recovery range: {Math.min(...result.sectors.map((s) => s.recoveryDays))}d - {Math.max(...result.sectors.map((s) => s.recoveryDays))}d</p>
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Winners">
              <div className="card p-5">
                {result.winners.length === 0 ? <p className="text-sm text-gray-400">No winning sectors</p>
                  : <div className="space-y-2">
                      {result.winners.map((w) => {
                        const sec = result.sectors.find((s) => s.sector === w);
                        return (
                          <div key={w} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{SECTOR_LABELS[w] ?? w}</span>
                            <span className="text-sm font-mono text-econ-green">+{sec?.impact.toFixed(2) ?? "?"}</span>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            </Section>

            <Section title="Losers">
              <div className="card p-5">
                {result.losers.length === 0 ? <p className="text-sm text-gray-400">No losing sectors</p>
                  : <div className="space-y-2">
                      {result.losers.map((l) => {
                        const sec = result.sectors.find((s) => s.sector === l);
                        return (
                          <div key={l} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{SECTOR_LABELS[l] ?? l}</span>
                            <span className="text-sm font-mono text-econ-red">{sec?.impact.toFixed(2) ?? "?"}</span>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            </Section>
          </div>

          {result.propagationSteps.length > 0 && (
            <Section title="Propagation Timeline" subtitle="How the shock spreads through the economy">
              <div className="card p-5">
                <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
                  {result.propagationSteps.map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                      <p className="text-sm text-gray-700">
                        <span className="font-mono text-xs text-gray-400 mr-2">Step {step.step}</span>
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      {!result && scenarioList && scenarioList.length > 0 && (
        <Section title="Available Scenarios">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarioList.map((s) => (
              <button key={s.id} onClick={() => { setScenario(s.id); }}
                className={`text-left card p-4 hover:shadow-md transition-shadow ${scenario === s.id ? "ring-2 ring-blue-500" : ""}`}>
                <h4 className="text-sm font-semibold text-gray-900">{s.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
                  <span>Shock: {(s.shockPct * 100).toFixed(0)}%</span>
                  <span>Duration: {s.durationDays}d</span>
                  <span className="capitalize">{s.category}</span>
                </div>
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
