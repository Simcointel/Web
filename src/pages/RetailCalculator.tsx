import { useState, useEffect, useMemo } from "react";
import { BUILDINGS, RETAIL_PRODUCT_MAP, RESOURCES } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Store, DollarSign, Users, BarChart3, Settings2, TrendingUp, AlertTriangle } from "lucide-react";
import type { ProfitMarginsResponse, CalculatorLiveData, PhaseCoefficients } from "../types/api";

import { useProfitMargins } from "../hooks/useDataQueries";
import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtNumber, fmtPct } from "../utils/formatters";
import { fetchCalculatorLive, fetchPhaseCoefficients } from "../services/dataRepo";

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function demand(price: number, coeffs: PhaseCoefficients): number {
  return coeffs.T * price ** 2 + coeffs.U * price + coeffs.V * price ** 3 + coeffs.W;
}

function adjustedDemand(price: number, coeffs: PhaseCoefficients, saturation: number): number {
  const baseDemand = demand(price, coeffs);
  return baseDemand / Math.max(1, saturation);
}

function profit(price: number, input: {
  livePrice: number;
  buildingWage: number;
  buildingLevel: number;
  transport: number;
  saturation: number;
  phaseCoeffs: PhaseCoefficients;
}): number {
  const d = adjustedDemand(price, input.phaseCoeffs, input.saturation);
  const cost = input.livePrice + input.transport + (input.buildingWage / input.buildingLevel);
  return (price - cost) * d;
}

function optimizePrice(input: {
  livePrice: number;
  buildingWage: number;
  buildingLevel: number;
  transport: number;
  saturation: number;
  phaseCoeffs: PhaseCoefficients;
}): { price: number; profit: number; demand: number } {
  const minPrice = input.livePrice * 1.01;
  const maxPrice = input.livePrice * 3.0;

  let bestPrice = minPrice;
  let bestProfit = -Infinity;
  let bestDemand = 0;

  for (let i = 0; i <= 100; i++) {
    const price = minPrice + (maxPrice - minPrice) * (i / 100);
    const p = profit(price, input);
    const d = adjustedDemand(price, input.phaseCoeffs, input.saturation);
    if (p > bestProfit) {
      bestProfit = p;
      bestPrice = price;
      bestDemand = d;
    }
  }

  return { price: bestPrice, profit: bestProfit, demand: bestDemand };
}

