import { useState } from "react";
import { CheckCircle2, Download, TrendingUp, BarChart3, FileText, DollarSign, ShoppingCart, Package } from "lucide-react";
import { Section } from "../../components/Layout";
import { n } from "./types";

export function WorkstationTab({ active, onClick, label, icon: Icon, color }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${active ? `${color} text-white shadow-sm` : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'}`}>
       <Icon size={16} /> {label}
    </button>
  );
}

export function GlobalMetric({ label, value }: any) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] font-bold uppercase text-surface-400 leading-none mb-1">{label}</span>
       <span className="text-lg font-bold tabular-nums leading-none">{value}</span>
    </div>
  );
}

export function KPICard({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="card p-6 flex flex-col items-center text-center !shadow-none border-surface-200 dark:border-surface-800 group">
       <div className="w-12 h-12 bg-surface-50 dark:bg-surface-900 rounded-xl flex items-center justify-center text-brand-600 mb-4 group-hover:scale-105 transition-transform">
          <Icon size={24} />
       </div>
       <span className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">{label}</span>
       <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
       <p className="text-xs font-medium text-surface-500 mt-2 truncate w-full">{sub}</p>
    </div>
  );
}

export function SkillNode({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className={`card p-6 flex flex-col items-center text-center border-t-4 border-current shadow-sm ${color}`}>
       <div className="flex items-center gap-2 mb-3">
          <Icon size={18} />
          <span className="text-sm font-bold uppercase tracking-wide text-surface-900 dark:text-white">{label}</span>
       </div>
       <span className="text-3xl font-bold text-surface-900 dark:text-white tabular-nums leading-none">{value}</span>
       <span className="text-xs font-semibold uppercase opacity-40 mt-3 tracking-wide">{sub}</span>
    </div>
  );
}

export function ExecCard({ role, data, onChange, isApp }: any) {
  return (
    <div className={`card p-6 space-y-6 border-l-4 !shadow-none border-surface-200 dark:border-surface-800 transition-all ${isApp ? 'border-l-surface-300 dark:border-l-surface-600 opacity-80' : 'border-l-brand-600'}`}>
       <div className="flex items-center justify-between">
          <span className={`text-sm font-bold uppercase tracking-wide ${isApp ? 'text-surface-500' : 'text-brand-600'}`}>{role}</span>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <SkillLineSmall label="Management" val={data.management} onChange={(v: any) => onChange({...data, management: v})} />
          <SkillLineSmall label="Accounting" val={data.accounting} onChange={(v: any) => onChange({...data, accounting: v})} />
          <SkillLineSmall label="Communication" val={data.communication} onChange={(v: any) => onChange({...data, communication: v})} />
          <SkillLineSmall label="Science" val={data.science} onChange={(v: any) => onChange({...data, science: v})} />
       </div>
    </div>
  );
}

function SkillLineSmall({ label, val, onChange }: any) {
  return (
    <div className="flex flex-col bg-surface-50 dark:bg-surface-900 px-4 py-3 rounded-lg border border-surface-100 dark:border-surface-800">
       <span className="text-[10px] font-bold text-surface-400 uppercase mb-1">{label}</span>
       <input type="number" value={val} onChange={(e) => onChange(Number(e.target.value))} className="bg-transparent border-none p-0 text-lg font-bold outline-none tabular-nums" />
    </div>
  );
}

export function ForecastLine({ label, value, red, green }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-surface-50 dark:border-surface-800 last:border-0">
       <span className="text-[11px] font-black uppercase text-surface-500 italic tracking-tight">{label}</span>
       <span className={`text-base font-black tabular-nums italic ${red ? 'text-red-600' : green ? 'text-emerald-500' : 'text-surface-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

export function CheckItem({ label, active, light }: any) {
  return (
    <div className="flex items-center gap-5 py-2">
       <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${active ? 'bg-emerald-500 border-emerald-500 shadow-lg' : 'border-white/20 bg-white/5'}`}>
          {active && <CheckCircle2 size={14} className="text-white" />}
       </div>
       <span className={`text-[12px] font-black uppercase italic tracking-widest ${active ? (light ? 'text-white' : 'text-surface-900') : 'text-white/20'}`}>{label}</span>
    </div>
  );
}

