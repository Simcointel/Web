import React, { useState, useMemo } from "react";
import { Package, Ship, Search, Layers } from "lucide-react";
import { Section } from "../../components/Layout";
import { RESOURCES } from "../../data/simco_static";

export function LogisticsView({ state, setState, core }: any) {
  const [q, setQ] = useState("");
  const filteredRes = useMemo(() => RESOURCES.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [q]);

  const inventorySummary = useMemo(() => {
    const totalQty = (state.inventory || []).reduce((sum: number, i: any) => sum + i.qty, 0);
    const topItems = [...(state.inventory || [])]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3)
      .map(i => RESOURCES.find(r => r.id === i.id)?.name);
    return { totalQty, topItems };
  }, [state.inventory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
       <div className="lg:col-span-4 space-y-6">
          <Section title="Warehouse Inventory" icon={Package} color="text-indigo-600">
             <div className="card p-4 flex flex-col h-[70vh] !shadow-none border-surface-200 dark:border-surface-800">
                <div className="relative mb-4">
                   <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                   <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-indigo-600 outline-none" />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
                   {filteredRes.slice(0, 100).map(r => {
                      const item = (state.inventory || []).find(i => i.id === r.id);
                      return (
                         <div key={r.id} className="flex justify-between items-center py-2.5 px-2 hover:bg-surface-50 dark:hover:bg-surface-900 transition-all">
                            <span className="font-bold text-surface-700 dark:text-surface-300">{r.name}</span>
                            <input type="number" value={item?.qty || ""} onChange={(e) => { const v = Number(e.target.value); const next = [...state.inventory.filter(i => i.id !== r.id)]; if (v > 0) next.push({ id: r.id, qty: v }); setState({...state, inventory: next}); }} className="w-20 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded px-2 py-1 text-sm font-bold text-right outline-none focus:ring-1 focus:ring-indigo-600" />
                         </div>
                      )
                   })}
                </div>
             </div>
          </Section>
       </div>
       <div className="lg:col-span-8 space-y-6">
          <Section title="Logistics Assessment" icon={Ship} color="text-indigo-600">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 border-l-4 border-indigo-600 !shadow-none border-surface-200 dark:border-surface-800 bg-indigo-50/10 dark:bg-indigo-900/5">
                   <span className="text-xs font-bold text-surface-500 block mb-2 uppercase tracking-wide">Current Stock Liquidity</span>
                   <span className="text-4xl font-bold text-indigo-600">$${(core.inventoryValue/1000).toFixed(1)}K</span>
                   <p className="text-[10px] text-surface-400 mt-2 font-bold uppercase">Estimated VWAP Value</p>
                </div>
                <div className="card p-6 border-l-4 border-indigo-600 !shadow-none border-surface-200 dark:border-surface-800 bg-indigo-50/10 dark:bg-indigo-900/5">
                   <span className="text-xs font-bold text-surface-500 block mb-2 uppercase tracking-wide">Estimated Transport Units</span>
                   <span className="text-4xl font-bold text-indigo-600">{Math.ceil(core.inventoryValue/500).toLocaleString()} <span className="text-lg opacity-40 font-medium">Req</span></span>
                   <p className="text-[10px] text-surface-400 mt-2 font-bold uppercase">Based on avg. weight</p>
                </div>
             </div>
          </Section>

          <Section title="Inventory Insights" icon={Layers} color="text-indigo-600">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 !shadow-none border-surface-200 dark:border-surface-800">
                   <span className="text-[10px] font-bold text-surface-400 uppercase block mb-1">Total Items</span>
                   <span className="text-2xl font-bold">{inventorySummary.totalQty.toLocaleString()}</span>
                </div>
                <div className="card p-6 !shadow-none border-surface-200 dark:border-surface-800 md:col-span-2">
                   <span className="text-[10px] font-bold text-surface-400 uppercase block mb-2">Major Components</span>
                   <div className="flex flex-wrap gap-2">
                      {inventorySummary.topItems.length > 0 ? inventorySummary.topItems.map((name, i) => (
                        <span key={i} className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full text-xs font-bold text-indigo-600">{name}</span>
                      )) : <span className="text-xs text-surface-400 italic">No inventory recorded</span>}
                   </div>
                </div>
             </div>
          </Section>
       </div>
    </div>
  );
}
