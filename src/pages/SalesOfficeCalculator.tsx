import { useState, useMemo, useCallback, useRef } from "react";
import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtCurrency, fmtPct } from "../utils/formatters";
import { Calculator, Plus, Trash2, Copy, ArrowLeftRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

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

interface ContractResult {
  totalRevenue: number;
  totalSourcing: number;
  bonusAmount: number;
  totalWithBonus: number;
  overheadCost: number;
  totalCosts: number;
  netProfit: number;
  marginPct: number;
  totalQty: number;
}

// ─── Constants ───────────────────────────────────────────────

const QUALITIES = Array.from({ length: 13 }, (_, i) => i);
const QUALITY_OPTIONS = QUALITIES.map(q => ({ value: q, label: `Q${q}` }));

const INPUT_CLASS = "w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all";

// ─── Helpers ─────────────────────────────────────────────────

let nextId = 100;
function genId(): number {
  return ++nextId;
}

function createItem(): OrderItem {
  return { id: genId(), name: "", quantity: 1, unitPrice: 0, sourcingCost: 0, quality: 1 };
}

function createContract(name = ""): Contract {
  return {
    id: genId(),
    name,
    items: [
      { ...createItem(), name: "Sub-orbital rocket", quantity: 3, unitPrice: 109283 },
      { ...createItem(), name: "Single engine plane", quantity: 4, unitPrice: 37888 },
    ],
    qualityBonus: 2.23,
    wages: 37217,
    adminOverhead: 0,
  };
}

function calcItemBonus(item: OrderItem, baseRate: number): number {
  return item.quantity * item.unitPrice * (item.quality * baseRate / 100);
}

function calcContract(contract: Contract): ContractResult {
  let totalRevenue = 0;
  let totalSourcing = 0;
  let bonusAmount = 0;
  let totalQty = 0;

  for (const item of contract.items) {
    const itemRevenue = item.quantity * item.unitPrice;
    totalRevenue += itemRevenue;
    totalSourcing += item.quantity * item.sourcingCost;
    bonusAmount += calcItemBonus(item, contract.qualityBonus);
    totalQty += item.quantity;
  }

  const totalWithBonus = totalRevenue + bonusAmount;
  const overheadCost = contract.wages * (contract.adminOverhead / 100);
  const totalCosts = totalSourcing + contract.wages + overheadCost;
  const netProfit = totalWithBonus - totalCosts;
  const marginPct = totalWithBonus > 0 ? (netProfit / totalWithBonus) * 100 : 0;

  return { totalRevenue, totalSourcing, bonusAmount, totalWithBonus, overheadCost, totalCosts, netProfit, marginPct, totalQty };
}

// ─── Shared Components ───────────────────────────────────────

function SummaryCard({ label, value, color, prefix = "" }: {
  label: string; value: string; color: "emerald" | "violet" | "blue" | "rose"; prefix?: string;
}) {
  const colorMap = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300",
  };
  const labelColor = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    violet: "text-violet-600 dark:text-violet-400",
    blue: "text-blue-600 dark:text-blue-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${labelColor[color]} mb-1`}>{label}</div>
      <div className="text-lg font-black">{prefix}{value}</div>
    </div>
  );
}

