import { useState, useEffect, useMemo } from "react";
import { BUILDINGS, CONSTRUCTION_MATERIALS } from "../data/simco_static";

const LEVEL_COST_MULT = [0, 1, 1.5, 2.25, 3.38, 5.06, 7.59, 11.39, 17.09, 25.63, 38.44, 57.67, 86.50, 129.75, 194.62, 291.93, 437.90, 656.85, 985.27, 1477.91];
const SCRAP_RATES: Record<number, number> = { 0: 1, 1: 1, 2: 1, 3: 0.5, 4: 0.5 };

function getMatName(id: number): string {
  const m = CONSTRUCTION_MATERIALS.find(c => c.id === id);
  return m?.name ?? `Material ${id}`;
}

function calcMaterials(building: any, level: number): Record<number, number> {
  const mats: Record<number, number> = {};
  for (const r of building.resources) {
    mats[r.id] = (mats[r.id] ?? 0) + r.qty * (LEVEL_COST_MULT[level] ?? 1);
  }
  return mats;
}

export function ConstructionCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Construction Calculator"; }, []);

  const [buildingId, setBuildingId] = useState("");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(1);

  const building = useMemo(() => BUILDINGS.find((b: any) => b.id === buildingId), [buildingId]);

  const upgrades = useMemo(() => {
    if (!building || targetLevel <= currentLevel) return [];
    const steps: { level: number; cost: number; cumulativeCost: number; materials: Record<number, number>; time: number }[] = [];
    let cumCost = 0;
    for (let lv = currentLevel + 1; lv <= targetLevel; lv++) {
      const mat = calcMaterials(building, lv);
      const constUnits = mat[111] ?? 0;
      const timeHours = building.baseTime * (LEVEL_COST_MULT[lv] ?? 1);
      const cost = building.cost * (LEVEL_COST_MULT[lv] ?? 1);
      cumCost += cost;
      steps.push({ level: lv, cost, cumulativeCost: cumCost, materials: mat, time: timeHours });
    }
    return steps;
  }, [building, currentLevel, targetLevel]);

  const scrapRecovery = useMemo(() => {
    if (!building || currentLevel <= 0) return null;
    const rate = SCRAP_RATES[currentLevel] ?? 0.5;
    const mats: Record<number, number> = {};
    for (const r of building.resources) {
      const total = r.qty * (LEVEL_COST_MULT[currentLevel] ?? 1);
      mats[r.id] = Math.round(total * rate);
    }
    return { rate, materials: mats };
  }, [building, currentLevel]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-xl font-bold italic tracking-tight">Construction Calculator</h1>
          <p className="text-sm text-surface-500 mt-1 font-medium italic opacity-80 text-brand-600">Building Upgrade Planner</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6 space-y-5 border-surface-200 dark:border-surface-800">
            <h2 className="text-xs font-black uppercase tracking-widest text-surface-400">Building</h2>
            <select value={buildingId} onChange={e => setBuildingId(e.target.value)} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-2 rounded-lg text-sm font-bold outline-none">
              <option value="">-- Select Building --</option>
              {BUILDINGS.filter((b: any) => b.type === "production").sort((a: any, b: any) => a.name.localeCompare(b.name)).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {building && (
            <div className="card p-6 space-y-5 border-surface-200 dark:border-surface-800">
              <h2 className="text-xs font-black uppercase tracking-widest text-surface-400">Levels</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Current</label>
                  <input type="number" min={0} max={49} value={currentLevel} onChange={e => setCurrentLevel(Math.max(0, Math.min(49, Number(e.target.value))))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Target</label>
                  <input type="number" min={1} max={50} value={targetLevel} onChange={e => setTargetLevel(Math.max(1, Math.min(50, Number(e.target.value))))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
                </div>
              </div>
              <p className="text-xs text-surface-500">
                Base cost: <span className="font-bold">${building.cost.toLocaleString()}</span>
                {" | "}Base time: <span className="font-bold">{building.baseTime}h</span>
              </p>
            </div>
          )}

          {scrapRecovery && (
            <div className="card p-6 border-surface-200 dark:border-surface-800">
              <h2 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-3">Scrap Recovery (Lv{currentLevel})</h2>
              <p className="text-[11px] text-surface-500 mb-2">Recovery rate: {(scrapRecovery.rate * 100).toFixed(0)}%</p>
              <div className="space-y-1">
                {Object.entries(scrapRecovery.materials).map(([id, qty]) => (
                  <div key={id} className="flex justify-between text-[11px]">
                    <span className="text-surface-400">{getMatName(Number(id))}</span>
                    <span className="font-bold">{qty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!building ? (
            <div className="card p-12 flex items-center justify-center border-dashed">
              <p className="text-surface-300 font-bold italic text-lg uppercase tracking-widest">Select a building to begin</p>
            </div>
          ) : upgrades.length === 0 ? (
            <div className="card p-12 flex items-center justify-center border-dashed">
              <p className="text-surface-300 font-bold italic text-lg uppercase tracking-widest">Target must be higher than current level</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card p-4 border-l-4 border-amber-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Total Cost</span>
                  <span className="text-xl font-bold tabular-nums">${upgrades[upgrades.length-1].cumulativeCost.toLocaleString()}</span>
                </div>
                <div className="card p-4 border-l-4 border-blue-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Total Time</span>
                  <span className="text-xl font-bold tabular-nums">{(upgrades.reduce((s, u) => s + u.time, 0)).toFixed(1)}h</span>
                </div>
                <div className="card p-4 border-l-4 border-emerald-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Upgrade Steps</span>
                  <span className="text-xl font-bold tabular-nums">{upgrades.length}</span>
                </div>
                <div className="card p-4 border-l-4 border-violet-500">
                  <span className="text-[10px] font-bold uppercase text-surface-400 block">Const. Units</span>
                  <span className="text-xl font-bold tabular-nums">{Math.round(upgrades.reduce((s, u) => s + (u.materials[111] ?? 0), 0))}</span>
                </div>
              </div>

              <div className="card p-6 border-surface-200 dark:border-surface-800">
                <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-4">Material Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[101, 102, 108, 111, 110].map(matId => {
                    const total = upgrades.reduce((s, u) => s + (u.materials[matId] ?? 0), 0);
                    if (total === 0) return null;
                    return (
                      <div key={matId} className="bg-surface-50 dark:bg-surface-900 p-4 rounded-lg border border-surface-100 dark:border-surface-800">
                        <span className="text-[10px] font-bold uppercase text-surface-400 block">{getMatName(matId)}</span>
                        <span className="text-lg font-bold tabular-nums">{Math.round(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card border-surface-200 dark:border-surface-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-900 text-xs font-bold uppercase text-surface-500 border-b border-surface-100 dark:border-surface-800">
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 text-right">Cumulative</th>
                        <th className="px-4 py-3 text-right">Time</th>
                        <th className="px-4 py-3 text-right">Concrete</th>
                        <th className="px-4 py-3 text-right">Bricks</th>
                        <th className="px-4 py-3 text-right">Planks</th>
                        <th className="px-4 py-3 text-right">C. Units</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
                      {upgrades.map(u => (
                        <tr key={u.level} className="hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors">
                          <td className="px-4 py-2 font-bold">Lv{u.level}</td>
                          <td className="px-4 py-2 text-right font-medium">${u.cost.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-surface-500">${u.cumulativeCost.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{u.time.toFixed(1)}h</td>
                          <td className="px-4 py-2 text-right">{Math.round(u.materials[101] ?? 0)}</td>
                          <td className="px-4 py-2 text-right">{Math.round(u.materials[102] ?? 0)}</td>
                          <td className="px-4 py-2 text-right">{Math.round(u.materials[108] ?? 0)}</td>
                          <td className="px-4 py-2 text-right font-bold text-brand-600">{Math.round(u.materials[111] ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
