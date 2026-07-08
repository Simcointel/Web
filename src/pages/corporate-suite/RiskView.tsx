import { RESOURCES } from "../../data/simco_static";

export function RiskView({ phase, retail }: any) {
  return (
    <div className="card p-10 !shadow-none border-surface-200 dark:border-surface-800">
       <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-surface-500 mb-10 text-center">Global Market Sentiment & Risk Matrix</h3>
       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).slice(0, 24).map(res => {
             const retailItem: any = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === res.name.toLowerCase()) : null;
             const sat = retailItem?.[1]?.saturation || 1.0;
             return (
               <div key={res.id} className="card p-5 text-center border-b-4 border-indigo-600 !shadow-none border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-brand-900/10 transition-all">
                  <span className="block text-xs font-bold uppercase text-surface-400 truncate mb-3">{res.name}</span>
                  <span className={`text-2xl font-bold tabular-nums ${sat < 1 ? 'text-emerald-600' : 'text-rose-600'}`}>{sat.toFixed(2)}</span>
               </div>
             )
          })}
       </div>
    </div>
  );
}
