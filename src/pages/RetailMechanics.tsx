import { useState, useMemo } from "react";
import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtCurrency, fmtPct, fmtNumber } from "../utils/formatters";
import { Calculator, Plus, Trash2, Copy, ChevronDown, ChevronUp, Clock, Building2, Store, ShoppingBag, Factory, Settings, Info, AlertTriangle, Zap, Truck, ArrowLeftRight } from "lucide-react";

// ============================================================================
// RETAIL BUILDING DEFINITIONS (from simco_static.ts + game mechanics)
// ============================================================================

interface RetailBuilding {
  id: string;
  name: string;
  type: 'standard' | 'sales_office' | 'restaurant' | 'seasonal';
  baseHourlyWage: number;
  baseContractHours: number;
  ordersPerLevel: number;
  qualityScaling: 'none' | 'linear' | 'sales_office';
  description: string;
  products: string[]; // Product names this building sells
}

const RETAIL_BUILDINGS: RetailBuilding[] = [
  {
    id: 'G',
    name: 'Grocery Store',
    type: 'standard',
    baseHourlyWage: 138,
    baseContractHours: 1,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Standard retail - sells food/consumer goods. Fixed 1h cycles.',
    products: ['Apples', 'Oranges', 'Grapes', 'Steak', 'Sausages', 'Eggs', 'Butter', 'Cheese', 'Bread', 'Chocolate'],
  },
  {
    id: 'C',
    name: 'Electronics Store',
    type: 'standard',
    baseHourlyWage: 172.5,
    baseContractHours: 1,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Standard retail - sells electronics. Fixed 1h cycles.',
    products: ['Processors', 'Electronic components', 'Batteries', 'Displays', 'Smart phones', 'Tablets', 'Laptops', 'On-board computer', 'Flight computer'],
  },
  {
    id: 'd',
    name: 'Hardware Store',
    type: 'standard',
    baseHourlyWage: 172.5,
    baseContractHours: 4,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Standard retail - sells construction/industrial goods. 4h cycles.',
    products: ['Reinforced concrete', 'Bricks', 'Planks', 'Construction units', 'Cement', 'Windows', 'Tools', 'Beams'],
  },
  {
    id: 'A',
    name: 'Gas Station',
    type: 'standard',
    baseHourlyWage: 345,
    baseContractHours: 2,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Standard retail - sells fuel. 2h cycles.',
    products: ['Petrol', 'Diesel', 'Methane', 'Rocket fuel', 'Transport'],
  },
  {
    id: 'H',
    name: 'Fashion Store',
    type: 'standard',
    baseHourlyWage: 310.5,
    baseContractHours: 3,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Standard retail - sells fashion goods. 3h cycles.',
    products: ['Cotton', 'Fabric', 'Leather', 'Underwear', 'Dress', 'Gloves', 'Sneakers', 'Stiletto Heel', 'Fashion research'],
  },
  {
    id: '2',
    name: 'Car Dealership',
    type: 'standard',
    baseHourlyWage: 379.5,
    baseContractHours: 3,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Standard retail - sells vehicles. 3h cycles.',
    products: ['Basic interior', 'Car body', 'Combustion engine', 'Electric motor'],
  },
  {
    id: 'B',
    name: 'Sales Offices',
    type: 'sales_office',
    baseHourlyWage: 586.5,
    baseContractHours: 47,
    ordersPerLevel: 1,
    qualityScaling: 'sales_office',
    description: 'Aerospace retail - unique mechanics. 47h fixed cycle per order. One level = one concurrent order. Quality scales linearly (Q1=1x, Q2=2x...). Sales speed bonus reduces wage cost.',
    products: ['Sub-orbital rocket', 'Single engine plane', 'Quadcopter', 'Attitude control', 'Cockpit', 'Flight computer', 'Basic interior', 'Car body', 'Combustion engine', 'Electric motor', 'On-board computer'],
  },
  {
    id: 'r',
    name: 'Restaurant',
    type: 'restaurant',
    baseHourlyWage: 655.5,
    baseContractHours: 3,
    ordersPerLevel: 1,
    qualityScaling: 'linear',
    description: 'Food retail with quality scaling. 3h cycles. Quality affects price.',
    products: ['Steak', 'Sausages', 'Eggs', 'Butter', 'Cheese', 'Bread', 'Chocolate', 'Apple pie', 'Chocolate icecream', 'Pumpkin soup', 'Pasta', 'Apple cider', 'Ginger beer', 'Ramadan sweets', 'Easter Bunny'],
  },
  {
    id: 't',
    name: 'Halloween Market',
    type: 'seasonal',
    baseHourlyWage: 207,
    baseContractHours: 2,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Seasonal retail (Halloween). 2h cycles.',
    products: ['Witch costume', 'Xmas ornament', 'Xmas crackers', 'Halloween market items'],
  },
  {
    id: 'u',
    name: 'Xmas Market',
    type: 'seasonal',
    baseHourlyWage: 207,
    baseContractHours: 3,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Seasonal retail (Christmas). 3h cycles.',
    products: ['Xmas ornament', 'Xmas crackers', 'Xmas market items'],
  },
  {
    id: 'z',
    name: 'Beach Market',
    type: 'seasonal',
    baseHourlyWage: 207,
    baseContractHours: 1,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Seasonal retail (Beach). 1h cycles.',
    products: ['Beach market items'],
  },
  {
    id: '5',
    name: 'Lake',
    type: 'standard',
    baseHourlyWage: 0,
    baseContractHours: 12,
    ordersPerLevel: 1,
    qualityScaling: 'none',
    description: 'Special - water production. 12h cycles. No wages.',
    products: ['Water'],
  },
];

