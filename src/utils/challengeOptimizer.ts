import { RESOURCES, BUILDINGS, PHASE_MULTIPLIERS, MAT_REF_PRICES } from "../data/simco_static";

export interface OptimizerInputs {
  // Challenge constraints
  maxSlots: number;
  startingCash: number;
  targetTrucks: number;           // PRODUCTION target (not sales)
  truckQuality: number;
  economyPhase: "boom" | "normal" | "recession";
  productionMultiplier: number;   // multiplier for truck production rate (default 2.0 for current game)
  
  // Starting buildings (can be demolished)
  startingBuildings: Array<{ buildingId: string; level: number }>;
  
  // Live prices from API (realm 2)
  marketPrices: Record<number, number>; // resourceId -> Q0 price
  retailPrices: Record<number, number>; // resourceId -> retail price (for profit calc only)
  retailSaturation: Record<number, number>; // resourceId -> saturation (for retail capacity calc)
  
  // Configurable parameters
  qualityPriceMultiplier: number; // % per quality level (default 0.05 = 5%)
  demolitionRefundRate: number;   // fraction of level 1 material cost refunded per level (default 0.15)
  retailBaseRate: number;         // base trucks/hour per dealership level (default 10)
  retailCapacityOverride: number | null; // manual override for retail capacity (trucks/hour)
}

export interface BuildingPlan {
  buildingId: string;
  level: number;
  count: number;
}

export interface OptimizedPlan {
  buildings: BuildingPlan[];
  totalSlots: number;
  constructionTime: number;       // hours (parallel)
  constructionCost: number;       // cash
  demolitionRefund: number;       // material value refunded (not cash)
  truckOutputPerHour: number;     // trucks/hour PRODUCTION
  retailCapacityPerHour: number;  // trucks/hour RETAIL CAPACITY (from API data)
  productionTimeHours: number;    // hours to PRODUCE target trucks
  sellThroughTimeHours: number;   // hours to SELL target trucks at retail
  totalTimeToTarget: number;      // construction + max(production, sell-through)
  netProfitPerHour: number;       // profit from selling at retail
  roi: number;                    // monthly %
  cashFlowValid: boolean;
  inputCostPerTruck: number;
  makeBuyDecisions: Map<number, "make" | "buy">;
  cashRemaining: number;
  componentProduction: Map<number, number>; // resourceId -> units/hour produced by plan
  startingProduction: Map<number, number>;  // resourceId -> units/hour from starting buildings
}

// Building construction times per level (hours)
const BUILD_TIMES: Record<string, number[]> = {
  "1": [6, 6, 12, 18, 24, 30, 36, 42, 48, 54],   // Car factory
  "2": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],      // Car dealership
  "D": [7, 7, 14, 21, 28, 35, 42, 49, 56, 63],    // Propulsion factory
  "E": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],      // Power plant
  "T": [2, 2, 4, 6, 8, 10, 12, 14, 16, 18],       // Fashion factory
  "R": [4, 4, 8, 12, 16, 20, 24, 28, 32, 36],     // Refinery
  "Y": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],      // Factory
  "L": [5, 5, 10, 15, 20, 25, 30, 35, 40, 45],    // Electronics factory
  "8": [6, 6, 12, 18, 24, 30, 36, 42, 48, 54],    // Aerospace electronics
  "a": [6, 6, 12, 18, 24, 30, 36, 42, 48, 54],    // Automotive R&D
  "M": [4, 4, 8, 12, 16, 20, 24, 28, 32, 36],     // Mine
  "S": [3, 3, 6, 9, 12, 15, 18, 21, 24, 27],      // Shipping depot
  "Q": [2, 2, 4, 6, 8, 10, 12, 14, 16, 18],       // Quarry
  "O": [4, 4, 8, 12, 16, 20, 24, 28, 32, 36],     // Oil rig
};

function getBuildingName(id: string): string {
  return BUILDINGS.find(b => b.id === id)?.name ?? id;
}

