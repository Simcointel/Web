import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { Section, CardGrid } from "../components/Layout";
import { LoadingState, EmptyState } from "../components/States";

export function IntelligencePage() {
  const { data: momentum, loading: momLoading } = useDataRepoPoll(() => dataRepo.fetchMomentum(0), 60000, [], () => api.intelligence.momentum());
  const { data: volatility, loading: volLoading } = useDataRepoPoll(() => dataRepo.fetchVolatility(0), 60000, [], () => api.intelligence.volatility());
  const { data: regimes, loading: regLoading } = useDataRepoPoll(() => dataRepo.fetchRegimes(0), 60000, [], () => api.intelligence.regimes());
  const { data: sectors, loading: secLoading } = useDataRepoPoll(() => dataRepo.fetchSectors(0), 60000, [], () => api.intelligence.sectors());

  if (momLoading && volLoading && regLoading && secLoading) return <LoadingState text="Loading intelligence..." />;

  const realm = momentum ? Object.keys(momentum)[0] : "0";
  const mom = momentum?.[realm];
  const vol = volatility?.[realm];
  const reg = regimes?.[realm];
  const secList = sectors?.[realm];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Market Intelligence</h1>
        <p className="text-sm text-gray-500 mt-0.5">Momentum, volatility, regime classification, and sector analysis</p>
      </div>

      <Section title="Market Overview">
        <CardGrid cols={4}>
          <StatCard title="Momentum" value={mom?.momentum != null ? mom.momentum.toFixed(2) : "-"}
            trend={mom ? { up: (mom.momentum ?? 0) >= 0, label: mom.direction } : undefined}
            color="border-l-blue-500" />
          <StatCard title="Volatility" value={vol?.volatility != null ? vol.volatility.toFixed(2) : "-"}
            subtitle={vol?.classification} color="border-l-amber-500" />
          <StatCard title="Regime" value={reg?.regime ?? "-"}
            subtitle={reg?.confidence ? `Confidence: ${reg.confidence}` : undefined} color="border-l-purple-500" />
          <StatCard title="Sectors Tracked" value={secList?.length ?? 0}
            color="border-l-green-500" />
        </CardGrid>
      </Section>

      {secList && secList.length > 0 && (
        <Section title="Sector Intelligence" subtitle="Strength, momentum, and volatility by category">
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600 text-xs uppercase">Sector</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Strength</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Momentum</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Leader</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600 text-xs uppercase">Volatility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {secList.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{s.sector}</td>
                      <td className="px-5 py-3 text-right"><StrengthBadge value={s.strength} /></td>
                      <td className="px-5 py-3 text-right font-mono">{s.momentum.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{s.leader}</td>
                      <td className="px-5 py-3 text-right"><StrengthBadge value={s.volatility} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {momentum && Object.keys(momentum).length > 0 && (
          <Section title="Momentum by Realm">
            <div className="card divide-y divide-gray-100">
              {Object.entries(momentum!).map(([r, m]) => {
                const m2 = m as any;
                return (
                <div key={r} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-gray-600">Realm {r}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold">{m2.momentum.toFixed(3)}</span>
                    <span className={`text-xs ${m2.direction === "up" ? "text-econ-green" : "text-econ-red"}`}>
                      {m2.direction === "up" ? "\u2191" : "\u2193"} {m2.trend.toFixed(2)}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </Section>
        )}

        {volatility && Object.keys(volatility).length > 0 && (
          <Section title="Volatility by Realm">
            <div className="card divide-y divide-gray-100">
              {Object.entries(volatility!).map(([r, v]) => {
                const v2 = v as any;
                return (
                <div key={r} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-gray-600">Realm {r}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold">{v2.volatility.toFixed(3)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${v2.classification === "low" ? "bg-green-100 text-green-700" : v2.classification === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {v2.classification}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function StrengthBadge({ value }: { value: number }) {
  const color = value >= 0.5 ? "text-econ-green" : value >= 0 ? "text-econ-amber" : "text-econ-red";
  return <span className={`font-mono ${color}`}>{value.toFixed(2)}</span>;
}
