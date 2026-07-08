import { useState, useEffect, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState } from "../components/States";
import { RESOURCES, BUILDINGS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { ProfitMarginsResponse } from "../types/api";

function getBuildingName(buildingId: string | number | undefined): string {
  if (!buildingId) return "N/A";
  return BUILDINGS.find((x: any) => x.id === String(buildingId))?.name ?? String(buildingId);
}

export function ProfitCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Profit Calculator"; }, []);

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

  const { data: marginsData, loading } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const selected = useMemo(() => RESOURCES.find(r => r.id === resId), [resId]);
  const marginRec = useMemo(() => margins.find(m => m.id === resId), [margins, resId]);

  const vwapPrice = marginRec?.outputVwap ?? 0;
  const sellingPrice = customPrice ? parseFloat(customPrice) : vwapPrice;

  const result = useMemo(() => {
    if (!selected || !sellingPrice) return null;
    const ph = selected.basePh ?? 1;
    const wageBase = selected.baseWages ?? 0;
    const wageAtLevel = wageBase * (1 + 0.1 * (buildingLevel - 1));
    const wageTotal = robots ? wageAtLevel * 0.97 : wageAtLevel;

    let inputCost = 0;
    const inputDetails: { id: number; name: string; qty: number; vwap: number; overridePrice: number; cost: number }[] = [];
    if (selected.inputs) {
      for (const [inpId, qty] of Object.entries(selected.inputs)) {
        const inpRes = RESOURCES.find(r => r.id === Number(inpId));
        const inpMargin = margins.find(m => m.id === Number(inpId));
        const vwap = inpMargin?.outputVwap ?? 0;
        const overrideStr = inputOverrides[Number(inpId)];
        const overridePrice = overrideStr ? parseFloat(overrideStr) : 0;
        const effectivePrice = overridePrice > 0 ? overridePrice : vwap;
        const cost = effectivePrice * qty;
        inputCost += cost;
        inputDetails.push({ id: Number(inpId), name: inpRes?.name ?? `id:${inpId}`, qty, vwap, overridePrice, cost });
      }
    }

    const grossRevenue = sellingPrice * ph;
    const marketFee = contractMode ? 0 : grossRevenue * 0.04;
    const transportCost = (selected.transport ?? 0) * ph * 0.01;
    const transportActual = contractMode ? transportCost * 0.5 : transportCost;
    const overheadCost = grossRevenue * (overhead / 100);
    const netProfit = grossRevenue - marketFee - inputCost - wageTotal - transportActual - overheadCost;
    const marginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return { grossRevenue, marketFee, inputCost, wageTotal, transportActual, overheadCost, netProfit, marginPct, inputDetails, ph, wageBase, wageAtLevel };
  }, [selected, sellingPrice, buildingLevel, robots, overhead, margins, contractMode, inputOverrides]);

  const isExtraction = selected?.buildingId && ["M","O","Q","P","v"].includes(String(selected.buildingId));

  return (
    <div className="space-y-6 text-sm">
      <div className="border-b border-surface-200 pb-3">
        <h1 className="text-lg font-bold">Profit Calculator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-surface-200 rounded-lg p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase text-surface-400">Resource</h2>
            <select value={resId} onChange={e => { setResId(Number(e.target.value)); setInputOverrides({}); }} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none">
              <option value={0}>-- Select Resource --</option>
              {RESOURCES.filter(r => r.basePh).sort((a, b) => a.name.localeCompare(b.name)).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {selected && (
              <div className="text-xs text-surface-500">
                Building: <span className="font-bold">{getBuildingName(selected.buildingId)}</span>
                {" | "}Base/H: <span className="font-bold">{selected.basePh?.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border border-surface-200 rounded-lg p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase text-surface-400">Parameters</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Quality</label>
                <select value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none">
                  {[0,1,2,3,4,5].map(q => <option key={q} value={q}>Q{q}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Building Lv</label>
                <input type="number" min={1} max={20} value={buildingLevel} onChange={e => setBuildingLevel(Math.max(1, Math.min(20, Number(e.target.value))))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
              </div>
              {isExtraction && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Abundance %</label>
                  <input type="number" min={1} max={200} value={abundance} onChange={e => setAbundance(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">AO %</label>
                <input type="number" min={0} max={50} value={overhead} onChange={e => setOverhead(Number(e.target.value))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={robots} onChange={e => setRobots(e.target.checked)} className="rounded" />
                <span className="text-xs font-bold uppercase">Robots (-3%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={contractMode} onChange={e => setContractMode(e.target.checked)} className="rounded" />
                <span className="text-xs font-bold uppercase">Contract (0% fee)</span>
              </label>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Selling Price (blank = VWAP)</label>
              <input type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder={`VWAP: $${vwapPrice.toFixed(2)}`} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Select a resource</div>
          ) : !result ? (
            <LoadingState text="Calculating..." />
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-emerald-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Revenue/H</span>
                  <span className="text-lg font-bold">${result.grossRevenue.toFixed(2)}</span>
                </div>
                <div className="border border-surface-200 rounded-lg p-3 border-l-4" style={{ borderLeftColor: result.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Net Profit/H</span>
                  <span className={`text-lg font-bold ${result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${result.netProfit.toFixed(2)}</span>
                </div>
                <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-blue-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Margin</span>
                  <span className={`text-lg font-bold ${result.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{result.marginPct.toFixed(1)}%</span>
                </div>
                <div className="border border-surface-200 rounded-lg p-3 border-l-4 border-violet-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Prod/H</span>
                  <span className="text-lg font-bold">{result.ph.toFixed(2)}</span>
                </div>
              </div>

              <div className="border border-surface-200 rounded-lg">
                <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-xs font-bold text-surface-500 uppercase">Cost Breakdown</div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs font-bold text-surface-500">Revenue (Q{quality})</span><span className="text-sm font-bold text-emerald-600">+${result.grossRevenue.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs font-bold text-surface-500">Market Fee ({contractMode ? '0%' : '4%'})</span><span className="text-sm font-bold text-rose-500">-${result.marketFee.toFixed(2)}</span></div>

                  {result.inputDetails.length > 0 && (
                    <>
                      <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs font-bold text-surface-500">Input Costs</span><span className="text-sm font-bold text-rose-500">-${result.inputCost.toFixed(2)}</span></div>
                      <div className="space-y-2 pl-4">
                        {result.inputDetails.map(inp => (
                          <div key={inp.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-surface-500 w-20 truncate" title={inp.name}>{inp.name}</span>
                            <span className="text-surface-400">×{inp.qty.toFixed(2)}</span>
                            <input type="number" step="0.01" value={inputOverrides[inp.id] ?? ''} onChange={e => setInputOverrides(prev => ({ ...prev, [inp.id]: e.target.value }))} placeholder={`VWAP $${inp.vwap.toFixed(2)}`} className="w-24 border border-surface-200 px-2 py-1 rounded text-right text-xs font-bold outline-none" title="Override input material price" />
                            <span className="font-bold w-16 text-right">${inp.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs font-bold text-surface-500">Wages (Lv{buildingLevel}{robots ? ' -3%' : ''})</span><span className="text-sm font-bold text-rose-500">-${result.wageTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs font-bold text-surface-500">Transport{contractMode ? ' (50%)' : ''}</span><span className="text-sm font-bold text-rose-500">-${result.transportActual.toFixed(2)}</span></div>
                  <div className="flex justify-between py-2 border-b border-surface-100"><span className="text-xs font-bold text-surface-500">AO ({overhead}%)</span><span className="text-sm font-bold text-rose-500">-${result.overheadCost.toFixed(2)}</span></div>
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
