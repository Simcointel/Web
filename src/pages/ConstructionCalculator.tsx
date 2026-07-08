import { useState, useEffect, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { BUILDINGS, CONSTRUCTION_MATERIALS, MAT_REF_PRICES, RESOURCES } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { ProfitMarginsResponse } from "../types/api";

function matName(id: number): string {
  return CONSTRUCTION_MATERIALS.find(c => c.id === id)?.name ?? `Mat ${id}`;
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  const days = Math.floor(h / 24);
  const hrs = Math.round(h % 24);
  return `${days}d ${hrs}h`;
}

const MAT_IDS = [101, 102, 108, 111, 110];

export function ConstructionCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Construction Calculator"; }, []);

  const [realm] = useSharedRealm();
  const [buildingId, setBuildingId] = useState("");
  const [currentLv, setCurrentLv] = useState(0);
  const [targetLv, setTargetLv] = useState(1);

  const { data: marginsData } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const building = useMemo(() => BUILDINGS.find((b: any) => b.id === buildingId), [buildingId]);

  // Get market prices for construction materials
  const matPrices = useMemo(() => {
    const prices: Record<number, number> = {};
    for (const id of MAT_IDS) {
      const m = margins.find(r => r.id === id);
      prices[id] = m?.outputVwap ?? MAT_REF_PRICES[id] ?? 0;
    }
    return prices;
  }, [margins]);

  // Each level adds base_resources × level (total material cost is cumulative)
  const upgrades = useMemo(() => {
    if (!building || targetLv <= currentLv) return [];
    const steps: { lv: number; materials: Record<number, number>; time: number; matCost: number }[] = [];
    for (let lv = currentLv + 1; lv <= targetLv; lv++) {
      const materials: Record<number, number> = {};
      for (const r of building.resources) {
        materials[r.id] = (materials[r.id] ?? 0) + r.qty * lv;
      }
      let matCost = 0;
      for (const [id, qty] of Object.entries(materials)) {
        matCost += (matPrices[Number(id)] ?? 0) * qty;
      }
      const time = building.baseTime * lv;
      steps.push({ lv, materials, time, matCost });
    }
    return steps;
  }, [building, currentLv, targetLv, matPrices]);

  const totalTimeH = upgrades.reduce((s, u) => s + u.time, 0);
  const totalMatCost = upgrades.reduce((s, u) => s + u.matCost, 0);

  // ROI: estimate daily revenue from the building at target level
  const roi = useMemo<{ dailyRevenue: number; dailyWages: number; daysToRecoup: number; revenuePerLevel: number; outputVwap: number; dailyNet: number } | null>(() => {
    if (!building || upgrades.length === 0) return null;
    const res = RESOURCES.find(r => r.buildingId === building.id);
    if (!res) return { dailyRevenue: 0, dailyWages: 0, daysToRecoup: 0, revenuePerLevel: 0, outputVwap: 0, dailyNet: 0 };
    const outputVwap = margins.find(m => m.id === res.id)?.outputVwap ?? 0;
    const wages = building.wages ?? 0;
    const revenuePerLevel = (res.basePh ?? 0) * outputVwap * 24;
    const dailyRevenue = revenuePerLevel * targetLv;
    const dailyWages = wages * 24 * (1 + 0.1) * targetLv; // ponytail: 10% AO assumed, adjust via settings if needed
    const dailyNet = dailyRevenue - dailyWages;
    const daysToRecoup = dailyNet > 0 ? totalMatCost / dailyNet : Infinity;
    return { dailyRevenue, dailyWages, daysToRecoup, revenuePerLevel, outputVwap, dailyNet };
  }, [building, upgrades, targetLv, margins, totalMatCost]);

  const totalMats = useMemo(() => {
    const m: Record<number, number> = {};
    for (const u of upgrades) {
      for (const [id, qty] of Object.entries(u.materials)) {
        m[Number(id)] = (m[Number(id)] ?? 0) + qty;
      }
    }
    return m;
  }, [upgrades]);

  return (
    <div className="space-y-6 text-sm">
      <div className="border-b border-surface-200 pb-3">
        <h1 className="text-lg font-bold">Construction Calculator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-surface-200 rounded-lg p-4 space-y-4">
            <h2 className="text-xs font-bold uppercase text-surface-400">Building</h2>
            <select value={buildingId} onChange={e => setBuildingId(e.target.value)} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none">
              <option value="">-- Select Building --</option>
              {BUILDINGS.filter((b: any) => b.type === "production").sort((a: any, b: any) => a.name.localeCompare(b.name)).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {building && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Current</label><input type="number" min={0} max={49} value={currentLv} onChange={e => setCurrentLv(Math.max(0, Math.min(49, Number(e.target.value))))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" /></div>
                <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Target</label><input type="number" min={1} max={50} value={targetLv} onChange={e => setTargetLv(Math.max(1, Math.min(50, Number(e.target.value))))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" /></div>
              </div>
            )}
            {building && (
              <div className="text-xs text-surface-500 space-y-1">
                <p>Base time: {fmtHours(building.baseTime)}</p>
                <p>Materials per level: {building.resources.map(r => `${r.qty}× ${matName(r.id)}`).join(", ")}</p>
                <p className="text-[10px] text-surface-400 italic">Materials scale with level (lv × base materials)</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!building ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Select a building</div>
          ) : upgrades.length === 0 ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Target must be higher than current</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Material Cost</span><span className="text-lg font-bold">${totalMatCost.toLocaleString()}</span></div>
                <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Total Time</span><span className="text-lg font-bold">{fmtHours(totalTimeH)}</span></div>
                <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Steps</span><span className="text-lg font-bold">{upgrades.length}</span></div>
                <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">C. Units</span><span className="text-lg font-bold">{Math.round(totalMats[111] ?? 0)}</span></div>
              </div>

              {roi && roi.dailyRevenue > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/20 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Est. Daily Revenue</span><span className="text-lg font-bold text-brand-600">${roi.dailyRevenue.toLocaleString()}</span><span className="block text-[9px] text-surface-400">@ ${roi.outputVwap.toFixed(2)}/u</span></div>
                  <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Daily Wages (est)</span><span className="text-lg font-bold">${roi.dailyWages.toLocaleString()}</span></div>
                  <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Daily Net</span><span className={`text-lg font-bold ${roi.dailyNet > 0 ? "text-emerald-600" : "text-rose-600"}`}>${roi.dailyNet.toLocaleString()}</span></div>
                  <div className="border border-surface-200 rounded-lg p-3"><span className="text-[10px] text-surface-400 block uppercase font-bold">Recoup Time</span><span className="text-lg font-bold">{roi.daysToRecoup === Infinity ? "∞" : `${roi.daysToRecoup.toFixed(1)}d`}</span><span className="block text-[9px] text-surface-400">materials only</span></div>
                </div>
              )}

              <div className="border border-surface-200 rounded-lg">
                <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-xs font-bold text-surface-500 uppercase">Material Summary (market prices)</div>
                <div className="p-4 grid grid-cols-5 gap-3">
                  {MAT_IDS.map(id => {
                    const qty = Math.round(totalMats[id] ?? 0);
                    if (qty === 0) return null;
                    return <div key={id} className="bg-surface-50 p-3 rounded-lg border border-surface-100"><span className="text-[10px] text-surface-400 block uppercase font-bold">{matName(id)}</span><span className="text-lg font-bold">{qty.toLocaleString()}</span><span className="block text-[10px] text-surface-400">@ ${(matPrices[id] ?? 0).toFixed(2)}</span></div>;
                  })}
                </div>
              </div>

              <div className="border border-surface-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead><tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500 border-b border-surface-100"><th className="px-3 py-2">Lv</th><th className="px-3 py-2 text-right">Mat Cost</th><th className="px-3 py-2 text-right">Time</th><th className="px-3 py-2 text-right">Concrete</th><th className="px-3 py-2 text-right">Bricks</th><th className="px-3 py-2 text-right">Planks</th><th className="px-3 py-2 text-right">C. Units</th></tr></thead>
                  <tbody className="divide-y divide-surface-100">
                    {upgrades.map(u => (
                      <tr key={u.lv} className="hover:bg-surface-50 transition-colors">
                        <td className="px-3 py-2 font-bold">Lv{u.lv}</td>
                        <td className="px-3 py-2 text-right">${u.matCost.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{fmtHours(u.time)}</td>
                        <td className="px-3 py-2 text-right">{Math.round(u.materials[101] ?? 0)}</td>
                        <td className="px-3 py-2 text-right">{Math.round(u.materials[102] ?? 0)}</td>
                        <td className="px-3 py-2 text-right">{Math.round(u.materials[108] ?? 0)}</td>
                        <td className="px-3 py-2 text-right font-bold">{Math.round(u.materials[111] ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
