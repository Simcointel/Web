import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { RESOURCES, BUILDINGS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Search, Info, Factory, ShoppingCart, TrendingUp } from "lucide-react";
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

  if (loading && !margins) return <LoadingState text="SYNC_DATABASE..." />;

  return (
    <div className="grid grid-cols-12 gap-6 font-mono text-[10px] animate-in fade-in duration-300">
      <div className="col-span-12 lg:col-span-4 space-y-4">
         <div className="border border-surface-200 dark:border-surface-800">
            <div className="p-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
               <Search size={14} className="opacity-40" />
               <input
                 type="text"
                 placeholder="SEARCH_DB..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="bg-transparent border-none outline-none w-full uppercase font-black"
               />
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-surface-100 dark:divide-surface-900">
               {filtered.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors flex justify-between items-center ${selectedId === r.id ? 'bg-surface-100 dark:bg-surface-800' : ''}`}
                  >
                     <span className="uppercase font-bold">{r.name}</span>
                     <span className="opacity-30">ID_{r.id}</span>
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-6">
         {selected ? (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-200">
               <div className="border border-surface-200 dark:border-surface-800 p-6 flex justify-between items-start">
                  <div>
                     <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">{selected.name}</h1>
                     <div className="flex gap-4 opacity-40 uppercase font-bold text-[9px]">
                        <span>RESOURCE_ID: {selected.id}</span>
                        <span>TRANSPORT_REQ: {selected.transport}</span>
                     </div>
                  </div>
                  {selectedMargin && (
                     <div className="text-right">
                        <span className="block text-[8px] opacity-40 uppercase font-black mb-1">VWAP_PRICE</span>
                        <span className="text-2xl font-black tabular-nums">${selectedMargin.outputVwap.toFixed(2)}</span>
                     </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-surface-200 dark:border-surface-800">
                     <div className="p-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
                        <Factory size={14} className="opacity-40" />
                        <span className="font-black uppercase">Production_Chain</span>
                     </div>
                     <div className="p-4 space-y-4">
                        <div>
                           <span className="block text-[8px] opacity-40 uppercase font-black mb-2">Facility</span>
                           <div className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-900">
                              <span className="font-bold uppercase">{BUILDINGS.find(b => b.id === (selected as any).buildingId)?.name || 'UNKNOWN'}</span>
                           </div>
                        </div>
                        {selected.inputs && (
                           <div>
                              <span className="block text-[8px] opacity-40 uppercase font-black mb-2">Primary_Inputs</span>
                              <div className="space-y-1">
                                 {Object.entries(selected.inputs).map(([id, qty]) => (
                                    <div key={id} className="flex justify-between py-1 border-b border-surface-100 dark:border-surface-900 last:border-0 opacity-80">
                                       <span className="uppercase font-bold">{RESOURCES.find(r => r.id === Number(id))?.name || `ID_${id}`}</span>
                                       <span>{qty}U</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="border border-surface-200 dark:border-surface-800">
                     <div className="p-2 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
                        <ShoppingCart size={14} className="opacity-40" />
                        <span className="font-black uppercase">Retail_Profile</span>
                     </div>
                     <div className="p-4">
                        {selected.retailInfo && selected.retailInfo.length > 0 ? (
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-3 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-900 text-center">
                                    <span className="block text-[8px] opacity-40 uppercase mb-1">Base_Demand</span>
                                    <span className="text-sm font-black">HIGH</span>
                                 </div>
                                 <div className="p-3 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-900 text-center">
                                    <span className="block text-[8px] opacity-40 uppercase mb-1">Volatility</span>
                                    <span className="text-sm font-black">MED</span>
                                 </div>
                              </div>
                              <p className="opacity-60 leading-relaxed uppercase">Consumer good primary found in major retail chains. Price heavily influenced by regime cycles.</p>
                           </div>
                        ) : (
                           <div className="py-10 text-center opacity-30 italic uppercase">NON_RETAIL_ASSET</div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full border border-dashed border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center text-center p-20 opacity-20">
               <BookOpen size={48} className="mb-4" />
               <h2 className="text-xl font-black uppercase tracking-widest">Select_Entity_To_Inspect</h2>
               <p className="mt-2 font-bold">Comprehensive data on production and retail dynamics.</p>
            </div>
         )}
      </div>
    </div>
  );
}

function BookOpen({ size, className }: any) {
   return (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
         <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
         <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
   );
}