function calcBuildTime(buildingId: string, targetLevel: number, startLevel = 1): number {
  const times = BUILD_TIMES[buildingId];
  if (!times) return (targetLevel - startLevel + 1) * 6;
  return times.slice(startLevel - 1, targetLevel).reduce((a, b) => a + b, 0);
}

function calcBuildCost(buildingId: string, targetLevel: number, startLevel = 1): number {
  const building = BUILDINGS.find(b => b.id === buildingId);
  if (!building || !building.resources) return 0;
  
  let costPerLevel = 0;
  for (const res of building.resources) {
    const price = MAT_REF_PRICES[res.id] || 0;
    costPerLevel += res.qty * price;
  }
  
  let total = 0;
  for (let lvl = startLevel; lvl <= targetLevel; lvl++) {
    total += costPerLevel * lvl;
  }
  return total;
}

function calcDemolitionRefund(buildingId: string, currentLevel: number): number {
  const building = BUILDINGS.find(b => b.id === buildingId);
  if (!building || !building.resources) return 0;
  
  let lvl1MaterialCost = 0;
  for (const res of building.resources) {
    const price = MAT_REF_PRICES[res.id] || 0;
    lvl1MaterialCost += res.qty * price;
  }
  
  return lvl1MaterialCost * currentLevel;
}

// Calculate effective price per unit (make vs buy) - NO transport cost per user decision
function calcEffectivePrice(
  resourceId: number,
  quality: number,
  marketPrices: Record<number, number>,
  makeCostCache: Map<number, number>,
  visited: Set<number>,
  phaseMult: number
): number {
  if (visited.has(resourceId)) return Infinity;
  visited.add(resourceId);

  const resource = RESOURCES.find(r => r.id === resourceId);
  const marketPrice = marketPrices[resourceId] || 0;
  
  if (!resource || !resource.inputs || Object.keys(resource.inputs).length === 0) {
    visited.delete(resourceId);
    return marketPrice > 0 ? marketPrice : (MAT_REF_PRICES[resourceId] || 0);
  }

  let makeCost = 0;
  for (const [inpIdStr, qty] of Object.entries(resource.inputs)) {
    const inpId = Number(inpIdStr);
    const inpPrice = calcEffectivePrice(inpId, quality, marketPrices, makeCostCache, new Set(visited), phaseMult);
    makeCost += inpPrice * qty;
  }

  // Add wages per unit (phase multiplier applies to ALL production)
  const baseWages = resource.baseWages || 0;
  const basePh = resource.basePh || 1;
  const wagePerUnit = baseWages / basePh / phaseMult; // higher phase = more output = lower wage/unit
  
  // NO transport cost per user decision
  makeCost += wagePerUnit;
  makeCostCache.set(resourceId, makeCost);
  visited.delete(resourceId);

  return marketPrice > 0 ? Math.min(makeCost, marketPrice) : makeCost;
}

function calculateStartingProduction(startingBuildings: Array<{ buildingId: string; level: number }>, phaseMult: number): Map<number, number> {
  const production = new Map<number, number>();
  
  for (const sb of startingBuildings) {
    const building = BUILDINGS.find(b => b.id === sb.buildingId);
    if (!building) continue;
    
    const resource = RESOURCES.find(r => r.buildingId === sb.buildingId);
    if (!resource || !resource.basePh) continue;
    
    const outputPerHour = resource.basePh * sb.level * phaseMult;
    production.set(resource.id, (production.get(resource.id) || 0) + outputPerHour);
  }
  
  return production;
}

