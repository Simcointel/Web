import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';
import {
  TrendingUp, TrendingDown, Activity,
  Target, Zap, Globe, Package, Building2
} from 'lucide-react';

export function CommandView({ core, phase, margins, inventoryValue }: any) {
  return (
    <div className="layout-grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatMini label="LIQUID_ASSETS" value={`$${(inventoryValue/1000).toFixed(1)}K`} icon={Package} />
          <StatMini label="FIXED_ASSETS" value={`$${(core.mapValue/1_000_000).toFixed(2)}M`} icon={Building2} />
          <StatMini label="MARKET_PHASE" value={phase.toUpperCase()} icon={Globe} />
        </div>

        <Card title="Volatility Index" subtitle="Top Market Movers" icon={Activity}>
           <div className="space-y-4">
              {margins?.resources?.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded flex items-center justify-center font-bold text-[10px]">
                       {r.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-slate-500">${r.outputVwap.toFixed(2)}</span>
                    <Badge variant={r.marginDelta > 0 ? 'success' : 'error'} className="w-16 justify-center">
                       {r.marginDelta > 0 ? '+' : ''}{r.marginDelta.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
           </div>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card title="System Integrity" icon={Zap} className="bg-sky-600 border-none text-white overflow-hidden relative">
           <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
           <div className="relative z-10 space-y-4">
              <IntegrityRow label="C-SUITE" active={core.effMan > 0} />
              <IntegrityRow label="WAREHOUSE" active={inventoryValue > 0} />
              <IntegrityRow label="FACILITIES" active={core.totalLevels > 0} />
           </div>
        </Card>

        <Card title="Executive Summary" icon={Target}>
           <div className="space-y-4">
              <SummaryRow label="30D Forecast" value={`+$${(core.netDaily * 30 / 1_000_000).toFixed(2)}M`} />
              <SummaryRow label="Admin Drag" value={`${(core.actualAO * 100).toFixed(2)}%`} />
           </div>
        </Card>
      </div>
    </div>
  );
}

function StatMini({ label, value, icon: Icon }: any) {
  return (
    <div className="ui-card p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-sky-600 transition-colors">
        <Icon size={20} />
      </div>
      <div>
        <p className="txt-label">{label}</p>
        <p className="text-lg font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function IntegrityRow({ label, active }: any) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-bold tracking-wider opacity-80">{label}</span>
      <div className={cn(
        "w-2 h-2 rounded-full",
        active ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-white/20"
      )} />
    </div>
  );
}

function SummaryRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
      <span className="text-[11px] font-bold text-slate-500 uppercase">{label}</span>
      <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
