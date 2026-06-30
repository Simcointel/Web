import React from 'react';
import { useSharedRealm } from '../hooks/useSharedRealm';
import { useDataRepoPoll } from '../hooks/useDataRepo';
import * as dataRepo from '../services/dataRepo';
import { LoadingState } from '../components/States';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  Globe, Calendar, TrendingUp,
  ShieldCheck, Activity
} from 'lucide-react';

export function MacroPage() {
  const [realm] = useSharedRealm();
  const { data: dash, loading } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);

  if (loading && !dash) return <LoadingState text="Synthesizing Macroeconomic Vectors..." />;

  const ds = (dash as any)?.[String(realm)];
  const regime = ds?.regime;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Macro.<span className="text-sky-600">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Global economy regime analysis and cycle forecasting.</p>
        </div>
      </div>

      <div className="layout-grid grid-cols-1 lg:grid-cols-12">
         <div className="lg:col-span-4">
            <Card title="Current Regime" icon={Globe} className="bg-sky-600 border-none text-white overflow-hidden relative">
               <Globe className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10" />
               <div className="relative z-10 py-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">ACTIVE_PHASE</p>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                     {regime?.na || 'Normal'}
                  </h2>
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                     <ShieldCheck size={16} />
                     <span className="text-xs font-black">Stability Index: 84%</span>
                  </div>
               </div>
            </Card>
         </div>

         <div className="lg:col-span-8">
            <Card title="Phase Characteristics" icon={Activity} subtitle="Algorithmic Multipliers">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MultiplierCard label="Production Speed" value="+12%" color="text-emerald-600" />
                  <MultiplierCard label="Retail Demand" value="-5%" color="text-rose-600" />
                  <MultiplierCard label="Sourcing Cost" value="+2%" color="text-amber-600" />
               </div>

               <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                        <Calendar size={18} className="text-sky-600" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Forecasted Duration</p>
                        <p className="text-sm font-black italic">Approx. 2.4 days remaining in current phase.</p>
                     </div>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function MultiplierCard({ label, value, color }: any) {
   return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
         <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{label}</p>
         <p className={cn("text-2xl font-black tabular-nums tracking-tighter", color)}>{value}</p>
      </div>
   );
}