function evaluatePlan(
  buildings: BuildingPlan[],
  inputs: OptimizerInputs,
  startingBuildings: Array<{ buildingId: string; level: number }> = []
): OptimizedPlan | null {
  const { maxSlots, startingCash, targetTrucks, truckQuality, economyPhase, productionMultiplier, marketPrices, retailPrices, qualityPriceMultiplier, demolitionRefundRate } = inputs;
  
  const phaseMult = PHASE_MULTIPLIERS[economyPhase] || 1.0;
  
  // Build map of starting building levels
  const startingLevels = new Map<string, number>();
  for (const sb of startingBuildings) {
    startingLevels.set(sb.buildingId, sb.level);
  }
  
  // Validate slots
  const totalSlots = buildings.reduce((sum, b) => sum + b.count, 0);
  if (totalSlots > maxSlots) {
    console.log('[evaluatePlan] FAIL: totalSlots', totalSlots, '>', maxSlots);
    return null;
  }

  // Validate required buildings
  const hasCarFactory = buildings.some(b => b.buildingId === "1");
  const hasDealership = buildings.some(b => b.buildingId === "2");
  if (!hasCarFactory || !hasDealership) {
    console.log('[evaluatePlan] FAIL: missing required buildings', { hasCarFactory, hasDealership });
    return null;
  }

  // Validate construction cost + demolition refund (upgrade cost from starting level)
  let constructionCost = 0;
  let demolitionRefund = 0;
  let constructionTime = 0;
  
  for (const b of buildings) {
    const startLevel = startingLevels.get(b.buildingId) || 1;
    if (b.level > startLevel) {
      // Upgrade: pay for new levels only
      constructionCost += calcBuildCost(b.buildingId, b.level, startLevel) * b.count;
      constructionTime = Math.max(constructionTime, calcBuildTime(b.buildingId, b.level, startLevel));
    } else if (b.level === startLevel) {
      // Keep as-is: no cost, no time
    } else {
      // Demolish and rebuild lower: refund materials from starting, pay for new
      demolitionRefund += calcDemolitionRefund(b.buildingId, startLevel) * demolitionRefundRate;
      constructionCost += calcBuildCost(b.buildingId, b.level, 1) * b.count;
      constructionTime = Math.max(constructionTime, calcBuildTime(b.buildingId, b.level, 1));
    }
  }
  
  const netConstructionCost = constructionCost - demolitionRefund;
  if (netConstructionCost > startingCash) {
    console.log('[evaluatePlan] FAIL: netConstructionCost', netConstructionCost, '>', startingCash);
    return null;
  }

  // Calculate make/buy decisions for all truck components
  const truckResource = RESOURCES.find(r => r.id === 57);
  if (!truckResource?.inputs) {
    console.log('[evaluatePlan] FAIL: truckResource not found or no inputs');
    return null;
  }

  const makeCostCache = new Map<number, number>();
  const makeBuyDecisions = new Map<number, "make" | "buy">();
  let inputCostPerTruck = 0;

  for (const [inpIdStr, qty] of Object.entries(truckResource.inputs)) {
    const inpId = Number(inpIdStr);
    const visited = new Set<number>();
    const makeCost = calcEffectivePrice(inpId, truckQuality, marketPrices, makeCostCache, visited, phaseMult);
    const marketPrice = marketPrices[inpId] || 0;
    
    const decision = makeCost < marketPrice ? "make" : "buy";
    const effectivePrice = decision === "make" ? makeCost : marketPrice;
    
    makeBuyDecisions.set(inpId, decision);
    inputCostPerTruck += effectivePrice * qty;
  }

  // Calculate component production from plan buildings
  const componentProduction = new Map<number, number>();
  for (const b of buildings) {
    const resource = RESOURCES.find(r => r.buildingId === b.buildingId);
    if (!resource || !resource.basePh) continue;
    
    const outputPerHour = resource.basePh * b.level * phaseMult * b.count;
    componentProduction.set(resource.id, (componentProduction.get(resource.id) || 0) + outputPerHour);
  }

  // Calculate starting building production
  const startingProduction = calculateStartingProduction(startingBuildings, phaseMult);

  // COUPLING: Verify every "make" decision has sufficient production capacity
  for (const [inpId, decision] of makeBuyDecisions) {
    if (decision === "make") {
      const truckResource = RESOURCES.find(r => r.id === 57);
      const neededPerTruck = truckResource?.inputs?.[inpId] || 0;
      const neededPerHour = neededPerTruck; // for 1 truck/hour base
      
      const totalProduction = (componentProduction.get(inpId) || 0) + (startingProduction.get(inpId) || 0);
      if (totalProduction < neededPerHour * 0.1) { // need at least 10% of 1 truck/hour capacity
        console.log('[evaluatePlan] FAIL: insufficient production for', inpId, 'totalProduction', totalProduction, '< needed', neededPerHour * 0.1);
        return null; // insufficient production capacity for this component
      }
    }
  }

  // Find car factory and dealership
  const carFactory = buildings.find(b => b.buildingId === "1");
  const dealership = buildings.find(b => b.buildingId === "2");
  
  if (!carFactory || !dealership) {
    console.log('[evaluatePlan] FAIL: carFactory or dealership not in plan');
    return null;
  }

  // PRODUCTION rate (trucks/hour produced) - productionMultiplier applies here
  const basePh = 2.8; // Truck base per hour at L1
  const prodMult = inputs.productionMultiplier || 2.0; // user default 2x
  const truckOutputPerHour = basePh * phaseMult * prodMult * carFactory.level * carFactory.count;

  // Retail capacity from API data (dealership sales rate)
  // Use retailPrices[57] for price, retailSaturation[57] for capacity adjustment
  const truckRetailPrice = retailPrices[57] || marketPrices[57] || MAT_REF_PRICES[57] || 446;
  const truckSaturation = inputs.retailSaturation?.[57] || 1.0;
  
  // Retail capacity: manual override takes precedence, else use saturation-adjusted formula
  let retailCapacityPerHour: number;
  if (inputs.retailCapacityOverride !== null && inputs.retailCapacityOverride > 0) {
    retailCapacityPerHour = inputs.retailCapacityOverride;
  } else {
    const baseRate = inputs.retailBaseRate || 10;
    // Saturation < 1 = undersaturated = higher sales rate; > 1 = oversaturated = lower
    const saturationMult = 1 / truckSaturation;
    retailCapacityPerHour = baseRate * saturationMult * dealership.level * dealership.count;
  }

  // PRODUCTION time to target
  if (truckOutputPerHour <= 0) {
    console.log('[evaluatePlan] FAIL: truckOutputPerHour <= 0');
    return null;
  }
  const productionTimeHours = targetTrucks / truckOutputPerHour;

  // SELL-THROUGH time at retail capacity
  const trucksSoldPerHour = Math.min(truckOutputPerHour, retailCapacityPerHour);
  if (trucksSoldPerHour <= 0) {
    console.log('[evaluatePlan] FAIL: trucksSoldPerHour <= 0, retailCapacityPerHour', retailCapacityPerHour);
    return null;
  }
  const sellThroughTimeHours = targetTrucks / trucksSoldPerHour;

  // Revenue from selling at retail
  const qualityMult = 1 + truckQuality * qualityPriceMultiplier;
  const sellingPrice = truckRetailPrice * qualityMult;
  const grossRevenuePerHour = trucksSoldPerHour * sellingPrice;

  // Costs per hour
  const marketFeePerHour = grossRevenuePerHour * 0.03;
  // NO transport cost per user decision
  const inputCostPerHour = trucksSoldPerHour * inputCostPerTruck;

  // Wages (phase multiplier increases output, reducing wage/unit)
  let hourlyWages = 0;
  for (const b of buildings) {
    const building = BUILDINGS.find(bld => bld.id === b.buildingId);
    if (building) {
      hourlyWages += (building.wages * b.level) * b.count;
    }
  }
  // Add starting building wages
  for (const sb of startingBuildings) {
    const building = BUILDINGS.find(bld => bld.id === sb.buildingId);
    if (building) {
      hourlyWages += (building.wages * sb.level);
    }
  }
  const overheadPerHour = hourlyWages * 0.15;

  const netProfitPerHour = grossRevenuePerHour - marketFeePerHour - inputCostPerHour - hourlyWages - overheadPerHour;

  // ROI
  const roi = netConstructionCost > 0 ? (netProfitPerHour * 24 * 30) / netConstructionCost * 100 : 0;

  // Total time = construction + max(production, sell-through)
  const totalTimeToTarget = constructionTime + Math.max(productionTimeHours, sellThroughTimeHours);

  // Cash flow validation: need cash for construction + operating until first revenue
  // First revenue at: constructionTime + (1 / trucksSoldPerHour) hours
  const timeToFirstSale = constructionTime + (1 / trucksSoldPerHour);
  const operatingCashNeeded = (inputCostPerHour + hourlyWages + overheadPerHour) * timeToFirstSale;
  const cashRemaining = startingCash - netConstructionCost - operatingCashNeeded;
  const cashFlowValid = cashRemaining >= 0;
  
  if (!cashFlowValid) {
    console.log('[evaluatePlan] FAIL: cashFlowValid false, totalCashNeeded', startingCash - cashRemaining, '>', startingCash, 'timeToFirstSale', timeToFirstSale);
  }
  if (netProfitPerHour <= 0) {
    console.log('[evaluatePlan] FAIL: netProfitPerHour <= 0', netProfitPerHour);
  }

  return {
    buildings,
    totalSlots,
    constructionTime,
    constructionCost: netConstructionCost,
    demolitionRefund,
    truckOutputPerHour,
    retailCapacityPerHour,
    productionTimeHours,
    sellThroughTimeHours,
    totalTimeToTarget,
    netProfitPerHour,
    roi,
    cashFlowValid,
    inputCostPerTruck,
    makeBuyDecisions,
    cashRemaining,
    componentProduction,
    startingProduction,
  };
}