function BreakdownRow({ label, value, valueColor, bold = false }: {
  label: string; value: string; valueColor: string; bold?: boolean;
}) {
  return (
    <div className={`flex justify-between px-4 py-3 ${bold ? "bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700" : ""}`}>
      <span className={`text-sm ${bold ? "font-bold uppercase text-surface-700 dark:text-surface-300" : "font-medium text-surface-600 dark:text-surface-400"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-black" : "font-bold"} ${valueColor}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
      <span className="text-xs font-bold uppercase tracking-wider text-surface-500">{title}</span>
    </div>
  );
}

function ItemRow({ item, onUpdate, onRemove }: {
  item: OrderItem;
  onUpdate: (field: keyof OrderItem, value: string | number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-3">
        <input type="text" value={item.name} onChange={e => onUpdate("name", e.target.value)} placeholder="Item name"
          className={INPUT_CLASS} />
      </div>
      <div className="col-span-1">
        <input type="number" min={1} value={item.quantity} onChange={e => onUpdate("quantity", Math.max(1, Number(e.target.value)))}
          className={`${INPUT_CLASS} text-center`} />
      </div>
      <div className="col-span-2">
        <select value={item.quality} onChange={e => onUpdate("quality", Number(e.target.value))}
          className={`${INPUT_CLASS} text-center`}>
          {QUALITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="col-span-3">
        <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={e => onUpdate("unitPrice", Math.max(0, Number(e.target.value)))}
          className={`${INPUT_CLASS} text-right`} />
      </div>
      <div className="col-span-3 flex gap-1">
        <input type="number" min={0} step="0.01" value={item.sourcingCost} onChange={e => onUpdate("sourcingCost", Math.max(0, Number(e.target.value)))}
          placeholder="Cost" className={`${INPUT_CLASS} text-right`} />
        <button onClick={onRemove} className="p-2 text-surface-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Contract Panel ──────────────────────────────────────────

function ContractPanel({ contract, result, isBest, onUpdate, onUpdateItem, onAddItem, onRemoveItem, onRemove, onDuplicate }: {
  contract: Contract;
  result: ContractResult;
  isBest: boolean;
  onUpdate: (field: keyof Contract, value: string | number) => void;
  onUpdateItem: (itemId: number, field: keyof OrderItem, value: string | number) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: number) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const namedItems = useMemo(() => contract.items.filter(i => i.name), [contract.items]);

  return (
    <div className={`card overflow-hidden transition-all ${isBest ? "ring-2 ring-emerald-500/50" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <input type="text" value={contract.name} onChange={e => onUpdate("name", e.target.value)}
            placeholder="Contract name"
            className="text-sm font-bold bg-transparent border-none outline-none text-surface-800 dark:text-surface-200 placeholder:text-surface-400 w-40" />
          {isBest && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Best</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} className="p-2 text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors" title="Duplicate">
            <Copy size={16} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
            {expanded ? "▲" : "▼"}
          </button>
          <button onClick={onRemove} className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-6">
          {/* Items */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Order Items</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-900 rounded-lg text-[10px] font-bold uppercase tracking-wider text-surface-400">
                <div className="col-span-3">Item</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Quality</div>
                <div className="col-span-3 text-right">Unit Price</div>
                <div className="col-span-3 text-right">Sourcing</div>
              </div>
              {contract.items.map(item => (
                <ItemRow key={item.id} item={item}
                  onUpdate={(field, value) => onUpdateItem(item.id, field, value)}
                  onRemove={() => onRemoveItem(item.id)} />
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
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Quality Bonus Base Rate %</label>
                <input type="number" min={0} max={100} step={0.01} value={contract.qualityBonus}
                  onChange={e => onUpdate("qualityBonus", Math.min(100, Math.max(0, Number(e.target.value))))}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Wages</label>
                <input type="number" min={0} step={1} value={contract.wages}
                  onChange={e => onUpdate("wages", Math.max(0, Number(e.target.value)))}
                  className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1.5">Admin Overhead %</label>
                <input type="number" min={0} max={100} step={0.01} value={contract.adminOverhead}
                  onChange={e => onUpdate("adminOverhead", Math.min(100, Math.max(0, Number(e.target.value))))}
                  className={INPUT_CLASS} />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Financial Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard label="Revenue" value={fmtCurrency(result.totalRevenue)} color="emerald" />
              <SummaryCard label="Bonus" value={fmtCurrency(result.bonusAmount)} color="violet" prefix="+" />
              <SummaryCard label="Total" value={fmtCurrency(result.totalWithBonus)} color="blue" />
              <SummaryCard label="Costs" value={fmtCurrency(result.totalCosts)} color="rose" prefix="-" />
            </div>
          </div>

          {/* Net Profit Banner */}
          <div className={`rounded-xl p-5 ${result.netProfit >= 0 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-rose-500 to-rose-600"}`}>
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
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <SectionHeader title="Cost Breakdown" />
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              <BreakdownRow label="Base Revenue" value={`+${fmtCurrency(result.totalRevenue)}`} valueColor="text-emerald-600" />
              <BreakdownRow label="Quality Bonus" value={`+${fmtCurrency(result.bonusAmount)}`} valueColor="text-violet-600" />
              <BreakdownRow label="Sourcing Cost" value={`-${fmtCurrency(result.totalSourcing)}`} valueColor="text-rose-500" />
              <BreakdownRow label="Wages" value={`-${fmtCurrency(contract.wages)}`} valueColor="text-rose-500" />
              <BreakdownRow label={`Admin Overhead (${fmtPct(contract.adminOverhead)})`} value={`-${fmtCurrency(result.overheadCost)}`} valueColor="text-rose-500" />
              <BreakdownRow label="Net Profit" value={fmtCurrency(result.netProfit)} valueColor={result.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"} bold />
            </div>
          </div>

          {/* Per-Item Profit */}
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            <SectionHeader title="Per-Item Profit (before wages)" />
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {namedItems.map(item => {
                const itemRevenue = item.quantity * item.unitPrice;
                const itemBonus = calcItemBonus(item, contract.qualityBonus);
                const itemSourcing = item.quantity * item.sourcingCost;
                const itemProfit = itemRevenue + itemBonus - itemSourcing;
                const effectivePct = item.quality * contract.qualityBonus;
                return (
                  <div key={item.id} className="flex justify-between items-center px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{item.name}</span>
                      <span className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 rounded text-[10px] font-bold text-surface-500">Q{item.quality}</span>
                      {item.quality > 1 && (
                        <span className="px-1.5 py-0.5 bg-violet-50 dark:bg-violet-900/30 rounded text-[10px] font-bold text-violet-600">{fmtPct(effectivePct)}</span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${itemProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmtCurrency(itemProfit)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export function SalesOfficeCalculatorPage() {
  usePageTitleKey('salesOffice');

  const [contracts, setContracts] = useState<Contract[]>(() => [createContract("Contract A")]);
  const [compareMode, setCompareMode] = useState(false);

  const results = useMemo(() => contracts.map(c => ({ contract: c, result: calcContract(c) })), [contracts]);

  const bestContract = useMemo(() => {
    if (results.length <= 1) return null;
    return results.reduce((best, r) => r.result.netProfit > best.result.netProfit ? r : best);
  }, [results]);

  const addContract = useCallback(() => {
    setContracts(prev => {
      const id = Math.max(...prev.map(c => c.id), 0) + 1;
      const name = `Contract ${String.fromCharCode(64 + (id % 26 || 26))}${id > 26 ? Math.floor(id / 26) : ""}`;
      return [...prev, createContract(name)];
    });
  }, []);

  const removeContract = useCallback((id: number) => {
    setContracts(prev => prev.length <= 1 ? prev : prev.filter(c => c.id !== id));
  }, []);

  const duplicateContract = useCallback((id: number) => {
    setContracts(prev => {
      const source = prev.find(c => c.id === id);
      if (!source) return prev;
      const newId = Math.max(...prev.map(c => c.id), 0) + 1;
      return [...prev, { ...source, id: newId, name: source.name + " (copy)", items: source.items.map(i => ({ ...i, id: genId() })) }];
    });
  }, []);

  const updateContract = useCallback((id: number, field: keyof Contract, value: string | number) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const updateItem = useCallback((contractId: number, itemId: number, field: keyof OrderItem, value: string | number) => {
    setContracts(prev => prev.map(c => c.id !== contractId ? c : {
      ...c,
      items: c.items.map(i => i.id === itemId ? { ...i, [field]: value } : i),
    }));
  }, []);

  const addItem = useCallback((contractId: number) => {
    setContracts(prev => prev.map(c => c.id !== contractId ? c : {
      ...c,
      items: [...c.items, createItem()],
    }));
  }, []);

  const removeItem = useCallback((contractId: number, itemId: number) => {
    setContracts(prev => prev.map(c => c.id !== contractId ? c : {
      ...c,
      items: c.items.filter(i => i.id !== itemId),
    }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-slide-up">
      <PageHeader title="Sales Office Calculator" subtitle="Contract profitability analysis with quality bonus and sourcing costs"
        icon={<Calculator size={18} />} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600" />

      <div className="flex items-center gap-3">
        <button onClick={addContract} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
          <Plus size={16} /> Add Contract
        </button>
        {contracts.length > 1 && (
          <button onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${compareMode ? "bg-violet-600 text-white shadow-sm" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200"}`}>
            <ArrowLeftRight size={16} /> {compareMode ? "Hide Comparison" : "Compare Contracts"}
          </button>
        )}
      </div>

      {compareMode && contracts.length > 1 && (
        <div className="card overflow-hidden">
          <SectionHeader title="Contract Comparison" />
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
                {[
                  { label: "Revenue", key: "totalRevenue" as const, color: "text-emerald-600", prefix: "" },
                  { label: "Bonus", key: "bonusAmount" as const, color: "text-violet-600", prefix: "+" },
                  { label: "Total w/ Bonus", key: "totalWithBonus" as const, color: "", prefix: "" },
                  { label: "Sourcing Cost", key: "totalSourcing" as const, color: "text-rose-500", prefix: "-" },
                  { label: "Wages", key: "wages" as const, color: "text-rose-500", prefix: "-" },
                  { label: "Overhead", key: "overheadCost" as const, color: "text-rose-500", prefix: "-" },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="py-3 px-5 text-sm font-medium text-surface-500">{row.label}</td>
                    {results.map(r => {
                      const val = row.key === "wages" ? r.contract.wages : r.result[row.key];
                      return <td key={r.contract.id} className={`text-right py-3 px-4 text-sm font-bold ${row.color}`}>{row.prefix}{fmtCurrency(val)}</td>;
                    })}
                  </tr>
                ))}
                <tr className="bg-surface-50 dark:bg-surface-900">
                  <td className="py-4 px-5 text-sm font-black uppercase text-surface-700 dark:text-surface-300">Net Profit</td>
                  {results.map(r => (
                    <td key={r.contract.id} className={`text-right py-4 px-4 text-lg font-black ${r.result.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"} ${bestContract?.contract.id === r.contract.id ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}>
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
        {results.map(r => (
          <ContractPanel key={r.contract.id} contract={r.contract} result={r.result}
            isBest={bestContract?.contract.id === r.contract.id}
            onUpdate={(field, value) => updateContract(r.contract.id, field, value)}
            onUpdateItem={(itemId, field, value) => updateItem(r.contract.id, itemId, field, value)}
            onAddItem={() => addItem(r.contract.id)}
            onRemoveItem={(itemId) => removeItem(r.contract.id, itemId)}
            onRemove={() => removeContract(r.contract.id)}
            onDuplicate={() => duplicateContract(r.contract.id)} />
        ))}
      </div>
    </div>
  );
}
