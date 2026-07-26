import { useState, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Package, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import * as api from "../services/simcompanies-api";
import type { MarketOrder, Resource } from "../services/simcompanies-api";

export function MarketOrdersPage() {
  const [realm] = useSharedRealm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [sellOrders, setSellOrders] = useState<MarketOrder[]>([]);
  const [buyOrders, setBuyOrders] = useState<MarketOrder[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resData, sellData, buyData] = await Promise.all([
          api.fetchAllResources(),
          api.fetchMarketOrders(101, 'sell'), // Default to Reinforced Concrete
          api.fetchMarketOrders(101, 'buy')
        ]);
        setResources(resData);
        setSellOrders(sellData);
        setBuyOrders(buyData);
        
        // Auto-select first resource if none selected
        if (resData.length > 0 && !selectedResource) {
          setSelectedResource(resData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load market data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleResourceChange = async (resourceId: number) => {
    setSelectedResource(resourceId);
    try {
      const [sellData, buyData] = await Promise.all([
        api.fetchMarketOrders(resourceId, 'sell'),
        api.fetchMarketOrders(resourceId, 'buy')
      ]);
      setSellOrders(sellData);
      setBuyOrders(buyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock size={32} className="mx-auto text-brand-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-surface-500">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-800 p-6 bg-rose-50 dark:bg-rose-900/10">
        <p className="text-sm font-bold text-rose-600">{error}</p>
      </div>
    );
  }

  const selectedRes = resources.find(r => r.id === selectedResource);

  return (
    <div className="space-y-6 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Live Market Orders</h1>
            <p className="text-xs text-surface-400">Real-time buy and sell orders from SimCompanies API</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-4">
          <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800">
            <label className="text-xs font-bold uppercase text-surface-500 block mb-2">Select Resource</label>
            <select 
              value={selectedResource ?? ""} 
              onChange={(e) => handleResourceChange(Number(e.target.value))}
              className="input w-full"
            >
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} (#{r.id})</option>
              ))}
            </select>
          </div>

          {selectedRes && (
            <div className="card p-4 bg-brand-50 dark:bg-brand-900/10 border-l-4 border-brand-600 !shadow-none border-surface-200 dark:border-surface-800">
              <h3 className="text-sm font-bold text-brand-600 mb-3">{selectedRes.name}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-surface-400">ID:</span>
                  <span className="font-bold">#{selectedRes.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">Category:</span>
                  <span className="font-bold capitalize">{selectedRes.categoryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">Base Price:</span>
                  <span className="font-bold">${selectedRes.basePrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight size={16} className="text-emerald-600" />
                <h3 className="text-xs font-bold uppercase text-emerald-600">Buy Orders</h3>
              </div>
              <p className="text-2xl font-bold">{buyOrders.length}</p>
              <p className="text-xs text-surface-400 mt-1">Active bids</p>
            </div>

            <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight size={16} className="text-rose-600" />
                <h3 className="text-xs font-bold uppercase text-rose-600">Sell Orders</h3>
              </div>
              <p className="text-2xl font-bold">{sellOrders.length}</p>
              <p className="text-xs text-surface-400 mt-1">Active asks</p>
            </div>
          </div>

          <div className="card overflow-hidden !shadow-none border-surface-200 dark:border-surface-800">
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
              <h3 className="text-xs font-bold uppercase text-surface-500">Top Sell Orders (Lowest First)</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-900 text-surface-500 font-bold uppercase text-[10px]">
                    <th className="text-left px-4 py-2">Price</th>
                    <th className="text-right px-4 py-2">Quantity</th>
                    <th className="text-right px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                  {sellOrders.slice(0, 10).map((order, i) => (
                    <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-2 font-bold text-rose-600">${order.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{order.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-bold">${(order.price * order.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {sellOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-surface-400 italic">No active sell orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card overflow-hidden !shadow-none border-surface-200 dark:border-surface-800">
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
              <h3 className="text-xs font-bold uppercase text-surface-500">Top Buy Orders (Highest First)</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-900 text-surface-500 font-bold uppercase text-[10px]">
                    <th className="text-left px-4 py-2">Price</th>
                    <th className="text-right px-4 py-2">Quantity</th>
                    <th className="text-right px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
                  {buyOrders.slice(0, 10).map((order, i) => (
                    <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-2 font-bold text-emerald-600">${order.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">{order.amount.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-bold">${(order.price * order.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {buyOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-surface-400 italic">No active buy orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
