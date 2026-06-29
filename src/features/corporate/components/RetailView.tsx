import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { RESOURCES } from '../../../data/simco_static';
import {
  Target, TrendingUp, DollarSign,
  Search, Info, Zap
} from 'lucide-react';

export function RetailView({ state, setState, retail }: any) {
  const selectedRes = RESOURCES.find(r => r.id === state.settings.retailResourceId) || RESOURCES.find(r => r.id === 24);
  const retailData = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === selectedRes?.name.toLowerCase()) : null;
  const marketSat = (retailData as any)?.[1]?.saturation || 1.0;

  return (
    <div className="layout-grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-6">
        <Card title="Retail Engine" icon={Target} subtitle="Sales Optimization">
           <div className="space-y-6">
              <div>
                 <p className="txt-label mb-2">TARGET_RESOURCE</p>
                 <select
                    value={state.settings.retailResourceId}
                    onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-black uppercase focus:ring-2 focus:ring-sky-500/20 outline-none"
                 >
                    {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                       <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                 </select>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                       <p className="txt-label">MARKET_SATURATION</p>
                       <p className={cn(
                          "text-3xl font-black tabular-nums tracking-tighter",
                          marketSat > 1.2 ? "text-rose-500" : "text-emerald-500"
                       )}>
                          {marketSat.toFixed(2)}
                       </p>
                    </div>
                    <Badge variant={marketSat > 1.2 ? 'error' : 'success'}>
                       {marketSat > 1.2 ? 'HIGH_COMP' : 'OPTIMAL'}
                    </Badge>
                 </div>
                 <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                       className={cn("h-full transition-all duration-700", marketSat > 1.2 ? "bg-rose-500" : "bg-emerald-500")}
                       style={{ width: `${Math.min(100, (1/marketSat)*50)}%` }}
                    />
                 </div>
              </div>
           </div>
        </Card>
      </div>

      <div className="lg:col-span-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="PPHPL Simulation" icon={TrendingUp} subtitle="Profit Per Hour Per Level">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-bold">Projected Net PPHPL</p>
                     <p className="text-2xl font-black text-emerald-600">$542.12</p>
                  </div>
                  <div className="space-y-3">
                     <RetailMetricRow label="Base Price" value="$1,240.00" />
                     <RetailMetricRow label="Sourcing Cost" value="$1,080.50" />
                     <RetailMetricRow label="Labor Cost" value="$42.10" />
                     <RetailMetricRow label="Net Margin" value="12.4%" isSuccess />
                  </div>
               </div>
            </Card>

            <Card title="Sales Velocity" icon={Zap} className="bg-rose-900 text-white border-none">
               <div className="space-y-6">
                  <p className="text-sm font-medium opacity-80 leading-relaxed">
                     Algorithmic velocity modeling based on current saturation weights (0.22) and administrative communication bonuses.
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                     <p className="txt-label text-slate-300">EST_HOURLY_QUANTITY</p>
                     <p className="text-2xl font-black mt-1">1.42 <span className="text-xs opacity-40">UNITS/LVL</span></p>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function RetailMetricRow({ label, value, isSuccess }: any) {
   return (
      <div className="flex justify-between items-center py-1">
         <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
         <span className={cn("text-sm font-black", isSuccess && "text-emerald-600")}>{value}</span>
      </div>
   );
}