// ─── Page ──────────────────────────────────────────────────────
export function RetailCalculatorPage() {
  usePageTitleKey('retailCalculator');

  const [realm] = useSharedRealm();
  const [storeId, setStoreId] = useState("");
  const [resId, setResId] = useState(0);
  const [bldgLevel, setBldgLevel] = useState(1);
  const [ao, setAo] = useState(25);
  const [salesSpeed, setSalesSpeed] = useState(0);
  const [quality, setQuality] = useState(0);
  const [customPrice, setCustomPrice] = useState("");
  const [showTop, setShowTop] = useState(false);

  const { data: marginsData } = useProfitMargins(120000);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  // Fetch calculator live data
  const [calcLiveData, setCalcLiveData] = useState<CalculatorLiveData | null>(null);
  const [phaseCoeffs, setPhaseCoeffs] = useState<PhaseCoefficients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [liveData, coeffs] = await Promise.all([
          fetchCalculatorLive(realm),
          fetchPhaseCoefficients(realm),
        ]);
        setCalcLiveData(liveData);
        setPhaseCoeffs(coeffs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calculator data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [realm]);

  const stores = useMemo(() => BUILDINGS.filter(b => b.type === "retail" && b.id !== "r" && b.id !== "B" && (RETAIL_PRODUCT_MAP[b.id]?.length ?? 0) > 0), []);
  const store = useMemo(() => stores.find(s => s.id === storeId), [storeId, stores]);
  const storeProductIds = useMemo(() => RETAIL_PRODUCT_MAP[storeId] ?? [], [storeId]);
  const storeProducts = useMemo(() => storeProductIds.map(id => ({ id, name: RESOURCES.find(r => r.id === id)?.name ?? `#${id}` })), [storeProductIds]);
  useEffect(() => { if (store && resId && !storeProductIds.includes(resId)) setResId(0); }, [store, storeProductIds, resId]);
  const selected = storeProducts.find(p => p.id === resId);

  // Get live price and saturation from calculator-live.json
  const livePrice = useMemo(() => {
    if (!calcLiveData || !selected) return 0;
    return calcLiveData.livePrices[selected.id]?.[quality] ?? 0;
  }, [calcLiveData, selected, quality]);

  const saturation = useMemo(() => {
    if (!calcLiveData || !selected) return 1.0;
    return calcLiveData.saturation[selected.id]?.[quality] ?? 1.0;
  }, [calcLiveData, selected, quality]);

  const economyPhase = calcLiveData?.economyPhase ?? "Normal";
  const weatherMultiplier = calcLiveData?.weatherMultiplier ?? 1.0;

  // Get phase coefficients for this product/quality/phase
  const phaseCoeff = useMemo(() => {
    if (!selected) return null;
    return phaseCoeffs.find(c => c.productId === selected.id && c.quality === quality && c.phase === economyPhase) ?? null;
  }, [phaseCoeffs, selected, quality, economyPhase]);

  const vwapPrice = margins.find(m => m.id === resId)?.outputVwap ?? 0;
  const transportCost = margins.find(m => m.id === resId)?.transportPerHour ?? 0;
  const buildingWage = store?.wages ?? 100;

  // Calculate optimal price using cubic regression if coefficients available
  const optimizationResult = useMemo(() => {
    if (!selected || !livePrice || !phaseCoeff) return null;
    return optimizePrice({
      livePrice,
      buildingWage,
      buildingLevel: bldgLevel,
      transport: transportCost,
      saturation,
      phaseCoeffs: phaseCoeff,
    });
  }, [selected, livePrice, phaseCoeff, bldgLevel, transportCost, saturation]);

  const sellingPrice = customPrice ? toNum(customPrice, livePrice) : (optimizationResult?.price ?? livePrice * (1 + quality * 0.05));

  // Calculate single product
  const result = useMemo(() => {
    if (!store || !selected || !sellingPrice) return null;
    
    // Use optimization demand if available, otherwise fall back to simple model
    const u = optimizationResult?.demand ?? (() => {
      const baseRate = 3;
      const pm = weatherMultiplier;
      const dm = 1.0; // Use demand from optimization or default
      const ss = 1 + salesSpeed / 100;
      return baseRate * bldgLevel * pm * dm * ss;
    })();
    
    const rev = u * sellingPrice;
    const mf = rev * 0.03;
    const w = toNum(buildingWage) * bldgLevel;
    const ac = w * (ao / 100);
    const cogs = livePrice * u;
    const np = rev - mf - w - ac - cogs - transportCost;
    const mg = rev > 0 ? (np / rev) * 100 : 0;
    
    return { u, rev, mf, w, ac, cogs, np, mg, pm: weatherMultiplier, dm: 1.0, ss: 1 + salesSpeed / 100 };
  }, [store, selected, sellingPrice, bldgLevel, ao, salesSpeed, livePrice, transportCost, buildingWage, optimizationResult, weatherMultiplier]);

  const topProducts = useMemo(() => {
    if (!calcLiveData || !phaseCoeffs.length) return [];
    const out: Array<{ storeName: string; productName: string; demand: number; profit: number; margin: number; revenue: number; productId: number }> = [];
    
    for (const s of stores) {
      const pids = RETAIL_PRODUCT_MAP[s.id] ?? [];
      for (const pid of pids) {
        const liveP = calcLiveData.livePrices[pid]?.[quality] ?? 0;
        const sat = calcLiveData.saturation[pid]?.[quality] ?? 1.0;
        if (!liveP) continue;
        
        const coeff = phaseCoeffs.find(c => c.productId === pid && c.quality === quality && c.phase === economyPhase);
        if (!coeff) continue;
        
        const opt = optimizePrice({
          livePrice: liveP,
          buildingWage: s.wages,
          buildingLevel: bldgLevel,
          transport: margins.find(m => m.id === pid)?.transportPerHour ?? 0,
          saturation: sat,
          phaseCoeffs: coeff,
        });
        
        const u = opt.demand;
        const rev = u * opt.price;
        const mf = rev * 0.03;
        const w = s.wages * bldgLevel;
        const ac = w * (ao / 100);
        const cogs = liveP * u;
        const transport = margins.find(m => m.id === pid)?.transportPerHour ?? 0;
        const np = rev - mf - w - ac - cogs - transport;
        const mg = rev > 0 ? (np / rev) * 100 : 0;
        
        out.push({ 
          storeName: s.name, 
          productName: RESOURCES.find(r => r.id === pid)?.name ?? `#${pid}`, 
          demand: Math.round(opt.demand * 100) / 100,
          profit: np, 
          margin: mg, 
          revenue: rev,
          productId: pid,
        });
      }
    }
    return out.sort((a, b) => b.profit - a.profit).slice(0, 20);
  }, [stores, bldgLevel, ao, economyPhase, quality, margins, calcLiveData, phaseCoeffs]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
        <PageHeader
          title="Retail Profitability"
          subtitle="Loading live market data…"
          icon={<Store size={18} />}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
          iconColor="text-rose-600"
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
      <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
        <PageHeader
          title="Retail Profitability"
          subtitle="Error loading data"
          icon={<AlertTriangle size={18} />}
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

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
      <PageHeader
        title="Retail Profitability"
        subtitle={calcLiveData ? `Live data from ${new Date(calcLiveData.generatedAt).toLocaleString()} (${calcLiveData.dataFreshnessMinutes}min old)` : "No live data"}
        icon={<Store size={18} />}
        iconBg="bg-rose-100 dark:bg-rose-900/30"
        iconColor="text-rose-600"
        realm={realm}
        onRealmChange={() => {}}
      >
        <div className="text-[10px] text-surface-400 font-bold">
          {margins.length} products with pricing data
          {phaseCoeff && <span className="ml-4 text-brand-600">Coefficients: R²={phaseCoeff.rSquared.toFixed(2)} n={phaseCoeff.sampleSize}</span>}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── Sidebar ─── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Store */}
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Store size={13} /> Store</div>
            <label htmlFor="retail-store" className="sr-only">Store Type</label>
            <select id="retail-store" value={storeId} onChange={e => { setStoreId(e.target.value); setResId(0); }} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900">
              <option value="">Select a store type…</option>
              {stores.sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {store && storeProducts.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider pt-2 border-t border-surface-100 dark:border-surface-800"><TrendingUp size={13} /> Product</div>
                <label htmlFor="retail-product" className="sr-only">Product</label>
                <select id="retail-product" value={resId} onChange={e => setResId(toNum(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900">
                  <option value={0}>Choose product…</option>
                  {storeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </>
            )}

            {store && !storeProducts.length && <div className="text-center py-4 text-surface-400 text-xs">No products mapped for this store</div>}
            {!store && <div className="text-center py-6 text-surface-400 text-xs">Pick a store</div>}
          </div>

          {/* Parameters */}
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings2 size={13} /> Parameters</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div><label htmlFor="retail-level" className="text-[10px] font-semibold text-surface-500 block mb-1">Level</label><input id="retail-level" type="number" min={1} max={20} value={bldgLevel} onChange={e => setBldgLevel(Math.max(1, Math.min(20, toNum(e.target.value, 1))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" /></div>
              <div><label htmlFor="retail-quality" className="text-[10px] font-semibold text-surface-500 block mb-1">Quality</label><select id="retail-quality" value={quality} onChange={e => setQuality(Math.max(0, Math.min(12, toNum(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900">{[...Array(13).keys()].map(q => <option key={q} value={q}>Q{q}</option>)}</select></div>
              <div><label htmlFor="retail-ao" className="text-[10px] font-semibold text-surface-500 block mb-1">AO %</label><input id="retail-ao" type="number" min={0} max={100} value={ao} onChange={e => setAo(Math.max(0, Math.min(100, toNum(e.target.value, 25))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" /></div>
              <div><label htmlFor="retail-sales-speed" className="text-[10px] font-semibold text-surface-500 block mb-1">Sales Speed %</label><input id="retail-sales-speed" type="number" min={0} max={200} value={salesSpeed} onChange={e => setSalesSpeed(Math.max(0, Math.min(200, toNum(e.target.value, 0))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" /></div>
            </div>
          </div>

          {/* Demand + Price */}
          {selected && (
            <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><BarChart3 size={13} /> {selected.name} — Live Optimizer</div>

              <div>
                <label htmlFor="retail-base-rate" className="text-[10px] font-semibold text-surface-500 block mb-1">Base Sales Rate (units/h/level)</label>
                <input id="retail-base-rate" type="number" min={0.01} step={0.5} value={3} disabled className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-surface-50 dark:bg-surface-900" />
              </div>

              <div>
                <label htmlFor="retail-custom-price" className="text-[10px] font-semibold text-surface-500 block mb-1">Selling Price</label>
                <div className="flex items-center gap-2">
                  <input id="retail-custom-price" type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder={`Optimal: $${fmtNumber(optimizationResult?.price ?? livePrice)}`} className="flex-1 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" />
                  {customPrice && <button onClick={() => setCustomPrice("")} className="text-[10px] text-brand-600 font-bold">Auto</button>}
                </div>
                <div className="text-[10px] text-surface-400 mt-0.5">
                  Live VWAP: ${fmtNumber(livePrice)} | Optimal: ${fmtNumber(optimizationResult?.price ?? livePrice)} | Saturation: {saturation.toFixed(2)}x
                </div>
              </div>

              {optimizationResult && (
                <div className="border-t border-surface-100 dark:border-surface-800 pt-3 mt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-semibold text-surface-500">Optimized Demand</span>
                    <span className="text-xs font-bold text-brand-600">{fmtNumber(optimizationResult.demand)} units/h</span>
                  </div>
                  <div className="h-2.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all duration-700 ease-out" style={{ width: `${Math.min(100, optimizationResult.demand / 50 * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-surface-400 mt-1.5">
                    Expected Profit: ${fmtNumber(optimizationResult.profit)}/h at ${fmtNumber(optimizationResult.demand)} units/h
                  </p>
                </div>
              )}

              {phaseCoeff && (
                <div className="text-[10px] text-surface-400 bg-surface-50 dark:bg-surface-900 rounded-lg p-2">
                  Phase: {economyPhase} | Coeff: T={phaseCoeff.T.toFixed(6)} U={phaseCoeff.U.toFixed(4)} V={phaseCoeff.V.toFixed(6)} W={phaseCoeff.W.toFixed(2)} | R²={phaseCoeff.rSquared.toFixed(2)} (n={phaseCoeff.sampleSize})
                </div>
              )}
            </div>
          )}

        </div>

        {/* ─── Results ─── */}
        <div className="lg:col-span-8 space-y-3">
          {!store || !selected ? (
            <div className="bg-white dark:bg-surface-950 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-16 text-center">
              <Store size={40} className="mx-auto text-surface-300 mb-3" />
              <p className="text-surface-400 font-bold text-sm">{!store ? "Select a store" : "Choose a product"}</p>
              <p className="text-surface-300 text-xs mt-1">Adjust parameters in the sidebar</p>
            </div>
          ) : (
            <>
              {/* Top 20 toggle */}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowTop(!showTop)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showTop ? "bg-rose-600 text-white shadow-sm" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200"}`}>
                  {showTop ? "Hide Rankings" : "Top 20 Products"}
                </button>
                {showTop && <span className="text-[10px] text-surface-400">Ranked by profit using live data & cubic regression</span>}
              </div>

              {showTop && (
                <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><TrendingUp size={12} /> Top 20 Most Profitable Products</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-surface-50 dark:bg-surface-900 text-[10px] font-bold uppercase text-surface-500"><th className="text-left px-4 py-2.5">#</th><th className="text-left px-4 py-2.5">Store</th><th className="text-left px-4 py-2.5">Product</th><th className="text-right px-4 py-2.5">Demand</th><th className="text-right px-4 py-2.5">Revenue</th><th className="text-right px-4 py-2.5">Profit/h</th><th className="text-right px-4 py-2.5">Margin</th></tr></thead>
                      <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                        {topProducts.map((p, i) => (
                          <tr key={`${p.storeName}-${p.productName}-${p.productId}`} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                            <td className="px-4 py-2 text-surface-400 font-bold">{i + 1}</td>
                            <td className="px-4 py-2 font-bold">{p.storeName}</td>
                            <td className="px-4 py-2">{p.productName}</td>
                            <td className="px-4 py-2 text-right"><span className={`font-bold ${p.demand >= 60 ? "text-emerald-600" : p.demand >= 40 ? "text-amber-500" : "text-rose-500"}`}>{p.demand}%</span></td>
                            <td className="px-4 py-2 text-right text-surface-500">${fmtNumber(p.revenue)}</td>
                            <td className={`px-4 py-2 text-right font-bold ${p.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>${fmtNumber(p.profit)}</td>
                            <td className={`px-4 py-2 text-right font-bold ${p.margin >= 20 ? "text-emerald-600" : p.margin >= 0 ? "text-amber-500" : "text-rose-500"}`}>{p.margin.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!showTop && !result ? null : !showTop && result && (
                <>
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Revenue", val: `$${fmtNumber(result.rev)}`, color: "text-emerald-600", icon: DollarSign, iconColor: "text-emerald-500" },
                      { label: "Net Profit", val: `${result.np >= 0 ? "+" : ""}$${fmtNumber(result.np)}`, color: result.np >= 0 ? "text-emerald-600" : "text-rose-600", icon: DollarSign, iconColor: result.np >= 0 ? "text-emerald-500" : "text-rose-500" },
                      { label: "Margin", val: `${fmtPct(result.mg)}`, color: result.mg >= 0 ? "text-emerald-600" : "text-rose-600", icon: BarChart3, iconColor: "text-blue-500" },
                      { label: "Volume", val: fmtNumber(result.u), color: "text-surface-700 dark:text-surface-300", icon: Users, iconColor: "text-violet-500" },
                    ].map(c => (
                      <div key={c.label} className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-surface-400 mb-1"><c.icon size={12} className={c.iconColor} /> {c.label}</div>
                        <div className={`text-2xl font-bold tracking-tight ${c.color}`}>{c.val}</div>
                        <div className="text-[10px] text-surface-400">/ hour</div>
                      </div>
                    ))}
                  </div>

                  {/* Breakdown */}
                  <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl divide-y divide-surface-100 dark:divide-surface-800">
                    <div className="px-5 py-3 flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings2 size={12} /> Multipliers</div>
                    <div className="px-5 py-3 space-y-2">
                      <Mt label="Weather" val={weatherMultiplier.toFixed(3)} mult={weatherMultiplier} />
                      <Mt label="Demand" val={optimizationResult ? `${fmtNumber(optimizationResult.demand)} u/h` : "Auto"} mult={1} />
                      <Mt label="Sales Speed" val={`+${salesSpeed}%`} mult={result.ss} />
                      <Mt label="Base Rate" val={`${3}/h/lv`} />
                      <Mt label="Level" val={String(bldgLevel)} />
                    </div>
                    <div className="px-5 py-3 space-y-2">
                      <div className="flex justify-between"><span className="text-xs text-surface-500">Gross Revenue</span><span className="text-sm font-bold text-emerald-600">${fmtNumber(result.rev)}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-surface-500">Market Fee</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.mf)}</span><span className="text-[10px] text-surface-400 ml-auto">3%</span></div>
                      <div className="flex justify-between"><span className="text-xs text-surface-500">COGS</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.cogs)}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-surface-500">Wages</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.w)}</span><span className="text-[10px] text-surface-400 ml-auto">Lv{bldgLevel}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-surface-500">Admin Overhead</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.ac)}</span><span className="text-[10px] text-surface-400 ml-auto">{ao}%</span></div>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-wide">Net Profit</span>
                      <span className={`text-xl font-bold ${result.np >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{result.np >= 0 ? "+" : ""}${fmtNumber(result.np)}/h</span>
                    </div>
                  </div>

                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mini components ───────────────────────────────────────────
function Mt({ label, val, mult, badge, bc }: { label: string; val: string; mult?: number; badge?: string; bc?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-surface-500">{label}</span>
      <div className="flex items-center gap-2">
        {badge && <span className={`text-[10px] font-bold ${bc ?? "text-surface-500"}`}>{badge}</span>}
        <span className="text-xs font-bold text-surface-600">{val}</span>
        {mult !== undefined && <span className="text-[10px] text-surface-400 w-10 text-right">×{mult.toFixed(2)}</span>}
      </div>
    </div>
  );
}