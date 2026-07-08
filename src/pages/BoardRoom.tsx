import { useState, useEffect, useMemo } from "react";
import { Building2, Landmark, PiggyBank } from "lucide-react";

// ─── Game formulas ────────────────────────────────────────
interface ExecSkills { management: number; accounting: number; communication: number; science: number }

function calcAO(totalBldgLevels: number, cooMgmt: number, cfoMgmt: number, cmoMgmt: number, ctoMgmt: number): number {
  const rawAO = (totalBldgLevels - 1) / 170;
  const totalMgmt = cooMgmt + Math.floor((cfoMgmt + cmoMgmt + ctoMgmt) / 4);
  return Math.max(0, rawAO - rawAO * (totalMgmt / 100));
}

function calcTaxThreshold(accMax: number): number { return 3_000_000 + accMax * 5_500_000; }

function calcDailyTax(profit: number, threshold: number, bankLevel: number): number {
  const dailyThreshold = threshold / 30;
  if (profit <= dailyThreshold) return 0;
  return (profit - dailyThreshold) * Math.max(0.05, 0.07 - bankLevel * 0.001);
}

function calcSalesSpeed(commSum: number): number { return commSum / 3; }
function calcPatentProb(sciMax: number): number { return 6.25 + sciMax * 0.0625; }

function calcResearchCost(sciAvg: number, targetQ: number, startQ: number): number {
  if (targetQ <= startQ) return 0;
  return (targetQ - startQ) * 50 * Math.max(1, 10 - sciAvg * 0.5);
}

// EVA = (operating profit - capital charge) / capital = ROIC - WACC
function calcEVA(annualProfit: number, investedCapital: number, waccPct: number): number {
  if (investedCapital <= 0) return 0;
  const roic = (annualProfit / investedCapital) * 100;
  return roic - waccPct;
}

