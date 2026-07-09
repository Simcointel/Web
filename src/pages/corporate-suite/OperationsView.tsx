import React, { useState, useMemo } from "react";
import {
  Building2, HardHat, Search, Plus, Trash2, TrendingUp, Zap
} from "lucide-react";
import { Section } from "../../components/Layout";
import { BUILDINGS, CONSTRUCTION_MATERIALS } from "../../data/simco_static";
import { n } from "./types";

import type { SuiteViewProps } from "./types";

export function OperationsView({ state, setState, core }: SuiteViewProps) {
  const [q, setQ] = useState("");
  const filteredBuildings = useMemo(() => BUILDINGS.filter(b => b.name.toLowerCase().includes(q.toLowerCase())), [q]);

  const constructionTotals = useMemo(() => {
    const totals: Record<number, number> = { 101: 0, 102: 0, 108: 0, 111: 0, 110: 0, 0: 0 };
    (state.map || []).forEach(m => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (!b) return;
      totals[0] += b.cost * (n(m.level) <= 1 ? 1 : n(m.level));
      b.resources.forEach(r => {
         if (r.id !== 109) totals[r.id] = (totals[r.id] || 0) + (r.qty * (n(m.level) || 1));
      });
    });
    return totals;
  }, [state.map]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
       <div className="md:col-span-5 space-y-6">
          <Section title="Facility Management" icon={Building2} color="text-emerald-600">
             <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                   <input
                     value={q}
                     onChange={(e) => setQ(e.target.value)}
                     placeholder="Search buildings..."
                     className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                   />
                </div>
                <button
                  onClick={() => {
                    const b = filteredBuildings[0] || BUILDINGS[0];
                    setState({...state, map: [...(state.map || []), { id: b.id, level: 1 }]});
                  }}
                  className="btn !bg-emerald-600 text-white !px-4 shadow-sm font-bold"
                >
                  <Plus size={16} />
                </button>
             </div>
             <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {(state.map || []).map((m, i) => (
                   <div key={i} className="card p-3 flex items-center gap-4 hover:border-emerald-600/30 transition-all border-l-4 border-emerald-600 !shadow-none border-surface-200 dark:border-surface-800">
                      <div className="flex-1">
                         <select value={m.id} onChange={(e) => { const next = [...state.map]; next[i].id = e.target.value; setState({...state, map: next}); }} className="bg-transparent border-none p-0 font-bold uppercase w-full outline-none text-sm">
                            {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                         <p className="text-xs text-surface-400 font-medium mt-1">Instance Ref: {i+1} {m.instanceId ? `(ID: ${m.instanceId})` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-900 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-800">
                         <span className="text-[10px] font-bold text-surface-400 uppercase">LVL</span>
                         <input type="number" value={m.level} onChange={(e) => { const next = [...state.map]; next[i].level = Number(e.target.value); setState({...state, map: next}); }} className="w-8 bg-transparent border-none p-0 text-sm font-bold text-center outline-none" />
                      </div>
                      <button
                        onClick={() => setState({...state, map: state.map.filter((_, idx) => idx !== i)})}
                        className="p-2 text-surface-300 hover:text-rose-600 transition-colors"
                        aria-label="Remove facility"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                ))}
             </div>
          </Section>
       </div>
       <div className="md:col-span-7 space-y-6">
          <Section title="Construction Logistics" icon={HardHat} color="text-emerald-600">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-emerald-600 text-white p-6 relative overflow-hidden !shadow-none border-none">
                   <HardHat size={80} className="absolute -right-6 -bottom-6 opacity-10" />
                   <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-80">Total Capital Required</h3>
                   <span className="text-4xl font-bold tabular-nums leading-none">$${(constructionTotals[0]/1000).toFixed(1)}K</span>
                </div>
                <div className="card p-6 space-y-3 !shadow-none border-surface-200 dark:border-surface-800">
                   <div className="space-y-2">
                      {[101, 102, 108, 111, 110].map(id => (
                        <div key={id} className="flex justify-between items-center text-sm border-b border-surface-100 dark:border-surface-800 pb-2 last:border-0">
                           <span className="font-medium text-surface-500">{CONSTRUCTION_MATERIALS.find(m => m.id === id)?.name}</span>
                           <span className="font-bold tabular-nums">{constructionTotals[id]?.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </Section>

          <Section title="Economic Outlook & Scaling" icon={Zap} color="text-emerald-600">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Production Bonus</span>
                         <div className="flex items-center gap-1">
                            <input type="number" value={state.settings?.prodBonus} onChange={(e) => setState({...state, settings: {...state.settings, prodBonus: Number(e.target.value)}})} className="w-16 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 font-bold text-emerald-600 outline-none" />
                            <span className="text-emerald-600 font-bold">%</span>
                         </div>
                      </div>
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Admin Overhead</span>
                         <span className="text-xl font-bold text-rose-600 block mt-1">{(core.actualAO*100).toFixed(1)}%</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 pt-4 border-t border-surface-100 dark:border-surface-800">
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Resource Abundance</span>
                         <div className="flex items-center gap-1">
                            <input type="number" value={state.settings?.abundance} onChange={(e) => setState({...state, settings: {...state.settings, abundance: Number(e.target.value)}})} className="w-16 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 font-bold text-brand-600 outline-none" />
                            <span className="text-brand-600 font-bold">%</span>
                         </div>
                      </div>
                      <div>
                         <span className="text-xs font-bold text-surface-400 uppercase block mb-1">Research Bonus</span>
                         <div className="flex items-center gap-1">
                            <input type="number" value={state.settings?.researchBonus} onChange={(e) => setState({...state, settings: {...state.settings, researchBonus: Number(e.target.value)}})} className="w-16 bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded px-2 py-1 font-bold text-amber-600 outline-none" />
                            <span className="text-amber-600 font-bold">%</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="card p-6 space-y-6 !shadow-none border-surface-200 dark:border-surface-800">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Scaling Simulation</p>
                         <p className="text-3xl font-bold">+{state.settings?.whatIfLevel} <span className="text-sm text-surface-400">Levels</span></p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-rose-500 uppercase mb-1">Projected AO</p>
                         <p className="text-xl font-bold tabular-nums text-rose-600">{(core.actualAO*100).toFixed(1)}%</p>
                      </div>
                   </div>
                   <input type="range" min="0" max="500" step="5" value={state.settings?.whatIfLevel} onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})} className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                </div>
             </div>
          </Section>

          <Section title="Profit Contribution Breakdown" icon={TrendingUp} color="text-emerald-600">
             <div className="card overflow-hidden !shadow-none border-surface-200 dark:border-surface-800">
                <table className="w-full text-sm">
                   <thead>
                      <tr className="text-surface-500 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                         <th className="text-left px-6 py-3 font-bold uppercase text-xs">Building Type</th>
                         <th className="text-center px-6 py-3 font-bold uppercase text-xs">Lvl</th>
                         <th className="text-right px-6 py-3 font-bold uppercase text-xs">Est. Profit/H</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                      {core.buildingProfits.map((p, i) => (
                         <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                            <td className="px-6 py-4 font-medium">{p.name}</td>
                            <td className="px-6 py-4 text-center text-surface-400 font-bold">{p.level}</td>
                            <td className={`px-6 py-4 text-right font-bold ${p.profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>$${p.profit.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </Section>
       </div>
    </div>
  );
}
