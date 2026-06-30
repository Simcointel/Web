import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Building2, Trash2, Plus, Zap, HardHat } from 'lucide-react';
import { BUILDINGS, CONSTRUCTION_MATERIALS } from '../../../data/simco_static';

export function OperationsView({ state, setState, core }: any) {
  const constructionTotals = React.useMemo(() => {
    const totals: Record<number, number> = { 101: 0, 102: 0, 108: 0, 111: 0, 110: 0, 0: 0 };
    state.map.forEach((m: any) => {
      const b = BUILDINGS.find(bu => bu.id === m.id);
      if (!b) return;
      totals[0] += b.cost * (m.level <= 1 ? 1 : m.level);
      b.resources.forEach((r: any) => {
         if (r.id !== 109) totals[r.id] = (totals[r.id] || 0) + (r.qty * (m.level || 1));
      });
    });
    return totals;
  }, [state.map]);

  const addFacility = () => {
     setState({
        ...state,
        map: [...state.map, { id: BUILDINGS[0].id, level: 1 }]
     });
  };

  const removeFacility = (index: number) => {
     setState({
        ...state,
        map: state.map.filter((_: any, i: number) => i !== index)
     });
  };

  const updateFacility = (index: number, updates: any) => {
     const newMap = [...state.map];
     newMap[index] = { ...newMap[index], ...updates };
     setState({ ...state, map: newMap });
  };

  return (
    <div className="layout-grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-7 space-y-6">
        <Card
           title="Active Facilities"
           subtitle="Production Infrastructure"
           icon={Building2}
           headerActions={
              <Button size="sm" variant="primary" onClick={addFacility}>
                 <Plus size={14} className="mr-1" /> Add
              </Button>
           }
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
            {state.map.length === 0 ? (
               <div className="py-12 text-center opacity-30">
                  <Building2 size={48} className="mx-auto mb-2" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Facilities Registered</p>
               </div>
            ) : state.map.map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1">
                  <select
                    value={m.id}
                    onChange={(e) => updateFacility(i, { id: e.target.value })}
                    className="w-full bg-transparent font-bold text-sm outline-none cursor-pointer"
                  >
                    {BUILDINGS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <p className="txt-label mt-1">ID: FAC_${i.toString().padStart(3, '0')}</p>
                </div>
                <div className="w-24">
                   <Input
                      type="number"
                      value={m.level}
                      onChange={(e) => updateFacility(i, { level: Number(e.target.value) })}
                      className="text-center font-black"
                   />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFacility(i)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                   <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-5 space-y-6">
         <Card title="Logistics & Scaling" icon={HardHat} className="bg-slate-900 text-white border-none">
            <div className="space-y-6">
               <div>
                  <p className="txt-label text-slate-400 mb-1">TOTAL_CAPEX_REQ</p>
                  <p className="text-3xl font-black tabular-nums tracking-tighter text-sky-400">$${(constructionTotals[0]/1000).toFixed(1)}K</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {[101, 102, 108, 111, 110].map(id => (
                     <div key={id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate">
                           {CONSTRUCTION_MATERIALS.find(m => m.id === id)?.name}
                        </p>
                        <p className="text-sm font-black mt-1">
                           {constructionTotals[id]?.toLocaleString()} <span className="text-[10px] opacity-40">U</span>
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         </Card>

         <Card title="Expansion Simulator" icon={Zap}>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <div>
                     <p className="txt-label">SIMULATED_LEVELS</p>
                     <p className="text-2xl font-black text-emerald-600">+{state.settings.whatIfLevel}</p>
                  </div>
                  <div className="text-right">
                     <p className="txt-label">EST_ADMIN_OVERHEAD</p>
                     <p className="text-lg font-bold text-rose-500">{(core.actualAO*100).toFixed(2)}%</p>
                  </div>
               </div>
               <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={state.settings.whatIfLevel}
                  onChange={(e) => setState({...state, settings: {...state.settings, whatIfLevel: Number(e.target.value)}})}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-600"
               />
            </div>
         </Card>
      </div>
    </div>
  );
}
