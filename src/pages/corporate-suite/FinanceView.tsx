import { Wallet } from "lucide-react";
import { Section } from "../../components/Layout";
import { ForecastLine } from "./components";

export function FinanceView({ state, setState, core }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
       <div className="md:col-span-4 space-y-6">
          <Section title="Fiscal Parameters" icon={Wallet} color="text-violet-600">
             <div className="card p-6 space-y-6 border-l-4 border-violet-600 !shadow-none border-surface-200 dark:border-surface-800">
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-surface-400">Bank Infrastructure</label>
                      <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                         <span className="text-[10px] font-bold">LVL</span>
                         <input type="number" value={state.settings?.bankLevel} onChange={(e) => setState({...state, settings: {...state.settings, bankLevel: Number(e.target.value)}})} className="w-8 bg-transparent text-center font-bold outline-none" />
                      </div>
                   </div>
                   <p className="text-[10px] text-surface-400 font-medium italic -mt-2">Bank level increases your tax-free threshold significantly.</p>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-surface-500">Estimated Daily Profit</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 font-bold text-lg">$</span>
                      <input type="number" value={state.settings?.estDailyProfit} onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg py-3 pl-8 pr-4 text-xl font-bold outline-none focus:ring-1 focus:ring-violet-600" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-surface-500">Total Liabilities (Debt)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-600 font-bold text-lg">$</span>
                      <input type="number" value={state.debt?.current} onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})} className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg py-3 pl-8 pr-4 text-xl font-bold !text-rose-600 outline-none focus:ring-1 focus:ring-rose-600" />
                   </div>
                </div>
             </div>
          </Section>
       </div>
       <div className="md:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
             <h3 className="text-sm font-bold uppercase text-violet-600">Tax Engine Analysis</h3>
             <div className="space-y-4">
                <ForecastLine label="Net Tax-Free Threshold" value={`$${(core.taxThreshold/1_000_000).toFixed(2)}M`} />
                <ForecastLine label="Daily Ceiling" value={`$${(core.taxThreshold/30/1000).toFixed(1)}K`} />
                <ForecastLine label="Est. Effective Tax Rate" value={`${((core.estimatedDailyTax / (state.settings?.estDailyProfit || 1)) * 100).toFixed(1)}%`} />
                <ForecastLine label="Estimated Daily Tax" value={`-$${(core.estimatedDailyTax/1000).toFixed(1)}K` } red />
             </div>
          </div>
          <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
             <h3 className="text-sm font-bold uppercase text-violet-600">Net Margin Breakdown</h3>
             <div className="space-y-4">
                <ForecastLine label="AO Wage Impact" value={`-$${(core.dailyWages * core.actualAO / 1000).toFixed(1)}K`} red />
                <ForecastLine label="Daily Interest Expense" value={`-$${(core.dailyInterest / 1000).toFixed(1)}K`} red />
                <ForecastLine label="Total Net Daily Yield" value={`+$${(core.netDaily/1000).toFixed(1)}K`} green />
             </div>
          </div>
       </div>
    </div>
  );
}
