import { useState, useEffect, useMemo } from "react";
import { LoadingState } from "../components/States";
import { RESOURCES, BUILDINGS, PHASE_MULTIPLIERS, MAT_REF_PRICES } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Calculator, Zap, Settings, Truck } from "lucide-react";
import type { ProfitMarginsResponse, CalculatorLiveData } from "../types/api";

import { useProfitMargins } from "../hooks/useDataQueries";
import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtNumber, fmtPct } from "../utils/formatters";
import { fetchCalculatorLive } from "../services/dataRepo";

function getBuildingName(buildingId: string | number | undefined): string {
  if (!buildingId) return "N/A";
  return BUILDINGS.find(x => x.id === String(buildingId))?.name ?? String(buildingId);
}

function Mt({ label, val, mult }: { label: string; val: string; mult?: number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-surface-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-surface-600">{val}</span>
        {mult !== undefined && <span className="text-[10px] text-surface-400 w-10 text-right">×{mult.toFixed(2)}</span>}
      </div>
    </div>
  );
}

export function ProfitCalculatorPage() {
  usePageTitleKey('profitCalculator');

  const [realm] = useSharedRealm();
  const [resId, setResId] = useState(0);
  const [quality, setQuality] = useState(0);
  const [buildingLevel, setBuildingLevel] = useState(1);
  const [abundance, setAbundance] = useState(100);
  const [robots, setRobots] = useState(false);
  const [overhead, setOverhead] = useState(0);
  const [customPrice, setCustomPrice] = useState("");
  const [contractMode, setContractMode] = useState(false);
  const [inputOverrides, setInputOverrides] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<string>("normal");

  const { data: marginsData } = useProfitMargins(120000);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  // Fetch calculator live data
  const [calcLiveData, setCalcLiveData] = useState<CalculatorLiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const liveData = await fetchCalculatorLive(realm);
        setCalcLiveData(liveData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load calculator data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [realm]);

  const selected = useMemo(() => RESOURCES.find(r => r.id === resId), [resId]);
  const marginRec = useMemo(() => margins.find(m => m.id === resId), [margins, resId]);

  const vwapPrice = marginRec?.outputVwap ?? (calcLiveData?.livePrices[resId]?.[quality] ?? 0) ?? MAT_REF_PRICES[resId] ?? 0;
  const qualityMult = 1 + quality * 0.05; // Q0=1.0, Q12=1.6
  const sellingPrice = customPrice ? parseFloat(customPrice) : vwapPrice * qualityMult;

  const result = useMemo(() => {
    if (!selected || !sellingPrice) return null;
    const basePh = selected.basePh ?? 1;
    const phaseMult = PHASE_MULTIPLIERS[phase] ?? 1.0;

    // Production quantity = basePh * phase * buildingLevel (scales linearly)
    let ph = basePh * phaseMult * buildingLevel;
    if (selected.buildingId && ["M","O","Q"].includes(String(selected.buildingId))) {
      ph *= abundance / 100;
    }

    // Wages = baseWage * level (linear, per game guide)
    const wageBase = selected.baseWages ?? 0;
    const wageAtLevel = wageBase * buildingLevel;
    const wageTotal = robots ? wageAtLevel * 0.97 : wageAtLevel;

    // Admin overhead cost = wages * AO/100
    const overheadCost = wageTotal * (overhead / 100);

    // Input costs = sum of (input_qty * input_price)
    let inputCost = 0;
    const inputDetails: { id: number; name: string; qty: number; vwap: number; overridePrice: number; cost: number }[] = [];
    if (selected.inputs) {
      for (const [inpId, qty] of Object.entries(selected.inputs)) {
        const inpRes = RESOURCES.find(r => r.id === Number(inpId));
        const inpMargin = margins.find(m => m.id === Number(inpId));
        // Use live price from calculator-live.json if available, fallback to margins, then MAT_REF_PRICES
        const liveP = calcLiveData?.livePrices[Number(inpId)]?.[quality] ?? 0;
        const vwap = inpMargin?.outputVwap ?? liveP ?? MAT_REF_PRICES[Number(inpId)] ?? 0;
        const overrideStr = inputOverrides[Number(inpId)];
        const overridePrice = overrideStr ? parseFloat(overrideStr) : 0;
        const effectivePrice = overridePrice > 0 ? overridePrice : vwap;
        const cost = effectivePrice * qty;
        inputCost += cost;
        inputDetails.push({ id: Number(inpId), name: inpRes?.name ?? `id:${inpId}`, qty, vwap, overridePrice, cost });
      }
    }

    // Revenue = sellingPrice * ph
    const grossRevenue = sellingPrice * ph;

    // Market fee = 3% (not 4%!) per game guides
    const marketFee = contractMode ? 0 : grossRevenue * 0.03;

    // Transport cost = grossRevenue * transportRating * 0.01. Contracts = 50% transport
    const transportCost = grossRevenue * (selected.transport ?? 0) * 0.01;
    const transportActual = contractMode ? transportCost * 0.5 : transportCost;

    const netProfit = grossRevenue - marketFee - inputCost - wageTotal - overheadCost - transportActual;
    const marginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return { grossRevenue, marketFee, inputCost, wageTotal, overheadCost, transportActual, netProfit, marginPct, inputDetails, ph, phaseMult };
  }, [selected, sellingPrice, buildingLevel, robots, overhead, margins, contractMode, inputOverrides, abundance, phase, quality, calcLiveData]);

  const isExtraction = selected?.buildingId && ["M","O","Q"].includes(String(selected.buildingId));

  if (loading) {
    return (
      <div className="space-y-5 animate-slide-up">
        <PageHeader
          title="Profit Calculator"
          subtitle="Loading live market data…"
          icon={<Calculator size={18} />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
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
          title="Profit Calculator"
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

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Profit Calculator"
        subtitle={calcLiveData ? `Live data from ${new Date(calcLiveData.generatedAt).toLocaleString()} (${calcLiveData.dataFreshnessMinutes}min old)` : "Using fallback prices"}
        icon={<Calculator size={18} />}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600"
        realm={realm}
        onRealmChange={() => {}}
      >
        <div className="text-[10px] text-surface-400 font-bold">{margins.length} products with pricing data</div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── Sidebar ─── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Resource Selector */}
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Calculator size={13} /> Resource</div>
            <label htmlFor="prod-resource" className="sr-only">Resource</label>
            <select id="prod-resource" value={resId} onChange={e => { setResId(Number(e.target.value)); setCustomPrice(""); }} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900">
              <option value={0}>Select a resource…</option>
              {RESOURCES.filter(r => r.basePh && r.basePh > 0).sort((a, b) => a.name.localeCompare(b.name)).map(r => <option key={r.id} value={r.id}>{r.name} (ID: {r.id})</option>)}
            </select>
            {!selected && <div className="text-center py-6 text-surface-400 text-xs">Pick a resource</div>}
          </div>

          {/* Parameters */}
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings size={13} /> Parameters</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div><label htmlFor="prod-level" className="text-[10px] font-semibold text-surface-500 block mb-1">Level</label><input id="prod-level" type="number" min={1} max={20} value={buildingLevel} onChange={e => setBuildingLevel(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900" /></div>
              <div><label htmlFor="prod-quality" className="text-[10px] font-semibold text-surface-500 block mb-1">Quality</label><select id="prod-quality" value={quality} onChange={e => setQuality(Math.max(0, Math.min(12, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900">{[...Array(13).keys()].map(q => <option key={q} value={q}>Q{q}</option>)}</select></div>
              <div className="col-span-2"><label htmlFor="prod-phase" className="text-[10px] font-semibold text-surface-500 block mb-1">Economy Phase</label><select id="prod-phase" value={phase} onChange={e => setPhase(e.target.value)} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900"><option value="boom">Boom ×1.25</option><option value="normal">Normal ×1.0</option><option value="recession">Recession ×0.8</option></select></div>
            </div>
          </div>

          {/* Extraction / Inputs */}
          {selected && (
            <>
              {isExtraction && (
                <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Zap size={13} /> Extraction</div>
                  <div><label htmlFor="prod-abundance" className="text-[10px] font-semibold text-surface-500 block mb-1">Abundance %</label><input id="prod-abundance" type="number" min={0} max={100} value={abundance} onChange={e => setAbundance(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900" /></div>
                </div>
              )}

              <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Truck size={13} /> Logistics & Contracts</div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={robots} onChange={e => setRobots(e.target.checked)} className="w-4 h-4 accent-blue-600" /> Robots (-3% wages)</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={contractMode} onChange={e => setContractMode(e.target.checked)} className="w-4 h-4 accent-blue-600" /> Contract (no market fee, 50% transport)</label>
                <div><label htmlFor="prod-overhead" className="text-[10px] font-semibold text-surface-500 block mb-1">Admin Overhead %</label><input id="prod-overhead" type="number" min={0} max={100} step={0.1} value={overhead} onChange={e => setOverhead(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900" /></div>
              </div>

              {selected.inputs && Object.keys(selected.inputs).length > 0 && (
                <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings size={13} /> Input Costs (override per unit)</div>
                  {Object.entries(selected.inputs).map(([inpId, qty]) => {
                    const inpRes = RESOURCES.find(r => r.id === Number(inpId));
                    const inpMargin = margins.find(m => m.id === Number(inpId));
                    const liveP = calcLiveData?.livePrices[Number(inpId)]?.[quality] ?? 0;
                    const vwap = inpMargin?.outputVwap ?? liveP ?? MAT_REF_PRICES[Number(inpId)] ?? 0;
                    const overrideStr = inputOverrides[Number(inpId)];
                    return (
                      <div key={inpId} className="flex items-center gap-2">
                        <span className="w-36 text-xs text-surface-500 truncate">{inpRes?.name ?? `id:${inpId}`}</span>
                        <span className="w-16 text-xs text-surface-400 text-right">×{qty}</span>
                        <input type="number" step="0.01" value={overrideStr ?? ""} onChange={e => setInputOverrides(prev => ({ ...prev, [Number(inpId)]: e.target.value }))} placeholder={`VWAP: ${fmtNumber(vwap)}`} className="flex-1 border border-surface-300 dark:border-surface-700 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900" />
                        <span className="w-24 text-right text-[10px] text-surface-400">${fmtNumber(vwap)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings size={13} /> Output Price</div>
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder={`VWAP: ${fmtNumber(vwapPrice)} × Q = ${fmtNumber(vwapPrice * qualityMult)}`} className="flex-1 border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-surface-900" />
              {customPrice && <button onClick={() => setCustomPrice("")} className="text-[10px] text-brand-600 font-bold">Auto</button>}
            </div>
            <div className="text-[10px] text-surface-400 mt-0.5">VWAP: ${fmtNumber(vwapPrice)} × Q{quality} mult = ${fmtNumber(vwapPrice * qualityMult)}</div>
          </div>
        </div>

        {/* ─── Results ─── */}
        <div className="lg:col-span-8 space-y-3">
          {!selected ? (
            <div className="bg-white dark:bg-surface-950 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-16 text-center">
              <Calculator size={40} className="mx-auto text-surface-300 mb-3" />
              <p className="text-surface-400 font-bold text-sm">Select a resource</p>
              <p className="text-surface-300 text-xs mt-1">Adjust parameters in the sidebar</p>
            </div>
          ) : !result ? null : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Revenue", val: `$${fmtNumber(result.grossRevenue)}`, color: "text-emerald-600", icon: Calculator, iconColor: "text-emerald-500" },
                  { label: "Net Profit", val: `${result.netProfit >= 0 ? "+" : ""}$${fmtNumber(result.netProfit)}`, color: result.netProfit >= 0 ? "text-emerald-600" : "text-rose-600", icon: Calculator, iconColor: result.netProfit >= 0 ? "text-emerald-500" : "text-rose-500" },
                  { label: "Margin", val: `${fmtPct(result.marginPct)}`, color: result.marginPct >= 0 ? "text-emerald-600" : "text-rose-600", icon: Zap, iconColor: "text-blue-500" },
                  { label: "Volume", val: fmtNumber(result.ph), color: "text-surface-700 dark:text-surface-300", icon: Truck, iconColor: "text-violet-500" },
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
                <div className="px-5 py-3 flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings size={12} /> Multipliers</div>
                <div className="px-5 py-3 space-y-2">
                  <Mt label="Phase" val={phase} mult={result.phaseMult} />
                  <Mt label="Level" val={String(buildingLevel)} />
                  {isExtraction && <Mt label="Abundance" val={`${abundance}%`} />}
                  {robots && <Mt label="Robots" val="−3% wages" />}
                  {contractMode && <Mt label="Contract" val="no fee, ½ transport" />}
                </div>
                <div className="px-5 py-3 space-y-2">
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Gross Revenue</span><span className="text-sm font-bold text-emerald-600">${fmtNumber(result.grossRevenue)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Market Fee</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.marketFee)}</span><span className="text-[10px] text-surface-400 ml-auto">{contractMode ? "0%" : "3%"}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Input Costs</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.inputCost)}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Wages</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.wageTotal)}</span><span className="text-[10px] text-surface-400 ml-auto">{robots ? "×0.97" : ""}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Admin Overhead</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.overheadCost)}</span><span className="text-[10px] text-surface-400 ml-auto">{overhead}%</span></div>
                  <div className="flex justify-between"><span className="text-xs text-surface-500">Transport</span><span className="text-sm font-bold text-rose-500">-${fmtNumber(result.transportActual)}</span><span className="text-[10px] text-surface-400 ml-auto">{contractMode ? "½" : ""}</span></div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wide">Net Profit</span>
                  <span className={`text-xl font-bold ${result.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{result.netProfit >= 0 ? "+" : ""}${fmtNumber(result.netProfit)}/h</span>
                </div>
              </div>

              {/* Input Details */}
              {result.inputDetails.length > 0 && (
                <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2 text-[10px] font-bold uppercase text-surface-400 tracking-wider"><Settings size={12} /> Input Breakdown</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-surface-50 dark:bg-surface-900 text-[10px] font-bold uppercase text-surface-500"><th className="text-left px-4 py-2.5">Input</th><th className="text-right px-4 py-2.5">Qty/h</th><th className="text-right px-4 py-2.5">Price</th><th className="text-right px-4 py-2.5">Cost/h</th></tr></thead>
                      <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                        {result.inputDetails.map(d => (
                          <tr key={d.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                            <td className="px-4 py-2">{d.name}</td>
                            <td className="px-4 py-2 text-right">{fmtNumber(d.qty)}</td>
                            <td className="px-4 py-2 text-right">${fmtNumber(d.vwap)} {d.overridePrice > 0 && <span className="text-[10px] text-brand-600 ml-1">(override)</span>}</td>
                            <td className="px-4 py-2 text-right text-rose-500">${fmtNumber(d.cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}