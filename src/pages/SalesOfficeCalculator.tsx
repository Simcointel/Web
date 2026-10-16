import { useState, useMemo } from "react";
import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtCurrency, fmtPct } from "../utils/formatters";
import { Calculator, Plus, Trash2, Copy, ArrowLeftRight, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";

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

function NumberInput({ value, onChange, min = 0, max, step = 1, prefix = "", className = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; prefix?: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(Math.min(max ?? Infinity, Math.max(min, Number(e.target.value))))}
        className={`w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
      />
    </div>
  );
}

function ContractPanel({ contract, result, isBest, onUpdate, onUpdateItem, onAddItem, onRemoveItem, onRemove, onDuplicate }: {
  contract: Contract;
  result: ReturnType<typeof calcContract>;
  isBest: boolean;
  onUpdate: (field: keyof Contract, value: string | number) => void;
  onUpdateItem: (itemId: number, field: keyof OrderItem, value: string | number) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: number) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`card overflow-hidden transition-all ${isBest ? 'ring-2 ring-emerald-500/50' : ''}`}>
      {/* Contract Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={contract.name}
            onChange={e => onUpdate('name', e.target.value)}
            placeholder="Contract name"
            className="text-sm font-bold bg-transparent border-none outline-none text-surface-800 dark:text-surface-200 placeholder:text-surface-400 w-40"
          />
          {isBest && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Best
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} className="p-2 text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors" title="Duplicate">
            <Copy size={16} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onRemove} className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-6">
          {/* Items Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Order Items</h3>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-900 rounded-lg text-[10px] font-bold uppercase tracking-wider text-surface-400">
                <div className="col-span-4">Item</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Quality</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Sourcing</div>
                <div className="col-span-1"></div>
              </div>
              {/* Rows */}
              {contract.items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => onUpdateItem(item.id, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => onUpdateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg px-2 py-2.5 text-sm text-center font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={item.quality}
                      onChange={e => onUpdateItem(item.id, 'quality', Number(e.target.value))}
                      className="w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg px-2 py-2.5 text-sm text-center font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    >
                      {QUALITIES.map(q => <option key={q} value={q}>Q{q}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <NumberInput value={item.unitPrice} onChange={v => onUpdateItem(item.id, 'unitPrice', v)} step={0.01} prefix="$" />
                  </div>
                  <div className="col-span-2">
                    <NumberInput value={item.sourcingCost} onChange={v => onUpdateItem(item.id, 'sourcingCost', v)} step={0.01} prefix="$" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => onRemoveItem(item.id)} className="p-2 text-surface-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={onAddItem} className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Terms */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Contract Terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Quality Bonus %</label>
                <NumberInput value={contract.qualityBonus} onChange={v => onUpdate('qualityBonus', v)} min={0} max={100} step={0.01} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Wages</label>
                <NumberInput value={contract.wages} onChange={v => onUpdate('wages', v)} step={1} prefix="$" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Admin Overhead %</label>
                <NumberInput value={contract.adminOverhead} onChange={v => onUpdate('adminOverhead', v)} min={0} max={100} step={0.01} />
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Revenue</div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">{fmtCurrency(result.totalRevenue)}</div>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Bonus</div>
                <div className="text-lg font-black text-violet-700 dark:text-violet-300">+{fmtCurrency(result.bonusAmount)}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Total</div>
                <div className="text-lg font-black text-blue-700 dark:text-blue-300">{fmtCurrency(result.totalWithBonus)}</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">Costs</div>
                <div className="text-lg font-black text-rose-700 dark:text-rose-300">-{fmtCurrency(result.totalCosts)}</div>
              </div>
            </div>

            {/* Net Profit */}
            <div className={`mt-3 rounded-xl p-5 ${result.netProfit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Net Profit</div>
                  <div className="text-3xl font-black text-white">{fmtCurrency(result.netProfit)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Margin</div>
                  <div className="text-2xl font-black text-white">{fmtPct(result.marginPct)}</div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mt-3 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Cost Breakdown</span>
              </div>
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Base Revenue</span>
                  <span className="text-sm font-bold text-emerald-600">+{fmtCurrency(result.totalRevenue)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Quality Bonus</span>
                  <span className="text-sm font-bold text-violet-600">+{fmtCurrency(result.bonusAmount)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Sourcing Cost</span>
                  <span className="text-sm font-bold text-rose-500">-{fmtCurrency(result.totalSourcing)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Wages</span>
                  <span className="text-sm font-bold text-rose-500">-{fmtCurrency(contract.wages)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-surface-600 dark:text-surface-400">Admin Overhead ({fmtPct(contract.adminOverhead)})</span>
                  <span className="text-sm font-bold text-rose-500">-{fmtCurrency(result.overheadCost)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-surface-50 dark:bg-surface-900">
                  <span className="text-sm font-bold uppercase text-surface-700 dark:text-surface-300">Net Profit</span>
                  <span className={`text-sm font-black ${result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCurrency(result.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Per-Item Profit */}
            <div className="mt-3 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
              <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Per-Item Profit</span>
              </div>
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {contract.items.filter(i => i.name).map(item => {
                  const itemRevenue = item.quantity * item.unitPrice;
                  const itemBonus = item.quality >= 2 ? itemRevenue * (contract.qualityBonus / 100) : 0;
                  const itemSourcing = item.quantity * item.sourcingCost;
                  const itemWages = contract.wages / contract.items.reduce((s, i) => s + i.quantity, 0) * item.quantity;
                  const itemOverhead = itemWages * (contract.adminOverhead / 100);
                  const itemProfit = itemRevenue + itemBonus - itemSourcing - itemWages - itemOverhead;
                  return (
                    <div key={item.id} className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{item.name}</span>
                        <span className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 rounded text-[10px] font-bold text-surface-500">Q{item.quality}</span>
                        {item.quality < 2 && (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-[10px] font-bold text-amber-600">No bonus</span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCurrency(itemProfit)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
    <div className="max-w-4xl mx-auto space-y-5 animate-slide-up">
      <PageHeader
        title="Sales Office Calculator"
        subtitle="Contract profitability analysis with quality bonus and sourcing costs"
        icon={<Calculator size={18} />}
        iconBg="bg-violet-100 dark:bg-violet-900/30"
        iconColor="text-violet-600"
      />

      <div className="flex items-center gap-3">
        <button onClick={addContract} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Contract
        </button>
        {contracts.length > 1 && (
          <button onClick={() => setCompareMode(!compareMode)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${compareMode ? 'bg-violet-600 text-white shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
            <ArrowLeftRight size={16} /> {compareMode ? 'Hide Comparison' : 'Compare Contracts'}
          </button>
        )}
      </div>

      {compareMode && contracts.length > 1 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-surface-500">Contract Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider text-surface-400">Metric</th>
                  {results.map(r => (
                    <th key={r.contract.id} className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-surface-400">
                      {r.contract.name || `Contract ${r.contract.id}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Revenue</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold text-emerald-600">{fmtCurrency(r.result.totalRevenue)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Bonus</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold text-violet-600">+{fmtCurrency(r.result.bonusAmount)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Total w/ Bonus</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold">{fmtCurrency(r.result.totalWithBonus)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Sourcing Cost</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold text-rose-500">-{fmtCurrency(r.result.totalSourcing)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Wages</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold text-rose-500">-{fmtCurrency(r.contract.wages)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Overhead</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold text-rose-500">-{fmtCurrency(r.result.overheadCost)}</td>)}
                </tr>
                <tr className="bg-surface-50 dark:bg-surface-900">
                  <td className="py-4 px-5 text-sm font-black uppercase text-surface-700 dark:text-surface-300">Net Profit</td>
                  {results.map(r => (
                    <td key={r.contract.id} className={`text-right py-4 px-4 text-lg font-black ${r.result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${bestContract?.contract.id === r.contract.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                      {fmtCurrency(r.result.netProfit)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Margin</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm font-bold">{fmtPct(r.result.marginPct)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Items</td>
                  {results.map(r => <td key={r.contract.id} className="text-right py-3 px-4 text-sm">{r.result.totalQty}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          {bestContract && (
            <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Best: {bestContract.contract.name || `Contract ${bestContract.contract.id}`} — {fmtCurrency(bestContract.result.netProfit)} profit
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-5">
        {contracts.map(contract => {
          const r = results.find(x => x.contract.id === contract.id)!;
          return (
            <ContractPanel
              key={contract.id}
              contract={contract}
              result={r.result}
              isBest={bestContract?.contract.id === contract.id}
              onUpdate={(field, value) => updateContract(contract.id, field, value)}
              onUpdateItem={(itemId, field, value) => updateItem(contract.id, itemId, field, value)}
              onAddItem={() => addItem(contract.id)}
              onRemoveItem={(itemId) => removeItem(contract.id, itemId)}
              onRemove={() => removeContract(contract.id)}
              onDuplicate={() => duplicateContract(contract.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