// Generate building combinations using beam search (not exhaustive) to avoid freezing
function generateBuildingCombinations(inputs: OptimizerInputs): BuildingPlan[][] {
  const { maxSlots, startingBuildings, startingCash } = inputs;
  
  // Building types that can be used (production + retail) - LIMITED to essential ones
  const buildingTypes = [
    { id: "1", name: "Car Factory", maxLevel: 5, required: true },      // Truck production
    { id: "2", name: "Car Dealership", maxLevel: 5, required: true },   // Retail (for profit)
    { id: "D", name: "Propulsion Factory", maxLevel: 4 }, // Engines
    { id: "Y", name: "Factory", maxLevel: 4 },           // Steel, Alu, Basic Interior, Car Body
    { id: "L", name: "Electronics Factory", maxLevel: 4 }, // OBC, Displays
    { id: "E", name: "Power Plant", maxLevel: 3 },       // Power
    { id: "R", name: "Refinery", maxLevel: 3 },          // Plastic, Chemicals
  ];

  // Start with existing buildings
  const baseBuildings = new Map<string, number>();
  for (const sb of startingBuildings) {
    baseBuildings.set(sb.buildingId, sb.level);
  }

  // Beam search: keep only top N partial combinations at each step
  const BEAM_WIDTH = 50; // Maximum partial combinations to keep per step
  const MAX_TIME_MS = 3000; // 3 second hard limit
  const startTime = Date.now();

  type PartialCombo = {
    plans: BuildingPlan[];
    slotsUsed: number;
    cashSpent: number;
    hasCarFactory: boolean;
    hasDealership: boolean;
    index: number;
  };

  let beam: PartialCombo[] = [{
    plans: [],
    slotsUsed: 0,
    cashSpent: 0,
    hasCarFactory: false,
    hasDealership: false,
    index: 0,
  }];

  for (const bt of buildingTypes) {
    // Timeout check at each building type
    if (Date.now() - startTime > MAX_TIME_MS) break;

    const existingLevel = baseBuildings.get(bt.id) || 0;
    const newBeam: PartialCombo[] = [];

    for (const partial of beam) {
      // Option 1: Don't build this type (demolish if exists, unless required)
      if (!bt.required || existingLevel === 0) {
        newBeam.push({
          ...partial,
          index: partial.index + 1,
        });
      }

      // Option 2: Keep existing building as-is
      if (existingLevel > 0) {
        const newPlan: BuildingPlan = { buildingId: bt.id, level: existingLevel, count: 1 };
        newBeam.push({
          plans: [...partial.plans, newPlan],
          slotsUsed: partial.slotsUsed + 1,
          cashSpent: partial.cashSpent,
          hasCarFactory: partial.hasCarFactory || bt.id === "1",
          hasDealership: partial.hasDealership || bt.id === "2",
          index: partial.index + 1,
        });
      }

      // Option 3: Build/upgrade - only consider a few promising levels
      // Limit: try at most 2 levels (existing+1, and maxLevel) and 1 count for non-essential
      const levelsToTry = existingLevel > 0 
        ? [existingLevel + 1, bt.maxLevel].filter(l => l <= bt.maxLevel)
        : [1, Math.min(3, bt.maxLevel)]; // Start with level 1, maybe 2, 3
      
      const maxCount = (bt.id === "1" || bt.id === "2") ? 2 : 1;
      
      for (const level of levelsToTry) {
        for (let count = 1; count <= maxCount; count++) {
          const newSlots = partial.slotsUsed + count;
          if (newSlots > maxSlots) continue;

          const startLevelForCost = existingLevel > 0 ? existingLevel + 1 : 1;
          const buildCost = calcBuildCost(bt.id, level, startLevelForCost) * count;
          const newCash = partial.cashSpent + buildCost;
          if (newCash > startingCash) continue;

          const newPlan: BuildingPlan = { buildingId: bt.id, level, count };
          newBeam.push({
            plans: [...partial.plans, newPlan],
            slotsUsed: newSlots,
            cashSpent: newCash,
            hasCarFactory: partial.hasCarFactory || bt.id === "1",
            hasDealership: partial.hasDealership || bt.id === "2",
            index: partial.index + 1,
          });
        }
      }
    }

    // Prune beam: keep only top BEAM_WIDTH by estimated potential
    beam = newBeam
      .sort((a, b) => {
        // Prefer combinations that have both required buildings and use more slots efficiently
        const aScore = (a.hasCarFactory && a.hasDealership ? 1000 : 0) + a.slotsUsed * 10 - a.cashSpent / 10000;
        const bScore = (b.hasCarFactory && b.hasDealership ? 1000 : 0) + b.slotsUsed * 10 - b.cashSpent / 10000;
        return bScore - aScore;
      })
      .slice(0, BEAM_WIDTH);
  }

  // Convert completed beam to final combinations
  const finalCombos = beam
    .filter(p => p.hasCarFactory && p.hasDealership && p.plans.length > 0)
    .map(p => p.plans);
  console.log('[challengeOptimizer] generateBuildingCombinations: beam size', beam.length, 'final combos', finalCombos.length);
  return finalCombos;
}

