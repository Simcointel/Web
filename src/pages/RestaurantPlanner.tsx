import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowRight, BarChart3, Check, ChevronDown, ChevronUp, ExternalLink,
  Flame, Gauge, Info, RotateCcw, Settings2, Sparkles, Target, Utensils,
} from "lucide-react";
import { PageHeader } from "../components/ui/Common";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { fmtCurrency, fmtInteger, fmtNumber, fmtPct } from "../utils/formatters";
import {
  CATEGORY_LABELS, CATEGORY_ORDER, PRESETS, RESTAURANT_MENU_ITEMS, countMultiplier,
  type RestaurantMenuItemId, type RestaurantMode,
} from "../services/restaurantMenu";
import {
  computeMenuMarket, computeMenuRows, computeProfit, estimateRating, optimizeMenu,
  phaseWeights, resolveOccupancy, seatsForMode,
  type ItemMarketInput, type RestaurantMarketInputs, type RestaurantPlannerInput,
} from "../services/restaurantPlanner";
import {
  loadRestaurantMarketData, qualityPremiumCost,
  type RestaurantMarketData,
} from "../services/restaurantMarketData";

const ITEM_BY_ID = new Map(RESTAURANT_MENU_ITEMS.map(item => [item.id, item]));
const DEFAULT_MARKET: RestaurantMarketInputs = {
  restaurantCount: 743,
  avgMarketRating: 7.49,
  avgMarketPrice: 150,
  restaurantsOwned: 0,
  phase: null,
};

function pct(value: number, decimals = 1): string {
  return Number.isFinite(value) ? `${(value * 100).toFixed(decimals)}%` : "—";
}

function signedMoney(value: number): string {
  return `${value > 0 ? "+" : ""}${fmtCurrency(value)}`;
}

function fmtLoadedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
}

function demandPill(demand: number): string {
  if (demand >= 0.6) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (demand >= 0.35) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
}

