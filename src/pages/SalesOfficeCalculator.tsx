import { useState, useMemo } from "react";
import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtCurrency, fmtPct } from "../utils/formatters";
import { Calculator, Plus, Trash2, Copy, ArrowLeftRight } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  sourcingCost: number;
  quality: number;
}

interface Contract {
  id: number;
  name: string;
  items: OrderItem[];
  qualityBonus: number;
  wages: number;
  adminOverhead: number;
}

const QUALITIES = Array.from({ length: 13 }, (_, i) => i);

function createItem(id: number): OrderItem {
  return { id, name: "", quantity: 1, unitPrice: 0, sourcingCost: 0, quality: 2 };
}

function createContract(id: number, name = ""): Contract {
  return {
    id,
    name,
    items: [
      { ...createItem(1), name: "Sub-orbital rocket", quantity: 3, unitPrice: 109283 },
      { ...createItem(2), name: "Single engine plane", quantity: 4, unitPrice: 37888 },
    ],
    qualityBonus: 2.23,
    wages: 37217,
    adminOverhead: 0,
  };
}

function calcContract(contract: Contract) {
  const totalRevenue = contract.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalSourcing = contract.items.reduce((s, i) => s + i.quantity * i.sourcingCost, 0);
  const bonusAmount = contract.items
    .filter(i => i.quality >= 2)
    .reduce((s, i) => s + i.quantity * i.unitPrice * (contract.qualityBonus / 100), 0);
  const totalWithBonus = totalRevenue + bonusAmount;
  const overheadCost = contract.wages * (contract.adminOverhead / 100);
  const totalCosts = totalSourcing + contract.wages + overheadCost;
  const netProfit = totalWithBonus - totalCosts;
  const marginPct = totalWithBonus > 0 ? (netProfit / totalWithBonus) * 100 : 0;
  const totalQty = contract.items.reduce((s, i) => s + i.quantity, 0);
  return { totalRevenue, totalSourcing, bonusAmount, totalWithBonus, overheadCost, totalCosts, netProfit, marginPct, totalQty };
}