export function optimizeChallenge(inputs: OptimizerInputs): OptimizedPlan[] {
  const combinations = generateBuildingCombinations(inputs);
  console.log('[challengeOptimizer] optimizeChallenge: combinations to evaluate', combinations.length);
  console.log('[challengeOptimizer] inputs:', { maxSlots: inputs.maxSlots, startingCash: inputs.startingCash, targetTrucks: inputs.targetTrucks, truckSaturation: inputs.retailSaturation?.[57] });
  
  const validPlans: OptimizedPlan[] = [];
  
  for (const combo of combinations) {
    const plan = evaluatePlan(combo, inputs, inputs.startingBuildings);
    if (!plan) {
      console.log('[challengeOptimizer] evaluatePlan returned null for combo:', combo);
      continue;
    }
    if (plan.cashFlowValid && plan.netProfitPerHour > 0) {
      validPlans.push(plan);
    } else {
      console.log('[challengeOptimizer] plan rejected:', { cashFlowValid: plan.cashFlowValid, netProfitPerHour: plan.netProfitPerHour, totalTimeToTarget: plan.totalTimeToTarget });
    }
  }

  console.log('[challengeOptimizer] valid plans:', validPlans.length);

  // Sort by total time to target (ascending), then by ROI (descending)
  validPlans.sort((a, b) => {
    if (a.totalTimeToTarget !== b.totalTimeToTarget) {
      return a.totalTimeToTarget - b.totalTimeToTarget;
    }
    return b.roi - a.roi;
  });

  return validPlans.slice(0, 10); // Top 10
}

export function formatTime(hours: number): string {
  if (hours === Infinity) return "∞";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return h === 0 ? `${days}d` : `${days}d ${h}h`;
}