function fmt$(n: number): string { return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`; }

const tabs = ["execs", "eva", "bonds"] as const;
type Tab = typeof tabs[number];

export function BoardRoomPage() {
  useEffect(() => { document.title = "SimCo Intel - Board Room"; }, []);
  const [tab, setTab] = useState<Tab>("execs");

  return (
    <div className="space-y-4 text-sm max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Building2 size={18} className="text-amber-600" /></div>
        <div><h1 className="text-lg font-bold">Board Room</h1><p className="text-xs text-surface-400">Executives, EVA return tracking & bond analysis</p></div>
      </div>

      <div className="flex gap-1 bg-surface-100 dark:bg-surface-900 rounded-lg p-0.5 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${tab === t ? "bg-white dark:bg-surface-800 text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}>
            {t === "execs" ? "Executive Optimizer" : t === "eva" ? "EVA Tracker" : "Bonds Calculator"}
          </button>
        ))}
      </div>

      {tab === "execs" && <ExecsTab />}
      {tab === "eva" && <EvaTab />}
      {tab === "bonds" && <BondsTab />}
    </div>
  );
}

// ─── Exec Tab (from ExecutiveOptimizer) ───────────────────
function ExecsTab() {
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
    return {
      mgmtSum, accMax, commSum, sciMax, sciAvg,
      effectiveMgmt: coo.management + Math.floor((cfo.management + cmo.management + cto.management) / 4),
      rawAO: (totalBldgLevels - 1) / 170,
      aoPct: calcAO(totalBldgLevels, coo.management, cfo.management, cmo.management, cto.management),
      taxThreshold: calcTaxThreshold(accMax),
      dailyTax: calcDailyTax(dailyProfit, calcTaxThreshold(accMax), bankLevel),
      salesSpeed: calcSalesSpeed(commSum),
      patentProb: calcPatentProb(sciMax),
      researchCost: calcResearchCost(sciAvg, targetQ, startQ),
    };
  }, [coo, cfo, cmo, cto, totalBldgLevels, bankLevel, dailyProfit, startQ, targetQ]);

  const ExecInput = ({ role, label, data, color }: { role: 'coo' | 'cfo' | 'cmo' | 'cto'; label: string; data: ExecSkills; color: string }) => (
    <div className={`bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 border-l-4 ${color} rounded-xl p-4`}>
      <h3 className="text-xs font-bold uppercase mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        {(["management", "accounting", "communication", "science"] as const).map(f => (
          <div key={f}>
            <label className="text-[9px] font-bold uppercase text-surface-400 block mb-0.5">{f.slice(0, 4)}</label>
            <input type="number" min={0} max={100} value={data[f]} onChange={e => updateExec(role, f, Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded text-sm font-bold outline-none" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase text-surface-400">Your Board</h2>
        <ExecInput role="coo" label="COO (full mgmt weight)" data={coo} color="border-l-brand-600" />
        <ExecInput role="cfo" label="CFO (mgmt/4, acc focus)" data={cfo} color="border-l-emerald-500" />
        <ExecInput role="cmo" label="CMO (mgmt/4, comm focus)" data={cmo} color="border-l-amber-500" />
        <ExecInput role="cto" label="CTO (mgmt/4, sci focus)" data={cto} color="border-l-violet-500" />

        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase text-surface-400 mb-3">Company Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Total Building Levels</label><input type="number" min={0} max={500} value={totalBldgLevels} onChange={e => setTotalBldgLevels(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
            <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Bank Level</label><input type="number" min={0} max={20} value={bankLevel} onChange={e => setBankLevel(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
            <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Est. Daily Profit</label><input type="number" min={0} value={dailyProfit} onChange={e => setDailyProfit(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Start Q</label><input type="number" min={0} max={10} value={startQ} onChange={e => setStartQ(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-2 rounded text-sm font-bold outline-none" /></div>
              <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Target Q</label><input type="number" min={0} max={10} value={targetQ} onChange={e => setTargetQ(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-2 rounded text-sm font-bold outline-none" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase text-surface-400">Impact Analysis</h2>

        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 border-t-4 border-t-brand-600 rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase mb-3">1. Admin Overhead</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-surface-500">Raw AO</span><span className="font-bold">{(results.rawAO * 100).toFixed(2)}%</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Effective Management</span><span className="font-bold">{results.effectiveMgmt}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold">Final AO</span><span className="text-lg font-bold text-brand-600">{results.aoPct.toFixed(2)}%</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 border-t-4 border-t-emerald-500 rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase mb-3">2. Accounting & Tax</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-surface-500">Max Accounting</span><span className="font-bold">{results.accMax}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Tax-free Threshold</span><span className="font-bold text-emerald-600">{fmt$(results.taxThreshold)}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Daily Threshold</span><span className="font-bold">{fmt$(results.taxThreshold / 30)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold">Est. Daily Tax</span><span className={`text-lg font-bold ${results.dailyTax > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt$(results.dailyTax)}</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 border-t-4 border-t-amber-500 rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase mb-3">3. Sales Speed</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-surface-500">Total Communication</span><span className="font-bold">{results.commSum}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold">Sales Speed Bonus</span><span className="text-lg font-bold text-amber-600">+{results.salesSpeed.toFixed(2)}%</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 border-t-4 border-t-violet-500 rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase mb-3">4. R&D Impact</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-surface-500">Max Science</span><span className="font-bold">{results.sciMax}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Avg Science</span><span className="font-bold">{results.sciAvg.toFixed(1)}</span></div>
            <div className="flex justify-between"><span className="font-bold">Patent Probability</span><span className="text-lg font-bold text-violet-600">{results.patentProb.toFixed(2)}%</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold">Research Cost (Q{startQ}→Q{targetQ})</span><span className="text-lg font-bold">{fmt$(results.researchCost)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EVA Tab ──────────────────────────────────────────────
function EvaTab() {
  const [capital, setCapital] = useState(10_000_000);
  const [annualProfit, setAnnualProfit] = useState(2_500_000);
  const [wacc, setWacc] = useState(10);

  const eva = useMemo(() => {
    const roic = capital > 0 ? (annualProfit / capital) * 100 : 0;
    const spread = calcEVA(annualProfit, capital, wacc);
    const evaDollar = capital > 0 ? annualProfit - (capital * wacc / 100) : 0;
    return { roic, spread, evaDollar };
  }, [capital, annualProfit, wacc]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
        <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Company Metrics</h2>
        <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Invested Capital</label><input type="number" min={0} value={capital} onChange={e => setCapital(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Annual Operating Profit</label><input type="number" min={0} value={annualProfit} onChange={e => setAnnualProfit(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">WACC (%)</label><input type="number" min={0} max={50} step={0.5} value={wacc} onChange={e => setWacc(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
      </div>

      <div className="space-y-3">
        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Results</h2>
          <div className="flex justify-between"><span className="text-xs text-surface-500">ROIC</span><span className="text-sm font-bold">{eva.roic.toFixed(2)}%</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">WACC</span><span className="text-sm font-bold">{wacc}%</span></div>
          <div className="flex justify-between border-t pt-2"><span className="text-xs font-bold">EVA Spread (ROIC - WACC)</span><span className={`text-lg font-bold ${eva.spread >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{eva.spread >= 0 ? "+" : ""}{eva.spread.toFixed(2)}%</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Economic Value Added</span><span className={`text-lg font-bold ${eva.evaDollar >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt$(eva.evaDollar)}</span></div>
        </div>
        <p className="text-[10px] text-surface-400 leading-relaxed">
          EVA = ROIC - WACC. Positive means the company generates returns above its cost of capital — true value creation.
          WACC around 10% is typical for a diversified industrial company. Lower WACC = cheaper financing = higher EVA.
        </p>
      </div>
    </div>
  );
}

// ─── Bonds Tab ────────────────────────────────────────────
function BondsTab() {
  const [faceValue, setFaceValue] = useState(1_000_000);
  const [couponRate, setCouponRate] = useState(7);
  const [marketYield, setMarketYield] = useState(9);
  const [years, setYears] = useState(5);

  const bondPrice = useMemo(() => {
    const coupon = faceValue * (couponRate / 100);
    const y = marketYield / 100;
    let pv = 0;
    for (let t = 1; t <= years; t++) pv += coupon / Math.pow(1 + y, t);
    pv += faceValue / Math.pow(1 + y, years);
    return pv;
  }, [faceValue, couponRate, marketYield, years]);

  const annualIncome = useMemo(() => faceValue * (couponRate / 100), [faceValue, couponRate]);
  const effectiveYield = bondPrice > 0 ? (annualIncome / bondPrice) * 100 : 0;
  const totalReturn = useMemo(() => {
    const coupons = annualIncome * years;
    return coupons + (faceValue - bondPrice);
  }, [annualIncome, years, faceValue, bondPrice]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
        <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Bond Parameters</h2>
        <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Face Value</label><input type="number" min={0} value={faceValue} onChange={e => setFaceValue(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Coupon Rate (%)</label><input type="number" min={0} max={30} step={0.5} value={couponRate} onChange={e => setCouponRate(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
          <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Market Yield (%)</label><input type="number" min={0} max={30} step={0.5} value={marketYield} onChange={e => setMarketYield(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        </div>
        <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Years to Maturity</label><input type="number" min={1} max={30} value={years} onChange={e => setYears(Math.max(1, Math.min(30, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
      </div>

      <div className="space-y-3">
        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Pricing & Return</h2>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Bond Price</span><span className={`text-sm font-bold ${bondPrice > faceValue ? "text-amber-600" : bondPrice < faceValue ? "text-emerald-600" : ""}`}>{fmt$(bondPrice)} {bondPrice > faceValue ? "(premium)" : bondPrice < faceValue ? "(discount)" : "(par)"}</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Annual Coupon</span><span className="text-sm font-bold">{fmt$(annualIncome)}</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Effective Yield</span><span className="text-sm font-bold">{effectiveYield.toFixed(2)}%</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Coupon vs Market</span><span className={`text-sm font-bold ${couponRate > marketYield ? "text-emerald-600" : "text-rose-600"}`}>{couponRate > marketYield ? "Above market (sell at premium)" : couponRate < marketYield ? "Below market (sell at discount)" : "At market (sell at par)"}</span></div>
          <div className="flex justify-between border-t pt-2"><span className="text-xs font-bold">{years}-Year Total Return</span><span className="text-lg font-bold text-brand-600">{fmt$(totalReturn)}</span></div>
        </div>
        <p className="text-[10px] text-surface-400 leading-relaxed">
          In SimCo, bonds are company-issued debt securities. When your coupon rate exceeds the market yield, investors pay a premium.
          Use this to decide whether issuing bonds or borrowing from the bank is cheaper.
        </p>
      </div>
    </div>
  );
}