// ============================================================================
// CALCULATION ENGINE
// ============================================================================

interface RetailInputs {
  buildingId: string;
  buildingLevel: number;
  quality: number; // 0-12
  salesSpeedBonus: number; // % from recreation + CMO
  adminOverhead: number; // %
  contractPrice: number; // $ per unit
  sourcingCost: number; // $ per unit
  quantityPerOrder: number;
  qualityBonusPct: number; // base % from contract (SO only)
}

interface RetailResult {
  building: RetailBuilding;
  inputs: RetailInputs;
  
  // Per-order metrics
  revenuePerOrder: number;
  qualityBonusPerOrder: number;
  sourcingCostPerOrder: number;
  wageCostPerOrder: number;
  overheadCostPerOrder: number;
  totalCostPerOrder: number;
  profitPerOrder: number;
  marginPct: number;
  
  // Daily projection
  ordersPerDay: number;
  dailyRevenue: number;
  dailyCost: number;
  dailyProfit: number;
  
  // Effective values
  effectiveHourlyWage: number;
  effectiveWagePerOrder: number;
}

function qualityMultiplier(q: number, scaling: RetailBuilding['qualityScaling']): number {
  if (q <= 0) return 0;
  if (scaling === 'none') return 1; // Standard retail: quality doesn't affect price
  if (scaling === 'sales_office') return q; // SO: Q1=1x, Q2=2x, Q3=3x...
  return q; // Restaurant: linear
}

