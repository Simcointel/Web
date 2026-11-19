import { useState, useEffect, useMemo } from "react";
import { LoadingState } from "../components/States";
import { RESOURCES, BUILDINGS, PHASE_MULTIPLIERS, MAT_REF_PRICES } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Calculator, Zap, Settings, Truck, Factory, Store, TrendingUp, AlertTriangle, Maximize2 } from "lucide-react";
import type { CalculatorLiveData } from "../types/api";
import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtNumber, fmtPct, fmtInteger } from "../utils/formatters";
import { 
  fetchSimCompaniesMarketTicker, 
  fetchSimCompaniesRetailInfo,
  fetchPlayerCompany,
  type SimCompaniesMarketTickerItem,
  type SimCompaniesRetailInfoItem,
  type PlayerCompany,
  type ChallengeApiError,
} from "../services/dataRepo";
import { 
  optimizeChallenge, 
  type OptimizerInputs, 
  type OptimizedPlan,
  formatTime 
} from "../utils/challengeOptimizer";

// Challenge-specific constants (Bankrupt Car Manufacturer - Realm 2)
const CHALLENGE_REALM = 2;
const STARTING_CASH = 1_300_000;
const SLOTS = 9;
const DEFAULT_TARGET_TRUCKS = 750; // Production target from challenge (user can change)
const STARTING_BUILDINGS: Array<{ buildingId: string; level: number }> = [
  { buildingId: "1", level: 2 },  // Car Factory L2
  { buildingId: "2", level: 2 },  // Car Dealership L2
  { buildingId: "D", level: 3 },  // Propulsion Factory L3
  { buildingId: "E", level: 1 },  // Power Plant L1
  { buildingId: "T", level: 1 },  // Fashion Factory L1
  { buildingId: "R", level: 1 },  // Refinery L1
];

function getBuildingName(buildingId: string): string {
  return BUILDINGS.find(b => b.id === buildingId)?.name ?? buildingId;
}

function getResourceName(resourceId: number): string {
  return RESOURCES.find(r => r.id === resourceId)?.name ?? `ID:${resourceId}`;
}

interface ComponentAnalysis {
  resourceId: number;
  name: string;
  neededPerTruck: number;
  makeCost: number;
  buyPrice: number;
  decision: "make" | "buy";
  savings: number;
  buildingsNeeded: Array<{ id: string; level: number; count: number }>;
  productionCapacity: number; // units/hour from plan + starting buildings
}

