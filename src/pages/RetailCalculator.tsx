import { useState, useEffect, useMemo, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { BUILDINGS, RETAIL_PRODUCT_MAP, PHASE_MULTIPLIERS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Store, DollarSign, Users, BarChart3, RefreshCw, Settings2, TrendingUp } from "lucide-react";
import type { ProfitMarginsResponse } from "../types/api";

// ─── API data types ────────────────────────────────────────────
interface RetailInfo {
  quality: number;
  buildingLevelsNeededPerUnitPerHour: number;
  modeledProductionCostPerUnit: number;
  modeledStoreWages: number;
  modeledUnitsSoldAnHour: number;
  saturation: number;
}

interface ApiResource {
  id: number;
  name: string;
  retailInfo: RetailInfo | null;
}

// ─── Helpers ───────────────────────────────────────────────────
function getDemandMult(d: number): number {
  if (d >= 80) return 1.0;
  if (d >= 60) return 0.9;
  if (d >= 40) return 0.75;
  if (d >= 20) return 0.55;
  return 0.35;
}

function demandLabel(d: number): string {
  if (d >= 80) return "Very High";
  if (d >= 60) return "High";
  if (d >= 40) return "Medium";
  if (d >= 20) return "Low";
  return "Very Low";
}

function demandColor(d: number): string {
  if (d >= 80) return "text-emerald-600";
  if (d >= 60) return "text-emerald-500";
  if (d >= 40) return "text-amber-500";
  if (d >= 20) return "text-orange-500";
  return "text-rose-500";
}

function demandBarColor(d: number): string {
  if (d >= 80) return "bg-emerald-500";
  if (d >= 60) return "bg-emerald-400";
  if (d >= 40) return "bg-amber-400";
  if (d >= 20) return "bg-orange-400";
  return "bg-rose-400";
}

// API saturation (0-1, lower = less saturated), invert to demand
function satToDemand(sat: number): number {
  return Math.round((1 - sat) * 100);
}

function fmt(n: number): string { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }

// ─── API fetcher ───────────────────────────────────────────────
async function fetchApiResources(realm: number): Promise<ApiResource[]> {
  const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/resources?disable_pagination=True`)}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json() as { resources: Array<{ id: number; name: string; retailInfo: any[] | null }> };
  return data.resources.map(r => ({
    id: r.id,
    name: r.name,
    retailInfo: r.retailInfo?.[0] ?? null,
  }));
}

async function fetchApiVwaps(realm: number): Promise<Record<number, number>> {
  const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/market/vwaps`)}`);
  if (!res.ok) throw new Error(`VWAP ${res.status}`);
  const data = await res.json() as Array<{ resourceId: number; vwap: number; quality: number }>;
  const m: Record<number, number> = {};
  for (const v of data) { if (!(v.resourceId in m) || v.quality > 0) m[v.resourceId] = v.vwap; }
  return m;
}

// ─── Page ──────────────────────────────────────────────────────
export function RetailCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Retail Calculator"; }, []);

  const [realm] = useSharedRealm();
  const [storeId, setStoreId] = useState("");
  const [resId, setResId] = useState(0);
  const [bldgLevel, setBldgLevel] = useState(1);
  const [ao, setAo] = useState(25);
  const [salesSpeed, setSalesSpeed] = useState(0);
  const [demand, setDemand] = useState(50);
  const [baseRate, setBaseRate] = useState(3);
  const [customPrice, setCustomPrice] = useState("");
  const [phase, setPhase] = useState("normal");
  const [quality, setQuality] = useState(0);
  const [ds, setDs] = useState<"repo" | "direct">("repo");
  const [loading, setLoading] = useState(false);
  const [directVwaps, setDirectVwaps] = useState<Record<number, number> | null>(null);
  const [apiResources, setApiResources] = useState<ApiResource[]>([]);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Repo data
  const { data: marginsData } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const { data: retailData } = useDataRepoPoll(() => dataRepo.fetchRetailData(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  // Fetch API data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, vw] = await Promise.all([
        fetchApiResources(realm),
        ds === "direct" ? fetchApiVwaps(realm) : Promise.resolve(null),
      ]);
      setApiResources(res);
      if (vw) setDirectVwaps(vw);
      setLastFetch(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [realm, ds]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build lookup maps from API data
  const resNameMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const r of apiResources) m[r.id] = r.name;
    return m;
  }, [apiResources]);

  const retailInfoMap = useMemo(() => {
    const m: Record<number, RetailInfo> = {};
    for (const r of apiResources) { if (r.retailInfo) m[r.id] = r.retailInfo; }
    return m;
  }, [apiResources]);

  // Stores with products
  const stores = useMemo(() => BUILDINGS.filter((b: any) => b.type === "retail" && b.id !== "r" && b.id !== "B" && (RETAIL_PRODUCT_MAP[b.id]?.length ?? 0) > 0), []);
  const store = useMemo(() => stores.find((s: any) => s.id === storeId), [storeId, stores]);
  const storeProductIds = useMemo(() => RETAIL_PRODUCT_MAP[storeId] ?? [], [storeId]);

  // Build product list with API name fallback
  const storeProducts = useMemo(() => {
    return storeProductIds.map(id => {
      const ri = retailInfoMap[id];
      const name = resNameMap[id] ?? `#${id}`;
      return { id, name, retailInfo: ri, baseSalesRate: ri ? Math.round((1 / ri.buildingLevelsNeededPerUnitPerHour) * 100) / 100 : 0 };
    });
  }, [storeProductIds, retailInfoMap, resNameMap]);

  // Reset on store change
  useEffect(() => { if (store && resId && !storeProductIds.includes(resId)) setResId(0); }, [store, storeProductIds, resId]);

  const selected = storeProducts.find(p => p.id === resId);
  const ri = selected?.retailInfo;

  // VWAP price
  const vwapPrice = ds === "direct" && directVwaps
    ? (directVwaps[resId] ?? 0)
    : (margins.find(m => m.id === resId)?.outputVwap ?? 0);
  const sellingPrice = customPrice ? parseFloat(customPrice) : vwapPrice;

  // Auto-populate from API
  useEffect(() => {
    if (ri) {
      const d = satToDemand(ri.saturation);
      if (d > 0) setDemand(d);
      if (selected?.baseSalesRate && selected.baseSalesRate > 0) setBaseRate(selected.baseSalesRate);
    }
  }, [resId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate
  const result = useMemo(() => {
    if (!store || !selected || !sellingPrice) return null;
    const pm = PHASE_MULTIPLIERS[phase] ?? 1.0;
    const dm = getDemandMult(demand);
    const ss = 1 + salesSpeed / 100;
    const u = baseRate * bldgLevel * pm * dm * ss;
    const rev = u * sellingPrice;
    const mf = rev * 0.03;
    const w = ((store as any).wages ?? 0) * bldgLevel;
    const ac = w * (ao / 100);
    let cogs = 0;
    const r = (store as any).resources?.[0]; // placeholder for retail input structure
    if (ri && ri.modeledProductionCostPerUnit) cogs = ri.modeledProductionCostPerUnit * u;
    else cogs = vwapPrice * u;
    const np = rev - mf - w - ac - cogs;
    const mg = rev > 0 ? (np / rev) * 100 : 0;
    return { u, rev, mf, w, ac, cogs, np, mg, pm, dm, ss };
  }, [store, selected, sellingPrice, bldgLevel, ao, salesSpeed, demand, baseRate, phase, vwapPrice, ri]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center"><Store size={18} className="text-rose-600" /></div>
          <div><h1 className="text-lg font-bold leading-tight">Retail Profitability</h1><p className="text-xs text-surface-400">Demand-driven profit analysis per store & product</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-100 rounded-lg p-0.5">
            <button onClick={() => setDs("repo")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${ds === "repo" ? "bg-white text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}>Repo</button>
            <button onClick={() => setDs("direct")} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${ds === "direct" ? "bg-white text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}>Live</button>
          </div>
          <button onClick={fetchAll} disabled={loading} className="p-2 rounded-lg hover:bg-surface-100 transition-colors disabled:opacity-40"><RefreshCw size={15} className={`text-surface-400 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      {lastFetch && (
        <div className="text-[10px] text-surface-400 flex items-center gap-3">
          <span>{apiResources.filter(r => r.retailInfo).length} retail products from API</span>
          <span>at {lastFetch.toLocaleTimeString()}</span>
          {loading && <span className="text-brand-600 font-bold">refreshing…</span>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── Sidebar ─── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Store */}
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Store size={13} /> Store</div>
            <select value={storeId} onChange={e => { setStoreId(e.target.value); setResId(0); }} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900">
              <option value="">Select a store type…</option>
              {stores.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {store && storeProducts.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider pt-2 border-t border-surface-100 dark:border-surface-800"><TrendingUp size={13} /> Product</div>
                <select value={resId} onChange={e => setResId(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900">
                  <option value={0}>Choose product…</option>
                  {storeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.retailInfo ? ` (demand ${satToDemand(p.retailInfo.saturation)}%)` : ""}
                    </option>
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
              <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Level</label><input type="number" min={1} max={20} value={bldgLevel} onChange={e => setBldgLevel(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" /></div>
              <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Quality</label><select value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900">{[0,1,2,3,4,5].map(q => <option key={q} value={q}>Q{q}</option>)}</select></div>
              <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">AO %</label><input type="number" min={0} max={100} value={ao} onChange={e => setAo(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" /></div>
              <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Sales Speed %</label><input type="number" min={0} max={200} value={salesSpeed} onChange={e => setSalesSpeed(Math.max(0, Math.min(200, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" /></div>
              <div className="col-span-2"><label className="text-[10px] font-semibold text-surface-500 block mb-1">Economy</label><select value={phase} onChange={e => setPhase(e.target.value)} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900"><option value="boom">Boom ×1.25</option><option value="normal">Normal ×1.0</option><option value="recession">Recession ×0.8</option></select></div>
            </div>
          </div>

          {/* Demand + Base Rate */}
          {selected && ri && (
            <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><BarChart3 size={13} /> {selected.name} — Auto-detected</div>

              <div>
                <div className="flex items-center justify-between mb-1"><label className="text-[10px] font-semibold text-surface-500">Demand</label><span className={`text-xs font-bold ${demandColor(demand)}`}>{demandLabel(demand)}</span></div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden mb-1.5"><div className={`h-full transition-all duration-500 ${demandBarColor(demand)}`} style={{ width: `${demand}%` }} /></div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={demand} onChange={e => setDemand(Number(e.target.value))} className="flex-1 accent-rose-500" />
                  <input type="number" min={0} max={100} value={demand} onChange={e => setDemand(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-14 border border-surface-300 rounded-md px-2 py-1 text-xs font-bold text-center outline-none" />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-surface-400">
                  <span>API saturation: {(ri.saturation * 100).toFixed(0)}%</span>
                  <span>·</span>
                  <button onClick={() => setDemand(satToDemand(ri.saturation))} className="text-brand-600 hover:text-brand-700 font-bold">Reset</button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-surface-500 block mb-1">Base Sales Rate (units/h/level)</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0.01} step={0.5} value={baseRate} onChange={e => setBaseRate(Math.max(0.01, Number(e.target.value)))} className="flex-1 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" />
                  <button onClick={() => { if (selected.baseSalesRate > 0) setBaseRate(selected.baseSalesRate); }} className="text-[10px] text-brand-600 hover:text-brand-700 font-bold">Reset</button>
                </div>
                <div className="text-[10px] text-surface-400 mt-0.5">API: {selected.baseSalesRate.toFixed(2)} u/h/level</div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-surface-500 block mb-1">Selling Price</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder={`$${fmt(vwapPrice)}`} className="flex-1 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-surface-900" />
                  {customPrice && <button onClick={() => setCustomPrice("")} className="text-[10px] text-brand-600 font-bold">VWAP</button>}
                </div>
                <div className="text-[10px] text-surface-400 mt-0.5 flex gap-3">
                  <span>VWAP: ${fmt(vwapPrice)}</span>
                  <span>Modeled cost: ${fmt(ri.modeledProductionCostPerUnit)}</span>
                </div>
              </div>

              <div className="border-t border-surface-100 dark:border-surface-800 pt-3 mt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold text-surface-500">Demand Gauge</span>
                  <span className={`text-xs font-bold ${demandColor(demand)}`}>{demandLabel(demand)}</span>
                </div>
                <div className="h-2.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ease-out ${demandBarColor(demand)}`} style={{ width: `${demand}%` }} />
                </div>
                <p className="text-[10px] text-surface-400 mt-1.5">
                  {demand >= 60 ? "High demand — great time to sell" : demand >= 40 ? "Moderate demand — standard conditions" : "Low demand — consider different product"}
                </p>
              </div>
            </div>
          )}

          {selected && !ri && (
            <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 text-center text-surface-400 text-xs">
              No API data for #{resId} — fetch API products first
            </div>
          )}
        </div>

        {/* ─── Results ─── */}
        <div className="lg:col-span-8 space-y-3">
          {!store || !selected ? (
            <div className="bg-white dark:bg-surface-950 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-16 text-center">
              <Store size={40} className="mx-auto text-surface-300 mb-3" />
              <p className="text-surface-400 font-bold text-sm">{!store ? "Select a store" : "Choose a product"}</p>
              <p className="text-surface-300 text-xs mt-1">Adjust demand, price & parameters in the sidebar</p>
            </div>
          ) : !result ? null : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Revenue", val: `$${fmt(result.rev)}`, color: "text-emerald-600", icon: DollarSign, iconColor: "text-emerald-500" },
                  { label: "Net Profit", val: `${result.np >= 0 ? "+" : ""}$${fmt(result.np)}`, color: result.np >= 0 ? "text-emerald-600" : "text-rose-600", icon: DollarSign, iconColor: result.np >= 0 ? "text-emerald-500" : "text-rose-500" },
                  { label: "Margin", val: `${result.mg.toFixed(1)}%`, color: result.mg >= 0 ? "text-emerald-600" : "text-rose-600", icon: BarChart3, iconColor: "text-blue-500" },
                  { label: "Volume", val: fmt(result.u), color: "text-surface-700 dark:text-surface-300", icon: Users, iconColor: "text-violet-500" },
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
                  <Mt label="Phase" val={phase} mult={result.pm} />
                  <Mt label="Demand" val={`${demand}%`} mult={result.dm} badge={demandLabel(demand)} bc={demandColor(demand)} />
                  <Mt label="Sales Speed" val={`+${salesSpeed}%`} mult={result.ss} />
                  <Mt label="Base Rate" val={`${baseRate}/h/lv`} />
                  <Mt label="Level" val={String(bldgLevel)} />
                </div>
                <div className="px-5 py-3 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Gross Revenue</span><span className="text-sm font-bold text-emerald-600">${fmt(result.rev)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Market Fee</span><span className="text-sm font-bold text-rose-500">-${fmt(result.mf)}</span><span className="text-[10px] text-surface-400 ml-auto">3%</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">COGS</span><span className="text-sm font-bold text-rose-500">-${fmt(result.cogs)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Wages</span><span className="text-sm font-bold text-rose-500">-${fmt(result.w)}</span><span className="text-[10px] text-surface-400 ml-auto">Lv{bldgLevel}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Admin Overhead</span><span className="text-sm font-bold text-rose-500">-${fmt(result.ac)}</span><span className="text-[10px] text-surface-400 ml-auto">{ao}%</span></div>
                  {ri && <div className="flex justify-between"><span className="text-xs text-surface-500">Modeled Wages</span><span className="text-sm text-surface-400">${fmt(ri.modeledStoreWages)}</span><span className="text-[10px] text-surface-400 ml-auto">API est.</span></div>}
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wide">Net Profit</span>
                  <span className={`text-xl font-bold ${result.np >= 0 ? "text-emerald-600" : "text-rose-600}"}`}>{result.np >= 0 ? "+" : ""}${fmt(result.np)}/h</span>
                </div>
              </div>

              {ri && (
                <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-surface-500">Modeled Production Cost (API)</span>
                  <span className="text-sm font-bold">${fmt(ri.modeledProductionCostPerUnit)} / unit</span>
                </div>
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
