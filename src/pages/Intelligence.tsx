import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Section } from "../components/Layout";
import { useMemo } from "react";
import { Brain, Link2, AlertTriangle, Zap, TrendingUp } from "lucide-react";

export function IntelligencePage() {
  const [realm] = useSharedRealm();
  const { data: correlations, loading: cLoading } = useDataRepoPoll(() => dataRepo.fetchCorrelations(realm), 120000, [realm]);
  const { data: anomalies, loading: aLoading } = useDataRepoPoll(() => dataRepo.fetchAnomalies(realm), 60000, [realm]);
  const { data: divergence, loading: dLoading } = useDataRepoPoll(() => dataRepo.fetchDivergence(realm), 60000, [realm]);

  const loading = cLoading || aLoading || dLoading;

  const content = useMemo(() => {
    if (loading && (!correlations || !anomalies || !divergence)) return <LoadingState text="Synthesizing Intel..." />;
    return null;
  }, [loading, correlations, anomalies, divergence]);

  if (content) return content;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-mono text-[10px]">
      <div className="flex items-center gap-3 border-b border-surface-100 dark:border-surface-800/50 pb-4">
         <div className="w-10 h-10 bg-brand-500 rounded flex items-center justify-center text-white shadow-lg">
            <Brain size={20} />
         </div>
         <div>
            <h1 className="text-xl font-black uppercase italic tracking-tight">System.<span className="text-brand-600">Intelligence</span></h1>
            <p className="text-[9px] font-bold text-surface-400 uppercase tracking-[0.2em]">Cross-sector correlation and anomaly detection</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Correlations */}
         <div className="lg:col-span-4 space-y-4">
            <Section title="CORRELATION_MATRIX" icon={Link2} color="text-brand-500">
               <div className="card divide-y divide-surface-50 dark:divide-surface-800">
                  {correlations?.slice(0, 15).map((c: any, i: number) => (
                     <div key={i} className="p-2 flex justify-between items-center hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                        <span className="font-bold uppercase truncate max-w-[150px]">{c.pair}</span>
                        <div className="flex items-center gap-3">
                           <span className={`text-[9px] font-black ${Math.abs(c.coefficient) > 0.8 ? 'text-emerald-500' : 'opacity-40'}`}>
                              {(c.coefficient * 100).toFixed(0)}%
                           </span>
                           <div className="w-12 h-1 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500" style={{ width: `${Math.abs(c.coefficient) * 100}%` }} />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </Section>
         </div>

         {/* Anomalies & Divergence */}
         <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Section title="ACTIVE_ANOMALIES" icon={AlertTriangle} color="text-amber-500">
                  <div className="card min-h-[300px]">
                     {anomalies?.length === 0 ? <EmptyState message="NO_ANOMALIES_DETECTED" /> : (
                        <div className="divide-y divide-surface-50 dark:divide-surface-800">
                           {anomalies?.map((a: any, i: number) => (
                              <div key={i} className="p-3 flex items-start gap-4 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                                 <div className={`w-1.5 h-1.5 rounded-full mt-1 ${Math.abs(a.zScore) > 3 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                                 <div className="flex-1">
                                    <div className="flex justify-between">
                                       <span className="font-black uppercase">{a.category}</span>
                                       <span className="opacity-40">{a.zScore.toFixed(2)}σ</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-surface-500 uppercase mt-1">
                                       Trading {a.direction} historical mean by {(Math.abs(a.deviation)*100).toFixed(1)}%
                                    </p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </Section>

               <Section title="SECTOR_DIVERGENCE" icon={Zap} color="text-violet-500">
                  <div className="card min-h-[300px]">
                     {divergence?.length === 0 ? <EmptyState message="INTEGRITY_NOMINAL" /> : (
                        <div className="divide-y divide-surface-50 dark:divide-surface-800">
                           {divergence?.map((d: any, i: number) => (
                              <div key={i} className="p-3 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="font-black uppercase">{d.sector}</span>
                                    <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase ${
                                       d.signal === 'critical' ? 'bg-rose-500 text-white' :
                                       d.signal === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>{d.type}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-violet-500" style={{ width: `${d.strength * 100}%` }} />
                                    </div>
                                    <span className="text-[8px] font-black opacity-40">{(d.strength * 100).toFixed(0)}%</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </Section>
            </div>

            <Section title="RESOURCES_FORECAST" icon={TrendingUp} color="text-emerald-500">
               <div className="card p-8 flex flex-col items-center justify-center border-dashed opacity-30">
                  <TrendingUp size={40} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Predictive engine training in progress</p>
               </div>
            </Section>
         </div>
      </div>
    </div>
  );
}
