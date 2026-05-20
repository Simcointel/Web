import { useApiPoll } from "../hooks/useApi";
import { api } from "../services/api";
import { Section, CardGrid } from "../components/Layout";
import { StatCard } from "../components/StatCard";
import { LoadingState, EmptyState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useState } from "react";

type Tab = "correlations" | "anomalies" | "divergence" | "contagion";

export function CorrelationsPage() {
  const [tab, setTab] = useState<Tab>("correlations");
  const { data: correlations, loading: corrLoad } = useApiPoll(() => api.intelligence.correlations(), 30000);
  const { data: anomalies, loading: anomLoad } = useApiPoll(() => api.intelligence.anomalies(), 15000);
  const { data: divergence, loading: divLoad } = useApiPoll(() => api.intelligence.divergence(), 15000);
  const { data: contagion, loading: conLoad } = useApiPoll(() => api.intelligence.contagion(), 15000);

  const tabs: { key: Tab; label: string; loading: boolean }[] = [
    { key: "correlations", label: `Correlations (${correlations?.length ?? 0})`, loading: corrLoad },
    { key: "anomalies", label: `Anomalies (${anomalies?.length ?? 0})`, loading: anomLoad },
    { key: "divergence", label: `Divergence (${divergence?.length ?? 0})`, loading: divLoad },
    { key: "contagion", label: `Contagion (${contagion?.length ?? 0})`, loading: conLoad },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Correlations &amp; Anomalies</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cross-category correlations, anomaly detection, divergence signals, and contagion risk</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              tab === t.key
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "correlations" && (
        <Section title="Category Correlations" subtitle="Pairwise correlation coefficients across commodity categories">
          {corrLoad ? <LoadingState text="Loading correlations..." /> :
          !correlations?.length ? <EmptyState message="No correlation data available" /> :
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">Pair</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Coefficient</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {correlations.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-gray-900">{c.pair}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className={c.coefficient > 0.5 ? "text-econ-green" : c.coefficient < -0.3 ? "text-econ-red" : "text-gray-600"}>
                          {c.coefficient.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.strength === "strong" ? "bg-blue-100 text-blue-700" :
                          c.strength === "moderate" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{c.strength}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>}
        </Section>
      )}

      {tab === "anomalies" && (
        <Section title="Market Anomalies" subtitle="Z-score based anomaly detection events">
          {anomLoad ? <LoadingState text="Loading anomalies..." /> :
          !anomalies?.length ? <EmptyState message="No anomalies detected" /> :
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">Category</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Z-Score</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Deviation</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Direction</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {anomalies.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-900">{a.category}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className={a.zScore > 2 ? "text-econ-red" : a.zScore > 1.5 ? "text-econ-amber" : "text-gray-600"}>
                          {a.zScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">{a.deviation.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={a.direction === "above" ? "text-econ-green" : "text-econ-red"}>{a.direction}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500 text-xs">{new Date(a.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>}
        </Section>
      )}

      {tab === "divergence" && (
        <Section title="Sector Divergence" subtitle="Signals of sector-level divergence from expected patterns">
          {divLoad ? <LoadingState text="Loading divergence..." /> :
          !divergence?.length ? <EmptyState message="No divergence signals" /> :
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">Sector</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Strength</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Type</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {divergence.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-900">{d.sector}</td>
                      <td className="px-5 py-3 text-right font-mono">{d.strength.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{d.type}</td>
                      <td className="px-5 py-3 text-right">
                        <SeverityBadge severity={d.signal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>}
        </Section>
      )}

      {tab === "contagion" && (
        <Section title="Contagion Risk" subtitle="Risk of cascading failure across sectors">
          {conLoad ? <LoadingState text="Loading contagion..." /> :
          !contagion?.length ? <EmptyState message="No contagion signals" /> :
          <div className="grid gap-4">
            {contagion.map((c, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Origin: {c.origin}</span>
                    <span className="text-xs text-gray-500 ml-3">Spread: {c.spread.toFixed(2)}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    c.risk === "high" ? "bg-red-100 text-red-700" :
                    c.risk === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>{c.risk.toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">Affected sectors:</div>
                <div className="flex gap-1.5 flex-wrap">
                  {c.affected.map((a, j) => (
                    <span key={j} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>}
        </Section>
      )}
    </div>
  );
}
