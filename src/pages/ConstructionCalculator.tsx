import { useState, useEffect, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { BUILDINGS, CONSTRUCTION_MATERIALS, MAT_REF_PRICES, RESOURCES } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Section, CardGrid } from "../components/Layout";
import { HardHat, Search, Layers, TrendingUp, Package, ListTree, Timer, Building2 } from "lucide-react";
import type { ProfitMarginsResponse } from "../types/api";

function matName(id: number): string {
  return CONSTRUCTION_MATERIALS.find(c => c.id === id)?.name ?? RESOURCES.find(r => r.id === id)?.name ?? `Mat ${id}`;
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${Math.floor(h / 24)}d ${Math.round(h % 24)}h`;
}

export function ConstructionCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Construction Calculator"; }, []);

  const [realm] = useSharedRealm();
  const [buildingId, setBuildingId] = useState("");
  const [currentLv, setCurrentLv] = useState(0);
  const [targetLv, setTargetLv] = useState(1);

  const { data: marginsData } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const building = useMemo(() => BUILDINGS.find(b => b.id === buildingId), [buildingId]);

  const buildingMatIds = useMemo(() => {
    if (!building) return [];
    const ids = new Set<number>();
    for (const r of building.resources) ids.add(r.id);
    return [...ids];
  }, [building]);

  const matPrices = useMemo(() => {
    const prices: Record<number, number> = {};
    for (const id of buildingMatIds) {
      const m = margins.find(r => r.id === id);
      prices[id] = m?.outputVwap ?? MAT_REF_PRICES[id] ?? 0;
    }
    return prices;
  }, [margins, buildingMatIds]);

  const upgrades = useMemo(() => {
    if (!building || targetLv <= currentLv) return [];
    const steps: { lv: number; materials: Record<number, number>; time: number; matCost: number; refCost: number }[] = [];
    for (let lv = currentLv + 1; lv <= targetLv; lv++) {
      const mult = Math.max(1, lv - 1);
      const materials: Record<number, number> = {};
      for (const r of building.resources) {
        materials[r.id] = (materials[r.id] ?? 0) + r.qty * mult;
      }
      let matCost = 0;
      for (const [id, qty] of Object.entries(materials)) {
        matCost += (matPrices[Number(id)] ?? 0) * qty;
      }
      const time = building.baseTime * mult;
      const refCost = building.cost * mult;
      steps.push({ lv, materials, time, matCost, refCost });
    }
    return steps;
  }, [building, currentLv, targetLv, matPrices]);

  const totalTimeH = upgrades.reduce((s, u) => s + u.time, 0);
  const totalMatCost = upgrades.reduce((s, u) => s + u.matCost, 0);
  const totalRefCost = upgrades.reduce((s, u) => s + u.refCost, 0);

  const roi = useMemo<{ dailyRevenue: number; dailyWages: number; daysToRecoup: number; revenuePerLevel: number; outputVwap: number; dailyNet: number } | null>(() => {
    if (!building || upgrades.length === 0) return null;
    const res = RESOURCES.find(r => r.buildingId === building.id);
    if (!res) return { dailyRevenue: 0, dailyWages: 0, daysToRecoup: 0, revenuePerLevel: 0, outputVwap: 0, dailyNet: 0 };
    const outputVwap = margins.find(m => m.id === res.id)?.outputVwap ?? 0;
    const wages = building.wages ?? 0;
    const revenuePerLevel = (res.basePh ?? 0) * outputVwap * 24;
    const dailyRevenue = revenuePerLevel * targetLv;
    const dailyWages = wages * 24 * (1 + 0.1) * targetLv;
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
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
          <HardHat size={18} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Construction Calculator</h1>
          <p className="text-xs text-surface-400">Building cost estimator & ROI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── Sidebar: building & level controls ─── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-100 dark:border-surface-800">
              <Building2 size={16} className="text-surface-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Building</h2>
            </div>

            <div className="space-y-1.5">
              <label className="stat-label">Select building</label>
              <select value={buildingId} onChange={e => setBuildingId(e.target.value)}
                className="w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2.5 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-brand-500/20">
                <option value="">-- Choose a building --</option>
                <optgroup label="Production">
                  {BUILDINGS.filter(b => b.type === "production").sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Retail">
                  {BUILDINGS.filter(b => b.type === "retail").sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {building && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="stat-label">Current Lv</label>
                    <input type="number" min={0} max={49} value={currentLv}
                      onChange={e => setCurrentLv(Math.max(0, Math.min(49, Number(e.target.value))))}
                      className="input !text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="stat-label">Target Lv</label>
                    <input type="number" min={1} max={50} value={targetLv}
                      onChange={e => setTargetLv(Math.max(1, Math.min(50, Number(e.target.value))))}
                      className="input !text-sm" />
                  </div>
                </div>

                <div className="rounded-lg bg-surface-50 dark:bg-surface-950 border border-surface-100 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800 text-xs">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-surface-500 font-semibold">Type</span>
                    <span className="font-bold capitalize">{building.type}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-surface-500 font-semibold">Base time</span>
                    <span className="font-bold">{fmtHours(building.baseTime)}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-surface-500 font-semibold">Per level</span>
                    <span className="font-bold text-right">{building.resources.map(r => `${r.qty}× ${matName(r.id)}`).join(", ")}</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-surface-500 font-semibold">Scaling</span>
                    <span className="font-bold text-surface-400">Lv 1-2 = base, Lv 3+ = base × (lv-1)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Main dashboard ─── */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {!building ? (
            <div className="card p-14 text-center">
              <Search size={44} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
              <p className="text-surface-300 dark:text-surface-600 text-sm font-bold">Select a building to begin</p>
              <p className="text-xs text-surface-400 mt-1">Construction costs, material estimates, and ROI will appear here</p>
            </div>
          ) : upgrades.length === 0 ? (
            <div className="card p-14 text-center">
              <Layers size={44} className="mx-auto text-surface-200 dark:text-surface-700 mb-4" />
              <p className="text-surface-300 dark:text-surface-600 text-sm font-bold">Target must be higher than current level</p>
              <p className="text-xs text-surface-400 mt-1">Raise the target level above current to see the upgrade breakdown</p>
            </div>
          ) : (
            <>
              {/* ── Cost Summary ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-surface-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Cost Summary</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  <div className="kpi-card card border-l-4 border-l-sky-500">
                    <span className="stat-label">Reference Cost</span>
                    <span className="stat-value">${totalRefCost.toLocaleString()}</span>
                    <span className="block text-[10px] text-surface-400 mt-1">game reference prices</span>
                  </div>
                  <div className="kpi-card card border-l-4 border-l-violet-500">
                    <span className="stat-label">Market Cost</span>
                    <span className={`stat-value ${totalMatCost > totalRefCost ? 'text-rose-600' : 'text-emerald-600'}`}>${totalMatCost.toLocaleString()}</span>
                    <span className="block text-[10px] text-surface-400 mt-1">materials at VWAP</span>
                  </div>
                  <div className="kpi-card card border-l-4 border-l-amber-500">
                    <span className="stat-label">Scrap Value</span>
                    <span className="stat-value">${(building.cost * targetLv).toLocaleString()}</span>
                    <span className="block text-[10px] text-surface-400 mt-1">if demolished at target</span>
                  </div>
                  <div className="kpi-card card border-l-4 border-l-emerald-500">
                    <span className="stat-label">Total Time</span>
                    <span className="stat-value">{fmtHours(totalTimeH)}</span>
                    <span className="block text-[10px] text-surface-400 mt-1">{upgrades.length} level(s)</span>
                  </div>
                  <div className="kpi-card card border-l-4 border-l-orange-500">
                    <span className="stat-label">Upgrades</span>
                    <span className="stat-value">{upgrades.length}</span>
                    <span className="block text-[10px] text-surface-400 mt-1">Lv {currentLv} → Lv {targetLv}</span>
                  </div>
                </div>
              </section>

              {/* ── Revenue Analysis ── */}
              {roi && roi.dailyRevenue > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-surface-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Revenue Analysis</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="card p-4 border-l-4 border-l-brand-500 space-y-1">
                      <span className="metric-label">Daily Revenue</span>
                      <span className="metric-value text-brand-600">${roi.dailyRevenue.toLocaleString()}</span>
                      <span className="block text-[10px] text-surface-400">@ ${roi.outputVwap.toFixed(2)}/u</span>
                    </div>
                    <div className="card p-4 border-l-4 border-l-rose-400 space-y-1">
                      <span className="metric-label">Daily Wages</span>
                      <span className="metric-value">${roi.dailyWages.toLocaleString()}</span>
                      <span className="block text-[10px] text-surface-400">incl. 10% vacation</span>
                    </div>
                    <div className="card p-4 border-l-4 space-y-1" style={{ borderLeftColor: roi.dailyNet > 0 ? '#10b981' : '#f43f5e' }}>
                      <span className="metric-label">Daily Net</span>
                      <span className={`metric-value ${roi.dailyNet > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${roi.dailyNet.toLocaleString()}</span>
                      <span className="block text-[10px] text-surface-400">{roi.dailyNet > 0 ? 'revenue − wages' : 'operating at loss'}</span>
                    </div>
                    <div className="card p-4 border-l-4 border-l-violet-500 space-y-1">
                      <span className="metric-label">Recoup Time</span>
                      <span className="metric-value">{roi.daysToRecoup === Infinity ? '∞' : `${roi.daysToRecoup.toFixed(1)}d`}</span>
                      <span className="block text-[10px] text-surface-400">{roi.daysToRecoup === Infinity ? 'never profitable' : 'market cost ÷ daily net'}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Material Requirements ── */}
              {buildingMatIds.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-surface-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Material Requirements</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {buildingMatIds.map(id => {
                      const qty = Math.round(totalMats[id] ?? 0);
                      if (qty === 0) return null;
                      return (
                        <div key={id} className="card p-4 space-y-1">
                          <span className="stat-label">{matName(id)}</span>
                          <span className="stat-value">{qty.toLocaleString()}</span>
                          <span className="block text-[10px] text-surface-400">@ ${(matPrices[id] ?? 0).toFixed(2)} = ${(qty * (matPrices[id] ?? 0)).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Upgrade Breakdown ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ListTree size={15} className="text-surface-400" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500">Upgrade Breakdown</h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-900 text-[10px] font-bold uppercase text-surface-500 border-b border-surface-100 dark:border-surface-800">
                        <th className="px-3 py-2.5 text-left">Level</th>
                        <th className="px-3 py-2.5 text-right">Ref Cost</th>
                        <th className="px-3 py-2.5 text-right">Market Cost</th>
                        <th className="px-3 py-2.5 text-right">Time</th>
                        <th className="px-3 py-2.5 text-right">Cum. Time</th>
                        {buildingMatIds.map(id => (
                          <th key={id} className="px-3 py-2.5 text-right">{matName(id)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                      {(() => {
                        let cumTime = 0;
                        return upgrades.map((u, i) => {
                          cumTime += u.time;
                          return (
                            <tr key={u.lv} className={`hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors ${i % 2 === 1 ? 'bg-surface-50/30 dark:bg-surface-900/20' : ''}`}>
                              <td className="px-3 py-2 font-bold whitespace-nowrap">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 text-[10px] font-bold mr-1.5">{u.lv}</span>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">${u.refCost.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right tabular-nums">${u.matCost.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(u.time)}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-surface-400">{fmtHours(cumTime)}</td>
                              {buildingMatIds.map(id => (
                                <td key={id} className="px-3 py-2 text-right tabular-nums">{Math.round(u.materials[id] ?? 0)}</td>
                              ))}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot className="bg-surface-50 dark:bg-surface-900 text-xs font-bold border-t-2 border-surface-200 dark:border-surface-700">
                      <tr>
                        <td className="px-3 py-2.5">Total</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">${totalRefCost.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">${totalMatCost.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums" colSpan={2}>{fmtHours(totalTimeH)}</td>
                        {buildingMatIds.map(id => (
                          <td key={id} className="px-3 py-2.5 text-right tabular-nums">{Math.round(totalMats[id] ?? 0).toLocaleString()}</td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
