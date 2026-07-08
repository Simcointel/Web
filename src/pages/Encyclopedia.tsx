import { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { RESOURCES, BUILDINGS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Search, Info, Factory, ShoppingCart, TrendingUp, ChevronRight, BookOpen, Layers, BarChart } from "lucide-react";
import { LoadingState } from "../components/States";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ProfitMarginsResponse, PriceHistoryItem } from "../types/api";

export function EncyclopediaPage() {
  useEffect(() => {
    document.title = "Encyclopedia - SimcoIntel";
  }, []);

  const [realm] = useSharedRealm();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [hLoading, setHLoading] = useState(false);

  const { data: margins, loading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);

  useEffect(() => {
    if (selectedId) {
      setHLoading(true);
      dataRepo.fetchResourcePriceHistory(realm, selectedId, 30)
        .then(data => {
          setHistory(data.map(d => ({ ...d, d: new Date(d.date).toLocaleDateString() })));
        })
        .finally(() => setHLoading(false));
    }
  }, [selectedId, realm]);

  const filtered = useMemo(() => {
    return RESOURCES.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  const selected = useMemo(() =>
    RESOURCES.find(r => r.id === selectedId),
  [selectedId]);

  const selectedMargin = useMemo(() =>
    (margins as ProfitMarginsResponse | undefined)?.resources?.find((r) => r.id === selectedId),
  [margins, selectedId]);

  const content = useMemo(() => {
    if (loading && !margins) return <LoadingState text="Accessing Knowledge Base..." />;
    return null;
  }, [loading, margins]);

  if (content) return content;

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-300 text-sm">
      <div className="col-span-12 lg:col-span-4 space-y-4">
         <div className="card h-[75vh] flex flex-col overflow-hidden !shadow-none border-surface-200 dark:border-surface-800">
            <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
               <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search encyclopedia..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
               {filtered.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-surface-50 dark:hover:bg-brand-900/10 transition-all flex justify-between items-center group ${selectedId === r.id ? 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-600' : ''}`}
                  >
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 group-hover:text-brand-600 transition-colors ${selectedId === r.id ? 'text-brand-600 bg-white dark:bg-surface-800 shadow-sm' : ''}`}>
                           <Layers size={16} />
                        </div>
                        <span className={`font-semibold ${selectedId === r.id ? 'text-brand-600' : 'text-surface-700 dark:text-surface-300'}`}>{r.name}</span>
                     </div>
                     <ChevronRight size={14} className={`text-surface-300 transition-transform ${selectedId === r.id ? 'translate-x-1 text-brand-600' : ''}`} />
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
         {selected ? (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
               <div className="card p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group !shadow-none border-surface-200 dark:border-surface-800 border-t-4 border-t-brand-600">
                  <div className="absolute -right-8 -top-8 text-brand-500/5 group-hover:scale-110 transition-transform duration-1000">
                     <BookOpen size={200} />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-brand-600 text-white rounded text-[10px] font-bold uppercase">Registry Item</div>
                        <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">ID #{selected.id}</span>
                     </div>
                     <h1 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-white">{selected.name}</h1>
                  </div>
                  {selectedMargin && (
                     <div className="relative z-10 text-right">
                        <span className="block text-xs font-bold uppercase text-surface-400 mb-1">Market Benchmark</span>
                        <span className="text-3xl font-bold text-brand-600">${selectedMargin.outputVwap.toFixed(2)}</span>
                     </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6 md:col-span-2 space-y-6 border-surface-200 dark:border-surface-800 !shadow-none">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BarChart size={18} className="text-brand-600" />
                           <h3 className="text-sm font-bold text-surface-500 uppercase">Market Price History (30D)</h3>
                        </div>
                        {hLoading && <span className="text-[10px] font-bold text-brand-600 animate-pulse uppercase">Syncing...</span>}
                     </div>
                     <div className="h-[200px] w-full">
                        {history.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={history}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-surface-200 dark:stroke-surface-800" />
                                 <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                 <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                 <Line type="monotone" dataKey="vwap" stroke="#0ea5e9" strokeWidth={3} dot={false} name="VWAP" />
                              </LineChart>
                           </ResponsiveContainer>
                        ) : (
                           <div className="h-full flex items-center justify-center text-surface-400 italic text-xs">Insufficient data for trend analysis</div>
                        )}
                     </div>
                  </div>

                  <div className="card p-6 space-y-6 border-surface-200 dark:border-surface-800 !shadow-none">
                     <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-600" />
                        <h3 className="text-sm font-bold text-surface-500 uppercase">Financial Model</h3>
                     </div>
                     <div className="space-y-3">
                        <FinancialLine label="Gross Revenue/H" value={`$${(selectedMargin?.revenuePerHour || 0).toFixed(0)}`} />
                        <FinancialLine label="Input Costs/H" value={`-$${(selectedMargin?.inputCostPerHour || 0).toFixed(0)}`} red />
                        <FinancialLine label="Wages Cost/H" value={`-$${(selectedMargin?.wagesPerHour || 0).toFixed(0)}`} red />
                        <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
                           <span className="text-sm font-bold text-brand-600">Projected Net Profit/H</span>
                           <span className="text-2xl font-bold">${(selectedMargin?.netProfitPerHour || 0).toFixed(0)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="card p-6 space-y-6 border-surface-200 dark:border-surface-800 !shadow-none">
                     <div className="flex items-center gap-2">
                        <Info size={18} className="text-brand-600" />
                        <h3 className="text-sm font-bold text-surface-500 uppercase">Entity Specifications</h3>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <SpecNode label="Base Wages" value={`$${selected.baseWages || 0}`} />
                        <SpecNode label="Base Units/H" value={`${(selected.basePh || 0).toFixed(1)}`} />
                        <SpecNode label="Transport Req" value={selected.transport} />
                        <SpecNode label="Facility ID" value={selected.buildingId || 'N/A'} />
                     </div>
                  </div>

                  <div className="card flex flex-col border-surface-200 dark:border-surface-800 !shadow-none">
                     <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2">
                        <Factory size={18} className="text-emerald-600" />
                        <h3 className="text-sm font-bold text-surface-500 uppercase">Production Process</h3>
                     </div>
                     <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
                            <span className="font-bold">{BUILDINGS.find(b => b.id === (selected as { buildingId?: string }).buildingId)?.name || 'Extraction Facility'}</span>
                           <ChevronRight size={14} className="text-surface-300" />
                        </div>
                        {selected.inputs && (
                           <div className="space-y-2">
                              {Object.entries(selected.inputs).map(([id, qty]) => (
                                 <div key={id} className="flex justify-between items-center px-2 py-2 border-b border-surface-50 dark:border-surface-800 last:border-0">
                                    <span className="font-medium text-surface-600 dark:text-surface-400">{RESOURCES.find(r => r.id === Number(id))?.name}</span>
                                    <span className="font-bold">{qty}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="card flex flex-col border-surface-200 dark:border-surface-800 !shadow-none">
                     <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2">
                        <ShoppingCart size={18} className="text-rose-600" />
                        <h3 className="text-sm font-bold text-surface-500 uppercase">Retail Outlook</h3>
                     </div>
                     <div className="p-6">
                        {selected.retailInfo && selected.retailInfo.length > 0 ? (
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-surface-50 dark:bg-surface-900 p-4 text-center rounded-lg">
                                    <span className="block text-xs font-bold text-surface-400 mb-1">Optimal AS</span>
                                    <span className="text-lg font-bold text-emerald-600 uppercase">{(selected.retailInfo[0] as any)?.optimalAS || 'N/A'}</span>
                                 </div>
                                 <div className="bg-surface-50 dark:bg-surface-900 p-4 text-center rounded-lg">
                                    <span className="block text-xs font-bold text-surface-400 mb-1">Avg Price</span>
                                    <span className="text-lg font-bold text-brand-600">${(selected.retailInfo[0] as any)?.averagePrice?.toFixed(2) || 'N/A'}</span>
                                 </div>
                              </div>
                              <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-lg border border-brand-100 dark:border-brand-900/20">
                                 <p className="text-sm font-medium text-surface-600 dark:text-surface-300 leading-relaxed italic">
                                    Targeting quality {(selected.retailInfo[0] as any)?.avgQuality || 0} items for maximum throughput.
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="py-12 text-center opacity-30">
                              <Layers size={48} className="mx-auto mb-4" />
                              <p className="text-sm font-bold uppercase tracking-widest">Industrial Asset Only</p>
                              <p className="text-xs mt-1">This node cannot be sold in retail stores.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full card border-dashed border-2 border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center text-center p-16 group hover:border-brand-600/30 transition-all !shadow-none">
               <div className="w-24 h-24 rounded-3xl bg-surface-100 dark:bg-surface-900 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-8 shadow-sm group-hover:scale-105 transition-transform duration-500">
                  <BookOpen size={48} />
               </div>
               <h2 className="text-4xl font-bold tracking-tight text-surface-900 dark:text-white italic">Entity.<span className="text-brand-600">Encyclopedia</span></h2>
               <p className="mt-4 font-medium text-surface-500 max-w-sm text-sm leading-relaxed">
                  Select an industrial resource or consumer good from the registry to initialize deep entity inspection.
               </p>
            </div>
         )}
      </div>
    </div>
  );
}

function FinancialLine({ label, value, red }: { label: string; value: string; red?: boolean }) {
   return (
      <div className="flex justify-between items-center text-[10px]">
         <span className="font-bold text-surface-400 uppercase tracking-tighter">{label}</span>
         <span className={`font-black tabular-nums ${red ? 'text-rose-500' : 'text-surface-600 dark:text-surface-300'}`}>{value}</span>
      </div>
   );
}

function SpecNode({ label, value }: { label: string; value: string | number }) {
   return (
      <div className="bg-surface-50 dark:bg-surface-950 p-2 rounded">
         <span className="block text-[7px] font-black text-surface-400 uppercase mb-1">{label}</span>
         <span className="text-[11px] font-black text-surface-900 dark:text-white uppercase">{value}</span>
      </div>
   );
}
