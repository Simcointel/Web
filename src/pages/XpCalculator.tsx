import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

const XP_TABLE: Record<number, number> = {
  1:5e5,2:550000,3:6e5,4:650000,5:7e5,6:8e5,7:9e5,8:1e6,9:1100000,10:1200000,
  11:1300000,12:14e5,13:15e5,14:1600000,15:17e5,16:1800000,17:1900000,18:2e6,
  19:2100000,20:2200000,21:2300000,22:2400000,23:2500000,24:2600000,25:2700000,
  26:2800000,27:2900000,28:3e6,29:3100000,30:3200000,31:3300000,32:3400000,
  33:3500000,34:3600000,35:3700000,36:3800000,37:3900000,38:4e6,39:4100000,
  40:4200000,41:4300000,42:4400000,43:4500000,44:4600000,45:4700000,46:48e5,
  47:4900000,48:5e6,49:5100000,50:5200000,51:5300000,52:5400000,53:5500000,
  54:5600000,55:5700000,56:58e5,57:5900000,58:6e6,59:6100000,60:6200000,
};

const OP_XP = 750; // per operating building/h
const REC_XP = 1000; // per recreation building/h
const ABUN_XP = 200; // per abundance slot/h

export function XpCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - XP Calculator"; }, []);

  const [currentLv, setCurrentLv] = useState(1);
  const [progress, setProgress] = useState(0);
  const [targetLv, setTargetLv] = useState(2);
  const [opBldgs, setOpBldgs] = useState(10);
  const [recBldgs, setRecBldgs] = useState(1);
  const [abunSlots, setAbunSlots] = useState(0);

  const currentXp = XP_TABLE[currentLv] ?? 0;
  const remaining = currentXp * (1 - progress / 100);
  let totalNeeded = remaining;

  for (let lv = currentLv + 1; lv < targetLv; lv++) {
    totalNeeded += XP_TABLE[lv] ?? 0;
  }

  const hourlyXp = opBldgs * OP_XP + recBldgs * REC_XP + abunSlots * ABUN_XP;
  const hours = hourlyXp > 0 ? totalNeeded / hourlyXp : Infinity;
  const days = hours / 24;
  const eta = isFinite(hours) && hours > 0 ? new Date(Date.now() + hours * 3600_000) : null;

  const levelGap = targetLv - currentLv;
  const totalXpForLevels = Array.from({ length: levelGap }, (_, i) => XP_TABLE[currentLv + i] ?? 0).reduce((a, b) => a + b, 0);
  const progressPct = totalXpForLevels > 0 ? Math.min(100, (1 - remaining / totalXpForLevels) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center"><Zap size={18} className="text-yellow-600" /></div>
        <div><h1 className="text-lg font-bold">XP Calculator</h1><p className="text-xs text-surface-400">Time estimate to reach target level</p></div>
      </div>

      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
        <div className="flex justify-between text-xs text-surface-500 mb-1.5"><span>Lv {currentLv}</span><span>Lv {targetLv}</span></div>
        <div className="h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-[10px] text-surface-400 mt-1 text-center">{levelGap} level{levelGap > 1 ? "s" : ""} gap · {progressPct.toFixed(0)}% of XP earned</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Your Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Current Level</label><input type="number" min={1} max={60} value={currentLv} onChange={e => setCurrentLv(Math.max(1, Math.min(60, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-white dark:bg-surface-900" /></div>
            <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Target Level</label><input type="number" min={2} max={60} value={targetLv} onChange={e => setTargetLv(Math.max(currentLv + 1, Math.min(60, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-white dark:bg-surface-900" /></div>
            <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Progress %</label><input type="number" min={0} max={100} value={progress} onChange={e => setProgress(Math.max(0, Math.min(100, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-white dark:bg-surface-900" /></div>
            <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Operating Bldgs</label><input type="number" min={0} max={18} value={opBldgs} onChange={e => setOpBldgs(Math.max(0, Math.min(18, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-white dark:bg-surface-900" /></div>
            <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Recreation Bldgs</label><input type="number" min={0} max={3} value={recBldgs} onChange={e => setRecBldgs(Math.max(0, Math.min(3, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-white dark:bg-surface-900" /></div>
            <div><label className="text-[10px] font-semibold text-surface-500 block mb-1">Abundance Slots</label><input type="number" min={0} max={18} value={abunSlots} onChange={e => setAbunSlots(Math.max(0, Math.min(18, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-2 text-sm font-bold outline-none bg-white dark:bg-surface-900" /></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">XP Sources</h2>
            <div className="flex justify-between"><span className="text-xs text-surface-500">Operating ({opBldgs} × {OP_XP})</span><span className="text-sm font-bold">{fmt(opBldgs * OP_XP)}/h</span></div>
            <div className="flex justify-between"><span className="text-xs text-surface-500">Recreation ({recBldgs} × {REC_XP})</span><span className="text-sm font-bold">{fmt(recBldgs * REC_XP)}/h</span></div>
            <div className="flex justify-between"><span className="text-xs text-surface-500">Abundance ({abunSlots} × {ABUN_XP})</span><span className="text-sm font-bold">{fmt(abunSlots * ABUN_XP)}/h</span></div>
            <div className="border-t border-surface-200 pt-2 flex justify-between"><span className="text-xs font-bold">Total</span><span className="text-lg font-bold text-brand-600">{fmt(hourlyXp)}/h</span></div>
          </div>

          <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
            <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Results</h2>
            <div className="flex justify-between"><span className="text-xs text-surface-500">XP Needed</span><span className="text-sm font-bold">{fmt(totalNeeded)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-surface-500">Time</span><span className="text-sm font-bold">{!isFinite(hours) ? "—" : days < 1 ? `${Math.round(hours)}h` : `${days.toFixed(1)}d (${Math.round(hours)}h)`}</span></div>
            <div className="flex justify-between"><span className="text-xs text-surface-500">ETA</span><span className="text-sm font-bold">{eta ? eta.toLocaleDateString() : "—"}</span></div>
            {currentXp > 0 && <div className="flex justify-between"><span className="text-xs text-surface-500">XP for Lv.{currentLv}</span><span className="text-sm font-bold">{fmt(currentXp)}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number): string { return Math.round(n).toLocaleString(); }
