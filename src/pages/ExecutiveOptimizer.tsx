import { useState, useEffect, useMemo } from "react";

interface ExecSkills { management: number; accounting: number; communication: number; science: number }

const emptyExec = (): ExecSkills => ({ management: 0, accounting: 0, communication: 0, science: 0 });

function calcAO(managementSum: number, totalBuildingLevels: number): number {
  const ao = 100 - managementSum * 2 + totalBuildingLevels * 0.1;
  return Math.max(0, Math.min(100, ao));
}

function calcTaxThreshold(accountingMax: number): number {
  return 2500000 + accountingMax * 50000;
}

function calcDailyTax(profit: number, threshold: number, bankLevel: number): number {
  if (profit <= threshold) return 0;
  const taxable = profit - threshold;
  const rate = 0.25 - bankLevel * 0.01;
  return taxable * Math.max(0.05, rate);
}

function calcSalesSpeed(communicationSum: number): number {
  return communicationSum * 0.5;
}

function calcPatentProb(scienceMax: number): number {
  return Math.min(50, 5 + scienceMax * 1.5);
}

function calcResearchCost(scienceAvg: number, targetQ: number, startQ: number): number {
  const baseCost = 50;
  const steps = targetQ - startQ;
  if (steps <= 0) return 0;
  return steps * baseCost * Math.max(1, 10 - scienceAvg * 0.5);
}

