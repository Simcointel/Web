import { useState, useMemo } from "react";
import { Building2, Landmark, PiggyBank } from "lucide-react";
import { PageHeader, MetricBox } from "../../components/ui/Common";
import { usePageTitleKey } from "../../hooks/usePageTitle";
import { fmtNumber, fmtPct, fmtCurrency } from "../../utils/formatters";
import type { SuiteViewProps, SuiteStateV6 } from "./types";

type BoardRoomTab = 'execs' | 'eva' | 'bonds';

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

export function BoardRoomView({ state, core, setState }: SuiteViewProps) {
  const [tab, setTab] = useState<BoardRoomTab>('execs');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-900 rounded-xl p-1 w-fit">
        {(['execs', 'eva', 'bonds'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn ${tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
            {t === 'execs' ? 'Executive Optimizer' : t === 'eva' ? 'EVA Tracker' : 'Bonds Calculator'}
          </button>
        ))}
      </div>

      {tab === 'execs' && <BoardExecsTab state={state} setState={setState} />}
      {tab === 'eva' && <EvaTab />}
      {tab === 'bonds' && <BondsTab />}
    </div>
  );
}

function BoardExecsTab({ state, setState }: { state: SuiteStateV6; setState: React.Dispatch<React.SetStateAction<SuiteStateV6>> }) {
  const board = state.board;
  const totalBldgLevels = state.settings?.whatIfLevel || 50;
  const bankLevel = state.settings?.bankLevel || 0;
  const dailyProfit = state.settings?.estDailyProfit || 500000;

  const effBoard = board;
  const effMgmt = eff(effBoard.coo.management) + eff(effBoard.cfo.management) + eff(effBoard.cmo.management) + eff(effBoard.cto.management);
  const effAccMax = Math.max(eff(effBoard.coo.accounting), eff(effBoard.cfo.accounting), eff(effBoard.cmo.accounting), eff(effBoard.cto.accounting));
  const effCommSum = eff(effBoard.coo.communication) + eff(effBoard.cfo.communication) + eff(effBoard.cmo.communication) + eff(effBoard.cto.communication);
  const effSciMax = Math.max(eff(effBoard.coo.science), eff(effBoard.cfo.science), eff(effBoard.cmo.science), eff(effBoard.cto.science));
  const effSciAvg = (eff(effBoard.coo.science) + eff(effBoard.cfo.science) + eff(effBoard.cmo.science) + eff(effBoard.cto.science)) / 4;

  const rawAO = (totalBldgLevels - 1) / 170;
  const aoPct = calcAO(totalBldgLevels, effBoard.coo.management, effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management);
  const taxThreshold = calcTaxThreshold(effAccMax);
  const dailyTax = calcDailyTax(dailyProfit, taxThreshold, bankLevel);
  const salesSpeed = calcSalesSpeed(effCommSum);
  const patentProb = calcPatentProb(effSciMax);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Your Board</h2>
        {(['coo', 'cfo', 'cmo', 'cto'] as const).map(role => {
          const data = board[role];
          const labels: Record<string, string> = { coo: 'COO', cfo: 'CFO', cmo: 'CMO', cto: 'CTO' };
          const colors: Record<string, string> = { coo: 'border-l-brand-500', cfo: 'border-l-emerald-500', cmo: 'border-l-amber-500', cto: 'border-l-violet-500' };
          return (
            <div key={role} className={`card p-4 border-l-4 ${colors[role]}`}>
              <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">{labels[role]}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {(["management", "accounting", "communication", "science"] as const).map(f => (
                  <div key={f}>
                    <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block mb-0.5">{f.slice(0, 4)}</label>
                    <input type="number" min={0} max={100} value={data[f]}
                      onChange={e => setState({ ...state, board: { ...state.board, [role]: { ...data, [f]: Number(e.target.value) } } })}
                      className="w-full border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 px-2.5 py-1.5 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-brand-500/20" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Impact Analysis</h2>
        <div className="card p-4 border-l-4 border-l-brand-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">Admin Overhead</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Raw AO</span><span className="font-bold">{(rawAO * 100).toFixed(2)}%</span></div>
            <div className="flex justify-between"><span>Final AO</span><span className="font-bold text-brand-600">{aoPct.toFixed(2)}%</span></div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">Accounting & Tax</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Tax-free Threshold</span><span className="font-bold text-emerald-600">{fmtCurrency(taxThreshold)}</span></div>
            <div className="flex justify-between"><span>Est. Daily Tax</span><span className={`font-bold ${dailyTax > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtCurrency(dailyTax)}</span></div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">Sales Speed</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Sales Speed Bonus</span><span className="font-bold text-amber-600">+{salesSpeed.toFixed(2)}%</span></div>
          </div>
        </div>
        <div className="card p-4 border-l-4 border-l-violet-500">
          <h3 className="text-xs font-bold uppercase mb-3 tracking-wider">R&D Impact</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Patent Probability</span><span className="font-bold text-violet-600">{patentProb.toFixed(2)}%</span></div>
          </div>
        </div>
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
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Invested Capital</label><input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} className="input" /></div>
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Annual Operating Profit</label><input type="number" value={annualProfit} onChange={e => setAnnualProfit(Number(e.target.value))} className="input" /></div>
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">WACC (%)</label><input type="number" min={0} max={50} step={0.5} value={wacc} onChange={e => setWacc(Number(e.target.value))} className="input" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="card p-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Results</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>ROIC</span><span className="font-bold">{fmtPct(eva.roic)}</span></div>
            <div className="flex justify-between"><span>WACC</span><span className="font-bold">{fmtPct(wacc)}</span></div>
            <div className="border-t border-surface-100 dark:border-surface-800 pt-2 mt-2"><div className="flex justify-between"><span>EVA Spread</span><span className={`font-bold ${eva.spread >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{eva.spread >= 0 ? '+' : ''}{fmtPct(eva.spread)}</span></div></div>
            <div className="flex justify-between"><span>Economic Value Added</span><span className={`font-bold ${eva.evaDollar >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCurrency(eva.evaDollar)}</span></div>
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
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Face Value</label><input type="number" value={faceValue} onChange={e => setFaceValue(Number(e.target.value))} className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Coupon Rate (%)</label><input type="number" min={0} max={30} step={0.1} value={couponRate} onChange={e => setCouponRate(Number(e.target.value))} className="input" /></div>
            <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Market Yield (%)</label><input type="number" min={0} max={30} step={0.1} value={marketYield} onChange={e => setMarketYield(Number(e.target.value))} className="input" /></div>
          </div>
          <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-surface-400">Years to Maturity</label><input type="number" min={1} max={30} value={years} onChange={e => setYears(Math.max(1, Math.min(30, Number(e.target.value))))} className="input" /></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="card p-5 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Pricing & Return</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>Bond Price</span><span className={`font-bold ${priceStatus === "premium" ? 'text-amber-600' : priceStatus === "discount" ? 'text-emerald-600' : ''}`}>{fmtCurrency(bondPrice)} ({priceStatus})</span></div>
            <div className="flex justify-between"><span>Annual Coupon</span><span className="font-bold">{fmtCurrency(annualIncome)}</span></div>
            <div className="flex justify-between"><span>Effective Yield</span><span className="font-bold">{fmtPct(effectiveYield)}</span></div>
            <div className="border-t border-surface-100 dark:border-surface-800 pt-2 mt-2"><div className="flex justify-between"><span>{years}-Year Total Return</span><span className="font-bold text-brand-600">{fmtCurrency(totalReturn)}</span></div></div>
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