function demandText(demand: number): string {
  if (demand >= 0.6) return "text-emerald-600 dark:text-emerald-400";
  if (demand >= 0.35) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function RestaurantPlannerPage() {
  usePageTitleKey("restaurantPlanner");

  const [input, setInput] = useState<RestaurantPlannerInput>(() => ({
    mode: "economy",
    level: 10,
    quality: 4,
    staff: "rookie",
    salesSpeedBonus: 0,
    cmoCommSkill: 0,
    mealPrice: 150,
    occupancyMode: "estimate",
    actualOccupancy: 0.6,
    targetRating: 7.5,
    adminOverheadPct: 0,
    selectedItemIds: [...PRESETS.economy.itemIds],
    unitCosts: {},
    qualityPremiumPct: 1,
    actualRating: null,
    market: { ...DEFAULT_MARKET },
  }));
  const [marketData, setMarketData] = useState<RestaurantMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMarketTable, setShowMarketTable] = useState(false);

  useEffect(() => {
    let alive = true;
    loadRestaurantMarketData()
      .then(data => {
        if (!alive) return;
        setMarketData(data);
        setInput(prev => ({ ...prev, market: { ...prev.market, phase: data.phase ?? prev.market.phase } }));
        setLoading(false);
      })
      .catch(err => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Market data unavailable");
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const defaultUnitCosts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of RESTAURANT_MENU_ITEMS) {
      const vwap = marketData?.vwapByName.get(item.dataRepoName) ?? 0;
      out[item.id] = qualityPremiumCost(vwap, input.quality, input.qualityPremiumPct);
    }
    return out;
  }, [marketData, input.quality, input.qualityPremiumPct]);

  // Manual costs override the live VWAP-derived cost; both reach the calculator merged.
  const plannerInput = useMemo<RestaurantPlannerInput>(
    () => ({ ...input, unitCosts: { ...defaultUnitCosts, ...input.unitCosts } }),
    [input, defaultUnitCosts],
  );

  const rows = useMemo(() => computeMenuRows(plannerInput), [plannerInput]);
  const foodCost = useMemo(() => rows.reduce((sum, row) => sum + row.lineCost, 0), [rows]);
  const ratingRaw = useMemo(() => estimateRating(plannerInput, foodCost), [plannerInput, foodCost]);
  const currentRating = input.actualRating ?? ratingRaw;
  const { occupancy, breakdown } = useMemo(
    () => resolveOccupancy(plannerInput, currentRating),
    [plannerInput, currentRating],
  );
  const profit = useMemo(() => computeProfit(plannerInput, rows, occupancy), [plannerInput, rows, occupancy]);

  const itemMarket = useMemo<Record<string, ItemMarketInput>>(() => {
    const out: Record<string, ItemMarketInput> = {};
    for (const item of RESTAURANT_MENU_ITEMS) {
      out[item.id] = {
        saturation: marketData?.saturationByResourceId.get(item.resourceId) ?? null,
        marketUnitsPerDay: marketData?.marketVolumeByResourceId.get(item.resourceId) ?? null,
      };
    }
    return out;
  }, [marketData]);

  const marketRows = useMemo(
    () => computeMenuMarket(rows, input.market, itemMarket, occupancy),
    [rows, input.market, itemMarket, occupancy],
  );
  const marketRowById = useMemo(() => new Map(marketRows.map(row => [row.itemId, row])), [marketRows]);
  const optimizer = useMemo(() => optimizeMenu(plannerInput, rows, occupancy), [plannerInput, rows, occupancy]);

  const seats = seatsForMode(input.mode, input.level);
  const selectedSet = useMemo(() => new Set(input.selectedItemIds), [input.selectedItemIds]);
  const weights = phaseWeights(input.market.phase);
  const best = optimizer.best;
  const bestIsCurrent = !!best
    && best.itemIds.length === input.selectedItemIds.length
    && best.itemIds.every(id => selectedSet.has(id));
  const missingCostItems = RESTAURANT_MENU_ITEMS.filter(
    item => selectedSet.has(item.id) && !(plannerInput.unitCosts[item.id] > 0),
  );
  const pricesUnavailable = !loading && !marketData?.sources.margins;
  const estimateDelta = (occupancy - breakdown.occupancy) * 100;
  const bestGroups = best
    ? CATEGORY_ORDER.map(category => ({
        category,
        items: best.itemIds.flatMap(id => {
          const item = ITEM_BY_ID.get(id);
          return item?.category === category ? [item] : [];
        }),
      }))
    : [];
  const sourceList = [
    { label: "ingredient prices", ok: !!marketData?.sources.margins },
    { label: "retail saturation", ok: !!marketData?.sources.retail },
    { label: "economic phase", ok: !!marketData?.sources.phase },
    { label: "restaurant volumes", ok: !!marketData?.sources.snapshot },
  ];
  const loadedSources = sourceList.filter(source => source.ok).map(source => source.label);
  const fallbackSources = sourceList.filter(source => !source.ok).map(source => source.label);
  const pricesLoadedAt = fmtLoadedAt(marketData?.pricesLoadedAt ?? null);
  const retailLoadedAt = fmtLoadedAt(marketData?.retailLoadedAt ?? null);

  const patch = (next: Partial<RestaurantPlannerInput>) => setInput(prev => ({ ...prev, ...next }));
  const patchMarket = (next: Partial<RestaurantMarketInputs>) =>
    setInput(prev => ({ ...prev, market: { ...prev.market, ...next } }));
  const menuMatches = (ids: RestaurantMenuItemId[]) =>
    ids.length === input.selectedItemIds.length && ids.every(id => selectedSet.has(id));
  const applyMenu = (ids: RestaurantMenuItemId[]) => patch({ selectedItemIds: [...ids] });
  const toggleItem = (id: RestaurantMenuItemId) => {
    setInput(prev => {
      if (prev.selectedItemIds.includes(id)) {
        const category = ITEM_BY_ID.get(id)?.category;
        const inCategory = prev.selectedItemIds.filter(selected => ITEM_BY_ID.get(selected)?.category === category);
        if (inCategory.length <= 1) return prev;
        return { ...prev, selectedItemIds: prev.selectedItemIds.filter(selected => selected !== id) };
      }
      return { ...prev, selectedItemIds: [...prev.selectedItemIds, id] };
    });
  };
  const setManualCost = (id: RestaurantMenuItemId, value: number) =>
    patch({ unitCosts: { ...input.unitCosts, [id]: value } });
  const resetCost = (id: RestaurantMenuItemId) => {
    const next = { ...input.unitCosts };
    delete next[id];
    patch({ unitCosts: next });
  };

  const modeSwitch = () => patch({ mode: input.mode === "economy" ? "luxury" : "economy" });

  return (
    <div className="space-y-4">
      {/* Header + Mode Switch */}
      <PageHeader
        title="Restaurant Planner"
        subtitle="Economy/Luxury seating, auto-computed best menu, market-driven occupancy"
        icon={<Utensils size={18} />}
        iconBg="bg-rose-100 dark:bg-rose-900/30"
        iconColor="text-rose-600"
      />

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 border border-surface-200 dark:border-surface-700 rounded-lg p-1 bg-white dark:bg-surface-900">
          <button
            onClick={modeSwitch}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              input.mode === "economy"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
            }`}
          >
            Economy
          </button>
          <button
            onClick={modeSwitch}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              input.mode === "luxury"
                ? "bg-rose-700 text-white shadow-sm"
                : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
            }`}
          >
            Luxury
          </button>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-surface-600 dark:text-surface-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-800 dark:text-white">{seats.toLocaleString()}</span>
            <span>seats</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-800 dark:text-white">
              {Math.round(seats * breakdown.occupancy).toLocaleString()}
            </span>
            <span>meals/cycle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-800 dark:text-white">
              {input.mode === "economy" ? "1.0×" : "0.5×"}
            </span>
            <span>wage factor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-800 dark:text-white">
              {input.market.phase ? input.market.phase.charAt(0).toUpperCase() + input.market.phase.slice(1) : "Unknown"}
            </span>
            <span>phase</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-surface-800 dark:text-white">{pct(breakdown.occupancy)}</span>
            <span>est. occupancy</span>
          </div>
        </div>

        {loading && (
          <span className="text-xs text-surface-500 animate-pulse">Loading market data…</span>
        )}
      </div>

      {/* Best Menu Hero */}
      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-surface-800 dark:text-white">Best Menu</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Target rating: <span className="font-semibold">{input.targetRating.toFixed(1)}</span> ·{" "}
              Current:{" "}
              <span
                className={input.actualRating !== null ? "text-brand-600" : "text-emerald-600"}
              >
                {input.actualRating !== null
                  ? `Calibrated ${(ratingRaw + (input.actualRating - ratingRaw)).toFixed(2)} (raw ${ratingRaw.toFixed(2)})`
                  : `Est. ${ratingRaw.toFixed(2)}`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!bestIsCurrent && best && (
              <button
                onClick={() => applyMenu(best.itemIds)}
                className="btn-primary text-sm px-3 py-1.5"
                disabled={!optimizer.targetReachable}
              >
                <Sparkles size={14} className="mr-1.5" /> Apply Best Menu
              </button>
            )}
            <div className="text-xs text-surface-500">
              Occupancy used: {pct(occupancy)}{" "}
              {input.occupancyMode === "actual" && (
                <span className="text-brand-600">(actual)</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <ResultCard label="Food Cost" value={fmtCurrency(foodCost)} />
          <ResultCard label="Profit / Cycle" value={signedMoney(profit.profitPerCycle)} color={profit.profitPerCycle >= 0 ? "emerald" : "rose"} />
          <ResultCard label="Profit / Day" value={signedMoney(profit.profitPerDay)} color={profit.profitPerDay >= 0 ? "emerald" : "rose"} />
          <ResultCard label="Break-even Occ." value={pct(profit.breakEvenOccupancy)} color={profit.belowBreakEven ? "rose" : "emerald"} />
        </div>

        {missingCostItems.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle size={14} className="inline mr-1" /> Incomplete costs for:{' '}
            {missingCostItems.map(i => i.name).join(", ")}. Profit assumes $0 for these.
          </div>
        )}

        {!optimizer.targetReachable && (
          <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-800 dark:text-rose-200">
            <AlertTriangle size={14} className="inline mr-1" /> Target rating {input.targetRating.toFixed(1)} not reachable.
            Best available: {optimizer.best?.rating.toFixed(2) ?? "—"}.
          </div>
        )}

        {profit.belowBreakEven && (
          <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-800 dark:text-rose-200">
            <AlertTriangle size={14} className="inline mr-1" /> Occupancy {pct(occupancy)} below break-even {pct(profit.breakEvenOccupancy)}.
            Expected loss: {fmtCurrency(-profit.profitPerCycle)}/cycle.
          </div>
        )}

        {best && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              Top {optimizer.alternatives.length + 1} alternatives (click to apply)
            </summary>
            <div className="mt-2 space-y-2">
              {[
                { itemIds: best.itemIds, rating: best.rating, foodCost: best.foodCost, profitPerCycle: best.profitPerCycle, isBest: true },
                ...optimizer.alternatives.map(a => ({ ...a, isBest: false })),
              ].map((alt, idx) => (
                <button
                  key={alt.itemIds.join("-")}
                  onClick={() => applyMenu(alt.itemIds)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    alt.isBest
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200"
                      : "hover:bg-surface-50 dark:hover:bg-surface-900 border-surface-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-surface-800 dark:text-white">
                      #{idx + 1}: {alt.itemIds.length} items · {fmtCurrency(alt.foodCost)} food
                    </span>
                    <span className="text-sm font-bold text-emerald-600">{fmtCurrency(alt.profitPerCycle)}/cycle</span>
                  </div>
                  <div className="text-xs text-surface-500 mt-1">
                    Est. rating: <span className="font-semibold">{alt.rating.toFixed(2)}</span>
                    {alt.isBest && <span className="ml-2 text-emerald-600">← Current</span>}
                  </div>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Preset Chips */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Quick Presets</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([mode, preset]) => (
            <button
              key={mode}
              onClick={() => applyMenu(preset.itemIds)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                menuMatches(preset.itemIds)
                  ? "bg-brand-100 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300"
                  : "bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-brand-500/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Setup Card */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Setup</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NumberInputGroup
            label="Level"
            value={input.level}
            onChange={v => patch({ level: v })}
            min={1}
            max={10}
            step={1}
          />
          <NumberInputGroup
            label="Food Quality (0–12)"
            value={input.quality}
            onChange={v => patch({ quality: v })}
            min={0}
            max={12}
            step={1}
          />
          <NumberInputGroup
            label="Sales Speed Bonus %"
            value={input.salesSpeedBonus}
            onChange={v => patch({ salesSpeedBonus: v })}
            min={0}
            max={90}
            step={0.1}
          />
          <NumberInputGroup
            label="CMO Comm Skill (0–100)"
            value={input.cmoCommSkill}
            onChange={v => patch({ cmoCommSkill: v })}
            min={0}
            max={100}
            step={1}
          />
          <NumberInputGroup
            label="Menu Price $60-$350"
            value={input.mealPrice}
            onChange={v => {
              const val = Math.min(350, Math.max(60, v));
              patch({ mealPrice: val });
            }}
            min={60}
            max={350}
            step={1}
            prefix="$"
          />
          <NumberInputGroup
            label="Target Rating"
            value={input.targetRating}
            onChange={v => patch({ targetRating: v })}
            min={0}
            max={15}
            step={0.1}
          />
          <NumberInputGroup
            label="Admin Overhead %"
            value={input.adminOverheadPct}
            onChange={v => patch({ adminOverheadPct: v })}
            min={0}
            max={100}
            step={0.01}
          />
          <NumberInputGroup
            label="Quality Premium %/Q"
            value={input.qualityPremiumPct}
            onChange={v => patch({ qualityPremiumPct: v })}
            min={0}
            max={5}
            step={0.1}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Staff</label>
            <select
              value={input.staff}
              onChange={e => patch({ staff: e.target.value as "rookie" | "professional" })}
              className="w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="rookie">Rookies (1× wages, 0 rating bonus)</option>
              <option value="professional">Professionals (5× wages, +1.0 rating estimate)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1.5">Actual In-Game Rating (optional)</label>
            <NumberInputGroup
              label=""
              value={input.actualRating ?? 0}
              onChange={v => patch({ actualRating: v > 0 ? v : null })}
              min={0}
              max={20}
              step={0.01}
              placeholder="Leave empty to use estimate"
            />
            <p className="text-xs text-surface-500 mt-1">
              Overrides the estimated rating. Calibrates all menu candidates by the same offset.
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-surface-500 dark:text-surface-400">
          <Info size={12} className="inline mr-1" />
          Low pulls the lowest quality from your warehouse; High pulls the highest. This planner uses the quality you actually serve.
        </p>
      </div>

      {/* Market Conditions Card */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
          <BarChart3 size={14} /> Market Conditions
        </h3>

        <div className="mb-4">
          <label className="block text-xs font-medium text-surface-500 mb-1.5">Occupancy Mode</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="occMode"
                checked={input.occupancyMode === "estimate"}
                onChange={() => patch({ occupancyMode: "estimate" })}
                className="radio"
              />
              <span>Estimate (model)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="occMode"
                checked={input.occupancyMode === "actual"}
                onChange={() => patch({ occupancyMode: "actual" })}
                className="radio"
              />
              <span>Actual (in-game)</span>
            </label>
          </div>
        </div>

        {input.occupancyMode === "actual" && (
          <NumberInputGroup
            label="Actual Occupancy %"
            value={input.actualOccupancy * 100}
            onChange={v => {
              const val = Math.min(0.95, Math.max(0.03, v / 100));
              patch({ actualOccupancy: val });
            }}
            min={3}
            max={95}
            step={0.1}
            suffix="%"
          />
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NumberInputGroup
            label="Restaurant Count"
            value={input.market.restaurantCount}
            onChange={v => patchMarket({ restaurantCount: v })}
            min={1}
            max={5000}
            step={1}
          />
          <NumberInputGroup
            label="Avg Market Rating"
            value={input.market.avgMarketRating}
            onChange={v => patchMarket({ avgMarketRating: v })}
            min={0}
            max={20}
            step={0.01}
          />
          <NumberInputGroup
            label="Avg Market Price"
            value={input.market.avgMarketPrice}
            onChange={v => patchMarket({ avgMarketPrice: v })}
            min={1}
            max={500}
            step={1}
            prefix="$"
          />
          <NumberInputGroup
            label="Restaurants Owned"
            value={input.market.restaurantsOwned}
            onChange={v => patchMarket({ restaurantsOwned: v })}
            min={0}
            max={50}
            step={1}
          />
        </div>

        <div className="mt-3 text-xs text-surface-500">
          Phase: <span className="font-semibold">{input.market.phase ?? "unknown"}</span>{" "}
          {weights.phaseFactor !== 1 && (
            <span className="ml-2 text-amber-600">(demand factor: {weights.phaseFactor.toFixed(2)}×)</span>
          )}
        </div>

        <div className="mt-2 text-xs text-surface-500 font-mono">
          Breakdown: base {pct(breakdown.baseOccupancy)} × competition {breakdown.competition.toFixed(2)} × phase{" "}
          {breakdown.phaseFactor.toFixed(2)} × supply {breakdown.supplyFactor.toFixed(4)} = {pct(occupancy)}
        </div>

        <div className="mt-2 text-xs text-surface-500">
          Data sources: {loadedSources.length ? loadedSources.join(", ") : "none (neutral fallbacks)"}
          {fallbackSources.length > 0 && (
            <span className="ml-2 text-amber-600">Fallback: {fallbackSources.join(", ")}</span>
          )}
        </div>
        {pricesLoadedAt && (
          <div className="mt-1 text-xs text-surface-500">
            Prices loaded at {pricesLoadedAt}{retailLoadedAt && ` · Retail data loaded at ${retailLoadedAt}`}
          </div>
        )}
      </div>

      {/* Results Strip */}
      <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <ResultCard label="Occupancy" value={pct(occupancy)} />
        <ResultCard label="Seats" value={profit.seats.toLocaleString()} />
        <ResultCard label="Meals / Cycle" value={Math.round(profit.mealsServed).toLocaleString()} />
        <ResultCard label="Revenue" value={fmtCurrency(profit.revenue)} />
        <ResultCard label="Food Cost" value={fmtCurrency(profit.foodCost)} />
        <ResultCard label="Wages" value={fmtCurrency(profit.wages)} />
        <ResultCard label="Profit / Cycle" value={signedMoney(profit.profitPerCycle)} color={profit.profitPerCycle >= 0 ? "emerald" : "rose"} />
        <ResultCard
          label="Break-even Occ."
          value={pct(profit.breakEvenOccupancy)}
          color={profit.belowBreakEven ? "rose" : "emerald"}
        />
      </div>

      {/* Menu Builder */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Menu Builder</h3>
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <span className="cursor-pointer hover:text-brand-600" title="Reset to preset">
              <RotateCcw size={12} onClick={() => patch({ selectedItemIds: [...PRESETS[input.mode].itemIds] })} className="cursor-pointer hover:text-brand-600" />
            </span>
            <span>Spoilage: food consumed per cycle regardless of sales</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {CATEGORY_ORDER.map(category => {
            const items = RESTAURANT_MENU_ITEMS.filter(i => i.category === category);
            const selected = items.filter(i => selectedSet.has(i.id));
            const mult = countMultiplier(selected.length);
            const totalUnits = selected.reduce((sum, i) => {
              const row = rows.find(r => r.item.id === i.id);
              return sum + (row?.units ?? 0);
            }, 0);
            const catFoodCost = selected.reduce((sum, i) => {
              const row = rows.find(r => r.item.id === i.id);
              return sum + (row?.lineCost ?? 0);
            }, 0);

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-surface-200 dark:border-surface-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500">
                    {CATEGORY_LABELS[category]} <span className="font-normal text-surface-400">({selected.length})</span>
                  </h4>
                  <span className="text-xs text-surface-400">Mult: {mult.toFixed(2)}×</span>
                </div>

                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {items.map(item => {
                    const isSelected = selectedSet.has(item.id);
                    const row = rows.find(r => r.item.id === item.id);
                    const mkt = marketRowById.get(item.id);
                    const demand = mkt?.demand ?? null;
                    const unitCost = plannerInput.unitCosts[item.id] ?? 0;
                    const hasCost = unitCost > 0;
                    const isManual = input.unitCosts[item.id] !== undefined;

                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-brand-50 dark:bg-brand-900/20 border-brand-200"
                            : "bg-white dark:bg-surface-900 border-surface-200 hover:border-brand-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
                        />
                        <span className="flex-1 text-sm font-medium text-surface-800 dark:text-white truncate">
                          {item.name}
                        </span>
                        {isSelected && (
                          <>
                            <span className="text-xs font-mono text-surface-600 dark:text-surface-400 w-14 text-right">
                              {row?.units.toLocaleString() ?? "—"} u
                            </span>
                            <input
                              type="number"
                              value={unitCost}
                              onChange={e => setManualCost(item.id, Number(e.target.value))}
                              onBlur={e => {
                                const v = Number(e.target.value);
                                if (!Number.isFinite(v) || v < 0) resetCost(item.id);
                              }}
                              className={`w-18 text-right text-xs font-mono border rounded px-2 py-1 ${
                                hasCost ? "bg-white dark:bg-surface-900" : "bg-rose-50 dark:bg-rose-900/30 text-rose-600"
                              }`}
                              placeholder="auto"
                              min={0}
                              step={0.01}
                            />
                            {isManual && (
                              <button
                                onClick={() => resetCost(item.id)}
                                className="text-xs text-surface-400 hover:text-brand-600"
                                title="Reset to market price"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                            {mkt && demand !== null && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${demandPill(demand)}`}
                              >
                                {pct(demand, 0)} demand
                              </span>
                            )}
                            {!hasCost && (
                              <span className="text-xs text-rose-600">no cost</span>
                            )}
                          </>
                        )}
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-surface-200 dark:border-surface-700 text-xs text-surface-500">
                  Total units: <span className="font-semibold">{totalUnits.toLocaleString()}</span> · Cost:{' '}
                  <span className="font-semibold">{fmtCurrency(catFoodCost)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          <Flame size={14} className="inline mr-1" />
          <strong>Spoilage:</strong> All menu food is consumed or spoiled each 12h cycle whether sold or not. COGS does not scale with occupancy.
        </div>
      </div>

      {/* Menu Market Panel */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Menu Market Pressure</h3>
          <button
            onClick={() => setShowMarketTable(!showMarketTable)}
            className="text-xs text-brand-600 hover:underline flex items-center gap-1"
          >
            {showMarketTable ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Details
          </button>
        </div>

        {showMarketTable && marketRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-surface-500 border-b border-surface-200 dark:border-surface-700">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-right">Saturation</th>
                  <th className="pb-2 text-right">Demand</th>
                  <th className="pb-2 text-right">Market Units/Day</th>
                  <th className="pb-2 text-right">Own Units/Day</th>
                  <th className="pb-2 text-right">Own Share</th>
                  <th className="pb-2 text-right">Sat. After</th>
                  <th className="pb-2 text-right">Demand After</th>
                </tr>
              </thead>
              <tbody>
                {marketRows.map(row => (
                  <tr key={row.itemId} className="border-b border-surface-100 dark:border-surface-800">
                    <td className="py-2 font-medium text-surface-800 dark:text-white">{row.name}</td>
                    <td className="py-2 text-right font-mono">
                      {row.saturation !== null ? row.saturation.toFixed(3) : "—"}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {row.demand !== null ? pct(row.demand, 0) : "—"}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {row.marketUnitsPerDay !== null ? row.marketUnitsPerDay.toLocaleString() : "unknown"}
                    </td>
                    <td className="py-2 text-right font-mono">{row.ownUnitsPerDay.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono">{pct(row.ownShare, 2)}</td>
                    <td className="py-2 text-right font-mono">
                      {row.saturationAfter !== null ? row.saturationAfter.toFixed(3) : "—"}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {row.demandAfter !== null ? pct(row.demandAfter, 0) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showMarketTable && marketRows.length === 0 && (
          <p className="text-sm text-surface-500 text-center py-4">No market data for selected items.</p>
        )}
      </div>

      {/* Assumptions & Data Panel */}
      <details className="card">
        <summary className="p-4 cursor-pointer flex items-center gap-2">
          <Gauge size={16} /> Assumptions & Data Sources
        </summary>
        <div className="px-4 pb-4 space-y-2 text-xs text-surface-500">
          <p>• 12-hour cycles, 2 cycles/day. Food placed on menu is consumed or spoiled per cycle.</p>
          <p>• Economy: 1000 seats/level, 1× wages, 1× food. Luxury: 500 seats/level, 0.5× wages, 0.5× food, 1.5× rating effect.</p>
          <p>• Menu price clamped to $60–$350. Occupancy clamped to 3%–95%.</p>
          <p>• Item demand: <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1 rounded">clamp(1 - saturation/2, 0, 1)</span> (live API verified).</p>
          <p>• Occupancy model: offer vs. market offer, restaurant count, economic phase, own supply. Not the game's exact formula.</p>
          <p>• Rating estimate: quality, variety, food cost/seat, sales speed, CMO, staff. Labeled estimate; override with actual.</p>
          <p>• Professional staff: +1.0 estimated rating, 5× wages. Low/High quality: explanatory only.</p>
          <p>• <a href="https://www.simcompanies.com/pages/restaurant-guide/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-600">Official Restaurant Guide</a></p>
          <p className="text-rose-600 dark:text-rose-400">
            <strong>PvP Warning:</strong> Restaurants compete for finite customers. Profit is theoretical until you out-rate competitors.
          </p>
        </div>
      </details>
    </div>
  );
}

function NumberInputGroup({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-surface-500 mb-1.5">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={e => onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(e.target.value))))}
          className={`w-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">{suffix}</span>}
      </div>
    </div>
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