export function ExecutiveOptimizerPage() {
  useEffect(() => { document.title = "SimCo Intel - Executive Optimizer"; }, []);

  const [coo, setCoo] = useState<ExecSkills>({ management: 10, accounting: 0, communication: 0, science: 0 });
  const [cfo, setCfo] = useState<ExecSkills>({ management: 0, accounting: 10, communication: 0, science: 0 });
  const [cmo, setCmo] = useState<ExecSkills>({ management: 0, accounting: 0, communication: 10, science: 0 });
  const [cto, setCto] = useState<ExecSkills>({ management: 0, accounting: 0, communication: 0, science: 10 });
  const [totalBldgLevels, setTotalBldgLevels] = useState(50);
  const [bankLevel, setBankLevel] = useState(0);
  const [dailyProfit, setDailyProfit] = useState(500000);
  const [startQ, setStartQ] = useState(0);
  const [targetQ, setTargetQ] = useState(1);

  const updateExec = (role: 'coo' | 'cfo' | 'cmo' | 'cto', field: keyof ExecSkills, value: number) => {
    const setter = { coo: setCoo, cfo: setCfo, cmo: setCmo, cto: setCto }[role];
    setter((prev: ExecSkills) => ({ ...prev, [field]: Math.max(0, Math.min(100, value)) }));
  };

  const results = useMemo(() => {
    const mgmtSum = coo.management + cfo.management + cmo.management + cto.management;
    const accMax = Math.max(coo.accounting, cfo.accounting, cmo.accounting, cto.accounting);
    const commSum = coo.communication + cfo.communication + cmo.communication + cto.communication;
    const sciMax = Math.max(coo.science, cfo.science, cmo.science, cto.science);
    const sciAvg = (coo.science + cfo.science + cmo.science + cto.science) / 4;

    const aoPct = calcAO(mgmtSum, totalBldgLevels);
    const taxThreshold = calcTaxThreshold(accMax);
    const dailyTax = calcDailyTax(dailyProfit, taxThreshold, bankLevel);
    const salesSpeed = calcSalesSpeed(commSum);
    const patentProb = calcPatentProb(sciMax);
    const researchCost = calcResearchCost(sciAvg, targetQ, startQ);

    return { mgmtSum, accMax, commSum, sciMax, sciAvg, aoPct, taxThreshold, dailyTax, salesSpeed, patentProb, researchCost };
  }, [coo, cfo, cmo, cto, totalBldgLevels, bankLevel, dailyProfit, startQ, targetQ]);

  const ExecInput = ({ role, label, data, color }: { role: 'coo' | 'cfo' | 'cmo' | 'cto'; label: string; data: ExecSkills; color: string }) => (
    <div className={`card p-5 border-l-4 ${color} border-surface-200 dark:border-surface-800`}>
      <h3 className="text-xs font-black uppercase tracking-widest mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        {(["management", "accounting", "communication", "science"] as const).map(f => (
          <div key={f}>
            <label className="text-[9px] font-bold uppercase text-surface-400 block mb-0.5">{f.slice(0, 4)}</label>
            <input type="number" min={0} max={100} value={data[f]} onChange={e => updateExec(role, f, Number(e.target.value))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-2 py-1.5 rounded text-sm font-bold outline-none" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-xl font-bold italic tracking-tight">Executive Optimizer</h1>
          <p className="text-sm text-surface-500 mt-1 font-medium italic opacity-80 text-brand-600">Board Skill Impact Simulator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-surface-400">Your Board</h2>
          <ExecInput role="coo" label="COO (Mgmt focus)" data={coo} color="border-l-brand-600" />
          <ExecInput role="cfo" label="CFO (Acct focus)" data={cfo} color="border-l-emerald-500" />
          <ExecInput role="cmo" label="CMO (Comm focus)" data={cmo} color="border-l-amber-500" />
          <ExecInput role="cto" label="CTO (Sci focus)" data={cto} color="border-l-violet-500" />

          <div className="card p-5 border-surface-200 dark:border-surface-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-3">Company Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Total Bldg Levels</label>
                <input type="number" min={0} max={500} value={totalBldgLevels} onChange={e => setTotalBldgLevels(Number(e.target.value))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-2 rounded text-sm font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Bank Level</label>
                <input type="number" min={0} max={20} value={bankLevel} onChange={e => setBankLevel(Number(e.target.value))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-2 rounded text-sm font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Est. Daily Profit</label>
                <input type="number" min={0} value={dailyProfit} onChange={e => setDailyProfit(Number(e.target.value))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-3 py-2 rounded text-sm font-bold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Start Q</label>
                  <input type="number" min={0} max={10} value={startQ} onChange={e => setStartQ(Number(e.target.value))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-2 py-2 rounded text-sm font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Target Q</label>
                  <input type="number" min={0} max={10} value={targetQ} onChange={e => setTargetQ(Number(e.target.value))} className="w-full bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 px-2 py-2 rounded text-sm font-bold outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-surface-400">Impact Analysis</h2>

          <div className="card p-6 border-surface-200 dark:border-surface-800 border-t-4 border-t-brand-600">
            <h3 className="text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" /> 1. Admin Overhead
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-surface-500">Mgmt Sum</span><span className="font-bold">{results.mgmtSum}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Total Bldg Levels</span><span className="font-bold">{totalBldgLevels}</span></div>
              <div className="flex justify-between border-t border-surface-100 dark:border-surface-800 pt-2">
                <span className="font-bold">Admin Overhead</span>
                <span className="text-lg font-black tabular-nums text-brand-600">{results.aoPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="card p-6 border-surface-200 dark:border-surface-800 border-t-4 border-t-emerald-500">
            <h3 className="text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> 2. Accounting & Tax
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-surface-500">Max Accounting</span><span className="font-bold">{results.accMax}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Tax-free Threshold</span><span className="font-bold text-emerald-600">${results.taxThreshold.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Est. Daily Profit</span><span className="font-bold">${dailyProfit.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-surface-100 dark:border-surface-800 pt-2">
                <span className="font-bold">Est. Daily Tax</span>
                <span className={`text-lg font-black tabular-nums ${results.dailyTax > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${results.dailyTax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6 border-surface-200 dark:border-surface-800 border-t-4 border-t-amber-500">
            <h3 className="text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 3. Sales Speed
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-surface-500">Comm Sum</span><span className="font-bold">{results.commSum}</span></div>
              <div className="flex justify-between border-t border-surface-100 dark:border-surface-800 pt-2">
                <span className="font-bold">Sales Speed Bonus</span>
                <span className="text-lg font-black tabular-nums text-amber-600">+{results.salesSpeed.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="card p-6 border-surface-200 dark:border-surface-800 border-t-4 border-t-violet-500">
            <h3 className="text-sm font-black uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" /> 4. R&D Impact
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-surface-500">Max Science</span><span className="font-bold">{results.sciMax}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Avg Science</span><span className="font-bold">{results.sciAvg.toFixed(1)}</span></div>
              <div className="flex justify-between">
                <span className="font-bold">Patent Probability</span>
                <span className="text-lg font-black tabular-nums text-violet-600">{results.patentProb.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-t border-surface-100 dark:border-surface-800 pt-2">
                <span className="font-bold">Research Cost (Q{startQ}→Q{targetQ})</span>
                <span className="text-lg font-black tabular-nums">${results.researchCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card p-6 border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
            <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-2 text-center">What to Optimize</h3>
            <p className="text-xs text-surface-500 text-center">
              {results.aoPct > 30 ? "→ Reduce AO: invest in COO management skills or reduce total building levels. " : ""}
              {results.dailyTax > 100000 ? "→ Tax burden high: increase CFO accounting or raise bank level. " : ""}
              {results.salesSpeed < 20 ? "→ Consider more CMO communication for retail/restaurants. " : ""}
              {results.patentProb < 20 ? "→ Boost CTO science for better patent odds and research costs. " : ""}
              {results.aoPct <= 30 && results.dailyTax <= 100000 && results.salesSpeed >= 20 && results.patentProb >= 20 ? "Board is well-balanced for current operations." : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
