import { useState } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import type { DependencyData, BottleneckChain } from "../types/api";

const SECTOR_COLORS: Record<string, string> = {
  "raw-materials": "#d97706", "energy-fuel": "#dc2626", "agriculture": "#059669",
  "manufacturing": "#3b82f6", "technology": "#7c3aed", "construction": "#ea580c", "services-finance": "#0891b2",
};
const SECTOR_LABELS: Record<string, string> = {
  "raw-materials": "Raw Materials", "energy-fuel": "Energy & Fuel", "agriculture": "Agriculture",
  "manufacturing": "Manufacturing", "technology": "Technology", "construction": "Construction", "services-finance": "Services & Finance",
};

function DepGraph({ data }: { data: DependencyData }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sectors = Object.keys(data.dependencyMatrix ?? {});
  if (sectors.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No dependency graph data</p>;

  const maxScore = Math.max(1, ...Object.values(data.riskScores ?? {}));

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(sectors.length * 80, 400)} height={Math.max(sectors.length * 80, 400)} className="mx-auto">
        {sectors.map((s1, i) => sectors.map((s2, j) => {
          if (i === j || !data.dependencyMatrix[s1]?.[s2]) return null;
          const weight = data.dependencyMatrix[s1][s2];
          const strokeW = Math.max(1, weight * 4);
          const opacity = hovered ? (hovered === s1 || hovered === s2 ? 1 : 0.08) : 0.3;
          return (
            <line key={s1 + "-" + s2}
              x1={80 + i * 80} y1={40 + i * 60}
              x2={80 + j * 80} y2={40 + j * 60}
              stroke={SECTOR_COLORS[s1] ?? "#6b7280"}
              strokeWidth={strokeW} strokeOpacity={opacity}
            />
          );
        }))}
        {sectors.map((s, i) => {
          const riskScore = data.riskScores?.[s] ?? 0;
          const r = 20 + (riskScore / maxScore) * 15;
          const isHovered = hovered === s;
          return (
            <g key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              <circle cx={80 + i * 80} cy={40 + i * 60} r={r}
                fill={SECTOR_COLORS[s] ?? "#6b7280"}
                fillOpacity={hovered && !isHovered ? 0.2 : 0.6}
                stroke={isHovered ? "#000" : "transparent"}
                strokeWidth={2}
              />
              <text x={80 + i * 80} y={40 + i * 60} textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize={10} fontWeight="bold">
                {s === "services-finance" ? "S&F" : s === "raw-materials" ? "Raw" : s === "energy-fuel" ? "Fuel" : s.charAt(0).toUpperCase() + s.slice(1, 4)}
              </text>
              {isHovered && (
                <text x={80 + i * 80} y={40 + i * 60 + r + 16} textAnchor="middle" fontSize={10} fill="#374151">
                  {SECTOR_LABELS[s] ?? s} (risk: {riskScore.toFixed(1)})
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BottleneckCard({ chain, index }: { chain: BottleneckChain; index: number }) {
  const color = chain.pressure > 0.7 ? "text-econ-red" : chain.pressure > 0.4 ? "text-econ-amber" : "text-gray-600";
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
        <span className={`text-xs font-semibold ${color}`}>{(chain.pressure * 100).toFixed(0)}% pressure</span>
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">{chain.chain}</h4>
      <div className="flex flex-wrap gap-1">
        {chain.sectors.map((s) => (
          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{SECTOR_LABELS[s] ?? s}</span>
        ))}
      </div>
      <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${chain.pressure > 0.7 ? "bg-econ-red" : chain.pressure > 0.4 ? "bg-econ-amber" : "bg-blue-500"}`}
          style={{ width: `${(chain.pressure * 100).toFixed(0)}%` }} />
      </div>
    </div>
  );
}

export function DependenciesPage() {
  const [realm, setRealm] = useState(0);
  const connected = useSseConnected();
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDependencies(realm), 120000, [realm]);
  useSseEvent("pipeline_forecast_complete", () => refresh());

  if (loading) return <LoadingState text="Mapping dependencies..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (!data) return <EmptyState message="No dependency data available" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Supply Chain Risk</h1>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-econ-green" : "bg-gray-300"}`} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Sector dependency graph, bottleneck risks, and critical resource analysis</p>
        </div>
        <select value={realm} onChange={(e) => setRealm(Number(e.target.value))} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <Section title="Dependency Graph" subtitle="Sector interdependencies — thicker lines = stronger dependency">
        <div className="card p-5">
          <DepGraph data={data} />
          <p className="text-xs text-gray-400 mt-3 text-center">Hover a node to highlight its connections. Circle size reflects risk score.</p>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Bottleneck Risks" subtitle="Supply chain pressure points">
          <div className="space-y-3">
            {data.bottleneckChains.length === 0 ? (
              <p className="text-sm text-gray-400">No bottleneck chains detected</p>
            ) : data.bottleneckChains.map((c, i) => <BottleneckCard key={c.chain} chain={c} index={i} />)}
          </div>
        </Section>

        <Section title="Critical Resources" subtitle="Resources exceeding dependency threshold">
          <div className="card p-5">
            {data.criticalResources.length === 0 ? (
              <p className="text-sm text-gray-400">No critical resources identified</p>
            ) : (
              <div className="space-y-3">
                {data.criticalResources.map((r) => (
                  <div key={r} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                    <span className="w-2 h-2 bg-econ-red rounded-full shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r}</p>
                      <p className="text-xs text-gray-500">Critical dependency threshold exceeded</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>

      <Section title="Risk Scores" subtitle="Per-sector supply chain risk assessment">
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.risks.map((r) => {
              const color = r.score > 0.7 ? "text-econ-red" : r.score > 0.4 ? "text-econ-amber" : "text-gray-600";
              return (
                <div key={r.sector} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{SECTOR_LABELS[r.sector] ?? r.sector}</span>
                    {r.critical && <span className="text-[10px] bg-econ-red text-white px-1.5 py-0.5 rounded">CRITICAL</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Upstream: <span className={color}>{r.upstreamPressure.toFixed(2)}</span></span>
                    <span>Downstream: <span className={color}>{r.downstreamPressure.toFixed(2)}</span></span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${r.score > 0.7 ? "bg-econ-red" : r.score > 0.4 ? "bg-econ-amber" : "bg-blue-500"}`}
                      style={{ width: `${(r.score * 100).toFixed(0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {data.risks.length > 0 && (
        <Section title="Upstream & Downstream Pressure">
          <div className="card p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="text-left py-2 pr-4">Sector</th>
                    <th className="text-right py-2 px-4">Upstream</th>
                    <th className="text-right py-2 px-4">Downstream</th>
                    <th className="text-right py-2 pl-4">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {data.risks.map((r) => {
                    const net = r.upstreamPressure - r.downstreamPressure;
                    return (
                      <tr key={r.sector} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-900">{SECTOR_LABELS[r.sector] ?? r.sector}</td>
                        <td className="py-2 px-4 text-right font-mono">{r.upstreamPressure.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono">{r.downstreamPressure.toFixed(2)}</td>
                        <td className={`py-2 pl-4 text-right font-mono ${net > 0 ? "text-econ-red" : "text-econ-green"}`}>
                          {net > 0 ? "+" : ""}{net.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Positive net = sector is more dependent on upstream supply. Negative net = sector has more downstream pressure on its output.
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}
