import { useState, useEffect, useMemo } from "react";
import { Building2, Landmark, PiggyBank } from "lucide-react";

interface ExecSkills { management: number; accounting: number; communication: number; science: number }

function eff(v: number): number {
  if (v <= 60) return v;
  if (v <= 80) return 60 + (v - 60) / 2;
  return 70 + (v - 80) / 4;
}

function calcAO(totalBldgLevels: number, cooMgmt: number, cfoMgmt: number, cmoMgmt: number, ctoMgmt: number): number {
  const rawAO = (totalBldgLevels - 1) / 170;
  const totalMgmt = eff(cooMgmt) + Math.floor((eff(cfoMgmt) + eff(cmoMgmt) + eff(ctoMgmt)) / 4);
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
    <div className="space-y-5 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Board Room</h1>
          <p className="text-xs text-surface-400">Executives, EVA returns & bond analysis</p>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-100 dark:bg-surface-900 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
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

function ExecInput({ role, label, data, color, setter }: {
  role: 'coo' | 'cfo' | 'cmo' | 'cto';
  label: string;
  data: ExecSkills;
  color: string;
  setter: (field: keyof ExecSkills, value: number) => void;
}) {
  return (
    <div className={`card p-4 border-l-4 ${color}`}>
      <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">{label}</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {(["management","accounting","communication","science"] as const).map(f => (
          <div key={f}>
            <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block mb-0.5">{f.slice(0, 4)}</label>
            <input type="number" min={0} max={100} value={data[f]}
              onChange={e => setter(f, Number(e.target.value))}
              className="w-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 px-2.5 py-1.5 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-brand-500/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ title, color, children, value }: { title: string; color: string; children: React.ReactNode; value?: string }) {
  return (
    <div className={`card p-4 border-l-4 ${color}`}>
      <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">{title}</h3>
      <div className="space-y-1.5 text-xs">
        {children}
      </div>
    </div>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-surface-500 font-semibold">{label}</span>
      <span className={`font-bold tabular-nums ${highlight || ''}`}>{value}</span>
    </div>
  );
}

function ProgBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

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

  const updateExec = (setter: React.Dispatch<React.SetStateAction<ExecSkills>>, field: keyof ExecSkills, value: number) => {
    setter((prev: ExecSkills) => ({ ...prev, [field]: Math.max(0, Math.min(100, value)) }));
  };

  const results = useMemo(() => {
    const effMgmt = eff(coo.management) + eff(cfo.management) + eff(cmo.management) + eff(cto.management);
    const effAccMax = Math.max(eff(coo.accounting), eff(cfo.accounting), eff(cmo.accounting), eff(cto.accounting));
    const effCommSum = eff(coo.communication) + eff(cfo.communication) + eff(cmo.communication) + eff(cto.communication);
    const effSciMax = Math.max(eff(coo.science), eff(cfo.science), eff(cmo.science), eff(cto.science));
    const effSciAvg = (eff(coo.science) + eff(cfo.science) + eff(cmo.science) + eff(cto.science)) / 4;
    return {
      mgmtSum: effMgmt, accMax: effAccMax, commSum: effCommSum, sciMax: effSciMax, sciAvg: effSciAvg,
      effectiveMgmt: eff(coo.management) + Math.floor((eff(cfo.management) + eff(cmo.management) + eff(cto.management)) / 4),
      rawAO: (totalBldgLevels - 1) / 170,
      aoPct: calcAO(totalBldgLevels, coo.management, cfo.management, cmo.management, cto.management),
      taxThreshold: calcTaxThreshold(effAccMax),
      dailyTax: calcDailyTax(dailyProfit, calcTaxThreshold(effAccMax), bankLevel),
      salesSpeed: calcSalesSpeed(effCommSum),
      patentProb: calcPatentProb(effSciMax),
      researchCost: calcResearchCost(effSciAvg, targetQ, startQ),
    };
  }, [coo, cfo, cmo, cto, totalBldgLevels, bankLevel, dailyProfit, startQ, targetQ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Your Board</h2>
        <ExecInput role="coo" label="COO (full mgmt weight)" data={coo} color="border-l-brand-500" setter={(f, v) => updateExec(setCoo, f, v)} />
        <ExecInput role="cfo" label="CFO (mgmt/4, acc focus)" data={cfo} color="border-l-emerald-500" setter={(f, v) => updateExec(setCfo, f, v)} />
        <ExecInput role="cmo" label="CMO (mgmt/4, comm focus)" data={cmo} color="border-l-amber-500" setter={(f, v) => updateExec(setCmo, f, v)} />
        <ExecInput role="cto" label="CTO (mgmt/4, sci focus)" data={cto} color="border-l-violet-500" setter={(f, v) => updateExec(setCto, f, v)} />

        <div className="card p-4">
          <h3 className="text-xs font-bold uppercase text-surface-400 mb-3 tracking-wider">Company Profile</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Total Building Levels</label>
              <input type="number" min={0} max={500} value={totalBldgLevels} onChange={e => setTotalBldgLevels(Number(e.target.value))} className="input" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Bank Level</label>
              <input type="number" min={0} max={20} value={bankLevel} onChange={e => setBankLevel(Number(e.target.value))} className="input" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Est. Daily Profit</label>
              <input type="number" min={0} value={dailyProfit} onChange={e => setDailyProfit(Number(e.target.value))} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Start Q</label>
                <input type="number" min={0} max={10} value={startQ} onChange={e => setStartQ(Number(e.target.value))} className="input" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Target Q</label>
                <input type="number" min={0} max={10} value={targetQ} onChange={e => setTargetQ(Number(e.target.value))} className="input" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Impact Analysis</h2>

        <ResultCard title="Admin Overhead" color="border-l-brand-500">
          <MetricRow label="Raw AO" value={`${(results.rawAO * 100).toFixed(2)}%`} />
          <MetricRow label="Effective Mgmt" value={String(results.effectiveMgmt)} />
          <ProgBar pct={results.aoPct * 2} color="bg-brand-500" />
          <MetricRow label="Final AO" value={`${results.aoPct.toFixed(2)}%`} highlight="text-lg text-brand-600" />
        </ResultCard>

        <ResultCard title="Accounting & Tax" color="border-l-emerald-500">
          <MetricRow label="Max Accounting" value={String(results.accMax)} />
          <MetricRow label="Tax-free Threshold" value={fmt$(results.taxThreshold)} highlight="text-emerald-600" />
          <MetricRow label="Est. Daily Tax" value={fmt$(results.dailyTax)} highlight={`text-lg ${results.dailyTax > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
        </ResultCard>

        <ResultCard title="Sales Speed" color="border-l-amber-500">
          <MetricRow label="Total Communication" value={String(results.commSum)} />
          <ProgBar pct={results.salesSpeed * 4} color="bg-amber-500" />
          <MetricRow label="Sales Speed Bonus" value={`+${results.salesSpeed.toFixed(2)}%`} highlight="text-lg text-amber-600" />
        </ResultCard>

        <ResultCard title="R&D Impact" color="border-l-violet-500">
          <MetricRow label="Max Science" value={String(results.sciMax)} />
          <MetricRow label="Patent Probability" value={`${results.patentProb.toFixed(2)}%`} highlight="text-lg text-violet-600" />
          <ProgBar pct={results.patentProb * 4} color="bg-violet-500" />
          <MetricRow label={`Research (Q${startQ}→Q${targetQ})`} value={fmt$(results.researchCost)} highlight="text-lg font-bold" />
        </ResultCard>
      </div>
    </div>
  );
}

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card p-5 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Company Metrics</h2>
        <div className="space-y-3">
          <Field label="Invested Capital" value={capital} onChange={setCapital} />
          <Field label="Annual Operating Profit" value={annualProfit} onChange={setAnnualProfit} />
          <Field label="WACC (%)" value={wacc} onChange={setWacc} min={0} max={50} step={0.5} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="card p-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Results</h2>
          <div className="space-y-2">
            <MetricRow label="ROIC" value={`${eva.roic.toFixed(2)}%`} />
            <MetricRow label="WACC" value={`${wacc}%`} />
            <div className="border-t border-surface-100 dark:border-surface-800 pt-2 mt-2">
              <MetricRow label="EVA Spread" value={`${eva.spread >= 0 ? '+' : ''}${eva.spread.toFixed(2)}%`} highlight={eva.spread >= 0 ? 'text-lg text-emerald-600' : 'text-lg text-rose-600'} />
            </div>
            <MetricRow label="Economic Value Added" value={fmt$(eva.evaDollar)} highlight={eva.evaDollar >= 0 ? 'text-lg text-emerald-600' : 'text-lg text-rose-600'} />
          </div>
        </div>
        <p className="text-[10px] text-surface-400 leading-relaxed px-1">
          EVA = ROIC − WACC. Positive means the company generates returns above its cost of capital — true value creation.
          WACC ~10% is typical for a diversified industrial company.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">{label}</label>
      <input type="number" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input" />
    </div>
  );
}

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

  const priceStatus = bondPrice > faceValue ? "premium" : bondPrice < faceValue ? "discount" : "par";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="card p-5 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Bond Parameters</h2>
        <div className="space-y-3">
          <Field label="Face Value" value={faceValue} onChange={setFaceValue} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">
                Coupon Rate (%) <span className="text-[8px] font-normal text-surface-400">(0.5–2.0 in-game)</span>
              </label>
              <input type="number" min={0} max={30} step={0.1} value={couponRate}
                onChange={e => setCouponRate(Number(e.target.value))}
                className="input" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">
                Market Yield (%) <span className="text-[8px] font-normal text-surface-400">(0.5–2.0 in-game)</span>
              </label>
              <input type="number" min={0} max={30} step={0.1} value={marketYield}
                onChange={e => setMarketYield(Number(e.target.value))}
                className="input" />
            </div>
          </div>
          <Field label="Years to Maturity" value={years} onChange={v => setYears(Math.max(1, Math.min(30, v)))} min={1} max={30} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="card p-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Pricing & Return</h2>
          <div className="space-y-2">
            <MetricRow label="Bond Price" value={`${fmt$(bondPrice)} (${priceStatus})`}
              highlight={priceStatus === "premium" ? 'text-amber-600' : priceStatus === "discount" ? 'text-emerald-600' : ''} />
            <MetricRow label="Annual Coupon" value={fmt$(annualIncome)} />
            <MetricRow label="Effective Yield" value={`${effectiveYield.toFixed(2)}%`} />
            <MetricRow label="Coupon vs Market"
              value={couponRate > marketYield ? "Above market" : couponRate < marketYield ? "Below market" : "At market"}
              highlight={couponRate > marketYield ? 'text-emerald-600' : couponRate < marketYield ? 'text-rose-600' : ''} />
            <div className="border-t border-surface-100 dark:border-surface-800 pt-2 mt-2">
              <MetricRow label={`${years}-Year Total Return`} value={fmt$(totalReturn)} highlight="text-lg text-brand-600" />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-surface-400 leading-relaxed px-1">
          When coupon rate exceeds market yield, investors pay a premium.
          Use this to decide whether issuing bonds or bank borrowing is cheaper.
        </p>
      </div>
    </div>
  );
}
