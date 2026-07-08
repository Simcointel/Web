import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

const XP_TABLE: number[] = [
  130, 210, 340, 550, 890, 1430, 2320, 3750, 6000, 10000,
  16000, 26000, 42000, 68000, 110000, 170000, 280000,
];

function xpForLevel(lv: number): number {
  if (lv < 1 || lv > 60) return 0;
  if (lv <= XP_TABLE.length) return XP_TABLE[lv - 1];
  return 400_000;
}

const OP_XP = 12;
const REC_XP = 40;

function fmt(n: number): string { return Math.round(n).toLocaleString(); }

export function XpCalculatorPage() {
  useEffect(() => { document.title = "SimCo Intel - XP Calculator"; }, []);

  const [currentLv, setCurrentLv] = useState(1);
  const [progress, setProgress] = useState(0);
  const [targetLv, setTargetLv] = useState(5);
  const [opBldgs, setOpBldgs] = useState(10);
  const [recLvls, setRecLvls] = useState(3);
  const [prospecting, setProspecting] = useState(false);

  const currentXp = xpForLevel(currentLv);
  const remaining = currentXp * (1 - progress / 100);
  let totalNeeded = remaining;
  for (let lv = currentLv; lv < targetLv - 1; lv++) totalNeeded += xpForLevel(lv + 1);

  const hourlyXp = opBldgs * OP_XP + recLvls * REC_XP + (prospecting ? 36.5 : 0);
  const hours = hourlyXp > 0 ? totalNeeded / hourlyXp : Infinity;
  const days = hours / 24;
  const eta = isFinite(hours) && hours > 0 ? new Date(Date.now() + hours * 3600_000) : null;

  const levelGap = targetLv - currentLv;
  const totalXpForLevels = Array.from({ length: levelGap }, (_, i) => xpForLevel(currentLv + i)).reduce((a, b) => a + b, 0);
  const progressPct = totalXpForLevels > 0 ? Math.min(100, (1 - remaining / totalXpForLevels) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="w-9 h-9 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-yellow-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold">XP Calculator</h1>
          <p className="text-xs text-surface-400">Official game XP tables & rates</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex justify-between text-xs text-surface-500 mb-2">
          <span className="font-semibold">Lv {currentLv}</span>
          <span className="font-semibold">Lv {targetLv}</span>
        </div>
        <div className="h-2.5 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-[10px] text-surface-400 mt-1.5 text-center font-semibold">{levelGap} level{levelGap > 1 ? "s" : ""} · {fmt(totalNeeded)} XP needed</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Your Stats</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <InputField label="Current Level" value={currentLv} onChange={v => setCurrentLv(Math.max(1, Math.min(60, v)))} min={1} max={60} />
            <InputField label="Target Level" value={targetLv} onChange={v => setTargetLv(Math.max(currentLv + 1, Math.min(60, v)))} min={2} max={60} />
            <InputField label="Progress %" value={progress} onChange={v => setProgress(Math.max(0, Math.min(100, v)))} min={0} max={100} />
            <InputField label="Operating Bldgs" value={opBldgs} onChange={v => setOpBldgs(Math.max(0, Math.min(18, v)))} min={0} max={18} />
            <InputField label="Rec. Levels" value={recLvls} onChange={v => setRecLvls(Math.max(0, Math.min(9, v)))} min={0} max={9} />
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Prospecting</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                <input type="checkbox" checked={prospecting} onChange={e => setProspecting(e.target.checked)}
                  className="rounded border-surface-300 dark:border-surface-700 text-brand-600 focus:ring-brand-500/20" />
                <span className="text-xs font-semibold text-surface-500">Scrapping & rebuilding</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card p-5 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">XP Sources</h2>
            <div className="flex justify-between"><span className="text-xs text-surface-500 font-semibold">Operating ({opBldgs} × {OP_XP})</span><span className="text-sm font-bold">{fmt(opBldgs * OP_XP)}/h</span></div>
            <div className="flex justify-between"><span className="text-xs text-surface-500 font-semibold">Recreation ({recLvls} × {REC_XP})</span><span className="text-sm font-bold">{fmt(recLvls * REC_XP)}/h</span></div>
            {prospecting && <div className="flex justify-between"><span className="text-xs text-surface-500 font-semibold">Prospecting</span><span className="text-sm font-bold">36/h</span></div>}
            <div className="border-t border-surface-200 dark:border-surface-800 pt-3 flex justify-between items-center">
              <span className="text-xs font-bold">Total</span>
              <span className="text-xl font-black text-brand-600 tabular-nums">{fmt(hourlyXp)}/h</span>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Results</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="metric-label">XP Needed</span><div className="metric-value">{fmt(totalNeeded)}</div></div>
              <div><span className="metric-label">Time Required</span><div className="metric-value text-brand-600">{!isFinite(hours) ? "—" : days < 1 ? `${Math.round(hours)}h` : `${days.toFixed(1)}d`}</div></div>
              <div><span className="metric-label">ETA Date</span><div className="metric-value">{eta ? eta.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "—"}</div></div>
              <div><span className="metric-label">Current XP Cap</span><div className="metric-value">{currentXp > 0 ? fmt(currentXp) : "—"}</div></div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-surface-400 text-center max-w-xl mx-auto">
        Rates from official guide: 12 XP/h per operating building, 40 XP/h per recreation level. Prospecting ~36.5 XP/h.
      </p>
    </div>
  );
}

function InputField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">{label}</label>
      <input type="number" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input" />
    </div>
  );
}
