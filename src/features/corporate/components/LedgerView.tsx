import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { BarChart3, Download, History, ArrowRight } from 'lucide-react';

export function LedgerView({ state }: any) {
  return (
    <div className="layout-grid grid-cols-1 lg:grid-cols-12">
       <div className="lg:col-span-8">
          <Card
             title="Transaction History"
             icon={History}
             subtitle="Audit Trail"
             headerActions={
                <Button variant="secondary" size="sm">
                   <Download size={14} className="mr-2" /> Export CSV
                </Button>
             }
          >
             <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl opacity-30">
                <BarChart3 size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No Historical Data Parsed</p>
                <p className="text-xs mt-2 italic font-medium">Upload financial logs to populate ledger</p>
             </div>
          </Card>
       </div>

       <div className="lg:col-span-4 space-y-6">
          <Card title="Performance Extract" icon={BarChart3}>
             <div className="space-y-6">
                <div>
                   <p className="txt-label mb-1">AGGREGATED_DAILY_PROFIT</p>
                   <p className="text-3xl font-black text-teal-600 tracking-tighter tabular-nums">
                      ${(state.settings.estDailyProfit/1000).toFixed(1)}K
                   </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                   <p className="txt-label">RECENT_ANOMALIES</p>
                   <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold">None Detected</span>
                      <Badge variant="neutral">HEALTHY</Badge>
                   </div>
                </div>
             </div>
          </Card>
       </div>
    </div>
  );
}
