import { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { ProfitMarginsResponse } from "../types/api";
import { Search, TrendingUp } from "lucide-react";

const CATEGORIES = ["raw-materials", "refined-materials", "food-beverage", "consumer-goods", "construction-materials", "high-tech", "transport", "luxury-goods", "aerospace-defense", "energy"];

export function VWAPInflationPage() {
  useEffect(() => { document.title = "SimCo Intel - VWAP Market Prices"; }, []);

  const [realm, setRealm] = useSharedRealm();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState("");

  const { data: marginsData, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const { data: history } = useDataRepoPoll(
    () => selectedId ? dataRepo.fetchResourcePriceHistory(realm, selectedId, 30) : Promise.resolve([]),
    120000, [realm, selectedId]
  );

  const filtered = useMemo(() => {
    let list = margins;
    if (catFilter) list = list.filter(r => r.category === catFilter);
    if (search) list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (b.outputVwap ?? 0) - (a.outputVwap ?? 0));
  }, [margins, catFilter, search]);

  const selected = useMemo(() => margins.find(r => r.id === selectedId), [margins, selectedId]);

  const histData = useMemo(() => (history ?? []).map(d => ({ ...d, d: new Date(d.date).toLocaleDateString() })), [history]);

  if (loading && !marginsData) return <LoadingState text="Loading market prices..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center"><TrendingUp size={18} className="text-brand-600" /></div>
          <div><h1 className="text-lg font-bold">Market VWAP Prices</h1><p className="text-xs text-surface-400">Real-time & historical price data</p></div>
        </div>
        <select value={realm} onChange={e => setRealm(Number(e.target.value))} className="input w-auto">
          <option value={0}>R0</option>
          <option value={1}>R1</option>
        </select>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          <div className="border border-surface-200 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-surface-100 bg-surface-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-surface-300 rounded-md text-sm outline-none" />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-full mt-2 border border-surface-300 px-2 py-1.5 rounded-md text-sm outline-none">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
              </select>
            </div>
            <div className="h-64 overflow-y-auto divide-y divide-surface-100">
              {filtered.map(r => (
                <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full text-left px-3 py-2 flex justify-between items-center hover:bg-surface-50 transition-colors ${selectedId === r.id ? 'bg-brand-50 border-l-4 border-brand-600' : ''}`}>
                  <div>
                    <span className="font-semibold text-sm">{r.name}</span>
                    <span className="block text-[10px] text-surface-400 uppercase">{r.categoryName ?? r.category}</span>
                  </div>
                  <span className="font-bold text-sm">${r.outputVwap.toFixed(2)}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="p-4 text-center text-surface-400 text-sm">No results</p>}
            </div>
            <div className="p-2 border-t border-surface-100 bg-surface-50 text-center text-[10px] text-surface-400">{filtered.length} resources</div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          {selected ? (
            <>
              <div className="border border-surface-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <span className="text-xs text-surface-400 uppercase">{selected.categoryName ?? selected.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-brand-600">${selected.outputVwap.toFixed(2)}</span>
                    <span className="block text-[10px] text-surface-400">Current VWAP</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div><span className="text-[10px] text-surface-400 block">Revenue/H</span><span className="font-bold">${selected.revenuePerHour.toFixed(0)}</span></div>
                  <div><span className="text-[10px] text-surface-400 block">Profit/H</span><span className="font-bold">${selected.netProfitPerHour.toFixed(0)}</span></div>
                  <div><span className="text-[10px] text-surface-400 block">Margin</span><span className="font-bold">{selected.marginPct.toFixed(1)}%</span></div>
                  <div><span className="text-[10px] text-surface-400 block">Prod/H</span><span className="font-bold">{selected.producedPerHour.toFixed(1)}</span></div>
                </div>
              </div>

              <div className="border border-surface-200 rounded-lg">
                <div className="px-4 py-2 border-b border-surface-100 bg-surface-50">
                  <span className="text-xs font-bold text-surface-500 uppercase">Price History (30D)</span>
                </div>
                <div className="p-4">
                  {histData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={histData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="vwap" stroke="#0ea5e9" strokeWidth={2} dot={false} name="VWAP" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-16 text-center text-surface-400">Insufficient price history</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="border border-dashed border-surface-300 rounded-lg p-20 text-center">
              <p className="text-surface-400 text-lg">Select a resource to view price history</p>
              <p className="text-surface-300 text-sm mt-2">{margins.length} resources with price data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
