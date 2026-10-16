import { useState, useMemo } from "react";
import { PageHeader, MetricBox } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtNumber, fmtCurrency, fmtPct } from "../utils/formatters";
import { Calculator, Plus, Trash2, Package, DollarSign, TrendingUp, Percent } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  sourcingCost: number;
  quality: number;
}

const DEFAULT_ITEMS: OrderItem[] = [
  { id: 1, name: "Sub-orbital rocket", quantity: 3, unitPrice: 109283, sourcingCost: 0, quality: 2 },
  { id: 2, name: "Single engine plane", quantity: 4, unitPrice: 37888, sourcingCost: 0, quality: 2 },
];

export function SalesOfficeCalculatorPage() {
  usePageTitleKey('salesOffice');

  const [items, setItems] = useState<OrderItem[]>(DEFAULT_ITEMS);
  const [qualityBonus, setQualityBonus] = useState(2.23);
  const [wages, setWages] = useState(37217);
  const [adminOverhead, setAdminOverhead] = useState(0);
  const [contractName, setContractName] = useState("");

  const result = useMemo(() => {
    const totalRevenue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalSourcing = items.reduce((sum, item) => sum + item.quantity * item.sourcingCost, 0);
    // Quality bonus is only applied to items at or above quality 2 (meets buyer standard)
    const bonusAmount = items
      .filter(item => item.quality >= 2)
      .reduce((sum, item) => sum + item.quantity * item.unitPrice * (qualityBonus / 100), 0);
    const totalWithBonus = totalRevenue + bonusAmount;
    const overheadCost = wages * (adminOverhead / 100);
    const totalCosts = totalSourcing + wages + overheadCost;
    const netProfit = totalWithBonus - totalCosts;
    const marginPct = totalWithBonus > 0 ? (netProfit / totalWithBonus) * 100 : 0;
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const profitPerItem = totalQty > 0 ? netProfit / totalQty : 0;

    return { totalRevenue, totalSourcing, bonusAmount, totalWithBonus, overheadCost, totalCosts, netProfit, marginPct, profitPerItem };
  }, [items, qualityBonus, wages, adminOverhead]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: "", quantity: 1, unitPrice: 0, sourcingCost: 0, quality: 2 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: number, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-slide-up">
      <PageHeader
        title="Sales Office Calculator"
        subtitle="Contract profitability analysis with quality bonus and sourcing costs"
        icon={<Calculator size={18} />}
        iconBg="bg-violet-100 dark:bg-violet-900/30"
        iconColor="text-violet-600"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Contract Details</h2>
              <input
                type="text"
                value={contractName}
                onChange={e => setContractName(e.target.value)}
                placeholder="Contract name (optional)"
                className="text-xs border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-brand-500/20 w-48"
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[9px] font-bold uppercase text-surface-400 tracking-wider">
                <div className="col-span-3">Item</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-center">Quality</div>
                <div className="col-span-3 text-right">Unit Price</div>
                <div className="col-span-3 text-right">Sourcing Cost</div>
              </div>

              {items.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full text-xs border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-full text-xs text-right border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={item.quality}
                      onChange={e => updateItem(item.id, 'quality', Number(e.target.value))}
                      className="w-full text-xs text-center border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-1 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20"
                    >
                      {[0,1,2,3,4,5].map(q => <option key={q} value={q}>Q{q}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs text-right border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20"
                    />
                  </div>
                  <div className="col-span-3 flex gap-1">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.sourcingCost}
                      onChange={e => updateItem(item.id, 'sourcingCost', Math.max(0, Number(e.target.value)))}
                      placeholder="Cost"
                      className="w-full text-xs text-right border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-brand-500/20"
                    />
                    <button onClick={() => removeItem(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem} className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">Terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Quality Bonus %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={qualityBonus}
                  onChange={e => setQualityBonus(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Wages ($)</label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={wages}
                  onChange={e => setWages(Math.max(0, Number(e.target.value)))}
                  className="input"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-surface-400 tracking-wider block">Admin Overhead %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={adminOverhead}
                  onChange={e => setAdminOverhead(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 border-l-4 border-emerald-500">
              <span className="metric-label">Revenue</span>
              <span className="metric-value">{fmtCurrency(result.totalRevenue)}</span>
            </div>
            <div className="card p-3 border-l-4 border-violet-500">
              <span className="metric-label">Bonus ({fmtPct(qualityBonus)})</span>
              <span className="metric-value text-violet-600">+{fmtCurrency(result.bonusAmount)}</span>
            </div>
            <div className="card p-3 border-l-4 border-blue-500">
              <span className="metric-label">Total w/ Bonus</span>
              <span className="metric-value">{fmtCurrency(result.totalWithBonus)}</span>
            </div>
            <div className="card p-3 border-l-4 border-rose-500">
              <span className="metric-label">Total Costs</span>
              <span className="metric-value text-rose-600">-{fmtCurrency(result.totalCosts)}</span>
            </div>
          </div>

          <div className={`card p-5 border-l-4 ${result.netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
            <span className="metric-label">Net Profit</span>
            <span className={`text-2xl font-black ${result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmtCurrency(result.netProfit)}
            </span>
            <span className={`text-sm font-bold ${result.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmtPct(result.marginPct)} margin
            </span>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="text-[10px] font-black uppercase tracking-wider text-surface-500">Cost Breakdown</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold text-surface-500">Base Revenue</span>
                <span className="text-sm font-bold text-emerald-600">+{fmtCurrency(result.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold text-surface-500">Quality Bonus</span>
                <span className="text-sm font-bold text-violet-600">+{fmtCurrency(result.bonusAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold text-surface-500">Sourcing Cost</span>
                <span className="text-sm font-bold text-rose-500">-{fmtCurrency(result.totalSourcing)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold text-surface-500">Wages</span>
                <span className="text-sm font-bold text-rose-500">-{fmtCurrency(wages)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800">
                <span className="text-xs font-bold text-surface-500">Admin Overhead ({fmtPct(adminOverhead)})</span>
                <span className="text-sm font-bold text-rose-500">-{fmtCurrency(result.overheadCost)}</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-sm font-bold uppercase">Net Profit</span>
                <span className={`text-lg font-bold ${result.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtCurrency(result.netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-surface-500 mb-3">Per-Item Profit</h3>
            <div className="space-y-2">
              {items.filter(i => i.name).map(item => {
                const itemRevenue = item.quantity * item.unitPrice;
                const itemBonus = item.quality >= 2 ? itemRevenue * (qualityBonus / 100) : 0;
                const itemSourcing = item.quantity * item.sourcingCost;
                const itemWages = items.length > 0 ? wages / items.reduce((s, i) => s + i.quantity, 0) * item.quantity : 0;
                const itemOverhead = itemWages * (adminOverhead / 100);
                const itemProfit = itemRevenue + itemBonus - itemSourcing - itemWages - itemOverhead;
                return (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-surface-600 dark:text-surface-400 truncate mr-2">{item.name} <span className="text-surface-400">Q{item.quality}</span></span>
                    <span className={`font-bold ${itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {fmtCurrency(itemProfit)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
