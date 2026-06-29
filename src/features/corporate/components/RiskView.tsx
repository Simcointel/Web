import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { RESOURCES } from '../../../data/simco_static';
import { AlertCircle, ShieldAlert, Zap, Globe } from 'lucide-react';

export function RiskView({ phase, retail }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <RiskCard title="Regime Exposure" value="MODERATE" icon={Globe} color="bg-amber-100 text-amber-700" />
         <RiskCard title="System Liquidity" value="STABLE" icon={Zap} color="bg-emerald-100 text-emerald-700" />
         <RiskCard title="Market Volatility" value="HIGH" icon={AlertCircle} color="bg-rose-100 text-rose-700" />
      </div>

      <Card title="Market Sentiment Matrix" icon={ShieldAlert} subtitle="Cross-Sector Saturation Analysis">
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 24).map(res => {
               const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
               const sat = retailItem?.[1]?.saturation || 1.0;

               return (
                  <div key={res.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center group hover:border-sky-500 transition-all">
                     <p className="text-[10px] font-bold text-slate-500 uppercase truncate mb-2">{res.name}</p>
                     <p className={`text-xl font-black italic tracking-tighter tabular-nums ${sat < 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sat.toFixed(2)}
                     </p>
                  </div>
               )
            })}
         </div>
      </Card>
    </div>
  );
}

function RiskCard({ title, value, icon: Icon, color }: any) {
   return (
      <Card className="flex-row items-center gap-4 py-4">
         <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={20} />
         </div>
         <div>
            <p className="txt-label">{title}</p>
            <p className="text-lg font-black tracking-tight">{value}</p>
         </div>
      </Card>
   );
}
