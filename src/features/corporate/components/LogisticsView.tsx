import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Package, Search, Ship, BarChart3 } from 'lucide-react';
import { RESOURCES } from '../../../data/simco_static';

export function LogisticsView({ state, setState, core }: any) {
  const [q, setQ] = useState("");
  const filteredRes = useMemo(() =>
    RESOURCES.filter(r => r.name.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  const updateInventory = (id: number, qty: number) => {
     const next = [...state.inventory.filter((i: any) => i.id !== id)];
     if (qty > 0) next.push({ id, qty });
     setState({ ...state, inventory: next });
  };

  return (
    <div className="layout-grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-6">
        <Card title="Warehouse Management" icon={Package}>
           <div className="space-y-4 flex flex-col h-[600px]">
              <Input
                 placeholder="Search Resources..."
                 value={q}
                 onChange={(e) => setQ(e.target.value)}
                 icon={Search}
              />
              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-1">
                 {filteredRes.map(r => {
                    const item = state.inventory.find((i: any) => i.id === r.id);
                    return (
                       <div key={r.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                          <span className="text-xs font-bold truncate pr-4">{r.name}</span>
                          <div className="w-24">
                             <input
                                type="number"
                                value={item?.qty || ""}
                                onChange={(e) => updateInventory(r.id, Number(e.target.value))}
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md px-2 py-1 text-xs font-black text-right outline-none tabular-nums"
                                placeholder="0"
                             />
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Storage Metrics" icon={BarChart3}>
               <div className="space-y-6">
                  <div>
                     <p className="txt-label">INVENTORY_LIQUIDITY</p>
                     <p className="text-3xl font-black text-indigo-600 mt-1">$0.00</p>
                     <p className="text-[11px] text-slate-500 font-medium italic mt-2">Calculated from VWAP market prices</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                     <p className="txt-label">TRANSPORT_REQ</p>
                     <p className="text-2xl font-black mt-1">0 <span className="text-xs opacity-40">UNITS</span></p>
                  </div>
               </div>
            </Card>

            <Card title="Supply Chain" icon={Ship} className="bg-indigo-900 text-white border-none">
               <div className="space-y-4">
                  <p className="text-sm font-medium opacity-80 leading-relaxed">
                     Automated logistics calculations are integrated with your facility levels to determine material throughput and shipping requirements.
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                     <p className="text-xs font-bold uppercase tracking-widest opacity-60">Status</p>
                     <p className="text-lg font-black mt-2 text-indigo-300">OPTIMAL_THROUGHPUT</p>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