export function LedgerView({ state }: any) {
  const ledger = state?.ledger ?? [];
  const meta = state?.ledgerMeta as { type: string; header: string[] } | undefined;
  const [sortCol, setSortCol] = useState(-1);
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (i: number) => {
    if (sortCol === i) setSortAsc(!sortAsc);
    else { setSortCol(i); setSortAsc(false); }
  };

  const sorted = sortCol >= 0 ? [...ledger].sort((a, b) => {
    const va = parseFloat(a[sortCol]) || a[sortCol] || "";
    const vb = parseFloat(b[sortCol]) || b[sortCol] || "";
    if (typeof va === "number" && typeof vb === "number") return sortAsc ? va - vb : vb - va;
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  }) : ledger;

  const renderTable = (rows: string[][], headers: string[]) => (
    <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-surface-50 dark:bg-surface-900">
          <tr className="border-b border-surface-100 dark:border-surface-800">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 font-bold uppercase tracking-wider cursor-pointer hover:text-brand-600" onClick={() => toggleSort(i)}>
                {h} {sortCol === i ? (sortAsc ? "↑" : "↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-surface-50 dark:hover:bg-surface-900">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-3 py-1.5 ${!isNaN(Number(cell)) ? 'text-right font-mono tabular-nums' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSummary = () => {
    if (!meta || !ledger.length) return null;
    const rows = ledger as string[][];
    const h = meta.header;
    if (meta.type === 'income') {
      const salesIdx = h.indexOf('Sales');
      const netIdx = h.indexOf('NetIncome');
      const totalSales = rows.reduce((s, r) => s + (parseFloat(r[salesIdx]) || 0), 0);
      const totalNet = rows.reduce((s, r) => s + (parseFloat(r[netIdx]) || 0), 0);
      return (
        <div className="space-y-2">
          <div className="flex justify-between"><span>Total Sales</span><span className="font-bold text-emerald-600">${(totalSales/1e6).toFixed(2)}M</span></div>
          <div className="flex justify-between"><span>Total Net Income</span><span className={`font-bold ${totalNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${(totalNet/1e6).toFixed(2)}M</span></div>
          <div className="flex justify-between"><span>Margin</span><span className="font-bold">{totalSales ? ((totalNet/totalSales)*100).toFixed(1) : '0'}%</span></div>
          <div className="flex justify-between"><span>Entries</span><span className="font-bold">{rows.length}</span></div>
        </div>
      );
    }
    if (meta.type === 'balance') {
      const cashIdx = h.indexOf('Cash');
      const buildingsIdx = h.indexOf('Buildings');
      const patentsIdx = h.indexOf('Patents');
      const liabilitiesIdx = h.indexOf('Liabilities');
      const retainedIdx = h.indexOf('Retained Earnings');
      const last = rows[rows.length - 1];
      return (
        <div className="space-y-2">
          <div className="flex justify-between"><span>Cash</span><span className="font-bold">${(parseFloat(last[cashIdx])/1e6).toFixed(2) || 'N/A'}M</span></div>
          <div className="flex justify-between"><span>Buildings</span><span className="font-bold">{last[buildingsIdx] || 'N/A'}</span></div>
          <div className="flex justify-between"><span>Patents</span><span className="font-bold">{last[patentsIdx] || 'N/A'}</span></div>
          <div className="flex justify-between"><span>Liabilities</span><span className="font-bold text-rose-600">${(parseFloat(last[liabilitiesIdx])/1e6).toFixed(2) || 'N/A'}M</span></div>
          <div className="flex justify-between border-t pt-2"><span>Equity</span><span className="font-bold text-emerald-600">{last[retainedIdx] || 'N/A'}</span></div>
        </div>
      );
    }
    return null;
  };

  if (!ledger.length) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
         <div className="md:col-span-8">
            <Section title="LEDGER_STREAM" icon={BarChart3} color="text-teal-500">
               <div className="card h-[60vh] flex flex-col items-center justify-center border-dashed opacity-20">
                  <Download size={40} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Game CSV to populate</p>
               </div>
            </Section>
         </div>
         <div className="md:col-span-4 space-y-3">
            <Section title="STAT_EXTRACT" icon={TrendingUp} color="text-teal-500">
               <div className="card p-4 border-l-2 border-teal-500">
                  <span className="text-[9px] font-black text-surface-400 block mb-2 uppercase">EST_DAILY_PROFIT</span>
                  <span className="text-2xl font-black italic tracking-tighter text-teal-600">$${(n(state.settings?.estDailyProfit)/1000).toFixed(1)}K</span>
               </div>
            </Section>
         </div>
      </div>
    );
  }

  const header = meta?.header ?? [];
  const IconComponent = meta?.type === 'income' ? DollarSign
    : meta?.type === 'balance' ? FileText
    : meta?.type === 'cashflow' ? ShoppingCart
    : meta?.type === 'warehouse' ? Package
    : BarChart3;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
       <div className="md:col-span-8">
          <Section title={`LEDGER: ${meta?.type?.toUpperCase() ?? 'DATA'}`} icon={IconComponent} color="text-teal-500">
             <div className="card border-surface-200 dark:border-surface-800 p-0">
                {renderTable(sorted, header)}
             </div>
          </Section>
       </div>
       <div className="md:col-span-4 space-y-3">
          <Section title="STAT_EXTRACT" icon={TrendingUp} color="text-teal-500">
             <div className="card p-4 border-l-2 border-teal-500">
                <span className="text-[9px] font-black text-surface-400 block mb-2 uppercase">EST_DAILY_PROFIT</span>
                <span className="text-2xl font-black italic tracking-tighter text-teal-600">$${(n(state.settings?.estDailyProfit)/1000).toFixed(1)}K</span>
             </div>
          </Section>
          <Section title="SUMMARY" icon={BarChart3} color="text-teal-500">
             <div className="card p-4 border-l-2 border-teal-500">
                {renderSummary()}
             </div>
          </Section>
       </div>
    </div>
  );
}
