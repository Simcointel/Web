import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Globe } from 'lucide-react';

import { PageHeader, MetricBox, ChartPanel } from '../components/ui/Common';
import { usePageTitleKey } from '../hooks/usePageTitle';
import { useMacroLatest, useMacroHistory, useMacroIndexes, useMacroPhases } from '../hooks/useDataQueries';
import { fmtNumber, fmtDuration } from '../utils/formatters';
import { useSharedRealm } from '../hooks/useSharedRealm';
import { LoadingState, ErrorState } from '../components/States';

interface PhaseRecord {
  phase: string;
  startDate: string;
  endDate: string | null;
  days: number;
}

export function MacroPage() {
  usePageTitleKey('macro');

  const [realm, setRealm] = useSharedRealm();
  const { data: latest, loading: lLoading, error: lError, refresh: lRefresh } = useMacroLatest();
  const { data: history } = useMacroHistory(120);
  const { data: indexes } = useMacroIndexes(200);
  const { data: phases } = useMacroPhases();

  const filteredPhases = useMemo<PhaseRecord[]>(() => {
    if (!phases?.phases) return [];
    return (phases.phases as PhaseRecord[]).slice().sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [phases]);

  if (lLoading && !latest) return <LoadingState text="Loading macro..." />;
  if (lError) return <ErrorState message={lError} onRetry={lRefresh} />;

  const h = latest?.latestHistory;
  const phasesList = filteredPhases;

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Macro Intelligence"
        subtitle="Company value, GDP & phase history"
        icon={<Globe size={18} className="text-violet-600" />}
        iconBg="bg-violet-100 dark:bg-violet-900/30"
        realm={realm}
        onRealmChange={setRealm}
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricBox
          label="Total System Value"
          value={h?.companiesValue != null ? `$${fmtNumber(h.companiesValue)}` : '—'}
        />
        <MetricBox
          label="Active Entities"
          value={h?.activeCompanies?.toLocaleString() ?? '—'}
        />
        <MetricBox
          label="Bonds Outstanding"
          value={h?.bondsSold != null ? fmtNumber(h.bondsSold) : '—'}
        />
        <MetricBox
          label="Total Facilities"
          value={h?.totalBuildings?.toLocaleString() ?? '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {history?.history && history.history.length > 0 && (
          <ChartPanel title="Market Value & GDP">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={(
                  indexes?.indexes
                    ? history.history.map(h => {
                        const ix = indexes.indexes.find(i => i.date === h.date);
                        return { ...h, gdp: ix?.gdp ?? null, d: new Date(h.date).toLocaleDateString() };
                      })
                    : history.history.map(h => ({ ...h, d: new Date(h.date).toLocaleDateString() }))
                )}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
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
              <LineChart data={indexes.indexes.map(h => ({ ...h, d: new Date(h.date).toLocaleDateString() }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="cpi" stroke="#ef4444" strokeWidth={2} dot={false} name="CPI" />
                <Line type="monotone" dataKey="coreCpi" stroke="#f59e0b" strokeWidth={2} dot={false} name="Core Index" />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}
      </div>

      {phasesList.length > 0 && (
        <div className="border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-surface-500">Phase Registry</span>
            <span className="text-xs font-bold text-brand-600 uppercase">Current: {phases?.currentPhase}</span>
          </div>
          <table className="w-full text-left">
            <thead className="text-xs font-bold uppercase text-surface-400 bg-surface-50/50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-800">
              <tr>
                <th className="px-4 py-2">Phase</th>
                <th className="px-4 py-2 text-right">Start</th>
                <th className="px-4 py-2 text-right">End</th>
                <th className="px-4 py-2 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {phasesList.map((p, i) => (
                <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                  <td className="px-4 py-2 font-bold">{p.phase}</td>
                  <td className="px-4 py-2 text-right text-surface-500">{p.startDate}</td>
                  <td className="px-4 py-2 text-right text-surface-500">{p.endDate || 'Active'}</td>
                  <td className="px-4 py-2 text-right font-bold">{fmtDuration(p.days)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
