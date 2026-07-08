import { useState, useEffect, useMemo, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { BUILDINGS, RESOURCES, RETAIL_PRODUCT_MAP, PHASE_MULTIPLIERS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { ProfitMarginsResponse } from "../types/api";

// ponytail: per-store base sales rate (units/h at level 1). Tune when real game data is available.
const STORE_BASE_SALES: Record<string, number> = {
  G: 60, C: 25, A: 200, 2: 5, H: 30, d: 80, r: 0, B: 0, t: 40, u: 40, z: 50,
};

function getSatMult(sat: number): number {
  if (sat <= 20) return 1.0;
  if (sat <= 40) return 0.9;
  if (sat <= 60) return 0.75;
  if (sat <= 80) return 0.55;
  return 0.35;
}

async function fetchApiResources(realm: number): Promise<Record<string, { saturation: number; sellers: number }>> {
  const baseUrl = `https://api.simcotools.com/v1/realms/${realm}/resources?disable_pagination=True`;
  const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(baseUrl)}`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const data = await res.json() as { resources: Array<{ id: number; retailInfo: Array<Record<string, unknown>> | null }> };
  const retail: Record<string, { saturation: number; sellers: number }> = {};
  for (const r of data.resources) {
    if (!r.retailInfo || r.retailInfo.length === 0) continue;
    const first = r.retailInfo[0];
    const saturation = (first?.saturation ?? first?.saturationPercent ?? first?.saturation_pct ?? 0) as number;
    const sellers = (first?.sellers ?? first?.activeSellers ?? 0) as number;
    if (saturation > 0 || sellers > 0) retail[String(r.id)] = { saturation, sellers };
  }
  return retail;
}

async function fetchApiVwaps(realm: number): Promise<Record<number, number>> {
  const baseUrl = `https://api.simcotools.com/v1/realms/${realm}/market/vwaps`;
  const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(baseUrl)}`);
  if (!res.ok) throw new Error(`VWAP API returned ${res.status}`);
  const data = await res.json() as Array<{ resourceId: number; vwap: number; quality: number }>;
  const vwaps: Record<number, number> = {};
  for (const v of data) {
    const existing = vwaps[v.resourceId];
    if (existing === undefined || v.quality > 0) vwaps[v.resourceId] = v.vwap;
  }
  return vwaps;
}

export function RetailCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Retail Calculator"; }, []);

  const [realm] = useSharedRealm();
  const [storeId, setStoreId] = useState("");
  const [resId, setResId] = useState(0);
  const [quality, setQuality] = useState(0);
  const [bldgLevel, setBldgLevel] = useState(1);
  const [ao, setAo] = useState(25);
  const [salesSpeed, setSalesSpeed] = useState(0);
  const [saturation, setSaturation] = useState(50);
  const [phase, setPhase] = useState("normal");
  const [customPrice, setCustomPrice] = useState("");

  const [dataSource, setDataSource] = useState<"repo" | "direct">("repo");
  const [directLoading, setDirectLoading] = useState(false);
  const [directRetail, setDirectRetail] = useState<Record<string, { saturation: number; sellers: number }> | null>(null);
  const [directVwaps, setDirectVwaps] = useState<Record<number, number> | null>(null);
  const [restaurantTab, setRestaurantTab] = useState<"products" | "restaurant">("products");

  const { data: marginsData } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const { data: retailData } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const fetchDirect = useCallback(async () => {
    setDirectLoading(true);
    try {
      const [retail, vwaps] = await Promise.all([fetchApiResources(realm), fetchApiVwaps(realm)]);
      setDirectRetail(retail);
      setDirectVwaps(vwaps);
    } catch { /* silent */ } finally { setDirectLoading(false); }
  }, [realm]);

  useEffect(() => { if (dataSource === "direct") fetchDirect(); }, [dataSource, fetchDirect]);

  const stores = useMemo(() => BUILDINGS.filter((b: any) => b.type === "retail"), []);
  const store = useMemo(() => stores.find((s: any) => s.id === storeId), [storeId, stores]);
  const isRestaurant = storeId === "r";

  // Products that this store sells
  const storeProducts = useMemo(() => {
    if (!store) return [];
    const ids = RETAIL_PRODUCT_MAP[store.id] ?? [];
    return ids.map(id => RESOURCES.find(r => r.id === id)).filter(Boolean);
  }, [store]);

  // Reset product when store changes if current selection not in new store
  useEffect(() => {
    if (store && resId && !storeProducts.some(r => r?.id === resId)) setResId(0);
  }, [store, storeProducts, resId]);

  const selected = useMemo(() => RESOURCES.find(r => r.id === resId), [resId]);
  const vwapPrice = dataSource === "direct" && directVwaps
    ? (directVwaps[resId] ?? 0)
    : (margins.find(m => m.id === resId)?.outputVwap ?? 0);
  const sellingPrice = customPrice ? parseFloat(customPrice) : vwapPrice;

  const satValue = dataSource === "direct" && directRetail
    ? (directRetail[String(resId)]?.saturation ?? saturation)
    : retailData?.retail?.[String(resId)]?.saturation ?? saturation;

  const baseSalesRate = isRestaurant ? 0 : (STORE_BASE_SALES[storeId] ?? 50);

  const result = useMemo(() => {
    if (!store || !selected || !sellingPrice || isRestaurant) return null;

    const phaseMult = PHASE_MULTIPLIERS[phase] ?? 1.0;
    const satMult = getSatMult(satValue);
    const salesSpeedBonus = 1 + salesSpeed / 100;
    const unitsSold = baseSalesRate * bldgLevel * phaseMult * satMult * salesSpeedBonus;

    const revenue = unitsSold * sellingPrice;
    const marketFee = revenue * 0.03;
    const wages = (store.wages ?? 0) * bldgLevel;
    const adminCost = wages * (ao / 100);

    let cogs = 0;
    if (selected.inputs) {
      const inpEntries = Object.entries(selected.inputs);
      if (inpEntries.length > 0) {
        for (const [inpId, qty] of inpEntries) {
          const price = dataSource === "direct" && directVwaps
            ? (directVwaps[Number(inpId)] ?? 0)
            : (margins.find(m => m.id === Number(inpId))?.outputVwap ?? 0);
          cogs += price * qty * unitsSold;
        }
      } else {
        cogs = vwapPrice * unitsSold;
      }
    } else {
      cogs = vwapPrice * unitsSold;
    }

    const netProfit = revenue - marketFee - wages - adminCost - cogs;
    const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return { unitsSold, revenue, marketFee, wages, adminCost, cogs, netProfit, marginPct, phaseMult, satMult, salesSpeedBonus, satValue };
  }, [store, selected, sellingPrice, bldgLevel, ao, salesSpeed, satValue, phase, margins, dataSource, directVwaps, vwapPrice, baseSalesRate, isRestaurant]);

  return (
    <div className="space-y-6 text-sm">
      <div className="border-b border-surface-200 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Retail Calculator</h1>
          <p className="text-xs text-surface-500 mt-0.5">Estimate retail profitability by store type and product</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-surface-400">Data:</span>
          <button onClick={() => setDataSource("repo")} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${dataSource === "repo" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}>Repo</button>
          <button onClick={() => setDataSource("direct")} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${dataSource === "direct" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}>Direct API</button>
        </div>
      </div>

      {dataSource === "direct" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 rounded-lg flex items-center justify-between">
          <span>Live from simcotools.com {directLoading ? "(loading...)" : ""}</span>
          <button onClick={fetchDirect} disabled={directLoading} className="px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded text-xs font-bold transition-colors disabled:opacity-50">Refresh</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-surface-200 rounded-lg p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase text-surface-400">Store</h2>
            <select value={storeId} onChange={e => { setStoreId(e.target.value); setResId(0); setRestaurantTab("products"); }} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none">
              <option value="">-- Select Store --</option>
              {stores.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {isRestaurant ? (
              <div className="space-y-3">
                <div className="flex gap-1">
                  <button onClick={() => setRestaurantTab("products")} className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${restaurantTab === "products" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600"}`}>Products</button>
                  <button onClick={() => setRestaurantTab("restaurant")} className={`flex-1 py-2 rounded text-xs font-bold transition-colors ${restaurantTab === "restaurant" ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600"}`}>Restaurant</button>
                </div>
                {restaurantTab === "restaurant" && (
                  <div className="bg-surface-50 p-3 rounded-lg text-xs text-surface-600 space-y-2">
                    <p className="font-bold">Restaurants use a menu/recipe system:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Select recipes (e.g. Hamburger, Pizza, Salad)</li>
                      <li>Each recipe requires specific ingredients</li>
                      <li>Revenue comes from meals served, not product sales</li>
                      <li>Profit depends on ingredient costs vs meal prices</li>
                      <li>{/* ponytail: recipe data needs game API — basic meal calculator below */}</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              store && storeProducts.length === 0 && storeId !== "B" && (
                <div className="bg-surface-50 p-3 rounded-lg text-xs text-surface-500">No known products mapped for this store</div>
              )
            )}

            {!isRestaurant && store && storeProducts.length > 0 && (
              <select value={resId} onChange={e => setResId(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none">
                <option value={0}>-- Select Product --</option>
                {storeProducts.map(r => r && <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>

          {!isRestaurant && (
            <div className="border border-surface-200 rounded-lg p-4 space-y-4">
              <h2 className="text-xs font-bold uppercase text-surface-400">Parameters</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Building Level</label><input type="number" min={1} max={20} value={bldgLevel} onChange={e => setBldgLevel(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" /></div>
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Quality</label><select value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none">{[0,1,2,3,4,5].map(q => <option key={q} value={q}>Q{q}</option>)}</select></div>
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">AO %</label><input type="number" min={0} max={100} value={ao} onChange={e => setAo(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" /></div>
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Sales Speed %</label><input type="number" min={0} max={200} value={salesSpeed} onChange={e => setSalesSpeed(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" /></div>
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Saturation</label>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={100} value={satValue} onChange={e => setSaturation(Number(e.target.value))} className="flex-1 border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
                    {retailData?.retail?.[String(resId)] && dataSource === "repo" && <span className="text-[10px] text-emerald-600 font-bold">live:{retailData.retail[String(resId)].saturation}</span>}
                  </div>
                </div>
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Economy</label><select value={phase} onChange={e => setPhase(e.target.value)} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none"><option value="boom">Boom</option><option value="normal">Normal</option><option value="recession">Recession</option></select></div>
              </div>
              <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Selling Price (blank = VWAP)</label><input type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder={`$${vwapPrice.toFixed(2)}`} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" /></div>
              {resId > 0 && (
                <div className="border-t border-surface-100 pt-3 mt-2">
                  <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-surface-400">Market Saturation</span><span className={`text-xl font-bold ${satValue > 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{satValue}%</span></div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${satValue > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${satValue}%` }} />
                  </div>
                  <p className="text-[10px] text-surface-400 mt-1">{satValue < 30 ? "Low saturation — good entry opportunity" : satValue < 60 ? "Moderate competition" : "High saturation — tight margins"}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!store ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Select a store</div>
          ) : isRestaurant ? (
            <RestaurantCalculator store={store} margins={margins} dataSource={dataSource} directVwaps={directVwaps} realm={realm} bldgLevel={bldgLevel} ao={ao} salesSpeed={salesSpeed} saturation={saturation} phase={phase} satValue={0} retailData={retailData} />
          ) : !selected && storeProducts.length > 0 ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Select a product from the {store.name}</div>
          ) : storeProducts.length === 0 ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">This store type has no products defined yet</div>
          ) : !result ? null : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-emerald-500"><span className="text-[10px] font-bold uppercase text-surface-400 block">Revenue/H</span><span className="text-lg font-bold">${result.revenue.toFixed(2)}</span></div>
                <div className="border border-surface-200 rounded-lg p-3 border-l-4" style={{ borderLeftColor: result.netProfit >= 0 ? '#10b981' : '#ef4444' }}><span className="text-[10px] font-bold uppercase text-surface-400 block">Net Profit/H</span><span className={`text-lg font-bold ${result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${result.netProfit.toFixed(2)}</span></div>
                <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-blue-500"><span className="text-[10px] font-bold uppercase text-surface-400 block">Margin</span><span className={`text-lg font-bold ${result.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{result.marginPct.toFixed(1)}%</span></div>
                <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-violet-500"><span className="text-[10px] font-bold uppercase text-surface-400 block">Units/H</span><span className="text-lg font-bold">{result.unitsSold.toFixed(0)}</span></div>
              </div>
              <div className="border border-surface-200 rounded-lg">
                <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-xs font-bold text-surface-500 uppercase">Breakdown</div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Sales Volume</span><span className="text-sm">{result.unitsSold.toFixed(0)} u/h</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Phase ({phase})</span><span className="text-sm">×{result.phaseMult.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Saturation ({result.satValue}%)</span><span className="text-sm">×{result.satMult.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Sales Speed</span><span className="text-sm">×{result.salesSpeedBonus.toFixed(3)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Revenue</span><span className="text-sm font-bold text-emerald-600">+${result.revenue.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Market Fee (3%)</span><span className="text-sm text-rose-500">-${result.marketFee.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">COGS</span><span className="text-sm text-rose-500">-${result.cogs.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Wages (Lv{bldgLevel})</span><span className="text-sm text-rose-500">-${result.wages.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Admin Overhead ({ao}%)</span><span className="text-sm text-rose-500">-${result.adminCost.toFixed(2)}</span></div>
                  <div className="flex justify-between py-3"><span className="text-sm font-bold uppercase">Net Profit</span><span className={`text-lg font-bold ${result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${result.netProfit.toFixed(2)}/h</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ponytail: meal recipes — keyed by resource ID, each listing ingredient resource IDs + qty per meal
const MEAL_RECIPES: Record<number, { name: string; inputs: Record<number, number> }> = {
  30: { name: "Frozen Pizza", inputs: { 137: 1, 122: 0.5, 55: 0.2 } },    // dough + cheese + sauce
  39: { name: "Hamburger", inputs: { 137: 1, 7: 0.2, 122: 0.1 } },        // dough + steak + cheese
  49: { name: "Lasagna", inputs: { 31: 0.5, 7: 0.3, 122: 0.3, 55: 0.2 } },
  53: { name: "Meat balls", inputs: { 8: 0.5, 55: 0.2 } },                // sausages + sauce
  56: { name: "Salad", inputs: { 120: 0.5, 33: 0.1 } },                   // vegetables + oil
  57: { name: "Samosa", inputs: { 133: 0.3, 120: 0.2 } },                 // flour + vegetables
  58: { name: "Pumpkin Soup", inputs: { 26: 0.5, 134: 0.1 } },            // pumpkin + butter
  38: { name: "Apple Pie", inputs: { 137: 0.5, 3: 0.5, 135: 0.1 } },     // dough + apples + sugar
};

function RestaurantCalculator({ store, margins, dataSource, directVwaps, realm, bldgLevel, ao, salesSpeed, saturation, phase, satValue, retailData }: any) {
  const phaseMult = PHASE_MULTIPLIERS[phase] ?? 1.0;
  const satMult = getSatMult(saturation);
  const salesSpeedBonus = 1 + salesSpeed / 100;

  // ponytail: restaurant meals served per hour — base rate unknown, using 30
  const mealsPerHour = 30 * bldgLevel * phaseMult * satMult * salesSpeedBonus;

  const recipeEntries = useMemo(() => Object.entries(MEAL_RECIPES), []);

  let totalMeals = 0;
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalMarketFee = 0;
  let totalWages = 0;
  let totalAdmin = 0;

  const mealDetails: any[] = [];

  for (const [, recipe] of recipeEntries) {
    const marginRec = margins.find((m: any) => m.id === Number(recipe.name));
    const mealPrice = dataSource === "direct" && directVwaps
      ? (directVwaps[Number(recipe.name)] ?? 0)
      : (marginRec?.outputVwap ?? 0);
    if (!mealPrice) continue;

    const mealsPerRecipe = mealsPerHour / recipeEntries.length;
    const mealRevenue = mealsPerRecipe * mealPrice;
    let mealCogs = 0;
    const ingredientCosts: { name: string; qty: number; cost: number }[] = [];

    for (const [ingId, qty] of Object.entries(recipe.inputs)) {
      const price = dataSource === "direct" && directVwaps
        ? (directVwaps[Number(ingId)] ?? 0)
        : (margins.find((m: any) => m.id === Number(ingId))?.outputVwap ?? 0);
      const cost = price * qty * mealsPerRecipe;
      mealCogs += cost;
      const res = RESOURCES.find((r: any) => r.id === Number(ingId));
      ingredientCosts.push({ name: res?.name ?? `id:${ingId}`, qty: qty * mealsPerRecipe, cost });
    }

    totalMeals += mealsPerRecipe;
    totalRevenue += mealRevenue;
    totalCogs += mealCogs;
    mealDetails.push({ name: recipe.name, meals: mealsPerRecipe, revenue: mealRevenue, cogs: mealCogs, price: mealPrice, ingredientCosts });
  }

  totalMarketFee = totalRevenue * 0.03;
  totalWages = (store.wages ?? 0) * bldgLevel;
  totalAdmin = totalWages * (ao / 100);
  const netProfit = totalRevenue - totalMarketFee - totalCogs - totalWages - totalAdmin;
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const satValueNum = dataSource === "direct"
    ? satValue
    : retailData?.retail?.[String(realm)]?.saturation ?? saturation;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-emerald-500"><span className="text-[10px] font-bold uppercase text-surface-400 block">Revenue/H</span><span className="text-lg font-bold">${totalRevenue.toFixed(2)}</span></div>
        <div className="border border-surface-200 rounded-lg p-3 border-l-4" style={{ borderLeftColor: netProfit >= 0 ? '#10b981' : '#ef4444' }}><span className="text-[10px] font-bold uppercase text-surface-400 block">Net Profit/H</span><span className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${netProfit.toFixed(2)}</span></div>
        <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-blue-500"><span className="text-[10px] font-bold uppercase text-surface-400 block">Margin</span><span className={`text-lg font-bold ${marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{marginPct.toFixed(1)}%</span></div>
        <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-violet-500"><span className="text-[10px] font-bold uppercase text-surface-400 block">Meals/H</span><span className="text-lg font-bold">{totalMeals.toFixed(0)}</span></div>
      </div>

      <div className="border border-surface-200 rounded-lg">
        <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-xs font-bold text-surface-500 uppercase">Menu Breakdown</div>
        <div className="divide-y divide-surface-100">
          {mealDetails.map((m: any) => (
            <div key={m.name} className="p-4">
              <div className="flex justify-between items-center mb-2"><span className="font-bold">{m.name}</span><span className="text-sm text-surface-500">{m.meals.toFixed(0)} meals/h @ ${m.price.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-surface-500 pl-4"><span>Revenue</span><span className="text-emerald-600">+${m.revenue.toFixed(2)}</span></div>
              {m.ingredientCosts.map((ic: any) => <div key={ic.name} className="flex justify-between text-xs text-surface-400 pl-4"><span>{ic.name}</span><span className="text-rose-500">-${ic.cost.toFixed(2)}</span></div>)}
              <div className="flex justify-between text-xs font-bold pl-4 border-t border-surface-100 pt-1 mt-1"><span>Meal net</span><span className={m.revenue - m.cogs >= 0 ? 'text-emerald-600' : 'text-rose-600'}>${(m.revenue - m.cogs).toFixed(2)}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-surface-200 rounded-lg p-4">
        <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Market Fee (3%)</span><span className="text-sm text-rose-500">-${totalMarketFee.toFixed(2)}</span></div>
        <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Wages (Lv{bldgLevel})</span><span className="text-sm text-rose-500">-${totalWages.toFixed(2)}</span></div>
        <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs text-surface-500">Admin Overhead ({ao}%)</span><span className="text-sm text-rose-500">-${totalAdmin.toFixed(2)}</span></div>
        <div className="flex justify-between py-3"><span className="text-sm font-bold uppercase">Net Profit</span><span className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${netProfit.toFixed(2)}/h</span></div>
      </div>
    </div>
  );
}
