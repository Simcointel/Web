import { useState, useEffect } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { FileText, DollarSign, Building2, Trophy, Clock } from "lucide-react";
import * as api from "../services/simcompanies-api";
import type { GovernmentContract, ExchangeRate, BuildingType, LeagueInfo } from "../services/simcompanies-api";

export function GovernmentPage() {
  const [realm] = useSharedRealm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [contracts, setContracts] = useState<GovernmentContract[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [contractsData, ratesData] = await Promise.all([
          api.fetchGovernmentContracts(),
          api.fetchExchangeRates()
        ]);
        setContracts(contractsData);
        setExchangeRates(ratesData);
        
        // Set default tier if available
        if (contractsData.length > 0 && !selectedTier) {
          setSelectedTier(contractsData[0].tier);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load government data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredContracts = selectedTier !== null 
    ? contracts.filter(c => c.tier === selectedTier)
    : contracts;

  const uniqueTiers = Array.from(new Set(contracts.map(c => c.tier))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock size={32} className="mx-auto text-brand-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-surface-500">Loading government data...</p>
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

  return (
    <div className="space-y-6 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Government Contracts & Exchange</h1>
            <p className="text-xs text-surface-400">Official government orders and currency exchange rates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Government Contracts Section */}
        <div className="space-y-4">
          <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase text-amber-600 flex items-center gap-2">
                <FileText size={16} />
                Available Contracts
              </h2>
              <select 
                value={selectedTier ?? ""} 
                onChange={(e) => setSelectedTier(e.target.value ? Number(e.target.value) : null)}
                className="text-xs border border-surface-200 dark:border-surface-700 rounded px-2 py-1 bg-white dark:bg-surface-900"
              >
                <option value="">All Tiers</option>
                {uniqueTiers.map(tier => (
                  <option key={tier} value={tier}>Tier {tier}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredContracts.map((contract, i) => (
                <div key={i} className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-amber-600">Tier {contract.tier}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded">
                      {contract.resourceName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-surface-400 block">Quantity:</span>
                      <span className="font-bold">{contract.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-surface-400 block">Price:</span>
                      <span className="font-bold">${contract.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-surface-400 block">Quality:</span>
                      <span className="font-bold">Q{contract.minQuality}+</span>
                    </div>
                    <div>
                      <span className="text-surface-400 block">Total Value:</span>
                      <span className="font-bold text-emerald-600">${(contract.amount * contract.price).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredContracts.length === 0 && (
                <div className="text-center py-8 text-surface-400 italic">
                  No contracts available for selected tier
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exchange Rates Section */}
        <div className="space-y-4">
          <div className="card p-4 !shadow-none border-surface-200 dark:border-surface-800">
            <h2 className="text-sm font-bold uppercase text-indigo-600 flex items-center gap-2 mb-4">
              <DollarSign size={16} />
              Currency Exchange Rates
            </h2>

            <div className="space-y-2">
              {exchangeRates.map((rate, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded flex items-center justify-center text-xs font-bold text-indigo-600">
                      {rate.currency}
                    </div>
                    <span className="text-sm font-bold">{rate.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-600">${rate.rate.toFixed(4)}</div>
                    <div className="text-xs text-surface-400">per unit</div>
                  </div>
                </div>
              ))}
              {exchangeRates.length === 0 && (
                <div className="text-center py-8 text-surface-400 italic">
                  No exchange rates available
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-600 !shadow-none border-surface-200 dark:border-surface-800">
            <h3 className="text-sm font-bold text-amber-600 mb-2">About Government Contracts</h3>
            <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              Government contracts are special orders that require specific quality levels. 
              Higher tiers offer better prices but demand higher quality resources. 
              Your Government Order Tier Index determines which tiers you can access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