export function ChallengeOptimizerPage() {
  usePageTitleKey('challengeOptimizer');

  const [realm] = useSharedRealm();
  const [quality, setQuality] = useState(0);
  const [phase, setPhase] = useState<string>("normal");
  const [startingCash, setStartingCash] = useState(STARTING_CASH);
  const [targetTrucks, setTargetTrucks] = useState(DEFAULT_TARGET_TRUCKS);
  const [productionMultiplier, setProductionMultiplier] = useState(2.0); // Default 2x per user decision
  const [qualityPriceMultiplier, setQualityPriceMultiplier] = useState(0.05); // 5% per quality
  const [demolitionRefundRate, setDemolitionRefundRate] = useState(0.15); // 15% material refund per level
  const [retailBaseRate, setRetailBaseRate] = useState(10); // base trucks/hour per dealership level
  const [retailCapacityOverride, setRetailCapacityOverride] = useState<number | null>(null); // manual override
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calcLiveData, setCalcLiveData] = useState<CalculatorLiveData | null>(null);
  const [marketTickerData, setMarketTickerData] = useState<SimCompaniesMarketTickerItem[]>([]);
  const [retailInfoData, setRetailInfoData] = useState<SimCompaniesRetailInfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizationRunning, setOptimizationRunning] = useState(false);
  const [bestPlan, setBestPlan] = useState<OptimizedPlan | null>(null);
  const [componentAnalysis, setComponentAnalysis] = useState<ComponentAnalysis[]>([]);

  // Player company state (for optional manual input)
  const [companyId, setCompanyId] = useState("");
  const [playerCompany, setPlayerCompany] = useState<PlayerCompany | null>(null);
  const [challengeError, setChallengeError] = useState<ChallengeApiError | null>(null);

  // Fetch live data for realm 2 via backend proxy
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch market data and retail info (real data only)
        const [tickerData, retailData] = await Promise.all([
          fetchSimCompaniesMarketTicker(CHALLENGE_REALM),
          fetchSimCompaniesRetailInfo(CHALLENGE_REALM),
        ]);

        setMarketTickerData(tickerData);
        setRetailInfoData(retailData);

        // Combine into calculator-live format
        const livePrices: Record<number, Record<number, number>> = {};
        for (const item of tickerData) {
          if (!livePrices[item.kind]) livePrices[item.kind] = {};
          livePrices[item.kind][0] = item.price; // Q0 price
        }
        setCalcLiveData({
          generatedAt: new Date().toISOString(),
          dataFreshnessMinutes: 0,
          livePrices,
          realm: CHALLENGE_REALM,
          economyPhase: "Normal",
          weatherMultiplier: 1.0,
          saturation: {},
          source: "backend-proxy",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load live market data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch player company data when companyId is provided
  useEffect(() => {
    if (!companyId) return;
    const loadPlayerData = async () => {
      const { data, error } = await fetchPlayerCompany(companyId, CHALLENGE_REALM);
      if (data) {
        setPlayerCompany(data);
      } else if (error) {
        setChallengeError(error);
      }
    };
    loadPlayerData();
  }, [companyId]);

  // Get live exchange price for a resource
  const getLivePrice = (resourceId: number, q: number): number => {
    return calcLiveData?.livePrices[resourceId]?.[q] ?? 0;
  };

  // Get retail price from retail info (for selling in retail stores)
  const getRetailPrice = (resourceId: number): number => {
    const retailItem = retailInfoData.find(r => r.dbLetter === resourceId);
    return retailItem?.averagePrice ?? 0;
  };

  // Get VWAP price from margins (fallback)
  const getVwapPrice = (resourceId: number): number => {
    return MAT_REF_PRICES[resourceId] ?? 0;
  };

  // Analyze make vs buy for each truck component - uses optimizer's logic
  const analyzeComponents = useMemo(() => {
    if (!calcLiveData || !bestPlan) return [];

    const truckRecipe = RESOURCES.find(r => r.id === 57);
    if (!truckRecipe || !truckRecipe.inputs) return [];

    const phaseMult = PHASE_MULTIPLIERS[phase as "boom" | "normal" | "recession"] || 1.0;
    const qualityMult = 1 + quality * qualityPriceMultiplier;

    const analysis: ComponentAnalysis[] = [];

    for (const [inpIdStr, qty] of Object.entries(truckRecipe.inputs)) {
      const inpId = Number(inpIdStr);
      const inpResource = RESOURCES.find(r => r.id === inpId);
      const buyPrice = getLivePrice(inpId, quality) || getVwapPrice(inpId);
      
      // Use optimizer's make-cost calculation (no transport)
      const makeCostCache = new Map<number, number>();
      const visited = new Set<number>();
      
      function calcMakeCost(resourceId: number, visited: Set<number>): number {
        if (visited.has(resourceId)) return Infinity;
        visited.add(resourceId);

        const resource = RESOURCES.find(r => r.id === resourceId);
        const marketPrice = marketTickerData.find(m => m.kind === resourceId)?.price || 0;
        
        if (!resource || !resource.inputs || Object.keys(resource.inputs).length === 0) {
          visited.delete(resourceId);
          return marketPrice > 0 ? marketPrice : (MAT_REF_PRICES[resourceId] || 0);
        }

        let makeCost = 0;
        for (const [inpIdStr, qty] of Object.entries(resource.inputs)) {
          const inpId = Number(inpIdStr);
          const inpPrice = calcMakeCost(inpId, new Set(visited));
          makeCost += inpPrice * qty;
        }

        // Add wages per unit (phase multiplier applies)
        const baseWages = resource.baseWages || 0;
        const basePh = resource.basePh || 1;
        const wagePerUnit = baseWages / basePh / phaseMult;
        
        makeCost += wagePerUnit;
        makeCostCache.set(resourceId, makeCost);
        visited.delete(resourceId);

        return marketPrice > 0 ? Math.min(makeCost, marketPrice) : makeCost;
      }

      const makeCost = calcMakeCost(inpId, new Set());
      
      // Determine buildings needed to produce this component
      const buildingsNeeded: Array<{ id: string; level: number; count: number }> = [];
      if (inpResource?.buildingId) {
        const buildingId = String(inpResource.buildingId);
        const basePh = inpResource.basePh ?? 1;
        const buildingsForOneTruck = qty / basePh;
        if (buildingsForOneTruck > 0) {
          buildingsNeeded.push({ id: buildingId, level: 1, count: Math.ceil(buildingsForOneTruck) });
        }
      }

      // Get production capacity from plan + starting buildings
      const planProduction = bestPlan.componentProduction.get(inpId) || 0;
      const startingProduction = bestPlan.startingProduction.get(inpId) || 0;
      const productionCapacity = planProduction + startingProduction;

      analysis.push({
        resourceId: inpId,
        name: inpResource?.name ?? `ID:${inpId}`,
        neededPerTruck: qty,
        makeCost,
        buyPrice,
        decision: makeCost < buyPrice ? "make" : "buy",
        savings: Math.abs(makeCost - buyPrice) * qty,
        buildingsNeeded,
        productionCapacity,
      });
    }

    return analysis;
  }, [calcLiveData, bestPlan, quality, phase, qualityPriceMultiplier, marketTickerData]);

  // Run optimization using true search
  const runOptimization = async () => {
    setOptimizationRunning(true);
    
    // Build market prices map
    const marketPrices: Record<number, number> = {};
    for (const item of marketTickerData) {
      marketPrices[item.kind] = item.price;
    }

    // Build retail prices map
    const retailPrices: Record<number, number> = {};
    // Build retail saturation map
    const retailSaturation: Record<number, number> = {};
    for (const item of retailInfoData) {
      if (item.averagePrice !== null && item.averagePrice !== undefined) {
        retailPrices[item.dbLetter] = item.averagePrice;
      }
      if (item.saturation !== null && item.saturation !== undefined) {
        retailSaturation[item.dbLetter] = item.saturation;
      }
    }

    const inputs: OptimizerInputs = {
      maxSlots: SLOTS,
      startingCash,
      targetTrucks,
      truckQuality: quality,
      economyPhase: phase as "boom" | "normal" | "recession",
      productionMultiplier,
      startingBuildings: STARTING_BUILDINGS,
      marketPrices,
      retailPrices,
      retailSaturation,
      qualityPriceMultiplier,
      demolitionRefundRate,
      retailBaseRate,
      retailCapacityOverride,
    };

    const plans = optimizeChallenge(inputs);
    console.log('[ChallengeOptimizer] optimizeChallenge returned:', plans.length, 'plans', plans);
    
    if (plans.length > 0) {
      setBestPlan(plans[0]);
      // Component analysis will update via useMemo
    } else {
      setBestPlan(null);
      console.warn('[ChallengeOptimizer] No valid plans found. Inputs:', inputs);
    }
    setOptimizationRunning(false);
  };

  // Trigger analysis when live data loads
  useEffect(() => {
    if (calcLiveData) {
      // Initial analysis without bestPlan (will re-run when bestPlan updates)
    }
  }, [calcLiveData]);

  if (loading) {
    return (
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          title="Challenge Optimizer"
          subtitle="Loading live market data for Realm 2…"
          icon={<Calculator size={18} />}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600"
          realm={realm}
          onRealmChange={() => {}}
        />
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          title="Challenge Optimizer"
          subtitle="Error loading data"
          icon={<Calculator size={18} />}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          iconColor="text-rose-600"
          realm={realm}
          onRealmChange={() => {}}
        />
        <div className="bg-white dark:bg-surface-950 border border-rose-200 dark:border-rose-800 rounded-xl p-6 text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  const truckResource = RESOURCES.find(r => r.id === 57);
  const truckRetailPrice = getRetailPrice(57) || getLivePrice(57, quality) || getVwapPrice(57);
  const sellingPrice = truckRetailPrice * (1 + quality * qualityPriceMultiplier);

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Challenge Optimizer"
        subtitle={
          calcLiveData 
            ? `Bankrupt Car Manufacturer — Realm 2 • Live data via backend proxy`
            : "Using fallback prices"
        }
        icon={<Maximize2 size={18} />}
        iconBg="bg-violet-100 dark:bg-violet-900/30"
        iconColor="text-violet-600"
        realm={realm}
        onRealmChange={() => {}}
      >
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase text-surface-400 tracking-wider">
          <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded">CHALLENGE</span>
          <span>Realm 2 • 9 Slots • ${fmtNumber(STARTING_CASH)} Start • Target: ${fmtNumber(targetTrucks)} Trucks</span>
        </div>
      </PageHeader>

      {/* Parameters Panel */}
      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings size={13} /> Challenge Parameters</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div>
            <label htmlFor="ch-quality" className="text-[10px] font-semibold text-surface-500 block mb-1">Truck Quality</label>
            <select id="ch-quality" value={quality} onChange={e => setQuality(Math.max(0, Math.min(12, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900">
              {[...Array(13).keys()].map(q => <option key={q} value={q}>Q{q}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ch-phase" className="text-[10px] font-semibold text-surface-500 block mb-1">Economy Phase</label>
            <select id="ch-phase" value={phase} onChange={e => setPhase(e.target.value)} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900">
              <option value="boom">Boom ×1.25</option>
              <option value="normal">Normal ×1.0</option>
              <option value="recession">Recession ×0.8</option>
            </select>
          </div>
          <div>
            <label htmlFor="ch-prod-mult" className="text-[10px] font-semibold text-surface-500 block mb-1">Production Multiplier</label>
            <input id="ch-prod-mult" type="number" step="0.1" min="0.1" max="20" value={productionMultiplier} onChange={e => setProductionMultiplier(Math.max(0.1, Math.min(20, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" />
            <div className="text-[9px] text-surface-400 mt-1">Default 2.0 (community estimate)</div>
          </div>
          <div>
            <label htmlFor="ch-quality-mult" className="text-[10px] font-semibold text-surface-500 block mb-1">Quality Price %</label>
            <input id="ch-quality-mult" type="number" step="0.01" min="0" max="0.5" value={qualityPriceMultiplier} onChange={e => setQualityPriceMultiplier(Math.max(0, Math.min(0.5, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" />
            <div className="text-[9px] text-surface-400 mt-1">Default 5% per quality</div>
          </div>
          <div>
            <label htmlFor="ch-demo-refund" className="text-[10px] font-semibold text-surface-500 block mb-1">Demo Refund %</label>
            <input id="ch-demo-refund" type="number" step="0.01" min="0" max="1" value={demolitionRefundRate} onChange={e => setDemolitionRefundRate(Math.max(0, Math.min(1, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" />
            <div className="text-[9px] text-surface-400 mt-1">Default 15% materials per level</div>
          </div>
          <div>
            <label htmlFor="ch-cash" className="text-[10px] font-semibold text-surface-500 block mb-1">Starting Cash</label>
            <input id="ch-cash" type="number" min={0} value={startingCash} onChange={e => setStartingCash(Math.max(0, Number(e.target.value)))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" />
          </div>
          <div>
            <label htmlFor="ch-target" className="text-[10px] font-semibold text-surface-500 block mb-1">Target Trucks</label>
            <input id="ch-target" type="number" min={1} value={targetTrucks} onChange={e => setTargetTrucks(Math.max(1, Number(e.target.value)))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" />
          </div>
          <div className="flex items-end">
            <button 
              onClick={runOptimization}
              disabled={optimizationRunning}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {optimizationRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Optimizing…
                </>
              ) : (
                <>
                  <Calculator size={14} />
                  Find Optimal Build
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings (Collapsible) */}
      <details className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
        <summary className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider cursor-pointer">
          <Settings size={13} /> Advanced: Retail Capacity Settings
        </summary>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label htmlFor="ch-retail-base" className="text-[10px] font-semibold text-surface-500 block mb-1">Base Retail Rate</label>
            <input id="ch-retail-base" type="number" step="0.5" min="0.5" max="50" value={retailBaseRate} onChange={e => setRetailBaseRate(Math.max(0.5, Math.min(50, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" />
            <div className="text-[9px] text-surface-400 mt-1">Trucks/hr per dealership level (default 10)</div>
          </div>
          <div>
            <label htmlFor="ch-retail-override" className="text-[10px] font-semibold text-surface-500 block mb-1">Manual Override</label>
            <input id="ch-retail-override" type="number" step="0.5" min="0" value={retailCapacityOverride ?? ""} onChange={e => { const v = e.target.value; setRetailCapacityOverride(v === "" ? null : Math.max(0, Number(v))); }} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900" placeholder="Auto (uses saturation)" />
            <div className="text-[9px] text-surface-400 mt-1">Fixed trucks/hr (bypasses saturation formula)</div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showAdvanced} onChange={e => setShowAdvanced(e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-violet-600 focus:ring-violet-500" />
              <span className="text-[10px] font-semibold text-surface-500">Show saturation debug</span>
            </label>
          </div>
        </div>
        {showAdvanced && retailInfoData.length > 0 && (
          <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-900/50 rounded-lg">
            <div className="text-[10px] font-bold text-surface-500 mb-2">Saturation Debug (from API):</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
              {retailInfoData
                .filter(item => item.saturation !== null && item.saturation !== undefined)
                .slice(0, 20)
                .map(item => (
                  <div key={item.dbLetter} className="flex justify-between">
                    <span className="text-surface-600 dark:text-surface-400">{getResourceName(item.dbLetter)} ({item.dbLetter})</span>
                    <span className="font-mono text-violet-600">{item.saturation.toFixed(3)}</span>
                  </div>
                ))}
            </div>
            <div className="text-[9px] text-surface-400 mt-2">Lower saturation = higher demand = higher retail capacity (1/saturation multiplier)</div>
          </div>
        )}
      </details>

      {/* Challenge Info & Player Progress */}
      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Factory size={13} /> Challenge: Bankrupt Car Manufacturer</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-blue-700 dark:text-blue-400 font-bold">Starting Cash</div>
            <div className="text-lg font-bold">${fmtNumber(STARTING_CASH)}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-green-700 dark:text-green-400 font-bold">Slots</div>
            <div className="text-lg font-bold">{SLOTS}</div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
            <div className="text-violet-700 dark:text-violet-400 font-bold">Starting Buildings</div>
            <div className="text-lg font-bold">{STARTING_BUILDINGS.length}</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <div className="text-amber-700 dark:text-amber-400 font-bold">Objective</div>
            <div className="text-lg font-bold">{fmtNumber(targetTrucks)} Trucks</div>
          </div>
        </div>
      </div>

      {/* Player's Current Buildings (from API - optional) */}
      {playerCompany && playerCompany.buildings.length > 0 && (
        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Factory size={13} /> Your Current Buildings (Level {playerCompany.level})</div>
            <input 
              type="text" 
              placeholder="Company ID" 
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="w-48 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500/20 bg-white dark:bg-surface-900"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {playerCompany.buildings.map((b, i) => {
              const building = BUILDINGS.find(bld => bld.id === b.kind);
              return (
                <div key={b.id} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{building?.name ?? b.kind}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-500">Level {b.level}</div>
                  <div className="text-[10px] text-surface-400">Slot {b.slot ?? i + 1}</div>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-emerald-600">Cash: ${fmtNumber(playerCompany.cash)} • Workers: {fmtNumber(playerCompany.workers)} • Overhead: {fmtPct(playerCompany.administrationOverhead)}%</div>
        </div>
      )}

      {/* Challenge Starting Buildings (fallback when no player data) */}
      {!playerCompany && (
        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Factory size={13} /> Challenge Starting Buildings (Can be demolished for material refund)</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {STARTING_BUILDINGS.map((b, i) => {
              const building = BUILDINGS.find(bld => bld.id === b.buildingId);
              const refund = building?.resources ? building.resources.reduce((sum, r) => {
                const price = MAT_REF_PRICES[r.id] || 0;
                return sum + r.qty * price * b.level * demolitionRefundRate;
              }, 0) : 0;
              return (
                <div key={i} className="bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 rounded-lg p-3 text-center">
                  <div className="text-xs font-bold text-surface-700 dark:text-surface-300">{building?.name ?? b.buildingId}</div>
                  <div className="text-[10px] text-surface-400">Level {b.level}</div>
                  <div className="text-[10px] text-violet-600 font-semibold">Slot {i + 1}</div>
                  <div className="text-[9px] text-emerald-600 mt-1">Refund: ~${fmtNumber(refund)} materials</div>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-surface-400">Used: {STARTING_BUILDINGS.length} / {SLOTS} slots • {SLOTS - STARTING_BUILDINGS.length} free</div>
        </div>
      )}

      {/* Component Analysis - Make vs Buy */}
      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><TrendingUp size={12} /> Component Analysis: Make vs Buy (per Truck)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900 text-[10px] font-bold uppercase text-surface-500">
                <th className="text-left px-4 py-2.5">Component</th>
                <th className="text-right px-4 py-2.5">Qty/Truck</th>
                <th className="text-right px-4 py-2.5">Make Cost</th>
                <th className="text-right px-4 py-2.5">Buy Price</th>
                <th className="text-center px-4 py-2.5">Decision</th>
                <th className="text-right px-4 py-2.5">Savings/Truck</th>
                <th className="text-right px-4 py-2.5">Plan Capacity /hr</th>
                <th className="text-left px-4 py-2.5">Buildings Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {componentAnalysis.map((comp) => (
                <tr key={comp.resourceId} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                  <td className="px-4 py-2 font-medium">{comp.name}</td>
                  <td className="px-4 py-2 text-right">{fmtNumber(comp.neededPerTruck)}</td>
                  <td className="px-4 py-2 text-right">${fmtNumber(comp.makeCost)}</td>
                  <td className="px-4 py-2 text-right">${fmtNumber(comp.buyPrice)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${comp.decision === "make" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {comp.decision.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-emerald-600 font-bold">${fmtNumber(comp.savings)}</td>
                  <td className="px-4 py-2 text-right text-blue-600 font-mono">{fmtNumber(comp.productionCapacity)}</td>
                  <td className="px-4 py-2 text-[10px] text-surface-500">
                    {comp.buildingsNeeded.map(b => `${b.count}× ${getBuildingName(b.id)} L${b.level}`).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Plan Results */}
      {bestPlan && (
        <>
          {/* ─── Minimum Time to Challenge Target ─── */}
          <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl p-6 text-white mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Truck size={24} />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wider opacity-90">Challenge Target</div>
                  <div className="text-2xl font-bold">{fmtNumber(targetTrucks)} Trucks</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">Minimum Time</div>
                <div className="text-4xl font-bold tracking-tight">
                  {bestPlan.totalTimeToTarget === Infinity ? "∞" : bestPlan.totalTimeToTarget.toFixed(1)}h
                </div>
                <div className="text-xs opacity-70">{(bestPlan.totalTimeToTarget / 24).toFixed(1)} days</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Construction</div>
                <div className="text-2xl font-bold">{bestPlan.constructionTime.toFixed(1)}h</div>
                <div className="text-xs opacity-70">Build all buildings</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Production Time</div>
                <div className="text-2xl font-bold">
                  {bestPlan.productionTimeHours === Infinity ? "∞" : bestPlan.productionTimeHours.toFixed(1)}h
                </div>
                <div className="text-xs opacity-70">Produce {fmtNumber(targetTrucks)} trucks</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Sell-Through Time</div>
                <div className="text-2xl font-bold">
                  {bestPlan.sellThroughTimeHours === Infinity ? "∞" : bestPlan.sellThroughTimeHours.toFixed(1)}h
                </div>
                <div className="text-xs opacity-70">Sell {fmtNumber(targetTrucks)} trucks at retail</div>
              </div>
            </div>
          </div>

          {/* ─── KPI Cards ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Trucks/Hour", val: fmtNumber(bestPlan.truckOutputPerHour), color: "text-violet-600", icon: Truck, iconColor: "text-violet-500" },
              { label: "Retail Capacity", val: fmtNumber(bestPlan.retailCapacityPerHour) + "/h", color: "text-blue-600", icon: Store, iconColor: "text-blue-500" },
              { label: "Net Profit/Hour", val: `${bestPlan.netProfitPerHour >= 0 ? "+" : ""}$${fmtNumber(bestPlan.netProfitPerHour)}`, color: bestPlan.netProfitPerHour >= 0 ? "text-emerald-600" : "text-rose-600", icon: Calculator, iconColor: bestPlan.netProfitPerHour >= 0 ? "text-emerald-500" : "text-rose-500" },
              { label: "Monthly ROI", val: `${fmtPct(bestPlan.roi / 100)}`, color: bestPlan.roi > 20 ? "text-emerald-600" : bestPlan.roi > 0 ? "text-amber-600" : "text-rose-600", icon: TrendingUp, iconColor: "text-violet-500" },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-surface-400 mb-1"><c.icon size={12} className={c.iconColor} /> {c.label}</div>
                <div className={`text-2xl font-bold tracking-tight ${c.color}`}>{c.val}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl divide-y divide-surface-100 dark:divide-surface-800">
            <div className="px-5 py-3 flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Factory size={12} /> Recommended Build</div>
            <div className="p-4 space-y-2">
              {bestPlan.buildings.map((b, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-violet-600 font-bold text-sm">{i + 1}</span>
                    <div>
                      <div className="font-bold text-sm">{getBuildingName(b.buildingId)}</div>
                      <div className="text-[10px] text-surface-400">Level {b.level} × {b.count} • Slot {i + 1}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-surface-500">
                    <div>Build: {formatTime(calcBuildTime(b.buildingId, b.level))}</div>
                    <div>Cost: ${fmtNumber(calcBuildCost(b.buildingId, b.level) * b.count)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-5 py-3 space-y-2 border-t border-surface-100 dark:border-surface-800">
              <div className="flex justify-between"><span className="text-xs text-surface-500">Total Slots Used</span><span className="text-sm font-bold">{bestPlan.totalSlots} / {SLOTS}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Construction Time</span><span className="text-sm font-bold">{formatTime(bestPlan.constructionTime)} ({(bestPlan.constructionTime / 24).toFixed(1)} days)</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Production Time</span><span className="text-sm font-bold text-blue-600">{formatTime(bestPlan.productionTimeHours)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Sell-Through Time</span><span className="text-sm font-bold text-amber-600">{formatTime(bestPlan.sellThroughTimeHours)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Total Time to Target</span><span className="text-sm font-bold text-violet-600">{formatTime(bestPlan.totalTimeToTarget)} ({(bestPlan.totalTimeToTarget / 24).toFixed(1)} days)</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Construction Cost</span><span className="text-sm font-bold text-rose-500">${fmtNumber(bestPlan.constructionCost)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Demolition Refund (materials)</span><span className="text-sm font-bold text-emerald-600">~${fmtNumber(bestPlan.demolitionRefund)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Net Construction Cost</span><span className="text-sm font-bold">${fmtNumber(bestPlan.constructionCost + bestPlan.demolitionRefund)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Remaining Cash</span><span className="text-sm font-bold text-emerald-600">${fmtNumber(bestPlan.cashRemaining)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Time to First Sale</span><span className="text-sm font-bold">{formatTime(bestPlan.constructionTime + (1 / (Math.min(bestPlan.truckOutputPerHour, bestPlan.retailCapacityPerHour) || 1)))}</span></div>
              <div className="flex justify-between"><span className="text-xs text-surface-500">Break-even Time</span><span className="text-sm font-bold">{bestPlan.netProfitPerHour > 0 ? formatTime(bestPlan.constructionCost / bestPlan.netProfitPerHour) : "Never"}</span></div>
            </div>
          </div>

          {/* Cash Flow Projection */}
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3 mt-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><TrendingUp size={12} /> Cash Flow Projection</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                <div className="text-emerald-700 dark:text-emerald-400 font-bold">Hourly Profit</div>
                <div className="text-lg font-bold">${fmtNumber(bestPlan.netProfitPerHour)}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-blue-700 dark:text-blue-400 font-bold">Daily Profit</div>
                <div className="text-lg font-bold">${fmtNumber(bestPlan.netProfitPerHour * 24)}</div>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
                <div className="text-violet-700 dark:text-violet-400 font-bold">Weekly Profit</div>
                <div className="text-lg font-bold">${fmtNumber(bestPlan.netProfitPerHour * 24 * 7)}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <div className="text-amber-700 dark:text-amber-400 font-bold">Monthly Profit</div>
                <div className="text-lg font-bold">${fmtNumber(bestPlan.netProfitPerHour * 24 * 30)}</div>
              </div>
            </div>
            <div className="text-[10px] text-surface-400">
              Target: {targetTrucks} trucks • Build: {formatTime(bestPlan.constructionTime)} + Produce: {formatTime(bestPlan.productionTimeHours)} + Sell: {formatTime(bestPlan.sellThroughTimeHours)} = Total: {formatTime(bestPlan.totalTimeToTarget)}
            </div>
          </div>

          {/* Component Production Breakdown */}
          <details className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 mt-4">
            <summary className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider cursor-pointer"><Factory size={13} /> Component Production Breakdown (units/hour)</summary>
            <div className="mt-3 space-y-2 text-xs">
              {Array.from(bestPlan.componentProduction.entries()).map(([resourceId, qty]) => {
                const resource = RESOURCES.find(r => r.id === resourceId);
                const starting = bestPlan.startingProduction.get(resourceId) || 0;
                return (
                  <div key={resourceId} className="flex items-center justify-between py-1">
                    <span className="text-surface-600 dark:text-surface-400">{resource?.name ?? `ID:${resourceId}`}</span>
                    <span className="text-surface-400">{fmtNumber(qty + starting)} /hr (plan: {fmtNumber(qty)}, starting: {fmtNumber(starting)})</span>
                  </div>
                );
              })}
            </div>
          </details>
        </>
      )}

      {!bestPlan && !optimizationRunning && (
        <div className="bg-white dark:bg-surface-950 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-16 text-center">
          <Calculator size={40} className="mx-auto text-surface-300 mb-3" />
          <p className="text-surface-400 font-bold text-sm">Click "Find Optimal Build" to analyze</p>
          <p className="text-surface-300 text-xs mt-1">The optimizer will evaluate make vs buy for each component and find the best building combination</p>
        </div>
      )}

      {/* Truck Recipe Reference */}
      <details className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
        <summary className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider cursor-pointer"><Truck size={13} /> Truck Recipe (Q{quality})</summary>
        <div className="mt-3 space-y-2 text-xs">
          {truckResource?.inputs && Object.entries(truckResource.inputs).map(([inpId, qty]) => {
            const inpRes = RESOURCES.find(r => r.id === Number(inpId));
            const analysis = componentAnalysis.find(a => a.resourceId === Number(inpId));
            const price = analysis?.decision === "make" ? analysis.makeCost : analysis?.buyPrice ?? 0;
            return (
              <div key={inpId} className="flex items-center justify-between py-1">
                <span className="text-surface-600 dark:text-surface-400">{inpRes?.name ?? `ID:${inpId}`}</span>
                <span className="text-surface-400">×{qty} = ${fmtNumber(price * qty)}</span>
              </div>
            );
          })}
          <div className="border-t border-surface-200 dark:border-surface-800 pt-2 flex justify-between font-bold">
            <span>Total Input Cost/Truck</span>
            <span>${fmtNumber(componentAnalysis.reduce((sum, c) => sum + (c.decision === "make" ? c.makeCost : c.buyPrice) * c.neededPerTruck, 0))}</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Retail Price (Q{quality})</span>
            <span>${fmtNumber(sellingPrice)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Gross Margin/Truck</span>
            <span>${fmtNumber(sellingPrice - componentAnalysis.reduce((sum, c) => sum + (c.decision === "make" ? c.makeCost : c.buyPrice) * c.neededPerTruck, 0))}</span>
          </div>
        </div>
      </details>
    </div>
  );
}

// Re-export optimizer's calc functions for UI display consistency
function calcBuildTime(buildingId: string, targetLevel: number, startLevel = 1): number {
  const BUILD_TIMES: Record<string, number[]> = {
    "1": [6, 6, 12, 18, 24, 30, 36, 42, 48, 54],
    "2": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],
    "D": [7, 7, 14, 21, 28, 35, 42, 49, 56, 63],
    "E": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],
    "T": [2, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    "R": [4, 4, 8, 12, 16, 20, 24, 28, 32, 36],
    "Y": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],
    "L": [5, 5, 10, 15, 20, 25, 30, 35, 40, 45],
    "8": [6, 6, 12, 18, 24, 30, 36, 42, 48, 54],
    "a": [6, 6, 12, 18, 24, 30, 36, 42, 48, 54],
    "M": [4, 4, 8, 12, 16, 20, 24, 28, 32, 36],
    "S": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],
    "Q": [2, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    "O": [4, 4, 8, 12, 16, 20, 24, 28, 32, 36],
  };
  const times = BUILD_TIMES[buildingId];
  if (!times) return (targetLevel - startLevel + 1) * 6;
  return times.slice(startLevel - 1, targetLevel).reduce((a, b) => a + b, 0);
}

function calcBuildCost(buildingId: string, targetLevel: number, startLevel = 1): number {
  const building = BUILDINGS.find(b => b.id === buildingId);
  if (!building || !building.resources) return 0;
  
  let costPerLevel = 0;
  for (const res of building.resources) {
    const price = MAT_REF_PRICES[res.id] || 0;
    costPerLevel += res.qty * price;
  }
  
  let total = 0;
  for (let lvl = startLevel; lvl <= targetLevel; lvl++) {
    total += costPerLevel * lvl;
  }
  return total;
}