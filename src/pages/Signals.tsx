import { useState, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import type { SignalData } from "../types/api";

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const SEVERITY_COLORS: Record<string, string> = { critical: "bg-econ-red", high: "bg-econ-amber", medium: "bg-blue-500", low: "bg-gray-400" };
const SEVERITY_BG: Record<string, string> = { critical: "bg-red-50 border-red-200", high: "bg-amber-50 border-amber-200", medium: "bg-blue-50 border-blue-200", low: "bg-gray-50 border-gray-200" };

function SignalCard({ signal }: { signal: SignalData }) {
  const sevColor = SEVERITY_COLORS[signal.severity] ?? "bg-gray-400";
  const cardBg = SEVERITY_BG[signal.severity] ?? "bg-white border-gray-200";
  return (
    <div className={`card p-4 border-l-4 ${cardBg}`} style={{ borderLeftColor: signal.severity === "critical" ? "#dc2626" : signal.severity === "high" ? "#d97706" : signal.severity === "medium" ? "#3b82f6" : "#9ca3af" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sevColor}`} />
            <h3 className="text-sm font-semibold text-gray-900">{signal.label}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{signal.type.replace(/-/g, " ")}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevColor} text-white`}>{signal.severity}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <span className="text-gray-500">Confidence</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(signal.confidence * 100).toFixed(0)}%` }} />
            </div>
            <span className="font-mono text-gray-900">{(signal.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div>
          <span className="text-gray-500">Duration</span>
          <p className="font-mono text-gray-900 mt-0.5">{signal.estimatedDurationDays}d</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-xs text-gray-500">Affected Sectors</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {signal.affectedSectors.map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>
      </div>

      {signal.indicators.length > 0 && (
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600">Supporting indicators ({signal.indicators.length})</summary>
          <div className="mt-2 space-y-1">
            {signal.indicators.map((ind, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{ind.name}</span>
                <span className="font-mono">{ind.value.toFixed(2)} / {ind.threshold}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {signal.rationale && (
        <p className="text-xs text-gray-400 mt-2 italic">{signal.rationale}</p>
      )}
    </div>
  );
}

export function SignalsPage() {
  const [realm, setRealm] = useState(0);
  const [sortBy, setSortBy] = useState<"severity" | "confidence" | "duration">("severity");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const connected = useSseConnected();
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchSignals(realm), 120000, [realm]);
  useSseEvent("forecast_bubble_warning", () => refresh());
  useSseEvent("forecast_crash_warning", () => refresh());
  useSseEvent("forecast_major_reversal", () => refresh());

  const signals = (data ?? []).filter((s) => filterSeverity === "all" || s.severity === filterSeverity);
  signals.sort((a, b) => {
    if (sortBy === "severity") return (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0);
    if (sortBy === "confidence") return b.confidence - a.confidence;
    return b.estimatedDurationDays - a.estimatedDurationDays;
  });

  const severityCounts: Record<string, number> = {};
  for (const s of data ?? []) { severityCounts[s.severity] = (severityCounts[s.severity] ?? 0) + 1; }

  if (loading) return <LoadingState text="Analyzing signals..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Market Signals</h1>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-econ-green" : "bg-gray-300"}`} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Early-warning signals for regime shifts, bubbles, and corrections</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
            <option value={0}>Realm 0</option>
            <option value={1}>Realm 1</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Filter:</span>
        {["all", "critical", "high", "medium", "low"].map((sev) => (
          <button key={sev} onClick={() => setFilterSeverity(sev)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterSeverity === sev ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}>
            {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
            {sev !== "all" && severityCounts[sev] ? ` (${severityCounts[sev]})` : ""}
          </button>
        ))}
        <span className="text-xs text-gray-300 mx-1">|</span>
        <span className="text-xs text-gray-500 font-medium">Sort:</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="text-xs px-2 py-1 bg-white border border-gray-300 rounded text-gray-700">
          <option value="severity">Severity</option>
          <option value="confidence">Confidence</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      {!data || data.length === 0 ? <EmptyState message="No signals detected currently" />
        : signals.length === 0 ? <EmptyState message="No signals match the selected filter" />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((s, i) => <SignalCard key={s.type + i} signal={s} />)}
          </div>
      }
    </div>
  );
}
