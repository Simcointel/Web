import React, { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from "recharts";
import { TrendingUp, Activity, Filter, Calendar } from "lucide-react";

export function VWAPInflationPage() {
  const [realm, setRealm] = useSharedRealm();
  const { data, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchVWAPInflation(realm, 200), 120000, [realm]);

  if (loading && !data) return <LoadingState text="Syncing Global Price Indices..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const chartData = (data?.vwapInflation || []).map(d => ({
    ...d,
    dt: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    val: d.overall.vw
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Inflation.<span className="text-sky-600">Matrix</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Aggregated VWAP tracking and price integrity monitoring.</p>
        </div>

        <div className="flex items-center gap-4">
           <select
             value={realm}
             onChange={(e) => setRealm(Number(e.target.value))}
             className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
           >
             <option value={0}>REALM_0</option>
             <option value={1}>REALM_1</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8">
            <Card title="Price Index Evolution" icon={TrendingUp} subtitle="Global Market VWAP">
               <div className="h-[400px] mt-4">
                  {chartData.length > 1 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                           <XAxis
                              dataKey="dt"
                              tick={{ fontSize: 10, fontWeight: 600 }}
                              axisLine={false}
                              tickLine={false}
                              minTickGap={30}
                           />
                           <YAxis
                              tick={{ fontSize: 10, fontWeight: 600 }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `$${v}`}
                           />
                           <Tooltip
                              contentStyle={{
                                 backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                 border: 'none',
                                 borderRadius: '12px',
                                 color: '#fff',
                                 fontSize: '11px',
                                 fontWeight: 'bold',
                                 boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                              }}
                           />
                           <Line
                              type="monotone"
                              dataKey="val"
                              stroke="#0ea5e9"
                              strokeWidth={3}
                              dot={false}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                              name="Market Index"
                           />
                        </LineChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                        <Activity size={48} className="mb-4" />
                        <p>Insufficient Data Feed for Analysis</p>
                     </div>
                  )}
               </div>
            </Card>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <Card title="Market Vectors" icon={Activity}>
               <div className="space-y-6">
                  <VectorRow label="7D Delta" value="+0.42%" isPositive />
                  <VectorRow label="Volatility" value="Low" />
                  <VectorRow label="Stability" value="94.2%" isPositive />
               </div>
            </Card>

            <Card title="Analysis Methodology" icon={Calendar} className="bg-sky-600 border-none text-white overflow-hidden relative">
               <Calendar className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
               <div className="relative z-10 space-y-4">
                  <p className="text-sm font-medium leading-relaxed">
                     The Inflation Matrix utilizes a volume-weighted average price (VWAP) calculation across all tradeable assets to determine the fundamental purchasing power of the currency.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                     Detailed Methodology
                  </Button>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function VectorRow({ label, value, isPositive }: any) {
   return (
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
         <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
         <span className={`text-lg font-black tracking-tighter ${isPositive ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
            {value}
         </span>
      </div>
   );
}
