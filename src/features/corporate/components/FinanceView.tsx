import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';
import { Wallet, Calculator, Percent, TrendingUp, AlertTriangle } from 'lucide-react';

export function FinanceView({ state, setState, core }: any) {
  return (
    <div className="layout-grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-6">
        <Card title="Fiscal Configuration" icon={Wallet}>
           <div className="space-y-6">
              <Input
                 label="EST_DAILY_PROFIT"
                 type="number"
                 value={state.settings.estDailyProfit}
                 onChange={(e) => setState({...state, settings: {...state.settings, estDailyProfit: Number(e.target.value)}})}
                 icon={TrendingUp}
              />
              <Input
                 label="TOTAL_LIABILITIES"
                 type="number"
                 value={state.debt.current}
                 onChange={(e) => setState({...state, debt: {...state.debt, current: Number(e.target.value)}})}
                 icon={AlertTriangle}
                 className="text-rose-600 font-bold"
              />
              <div className="grid grid-cols-2 gap-4">
                 <Input
                    label="DEBT_RATE"
                    type="number"
                    step="0.01"
                    value={state.debt.rate}
                    onChange={(e) => setState({...state, debt: {...state.debt, rate: Number(e.target.value)}})}
                    icon={Percent}
                 />
                 <Input
                    label="BANK_LEVEL"
                    type="number"
                    value={state.settings.bankLevel}
                    onChange={(e) => setState({...state, settings: {...state.settings, bankLevel: Number(e.target.value)}})}
                 />
              </div>
           </div>
        </Card>
      </div>

      <div className="lg:col-span-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Tax Engine" icon={Calculator}>
               <div className="space-y-4">
                  <StatLine label="Tax-Free Threshold" value={`$${(core.taxThreshold/1_000_000).toFixed(2)}M`} />
                  <StatLine label="Daily Safety Margin" value={`$${(core.taxThreshold/30/1000).toFixed(1)}K`} />
                  <StatLine label="Estimated Daily Tax" value={`-$${(core.estimatedDailyTax/1000).toFixed(1)}K`} isNegative />
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                     <p className="txt-label mb-2">TAXABLE_REVENUE</p>
                     <p className="text-xl font-black">$${Math.max(0, (state.settings.estDailyProfit - core.taxThreshold/30)).toLocaleString()}</p>
                  </div>
               </div>
            </Card>

            <Card title="Yield Analysis" icon={TrendingUp}>
               <div className="space-y-4">
                  <StatLine label="Daily Wages (Net)" value={`-$${(core.dailyWages * core.actualAO / 1000).toFixed(1)}K`} isNegative />
                  <StatLine label="Daily Interest" value={`-$${(core.dailyInterest / 1000).toFixed(1)}K`} isNegative />
                  <StatLine label="Admin Overhead Drag" value={`-$${(core.dailyWages * core.actualAO / 1000).toFixed(1)}K`} isNegative />
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                     <p className="txt-label mb-2">NET_DAILY_CASHFLOW</p>
                     <p className="text-xl font-black text-emerald-600">+$${(core.netDaily/1000).toFixed(1)}K</p>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function StatLine({ label, value, isNegative }: any) {
   return (
      <div className="flex justify-between items-center py-1">
         <span className="text-xs font-bold text-slate-500">{label}</span>
         <span className={cn("text-sm font-black", isNegative ? "text-rose-600" : "text-slate-900 dark:text-white")}>
            {value}
         </span>
      </div>
   );
}