export function SalesOfficeCalculatorPage() {
  usePageTitleKey('salesOffice');

  const [contracts, setContracts] = useState<Contract[]>([createContract(1, "Contract A")]);
  const [compareMode, setCompareMode] = useState(false);

  const results = useMemo(() => contracts.map(c => ({ contract: c, result: calcContract(c) })), [contracts]);

  const addContract = () => {
    const id = Math.max(...contracts.map(c => c.id), 0) + 1;
    setContracts([...contracts, createContract(id, `Contract ${String.fromCharCode(64 + id)}`)]);
  };

  const removeContract = (id: number) => {
    if (contracts.length <= 1) return;
    setContracts(contracts.filter(c => c.id !== id));
  };

  const duplicateContract = (id: number) => {
    const source = contracts.find(c => c.id === id);
    if (!source) return;
    const newId = Math.max(...contracts.map(c => c.id), 0) + 1;
    setContracts([...contracts, { ...source, id: newId, name: source.name + " (copy)", items: source.items.map(i => ({ ...i, id: Date.now() + Math.random() })) }]);
  };

  const updateContract = (id: number, field: keyof Contract, value: string | number) => {
    setContracts(contracts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateItem = (contractId: number, itemId: number, field: keyof OrderItem, value: string | number) => {
    setContracts(contracts.map(c => c.id !== contractId ? c : {
      ...c,
      items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i),
    }));
  };

  const addItem = (contractId: number) => {
    setContracts(contracts.map(c => c.id !== contractId ? c : {
      ...c,
      items: [...c.items, createItem(Date.now() + Math.random())],
    }));
  };

  const removeItem = (contractId: number, itemId: number) => {
    setContracts(contracts.map(c => c.id !== contractId ? c : {
      ...c,
      items: c.items.filter(i => i.id !== itemId),
    }));
  };

  const bestContract = results.length > 1 ? results.reduce((best, r) => r.result.netProfit > best.result.netProfit ? r : best) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
      <PageHeader
        title="Sales Office Calculator"
        subtitle="Contract profitability analysis with quality bonus and sourcing costs"
        icon={<Calculator size={18} />}
        iconBg="bg-violet-100 dark:bg-violet-900/30"
        iconColor="text-violet-600"
      />

      <div className="flex items-center gap-3">
        <button onClick={addContract} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors">
          <Plus size={14} /> Add Contract
        </button>
        {contracts.length > 1 && (
          <button onClick={() => setCompareMode(!compareMode)} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${compareMode ? 'bg-violet-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
            <ArrowLeftRight size={14} /> {compareMode ? 'Hide Comparison' : 'Compare Contracts'}
          </button>
        )}
      </div>

      {compareMode && contracts.length > 1 && (
        <div className="card p-5 overflow-x-auto">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-4">Contract Comparison</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] font-bold uppercase text-surface-400 tracking-wider border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-2 pr-4">Metric</th>
                {results.map(r => (
                  <th key={r.contract.id} className="text-right py-2 px-3">{r.contract.name || `Contract ${r.contract.id}`}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Revenue</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold text-emerald-600">{fmtCurrency(r.result.totalRevenue)}</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Bonus</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold text-violet-600">+{fmtCurrency(r.result.bonusAmount)}</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Total w/ Bonus</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold">{fmtCurrency(r.result.totalWithBonus)}</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Sourcing Cost</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold text-rose-500">-{fmtCurrency(r.result.totalSourcing)}</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Wages</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold text-rose-500">-{fmtCurrency(r.contract.wages)}</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Overhead</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold text-rose-500">-{fmtCurrency(r.result.overheadCost)}</td>)}
              </tr>
              <tr className="border-t-2 border-surface-200 dark:border-surface-700">
                <td className="py-3 pr-4 font-black uppercase text-surface-600 dark:text-surface-300">Net Profit</td>
                {results.map(r => (
                  <td key={r.contract.id} className={`text-right py-3 px-3 text-lg font-black ${r.result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${bestContract?.contract.id === r.contract.id ? 'bg-emerald-50 dark:bg-emerald-900/20 rounded' : ''}`}>
                    {fmtCurrency(r.result.netProfit)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Margin</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3 font-bold">{fmtPct(r.result.marginPct)}</td>)}
              </tr>
              <tr>
                <td className="py-2 pr-4 font-bold text-surface-500">Items</td>
                {results.map(r => <td key={r.contract.id} className="text-right py-2 px-3">{r.result.totalQty}</td>)}
              </tr>
            </tbody>
          </table>
          {bestContract && (
            <p className="text-xs text-emerald-600 font-bold mt-3">
              Best: {bestContract.contract.name || `Contract ${bestContract.contract.id}`} — {fmtCurrency(bestContract.result.netProfit)} profit
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {contracts.map(contract => {
          const r = results.find(x => x.contract.id === contract.id)!;
          return (
            <div key={contract.id} className="space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={contract.name}
                    onChange={e => updateContract(contract.id, 'name', e.target.value)}
                    placeholder="Contract name"
                    className="text-xs font-bold border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-brand-500/20 w-40"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => duplicateContract(contract.id)} className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-surface-50 dark:hover:bg-surface-800 rounded transition-colors" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    {contracts.length > 1 && (
                      <button onClick={() => removeContract(contract.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[9px] font-bold uppercase text-surface-400 tracking-wider">
                    <div className="col-span-3">Item</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-2 text-center">Quality</div>
                    <div className="col-span-3 text-right">Unit Price</div>
                    <div className="col-span-3 text-right">Sourcing</div>
                  </div>
                  {contract.items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <input type="text" value={item.name} onChange={e => updateItem(contract.id, item.id, 'name', e.target.value)} placeholder="Item name"
                          className="w-full text-xs border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20" />
                      </div>
                      <div className="col-span-1">
                        <input type="number" min={1} value={item.quantity} onChange={e => updateItem(contract.id, item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                          className="w-full text-xs text-right border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20" />
                      </div>
                      <div className="col-span-2">
                        <select value={item.quality} onChange={e => updateItem(contract.id, item.id, 'quality', Number(e.target.value))}
                          className="w-full text-xs text-center border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-1 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20">
                          {QUALITIES.map(q => <option key={q} value={q}>Q{q}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={e => updateItem(contract.id, item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs text-right border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20" />
                      </div>
                      <div className="col-span-3 flex gap-1">
                        <input type="number" min={0} step="0.01" value={item.sourcingCost} onChange={e => updateItem(contract.id, item.id, 'sourcingCost', Math.max(0, Number(e.target.value)))}
                          placeholder="Cost" className="w-full text-xs text-right border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20" />
                        <button onClick={() => removeItem(contract.id, item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => addItem(contract.id)} className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="card p-5 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Terms</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Quality Bonus %</label>
                    <input type="number" min={0} max={100} step="0.01" value={contract.qualityBonus}
                      onChange={e => updateContract(contract.id, 'qualityBonus', Math.max(0, Math.min(100, Number(e.target.value))))} className="input" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Wages ($)</label>
                    <input type="number" min={0} step="1" value={contract.wages}
                      onChange={e => updateContract(contract.id, 'wages', Math.max(0, Number(e.target.value)))} className="input" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Admin Overhead %</label>
                    <input type="number" min={0} max={100} step="0.01" value={contract.adminOverhead}
                      onChange={e => updateContract(contract.id, 'adminOverhead', Math.max(0, Math.min(100, Number(e.target.value))))} className="input" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 border-l-4 border-emerald-500">
                  <span className="metric-label">Revenue</span>
                  <span className="metric-value">{fmtCurrency(r.result.totalRevenue)}</span>
                </div>
                <div className="card p-3 border-l-4 border-violet-500">
                  <span className="metric-label">Bonus ({fmtPct(contract.qualityBonus)})</span>
                  <span className="metric-value text-violet-600">+{fmtCurrency(r.result.bonusAmount)}</span>
                </div>
                <div className="card p-3 border-l-4 border-blue-500">
                  <span className="metric-label">Total w/ Bonus</span>
                  <span className="metric-value">{fmtCurrency(r.result.totalWithBonus)}</span>
                </div>
                <div className="card p-3 border-l-4 border-rose-500">
                  <span className="metric-label">Total Costs</span>
                  <span className="metric-value text-rose-600">-{fmtCurrency(r.result.totalCosts)}</span>
                </div>
              </div>

              <div className={`card p-5 border-l-4 ${r.result.netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                <span className="metric-label">Net Profit</span>
                <span className={`text-2xl font-black ${r.result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtCurrency(r.result.netProfit)}
                </span>
                <span className={`text-sm font-bold ${r.result.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtPct(r.result.marginPct)} margin
                </span>
              </div>

              <div className="card p-4">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-surface-500 mb-3">Per-Item Profit</h3>
                <div className="space-y-2">
                  {contract.items.filter(i => i.name).map(item => {
                    const itemRevenue = item.quantity * item.unitPrice;
                    const itemBonus = item.quality >= 2 ? itemRevenue * (contract.qualityBonus / 100) : 0;
                    const itemSourcing = item.quantity * item.sourcingCost;
                    const itemWages = contract.wages / contract.items.reduce((s, i) => s + i.quantity, 0) * item.quantity;
                    const itemOverhead = itemWages * (contract.adminOverhead / 100);
                    const itemProfit = itemRevenue + itemBonus - itemSourcing - itemWages - itemOverhead;
                    return (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-surface-600 dark:text-surface-400 truncate mr-2">{item.name} <span className="text-surface-400">Q{item.quality}</span></span>
                        <span className={`font-bold ${itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCurrency(itemProfit)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