function calculateRetail(inputs: RetailInputs): RetailResult {
  const building = RETAIL_BUILDINGS.find(b => b.id === inputs.buildingId)!;
  const qMult = qualityMultiplier(inputs.quality, building.qualityScaling);
  
  // Effective hourly wage after sales speed reduction
  // Sales speed bonus reduces wage by that percentage (capped at 90%)
  const wageReduction = Math.min(inputs.salesSpeedBonus / 100, 0.9);
  const effectiveHourlyWage = building.baseHourlyWage * (1 - wageReduction);
  
  // Wage cost per order = hourly wage × contract hours
  const wageCostPerOrder = effectiveHourlyWage * building.baseContractHours;
  
  // Revenue calculations
  const baseRevenuePerOrder = inputs.contractPrice * inputs.quantityPerOrder;
  let qualityBonusPerOrder = 0;
  
  if (building.qualityScaling === 'sales_office') {
    // SO: quality bonus applies to revenue
    const effectiveBonusPct = inputs.qualityBonusPct * qMult;
    qualityBonusPerOrder = baseRevenuePerOrder * (effectiveBonusPct / 100);
  } else if (building.qualityScaling === 'linear' && inputs.quality > 0) {
    // Restaurant: quality increases effective price
    qualityBonusPerOrder = baseRevenuePerOrder * (qMult - 1) * 0.1; // ~10% per quality level
  }
  
  const revenuePerOrder = baseRevenuePerOrder + qualityBonusPerOrder;
  const sourcingCostPerOrder = inputs.sourcingCost * inputs.quantityPerOrder;
  const overheadCostPerOrder = wageCostPerOrder * (inputs.adminOverhead / 100);
  const totalCostPerOrder = sourcingCostPerOrder + wageCostPerOrder + overheadCostPerOrder;
  const profitPerOrder = revenuePerOrder - totalCostPerOrder;
  const marginPct = revenuePerOrder > 0 ? (profitPerOrder / revenuePerOrder) * 100 : 0;
  
  // Daily projection: how many orders per day per level
  const ordersPerLevelPerDay = 24 / building.baseContractHours;
  const ordersPerDay = ordersPerLevelPerDay * inputs.buildingLevel;
  const dailyRevenue = revenuePerOrder * ordersPerDay;
  const dailyCost = totalCostPerOrder * ordersPerDay;
  const dailyProfit = profitPerOrder * ordersPerDay;
  
  return {
    building,
    inputs,
    revenuePerOrder,
    qualityBonusPerOrder,
    sourcingCostPerOrder,
    wageCostPerOrder,
    overheadCostPerOrder,
    totalCostPerOrder,
    profitPerOrder,
    marginPct,
    ordersPerDay,
    dailyRevenue,
    dailyCost,
    dailyProfit,
    effectiveHourlyWage,
    effectiveWagePerOrder: wageCostPerOrder,
  };
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

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
        max={max}
        step={step}
        onChange={e => onChange(Math.min(max ?? Infinity, Math.max(min, Number(e.target.value))))}
        className={`w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
      />
    </div>
  );
}

function BuildingSelector({ selectedId, onChange }: { selectedId: string; onChange: (id: string) => void }) {
  return (
    <select
      value={selectedId}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
    >
      {RETAIL_BUILDINGS.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}

function ResultCard({ label, value, color, prefix = "" }: { label: string; value: string | number; color?: string; prefix?: string }) {
  return (
    <div className={`rounded-xl p-4 ${color ? `bg-${color}-50 dark:bg-${color}-900/20` : 'bg-surface-50 dark:bg-surface-900'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">{label}</div>
      <div className="text-lg font-black">{prefix}{value}</div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-800 last:border-none">
      <span className="text-sm text-surface-600 dark:text-surface-400">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export function RetailMechanicsPage() {
  usePageTitleKey('retailMechanics');

  const [inputs, setInputs] = useState<RetailInputs>({
    buildingId: 'B',
    buildingLevel: 1,
    quality: 1,
    salesSpeedBonus: 0,
    adminOverhead: 0,
    contractPrice: 100000,
    sourcingCost: 60000,
    quantityPerOrder: 1,
    qualityBonusPct: 2.23,
  });

  const [comparisons, setComparisons] = useState<RetailInputs[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const result = useMemo(() => calculateRetail(inputs), [inputs]);
  const comparisonResults = useMemo(() => comparisons.map(c => calculateRetail(c)), [comparisons]);

  const updateInput = <K extends keyof RetailInputs>(key: K, value: RetailInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const addComparison = () => {
    setComparisons([...comparisons, { ...inputs }]);
    setShowComparison(true);
  };

  const removeComparison = (index: number) => {
    setComparisons(comparisons.filter((_, i) => i !== index));
  };

  const isSalesOffice = result.building.type === 'sales_office';
  const showQualityBonus = isSalesOffice || result.building.qualityScaling !== 'none';

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-slide-up">
      <PageHeader
        title="Retail Mechanics Calculator"
        subtitle="Model profitability for all retail buildings with accurate game mechanics"
        icon={<Store size={18} />}
        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        iconColor="text-emerald-600"
      />

      {/* Building Selector */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Retail Building</label>
            <BuildingSelector selectedId={inputs.buildingId} onChange={v => updateInput('buildingId', v)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Building Level</label>
            <NumberInput value={inputs.buildingLevel} onChange={v => updateInput('buildingLevel', v)} min={1} max={10} step={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Quality (Q0-Q12)</label>
            <NumberInput value={inputs.quality} onChange={v => updateInput('quality', v)} min={0} max={12} step={1} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Sales Speed Bonus %</label>
            <NumberInput value={inputs.salesSpeedBonus} onChange={v => updateInput('salesSpeedBonus', v)} min={0} max={90} step={0.1} />
          </div>
        </div>
      </div>

      {/* Building-specific inputs */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">{result.building.name} — Contract Terms</h3>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">{result.building.description}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Admin Overhead %</label>
            <NumberInput value={inputs.adminOverhead} onChange={v => updateInput('adminOverhead', v)} min={0} max={100} step={0.01} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Contract Price / Unit</label>
            <NumberInput value={inputs.contractPrice} onChange={v => updateInput('contractPrice', v)} step={0.01} prefix="$" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Sourcing Cost / Unit</label>
            <NumberInput value={inputs.sourcingCost} onChange={v => updateInput('sourcingCost', v)} step={0.01} prefix="$" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Quantity per Order</label>
            <NumberInput value={inputs.quantityPerOrder} onChange={v => updateInput('quantityPerOrder', v)} min={1} step={1} />
          </div>
          {showQualityBonus && (
            <div>
              <label className="block text-xs font-medium text-surface-500 mb-1.5 flex items-center gap-1">
                Quality Bonus Base %
                <span className="inline w-3 h-3 text-surface-400 cursor-help" title={isSalesOffice 
                  ? 'SO: Base bonus % multiplied by quality (Q1=1x, Q2=2x, Q3=3x...)' 
                  : 'Restaurant: Quality increases effective sale price linearly'}>
                  <Info className="w-3 h-3" />
                </span>
              </label>
              <NumberInput value={inputs.qualityBonusPct} onChange={v => updateInput('qualityBonusPct', v)} min={0} max={100} step={0.01} />
            </div>
          )}
        </div>
      </div>

      {/* Effective values display */}
      <div className="card p-4 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Effective Values</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ResultCard label="Effective Hourly Wage" value={fmtCurrency(result.effectiveHourlyWage)} color="blue" prefix="$" />
          <ResultCard label="Wage per Order" value={fmtCurrency(result.effectiveWagePerOrder)} color="blue" prefix="$" />
          <ResultCard label="Overhead per Order" value={fmtCurrency(result.overheadCostPerOrder)} color="amber" prefix="$" />
          <ResultCard label="Orders/Day (all levels)" value={result.ordersPerDay.toFixed(2)} color="emerald" />
        </div>
      </div>

      {/* Results */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Per Order Financials</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <ResultCard label="Revenue" value={fmtCurrency(result.revenuePerOrder)} color="emerald" prefix="$" />
          <ResultCard label="Quality Bonus" value={fmtCurrency(result.qualityBonusPerOrder)} color="violet" prefix="+" />
          <ResultCard label="Total Revenue" value={fmtCurrency(result.revenuePerOrder + result.qualityBonusPerOrder)} color="blue" prefix="$" />
          <ResultCard label="Sourcing Cost" value={fmtCurrency(result.sourcingCostPerOrder)} color="rose" prefix="-$" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <ResultCard label="Wage Cost" value={fmtCurrency(result.wageCostPerOrder)} color="rose" prefix="-$" />
          <ResultCard label="Overhead" value={fmtCurrency(result.overheadCostPerOrder)} color="amber" prefix="-$" />
          <ResultCard label="Total Cost" value={fmtCurrency(result.totalCostPerOrder)} color="rose" prefix="-$" />
          <ResultCard label={result.profitPerOrder >= 0 ? 'Net Profit' : 'Net Loss'} value={fmtCurrency(Math.abs(result.profitPerOrder))} color={result.profitPerOrder >= 0 ? 'emerald' : 'rose'} prefix={result.profitPerOrder >= 0 ? '+' : '-'} />
        </div>

        <div className={`rounded-xl p-5 ${result.profitPerOrder >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Margin</div>
              <div className="text-3xl font-black text-white">{fmtPct(result.marginPct)}</div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Cycle Time</div>
              <div className="text-2xl font-black text-white flex items-center gap-1 justify-center sm:justify-end">
                <Clock size={18} /> {result.building.baseContractHours}h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Projection */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Daily Projection (Level {inputs.buildingLevel})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResultCard label="Orders/Day" value={result.ordersPerDay.toFixed(2)} color="emerald" />
          <ResultCard label="Daily Revenue" value={fmtCurrency(result.dailyRevenue)} color="emerald" prefix="$" />
          <ResultCard label="Daily Cost" value={fmtCurrency(result.dailyCost)} color="rose" prefix="$" />
          <ResultCard label="Daily Profit" value={fmtCurrency(result.dailyProfit)} color={result.dailyProfit >= 0 ? 'emerald' : 'rose'} prefix={result.dailyProfit >= 0 ? '+' : '-'} />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3">Cost Breakdown (per order)</h3>
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          <InfoRow label="Base Revenue" value={fmtCurrency(result.revenuePerOrder - result.qualityBonusPerOrder)} color="text-emerald-600" />
          {showQualityBonus && <InfoRow label={`Quality Bonus (Q${inputs.quality} × ${fmtPct(inputs.qualityBonusPct)})`} value={fmtCurrency(result.qualityBonusPerOrder)} color="text-violet-600" />}
          <InfoRow label="Sourcing Cost" value={fmtCurrency(result.sourcingCostPerOrder)} color="text-rose-500" />
          <InfoRow label="Wage Cost" value={fmtCurrency(result.wageCostPerOrder)} color="text-rose-500" />
          <InfoRow label={`Admin Overhead (${fmtPct(inputs.adminOverhead)})`} value={fmtCurrency(result.overheadCostPerOrder)} color="text-amber-500" />
          <InfoRow label="Total Cost" value={fmtCurrency(result.totalCostPerOrder)} color="text-rose-600" />
          <InfoRow label="Net Profit" value={fmtCurrency(result.profitPerOrder)} color={result.profitPerOrder >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        </div>
      </div>

      {/* Comparison Mode */}
      <div className="flex items-center gap-3">
        <button onClick={addComparison} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm">
          <Plus size={16} /> Add to Comparison
        </button>
        {comparisons.length > 0 && (
          <button onClick={() => setShowComparison(!showComparison)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${showComparison ? 'bg-emerald-600 text-white shadow-sm' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
            <ArrowLeftRight size={16} /> {showComparison ? 'Hide Comparison' : `Compare ${comparisons.length + 1} Configs`}
          </button>
        )}
      </div>

      {showComparison && comparisons.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-surface-500">Configuration Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wider text-surface-400">Metric</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-surface-400">Current</th>
                  {comparisonResults.map((r, i) => (
                    <th key={i} className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-surface-400">
                      Compare {i + 1} ({r.building.name} L{r.inputs.buildingLevel})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Building</td>
                  <td className="text-right py-3 px-4 text-sm font-bold">{result.building.name} L{inputs.buildingLevel}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className="text-right py-3 px-4 text-sm font-bold">{r.building.name} L{r.inputs.buildingLevel}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Quality</td>
                  <td className="text-right py-3 px-4 text-sm font-bold">Q{inputs.quality}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className="text-right py-3 px-4 text-sm font-bold">Q{r.inputs.quality}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Revenue/Order</td>
                  <td className="text-right py-3 px-4 text-sm font-bold text-emerald-600">{fmtCurrency(result.revenuePerOrder)}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className="text-right py-3 px-4 text-sm font-bold text-emerald-600">{fmtCurrency(r.revenuePerOrder)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Total Cost/Order</td>
                  <td className="text-right py-3 px-4 text-sm font-bold text-rose-500">{fmtCurrency(result.totalCostPerOrder)}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className="text-right py-3 px-4 text-sm font-bold text-rose-500">{fmtCurrency(r.totalCostPerOrder)}</td>)}
                </tr>
                <tr className="bg-surface-50 dark:bg-surface-900">
                  <td className="py-4 px-5 text-sm font-black uppercase text-surface-700 dark:text-surface-300">Profit/Order</td>
                  <td className="text-right py-4 px-4 text-lg font-black text-emerald-600">{fmtCurrency(result.profitPerOrder)}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className={`text-right py-4 px-4 text-lg font-black ${r.profitPerOrder >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCurrency(r.profitPerOrder)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Margin</td>
                  <td className="text-right py-3 px-4 text-sm font-bold">{fmtPct(result.marginPct)}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className="text-right py-3 px-4 text-sm font-bold">{fmtPct(r.marginPct)}</td>)}
                </tr>
                <tr>
                  <td className="py-3 px-5 text-sm font-medium text-surface-500">Daily Profit</td>
                  <td className="text-right py-3 px-4 text-sm font-bold">{fmtCurrency(result.dailyProfit)}</td>
                  {comparisonResults.map(r => <td key={r.building.id} className="text-right py-3 px-4 text-sm font-bold">{fmtCurrency(r.dailyProfit)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 space-y-2">
            {comparisons.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-900 rounded">
                <span className="text-sm">{comparisonResults[i].building.name} L{c.buildingLevel} Q{c.quality} — {fmtCurrency(comparisonResults[i].profitPerOrder)}/order</span>
                <button onClick={() => removeComparison(i)} className="p-1 text-surface-400 hover:text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mechanics Reference */}
      <details className="card p-4 bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800">
        <summary className="flex items-center gap-2 text-sm font-bold text-surface-600 dark:text-surface-400 cursor-pointer">
          <Settings size={16} className="text-emerald-600" />
          Game Mechanics Reference
        </summary>
        <div className="mt-3 space-y-2 text-xs text-surface-500 dark:text-surface-400">
          <h4 className="font-bold text-surface-600 dark:text-surface-300">Standard Retail (Grocery, Electronics, Hardware, Gas, Fashion, Car Dealership, Lake):</h4>
          <p>• Fixed contract hours per building (1h–12h). One level = one concurrent order.</p>
          <p>• Quality does NOT affect price (qualityScaling: 'none').</p>
          <p>• Profit = (Price × Qty) - (Sourcing × Qty) - (Hourly Wage × Contract Hours) - Overhead.</p>
          <p>• Sales speed bonus (from recreation + CMO) reduces hourly wage.</p>
          
          <h4 className="font-bold text-surface-600 dark:text-surface-300 mt-3">Sales Office (Aerospace):</h4>
          <p>• 47-hour fixed cycle per order search. One level = one concurrent order.</p>
          <p>• Base wage: $586.50/hr (reduced by sales speed bonus %).</p>
          <p>• Quality bonus: Base % × Quality level (Q1=1x, Q2=2x, Q3=3x...). Applied to revenue.</p>
          <p>• Contract terms (price, bonus %, items) are randomized per offer based on server demand.</p>
          <p>• Can reject orders → wait another 47h + pay wages again.</p>
          
          <h4 className="font-bold text-surface-600 dark:text-surface-300 mt-3">Restaurant:</h4>
          <p>• 3-hour cycles. Quality increases effective sale price linearly.</p>
          <p>• CMO communication skill increases sales speed → reduces wages.</p>
          
          <h4 className="font-bold text-surface-600 dark:text-surface-300 mt-3">Seasonal (Halloween/Xmas/Beach):</h4>
          <p>• Limited-time buildings. Fixed cycles. No quality scaling.</p>
          
          <h4 className="font-bold text-surface-600 dark:text-surface-300 mt-3">Key Formula:</h4>
          <p className="font-mono text-[11px] bg-surface-100 dark:bg-surface-800 p-2 rounded">
            Effective Wage = Base Wage × (1 - min(SalesSpeedBonus%, 90%))
          </p>
          <p className="font-mono text-[11px] bg-surface-100 dark:bg-surface-800 p-2 rounded">
            SO Quality Bonus = ContractPrice × Qty × (QualityBonusBase% × QualityLevel)
          </p>
        </div>
      </details>
    </div>
  );
}