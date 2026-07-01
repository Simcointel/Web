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

  const content = useMemo(() => {
    if (loading && !margins) return <LoadingState text="Accessing Knowledge Base..." />;
    return null;
  }, [loading, margins]);

  if (content) return content;

  return (
    <div className="grid grid-cols-12 gap-3 animate-in fade-in duration-300">
      <div className="col-span-12 lg:col-span-4 space-y-3">
         <div className="card h-[70vh] flex flex-col overflow-hidden">
            <div className="p-2 border-b border-surface-50 dark:border-surface-800 bg-surface-50/20">
               <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search Entity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input !pl-8 !py-1.5 !bg-white dark:!bg-surface-950 !rounded shadow-none border-none"
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-50 dark:divide-surface-800 scrollbar-hide">
               {filtered.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all flex justify-between items-center group ${selectedId === r.id ? 'bg-brand-500/5 dark:bg-brand-500/10 border-l-2 border-brand-500' : ''}`}
                  >
                     <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-surface-400 group-hover:text-brand-500 transition-colors ${selectedId === r.id ? 'text-brand-500 bg-white dark:bg-surface-800 shadow-sm' : ''}`}>
                           <Layers size={12} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tight ${selectedId === r.id ? 'text-brand-600' : 'text-surface-500 dark:text-surface-400'}`}>{r.name}</span>
                     </div>
                     <ChevronRight size={10} className={`text-surface-300 transition-transform ${selectedId === r.id ? 'translate-x-1 text-brand-500' : ''}`} />
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
         {selected ? (
            <div className="space-y-3 animate-in slide-in-from-right-2 duration-300">
               <div className="card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group border-t-2 border-brand-500">
                  <div className="absolute -right-8 -top-8 text-brand-500/5 group-hover:scale-110 transition-transform duration-1000">
                     <BookOpen size={160} />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-1">
                        <div className="px-1.5 py-0.5 bg-brand-500 text-white rounded-[2px] text-[8px] font-black uppercase tracking-widest">REGISTRY</div>
                        <span className="text-[8px] font-black text-surface-400 uppercase tracking-widest"># {selected.id}</span>
                     </div>
                     <h1 className="text-2xl font-black uppercase tracking-tight italic text-surface-900 dark:text-white">{selected.name}</h1>
                  </div>
                  {selectedMargin && (
                     <div className="relative z-10 text-right">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-surface-400 mb-0.5">BENCHMARK</span>
                        <span className="text-xl font-black italic tracking-tighter tabular-nums text-brand-500">${selectedMargin.outputVwap.toFixed(2)}</span>
                     </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="card p-4 space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-brand-500" />
                        <h3 className="text-[9px] font-black uppercase text-surface-400">FINANCIAL_MODEL</h3>
                     </div>
                     <div className="space-y-2">
                        <FinancialLine label="REVENUE/H" value={`$${(selectedMargin?.revenuePerHour || 0).toFixed(0)}`} />
                        <FinancialLine label="INPUTS/H" value={`-$${(selectedMargin?.inputCostPerHour || 0).toFixed(0)}`} red />
                        <FinancialLine label="WAGES/H" value={`-$${(selectedMargin?.wagesPerHour || 0).toFixed(0)}`} red />
                        <div className="pt-2 border-t border-surface-50 dark:border-surface-800 flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-brand-500">NET_PROFIT/H</span>
                           <span className="text-lg font-black tabular-nums">${(selectedMargin?.netProfitPerHour || 0).toFixed(0)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="card p-4 space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-brand-500" />
                        <h3 className="text-[9px] font-black uppercase text-surface-400">ENTITY_SPECS</h3>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <SpecNode label="BASE_WAGES" value={`$${selected.baseWages || 0}`} />
                        <SpecNode label="UNITS/H" value={`${(selected.basePh || 0).toFixed(1)}`} />
                        <SpecNode label="TRANSPORT" value={selected.transport} />
                        <SpecNode label="B_ID" value={selected.buildingId || 'N/A'} />
                     </div>
                  </div>

                  <div className="card flex flex-col">
                     <div className="px-3 py-1.5 border-b border-surface-50 dark:border-surface-800/50 flex items-center gap-2">
                        <Factory size={12} className="text-emerald-500" />
                        <h3 className="text-[9px] font-black uppercase text-surface-400">PRODUCTION</h3>
                     </div>
                     <div className="p-3 space-y-3">
                        <div className="flex justify-between items-center p-2 bg-surface-50 dark:bg-surface-950 rounded">
                           <span className="text-xs font-black uppercase truncate">{BUILDINGS.find(b => b.id === (selected as any).buildingId)?.name || 'Extraction'}</span>
                           <ChevronRight size={10} className="text-surface-300" />
                        </div>
                        {selected.inputs && (
                           <div className="grid grid-cols-1 gap-1">
                              {Object.entries(selected.inputs).map(([id, qty]) => (
                                 <div key={id} className="flex justify-between items-center px-2 py-1 text-[10px] border-b border-surface-50 dark:border-surface-800 last:border-0">
                                    <span className="font-bold text-surface-500 truncate">{RESOURCES.find(r => r.id === Number(id))?.name}</span>
                                    <span className="font-black tabular-nums">{qty}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="card flex flex-col">
                     <div className="px-3 py-1.5 border-b border-surface-50 dark:border-surface-800/50 flex items-center gap-2">
                        <ShoppingCart size={12} className="text-rose-500" />
                        <h3 className="text-[9px] font-black uppercase text-surface-400">RETAIL</h3>
                     </div>
                     <div className="p-3">
                        {selected.retailInfo && selected.retailInfo.length > 0 ? (
                           <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                 <div className="bg-surface-50 dark:bg-surface-950 p-2 text-center rounded">
                                    <span className="block text-[8px] font-black text-surface-400">DEMAND</span>
                                    <span className="text-xs font-black text-emerald-500">HIGH</span>
                                 </div>
                                 <div className="bg-surface-50 dark:bg-surface-950 p-2 text-center rounded">
                                    <span className="block text-[8px] font-black text-surface-400">SAT</span>
                                    <span className="text-xs font-black text-brand-500">0.22</span>
                                 </div>
                              </div>
                              <div className="p-3 bg-brand-500/5 rounded border border-brand-500/10">
                                 <p className="text-[10px] font-bold text-surface-600 dark:text-surface-300 italic leading-tight">
                                    High margin potential in Expansion regimes. Saturation optimal.
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="py-8 text-center opacity-20">
                              <Layers size={30} className="mx-auto mb-2" />
                              <p className="text-[9px] font-black">INDUSTRIAL ASSET</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full card border-dashed border-2 border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center text-center p-12 group hover:border-brand-600/30 transition-all">
               <div className="w-20 h-20 rounded-2xl bg-surface-50 dark:bg-surface-900 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 shadow-xl group-hover:scale-110 transition-transform duration-700">
                  <BookOpen size={40} />
               </div>
               <h2 className="text-3xl font-black uppercase italic tracking-tighter text-surface-900 dark:text-white">Knowledge.<span className="text-brand-600">Matrix</span></h2>
               <p className="mt-4 font-bold text-surface-400 max-w-xs uppercase tracking-widest text-[10px] leading-relaxed italic">
                  Select an industrial or retail node from the global registry to initialize professional entity inspection.
               </p>
            </div>
         )}
      </div>
    </div>
  );
}

function FinancialLine({ label, value, red }: any) {
   return (
      <div className="flex justify-between items-center text-[10px]">
         <span className="font-bold text-surface-400 uppercase tracking-tighter">{label}</span>
         <span className={`font-black tabular-nums ${red ? 'text-rose-500' : 'text-surface-600 dark:text-surface-300'}`}>{value}</span>
      </div>
   );
}

function SpecNode({ label, value }: any) {
   return (
      <div className="bg-surface-50 dark:bg-surface-950 p-2 rounded">
         <span className="block text-[7px] font-black text-surface-400 uppercase mb-1">{label}</span>
         <span className="text-[11px] font-black text-surface-900 dark:text-white uppercase">{value}</span>
      </div>
   );
}
