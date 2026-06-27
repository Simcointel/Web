import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { RESOURCES, BUILDINGS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Search, Info, Factory, ShoppingCart, TrendingUp, ChevronRight, BookOpen, Layers } from "lucide-react";
import { LoadingState } from "../components/States";

export function EncyclopediaPage() {
  const [realm] = useSharedRealm();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: margins, loading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);

  const filtered = useMemo(() => {
    return RESOURCES.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  const selected = useMemo(() =>
    RESOURCES.find(r => r.id === selectedId),
  [selectedId]);

  const selectedMargin = useMemo(() =>
    margins?.resources?.find((r: any) => r.id === selectedId),
  [margins, selectedId]);

  if (loading && !margins) return <LoadingState text="Accessing Knowledge Base..." />;

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500">
      <div className="col-span-12 lg:col-span-4 space-y-6">
         <div className="card h-[80vh] flex flex-col overflow-hidden shadow-xl">
            <div className="p-6 border-b border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-800/30">
               <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search Entity Database..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input !pl-12 !py-2.5 !bg-white dark:!bg-surface-900 !rounded-xl !border-none shadow-inner"
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-50 dark:divide-surface-800 scrollbar-hide">
               {filtered.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-4 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all flex justify-between items-center group ${selectedId === r.id ? 'bg-brand-50 dark:bg-brand-900/20 border-r-4 border-brand-600' : ''}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover:text-brand-600 transition-colors ${selectedId === r.id ? 'text-brand-600 shadow-sm bg-white dark:bg-surface-700' : ''}`}>
                           <Layers size={18} />
                        </div>
                        <span className={`text-sm font-black uppercase italic tracking-tighter ${selectedId === r.id ? 'text-brand-700 dark:text-brand-400' : 'text-surface-600 dark:text-surface-300'}`}>{r.name}</span>
                     </div>
                     <ChevronRight size={14} className={`text-surface-300 transition-transform ${selectedId === r.id ? 'translate-x-1 text-brand-600' : ''}`} />
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
         {selected ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="card p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden group shadow-2xl">
                  <div className="absolute -right-12 -top-12 text-brand-600/5 group-hover:scale-110 transition-transform duration-1000">
                     <BookOpen size={280} />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="px-3 py-1 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded text-[10px] font-black uppercase tracking-[0.2em]">Registry Node</div>
                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Resource_ID: {selected.id}</span>
                     </div>
                     <h1 className="text-5xl font-black uppercase tracking-tighter italic text-surface-900 dark:text-white">{selected.name}</h1>
                  </div>
                  {selectedMargin && (
                     <div className="relative z-10 text-right">
                        <span className="block text-[11px] font-black uppercase tracking-widest text-surface-400 mb-2 italic">Global Benchmark</span>
                        <span className="text-4xl font-black italic tracking-tighter tabular-nums text-brand-600">${selectedMargin.outputVwap.toFixed(2)}</span>
                     </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="card h-full flex flex-col shadow-xl">
                     <div className="px-8 py-5 border-b border-surface-50 dark:border-surface-800 flex items-center gap-4">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600 dark:text-brand-400 shadow-sm"><Factory size={20} /></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400">Industrial Profile</h3>
                     </div>
                     <div className="p-8 space-y-10">
                        <div>
                           <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest block mb-5 italic">Primary Production Unit</label>
                           <div className="card !bg-surface-50 dark:!bg-surface-800/50 p-6 flex items-center justify-between border-dashed border-2 hover:border-brand-600 transition-all cursor-default">
                              <span className="text-xl font-black uppercase italic tracking-tighter">{BUILDINGS.find(b => b.id === (selected as any).buildingId)?.name || 'Extraction Point'}</span>
                              <ChevronRight className="text-surface-300" />
                           </div>
                        </div>
                        {selected.inputs && (
                           <div>
                              <label className="text-[10px] font-black uppercase text-surface-400 tracking-widest block mb-5 italic">Input Composition</label>
                              <div className="grid grid-cols-1 gap-3">
                                 {Object.entries(selected.inputs).map(([id, qty]) => (
                                    <div key={id} className="flex justify-between items-center p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-100 dark:border-surface-800 shadow-sm hover:border-brand-600 transition-all cursor-default">
                                       <span className="text-sm font-black uppercase tracking-tight italic text-surface-700 dark:text-surface-200">{RESOURCES.find(r => r.id === Number(id))?.name || `ID_${id}`}</span>
                                       <div className="flex items-center gap-4">
                                          <span className="text-base font-black tabular-nums">{qty}</span>
                                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Units</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="card h-full flex flex-col shadow-xl">
                     <div className="px-8 py-5 border-b border-surface-50 dark:border-surface-800 flex items-center gap-4">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600 dark:text-brand-400 shadow-sm"><ShoppingCart size={20} /></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400">Retail Dynamics</h3>
                     </div>
                     <div className="p-8">
                        {selected.retailInfo && selected.retailInfo.length > 0 ? (
                           <div className="space-y-10">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="card p-6 text-center border-l-4 border-l-emerald-600 bg-surface-50/50 dark:bg-surface-800/30 shadow-sm">
                                    <span className="block text-[10px] font-black uppercase text-surface-400 mb-2 italic tracking-widest">Market Demand</span>
                                    <span className="text-2xl font-black italic tracking-tighter">VOLATILE</span>
                                 </div>
                                 <div className="card p-6 text-center border-l-4 border-l-brand-600 bg-surface-50/50 dark:bg-surface-800/30 shadow-sm">
                                    <span className="block text-[10px] font-black uppercase text-surface-400 mb-2 italic tracking-widest">Sat. Multiplier</span>
                                    <span className="text-2xl font-black italic tracking-tighter">0.22</span>
                                 </div>
                              </div>
                              <div className="p-8 bg-surface-900 dark:bg-white rounded-[2rem] shadow-2xl relative overflow-hidden">
                                 <div className="absolute inset-0 gradient-brand opacity-10" />
                                 <div className="relative z-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 dark:text-brand-600 mb-4 italic">Economic Synthesis</h4>
                                    <p className="text-sm font-bold text-white dark:text-surface-900 leading-relaxed uppercase tracking-tight italic">
                                       Consumer velocity maximized in Expansion regimes. Saturation values below 0.85 indicate high margin opportunities for direct retail distribution.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="py-24 text-center flex flex-col items-center justify-center opacity-25">
                              <Layers size={80} className="mb-8" />
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Industrial Asset</h3>
                              <p className="text-xs font-bold mt-4 uppercase tracking-[0.2em]">Non-Retail Commodity Node</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full card border-dashed border-4 border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center text-center p-20 group hover:border-brand-600/30 transition-all">
               <div className="w-28 h-28 rounded-[2.5rem] bg-surface-50 dark:bg-surface-900 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-10 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                  <BookOpen size={56} />
               </div>
               <h2 className="text-4xl font-black uppercase italic tracking-tighter text-surface-900 dark:text-white">Knowledge.<span className="text-brand-600">Matrix</span></h2>
               <p className="mt-6 font-bold text-surface-400 max-w-sm uppercase tracking-widest text-xs leading-loose italic">
                  Select an industrial or retail node from the global registry to initialize professional entity inspection.
               </p>
            </div>
         )}
      </div>
    </div>
  );
}
