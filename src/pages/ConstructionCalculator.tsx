import { useState, useEffect, useMemo } from "react";
import { BUILDINGS, CONSTRUCTION_MATERIALS } from "../data/simco_static";

function matName(id: number): string {
  return CONSTRUCTION_MATERIALS.find(c => c.id === id)?.name ?? `Mat ${id}`;
}

function levelMult(lv: number): number {
  if (lv <= 0) return 0;
  return Math.pow(1.5, lv - 1);
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  const days = Math.floor(h / 24);
  const hrs = Math.round(h % 24);
  return `${days}d ${hrs}h`;
}

function calcMats(building: any, lv: number): Record<number, number> {
  const m: Record<number, number> = {};
  for (const r of building.resources) {
    m[r.id] = (m[r.id] ?? 0) + r.qty * levelMult(lv);
  }
  return m;
}

const MAT_IDS = [101, 102, 108, 111, 110];

export function ConstructionCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - Construction Calculator"; }, []);

  const [buildingId, setBuildingId] = useState("");
  const [currentLv, setCurrentLv] = useState(0);
  const [targetLv, setTargetLv] = useState(1);

  const building = useMemo(() => BUILDINGS.find((b: any) => b.id === buildingId), [buildingId]);

  const upgrades = useMemo(() => {
    if (!building || targetLv <= currentLv) return [];
    const steps: { lv: number; cost: number; cumCost: number; materials: Record<number, number>; time: number }[] = [];
    let cum = 0;
    for (let lv = currentLv + 1; lv <= targetLv; lv++) {
      const mul = levelMult(lv);
      const mat = calcMats(building, lv);
      cum += building.cost * mul;
      steps.push({ lv, cost: building.cost * mul, cumCost: cum, materials: mat, time: building.baseTime * mul });
    }
    return steps;
  }, [building, currentLv, targetLv]);

  const last = upgrades[upgrades.length - 1];
  const totalTimeH = upgrades.reduce((s, u) => s + u.time, 0);

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
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Current</label>
                  <input type="number" min={0} max={49} value={currentLv} onChange={e => setCurrentLv(Math.max(0, Math.min(49, Number(e.target.value))))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Target</label>
                  <input type="number" min={1} max={50} value={targetLv} onChange={e => setTargetLv(Math.max(1, Math.min(50, Number(e.target.value))))} className="w-full border border-surface-300 px-3 py-2 rounded-lg text-sm font-bold outline-none" />
                </div>
              </div>
            )}
            {building && <p className="text-xs text-surface-500">Base: ${building.cost.toLocaleString()} / {fmtHours(building.baseTime)}</p>}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!building ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Select a building to begin</div>
          ) : upgrades.length === 0 ? (
            <div className="border border-dashed border-surface-300 rounded-lg p-16 text-center text-surface-400">Target must be higher than current level</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="border border-surface-200 rounded-lg p-3">
                  <span className="text-[10px] text-surface-400 block uppercase font-bold">Total Cost</span>
                  <span className="text-lg font-bold">${last.cumCost.toLocaleString()}</span>
                </div>
                <div className="border border-surface-200 rounded-lg p-3">
                  <span className="text-[10px] text-surface-400 block uppercase font-bold">Total Time</span>
                  <span className="text-lg font-bold">{fmtHours(totalTimeH)}</span>
                </div>
                <div className="border border-surface-200 rounded-lg p-3">
                  <span className="text-[10px] text-surface-400 block uppercase font-bold">Steps</span>
                  <span className="text-lg font-bold">{upgrades.length}</span>
                </div>
                <div className="border border-surface-200 rounded-lg p-3">
                  <span className="text-[10px] text-surface-400 block uppercase font-bold">C. Units</span>
                  <span className="text-lg font-bold">{Math.round(totalMats[111] ?? 0)}</span>
                </div>
              </div>

              <div className="border border-surface-200 rounded-lg">
                <div className="px-4 py-2 border-b border-surface-100 bg-surface-50 text-xs font-bold text-surface-500 uppercase">Material Summary</div>
                <div className="p-4 grid grid-cols-5 gap-3">
                  {MAT_IDS.map(id => {
                    const qty = Math.round(totalMats[id] ?? 0);
                    if (qty === 0) return null;
                    return <div key={id} className="bg-surface-50 p-3 rounded-lg border border-surface-100"><span className="text-[10px] text-surface-400 block uppercase font-bold">{matName(id)}</span><span className="text-lg font-bold">{qty.toLocaleString()}</span></div>;
                  })}
                </div>
              </div>

              <div className="border border-surface-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead><tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500 border-b border-surface-100"><th className="px-3 py-2">Lv</th><th className="px-3 py-2 text-right">Cost</th><th className="px-3 py-2 text-right">Cumulative</th><th className="px-3 py-2 text-right">Time</th><th className="px-3 py-2 text-right">Concrete</th><th className="px-3 py-2 text-right">Bricks</th><th className="px-3 py-2 text-right">Planks</th><th className="px-3 py-2 text-right">C. Units</th></tr></thead>
                  <tbody className="divide-y divide-surface-100">
                    {upgrades.map(u => (
                      <tr key={u.lv} className="hover:bg-surface-50 transition-colors">
                        <td className="px-3 py-2 font-bold">Lv{u.lv}</td><td className="px-3 py-2 text-right">${u.cost.toLocaleString()}</td><td className="px-3 py-2 text-right text-surface-500">${u.cumCost.toLocaleString()}</td><td className="px-3 py-2 text-right">{fmtHours(u.time)}</td>
                        <td className="px-3 py-2 text-right">{Math.round(u.materials[101] ?? 0)}</td><td className="px-3 py-2 text-right">{Math.round(u.materials[102] ?? 0)}</td><td className="px-3 py-2 text-right">{Math.round(u.materials[108] ?? 0)}</td><td className="px-3 py-2 text-right font-bold">{Math.round(u.materials[111] ?? 0)}</td>
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
