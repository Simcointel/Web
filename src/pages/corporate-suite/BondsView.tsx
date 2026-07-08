import { useState, useMemo } from "react";
import { Landmark, TrendingDown, TrendingUp } from "lucide-react";

function fmt$(n: number): string { return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`; }

export function BondsView() {
  const [faceValue, setFaceValue] = useState(1_000_000);
  const [couponRate, setCouponRate] = useState(7);
  const [marketYield, setMarketYield] = useState(9);
  const [years, setYears] = useState(5);
  const [bankLoanRate, setBankLoanRate] = useState(8);

  const { bondPrice, annualIncome, effectiveYield, totalCoupons, totalReturn, yieldToMaturity } = useMemo(() => {
    const coupon = faceValue * (couponRate / 100);
    const y = marketYield / 100;
    let pv = 0;
    for (let t = 1; t <= years; t++) pv += coupon / Math.pow(1 + y, t);
    pv += faceValue / Math.pow(1 + y, years);

    const effectiveY = pv > 0 ? (coupon / pv) * 100 : 0;

    // YTM approximation
    const totalCouponsVal = coupon * years;
    const gainLoss = faceValue - pv;
    const avgAnnualReturn = (totalCouponsVal + gainLoss) / years;
    const avgInvestment = (pv + faceValue) / 2;
    const ytm = avgInvestment > 0 ? (avgAnnualReturn / avgInvestment) * 100 : 0;

    return {
      bondPrice: pv,
      annualIncome: coupon,
      effectiveYield: effectiveY,
      totalCoupons: totalCouponsVal,
      totalReturn: totalCouponsVal + gainLoss,
      yieldToMaturity: ytm,
    };
  }, [faceValue, couponRate, marketYield, years]);

  const bondCheaper = effectiveYield > bankLoanRate;
  const savings = bondCheaper ? effectiveYield - bankLoanRate : bankLoanRate - effectiveYield;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
        <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Issue Parameters</h2>
        <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Face Value</label><input type="number" min={0} value={faceValue} onChange={e => setFaceValue(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Coupon Rate (%) <span className="text-[9px] font-normal text-surface-400">(0.5–2.0 in-game)</span></label><input type="number" min={0} max={30} step={0.1} value={couponRate} onChange={e => setCouponRate(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
          <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Market Yield (%) <span className="text-[9px] font-normal text-surface-400">(0.5–2.0 in-game)</span></label><input type="number" min={0} max={30} step={0.1} value={marketYield} onChange={e => setMarketYield(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Maturity (years)</label><input type="number" min={1} max={30} value={years} onChange={e => setYears(Math.max(1, Math.min(30, Number(e.target.value))))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
          <div><label className="text-[10px] font-bold uppercase text-surface-400 block mb-1">Bank Loan Rate (%)</label><input type="number" min={0} max={30} step={0.5} value={bankLoanRate} onChange={e => setBankLoanRate(Number(e.target.value))} className="w-full border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 rounded text-sm font-bold outline-none" /></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-3">
          <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Cost of Capital Comparison</h2>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Bond Price</span><span className={`text-sm font-bold ${bondPrice > faceValue ? "text-amber-600" : bondPrice < faceValue ? "text-emerald-600" : ""}`}>{fmt$(bondPrice)} {bondPrice > faceValue ? "(premium)" : bondPrice < faceValue ? "(discount)" : "(par)"}</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Annual Coupon</span><span className="text-sm font-bold">{fmt$(annualIncome)}</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Effective Yield</span><span className="text-sm font-bold">{effectiveYield.toFixed(2)}%</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Yield to Maturity</span><span className="text-sm font-bold">{yieldToMaturity.toFixed(2)}%</span></div>
          <div className="border-t pt-2">
            <div className="flex justify-between"><span className="text-xs text-surface-500">Bank Loan Rate</span><span className="text-sm font-bold">{bankLoanRate}%</span></div>
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg text-xs font-bold" style={{ backgroundColor: bondCheaper ? "#ecfdf5" : "#fef2f2", color: bondCheaper ? "#059669" : "#dc2626" }}>
              {bondCheaper ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              Bonds are {bondCheaper ? `${savings.toFixed(1)}% cheaper` : `${savings.toFixed(1)}% more expensive`} than bank loans
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-xl p-4 space-y-2">
          <h2 className="text-[10px] font-bold uppercase text-surface-400 tracking-wider">Total Return ({years}y)</h2>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Coupon Income ({years}×{fmt$(annualIncome)})</span><span className="text-sm font-bold">{fmt$(totalCoupons)}</span></div>
          <div className="flex justify-between"><span className="text-xs text-surface-500">Capital Gain/Loss</span><span className={`text-sm font-bold ${faceValue - bondPrice >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt$(faceValue - bondPrice)}</span></div>
          <div className="flex justify-between border-t pt-2"><span className="text-xs font-bold">Total Bondholder Return</span><span className="text-lg font-bold text-brand-600">{fmt$(totalReturn)}</span></div>
        </div>
      </div>
    </div>
  );
}
