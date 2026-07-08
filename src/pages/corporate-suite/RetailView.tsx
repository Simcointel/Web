import { Target } from "lucide-react";
import { Section } from "../../components/Layout";
import { RESOURCES } from "../../data/simco_static";

export function RetailView({ state, setState, retail }: any) {
  const selectedRes = RESOURCES.find(r => r.id === state.settings?.retailResourceId) || RESOURCES.find(r => r.id === 24);
  const retailData = retail?.retail ? Object.entries(retail.retail).find(([k]) => k.toLowerCase() === selectedRes?.name.toLowerCase()) : null;
  const marketSat = (retailData as any)?.[1]?.saturation || 1.0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-4 space-y-6">
          <Section title="Retail Engine" icon={Target} color="text-rose-600">
             <div className="card p-6 border-l-4 border-rose-600 !shadow-none border-surface-200 dark:border-surface-800">
                <label className="text-xs font-bold text-surface-500 block mb-3 uppercase">Inventory Selection</label>
                <select value={state.settings?.retailResourceId} onChange={(e) => setState({...state, settings: {...state.settings, retailResourceId: Number(e.target.value)}})} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-lg py-2.5 px-4 font-bold text-sm outline-none focus:ring-1 focus:ring-rose-600 mb-6">
                   {RESOURCES.filter(r => r.retailInfo && r.retailInfo.length > 0).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                   ))}
                </select>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-surface-400 uppercase">Market Saturation</span>
                      <span className={`text-3xl font-bold ${marketSat > 1.2 ? 'text-rose-600' : 'text-emerald-600'}`}>{marketSat.toFixed(2)}</span>
                   </div>
                   <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className={`h-full ${marketSat > 1.2 ? 'bg-rose-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, (1/marketSat)*50)}%`, transition: 'width 0.7s ease-out' }} />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border-t-4 border-rose-600 !shadow-none border-surface-200 dark:border-surface-800">
             <span className="text-sm font-bold text-surface-500 block mb-3 uppercase tracking-wide">Velocity Sales Model</span>
             <p className="text-base font-medium text-surface-600 dark:text-surface-300 leading-relaxed">
                A market saturation of <span className="font-bold text-brand-600">{marketSat.toFixed(2)}</span> indicates {marketSat < 1 ? "optimal conditions for aggressive retail expansion" : "a highly competitive landscape requiring premium quality to maintain margins"}.
             </p>
          </div>
       </div>
    </div>
  );
}
