import { RESOURCES, BUILDINGS, PHASE_MULTIPLIERS, MAT_REF_PRICES } from "../data/simco_static";

export interface OptimizerInputs {
  // Challenge constraints
  maxSlots: number;
  startingCash: number;
  targetTrucks: number;           // PRODUCTION target (not sales)
  truckQuality: number;
  economyPhase: "boom" | "normal" | "recession";
  productionMultiplier: number;   // multiplier for truck production rate (default ~5.4 for current game)
  
  // Starting buildings (can be demolished)
  startingBuildings: Array<{ buildingId: string; level: number }>;
  
  // Live prices
  marketPrices: Record<number, number>; // resourceId -> Q0 price
  retailPrices: Record<number, number>; // resourceId -> retail price (for profit calc only)
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
  truckOutputPerHour: number;     // trucks/hour PRODUCTION
  retailCapacityPerHour: number;  // trucks/hour RETAIL CAPACITY
  productionTimeHours: number;    // hours to PRODUCE target trucks
  totalTimeToTarget: number;      // construction + production (NOT retail sell-through)
  netProfitPerHour: number;       // profit from selling at retail
  roi: number;                    // monthly %
  cashFlowValid: boolean;
  inputCostPerTruck: number;
  makeBuyDecisions: Map<number, "make" | "buy">;
  cashRemaining: number;
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
};

function getBuildingName(id: string): string {
  return BUILDINGS.find(b => b.id === id)?.name ?? id;
}

function calcBuildTime(buildingId: string, targetLevel: number, startLevel = 1): number {
  const times = BUILD_TIMES[buildingId];
  if (!times) return (targetLevel - startLevel + 1) * 6;
  // Sum from startLevel to targetLevel (inclusive)
  return times.slice(startLevel - 1, targetLevel).reduce((a, b) => a + b, 0);
}

function calcBuildCost(buildingId: string, targetLevel: number, startLevel = 1): number {
  const building = BUILDINGS.find(b => b.id === buildingId);
  if (!building || !building.resources) return 0;
  
  // Calculate cost per level using actual material quantities × reference prices
  let costPerLevel = 0;
  for (const res of building.resources) {
    const price = MAT_REF_PRICES[res.id] || 0;
    costPerLevel += res.qty * price;
  }
  
  // Game scales quantities linearly: L1=1×, L2=2×, L3=3×, etc.
  // Cost from startLevel to targetLevel (inclusive)
  let total = 0;
  for (let lvl = startLevel; lvl <= targetLevel; lvl++) {
    total += costPerLevel * lvl;
  }
  return total;
}

// Calculate effective price per unit (make vs buy)
function calcEffectivePrice(
  resourceId: number,
  quality: number,
  marketPrices: Record<number, number>,
  makeCostCache: Map<number, number>,
  visited: Set<number>
): number {
  if (visited.has(resourceId)) return Infinity;
  visited.add(resourceId);

  const resource = RESOURCES.find(r => r.id === resourceId);
  const marketPrice = marketPrices[resourceId] || 0;
  
  if (!resource || !resource.inputs || Object.keys(resource.inputs).length === 0) {
    visited.delete(resourceId);
    return marketPrice > 0 ? marketPrice : (MAT_REF_PRICES[resourceId] || 0);
  }

  // Calculate make cost
  let makeCost = 0;
  for (const [inpIdStr, qty] of Object.entries(resource.inputs)) {
    const inpId = Number(inpIdStr);
    const inpPrice = calcEffectivePrice(inpId, quality, marketPrices, makeCostCache, new Set(visited));
    makeCost += inpPrice * qty;
  }

  // Add wages per unit
  const baseWages = resource.baseWages || 0;
  const basePh = resource.basePh || 1;
  const wagePerUnit = baseWages / basePh;
  
  // Add transport cost
  const transport = resource.transport || 0;
  const transportCostPerUnit = (makeCost + wagePerUnit) * transport * 0.01;
  
  makeCost += wagePerUnit + transportCostPerUnit;
  makeCostCache.set(resourceId, makeCost);
  visited.delete(resourceId);

  // Return cheaper of make vs buy
  return marketPrice > 0 ? Math.min(makeCost, marketPrice) : makeCost;
}

function evaluatePlan(
  buildings: BuildingPlan[],
  inputs: OptimizerInputs,
  startingBuildings: Array<{ buildingId: string; level: number }> = []
): OptimizedPlan | null {
  const { maxSlots, startingCash, targetTrucks, truckQuality, economyPhase, productionMultiplier, marketPrices, retailPrices } = inputs;
  
  // Build map of starting building levels
  const startingLevels = new Map<string, number>();
  for (const sb of startingBuildings) {
    startingLevels.set(sb.buildingId, sb.level);
  }
  
  // Validate slots
  const totalSlots = buildings.reduce((sum, b) => sum + b.count, 0);
  if (totalSlots > maxSlots) return null;

  // Validate construction cost (upgrade cost from starting level)
  let constructionCost = 0;
  let constructionTime = 0;
  for (const b of buildings) {
    const startLevel = startingLevels.get(b.buildingId) || 1;
    constructionCost += calcBuildCost(b.buildingId, b.level, startLevel) * b.count;
    constructionTime = Math.max(constructionTime, calcBuildTime(b.buildingId, b.level, startLevel));
  }
  if (constructionCost > startingCash) return null;

  // Calculate make/buy decisions for all truck components
  const truckResource = RESOURCES.find(r => r.id === 57);
  if (!truckResource?.inputs) return null;

  const makeCostCache = new Map<number, number>();
  const makeBuyDecisions = new Map<number, "make" | "buy">();
  let inputCostPerTruck = 0;

  for (const [inpIdStr, qty] of Object.entries(truckResource.inputs)) {
    const inpId = Number(inpIdStr);
    const visited = new Set<number>();
    const makeCost = calcEffectivePrice(inpId, truckQuality, marketPrices, makeCostCache, visited);
    const marketPrice = marketPrices[inpId] || 0;
    
    const decision = makeCost < marketPrice ? "make" : "buy";
    const effectivePrice = decision === "make" ? makeCost : marketPrice;
    
    makeBuyDecisions.set(inpId, decision);
    inputCostPerTruck += effectivePrice * qty;
  }

  // Find car factory and dealership
  const carFactory = buildings.find(b => b.buildingId === "1");
  const dealership = buildings.find(b => b.buildingId === "2");
  
  if (!carFactory || !dealership) return null;

  // PRODUCTION rate (trucks/hour produced)
  const basePh = 2.8; // Truck base per hour at L1 (legacy static data)
  const phaseMult = PHASE_MULTIPLIERS[economyPhase] || 1.0;
  const prodMult = inputs.productionMultiplier || 5.4; // community-derived multiplier for current game version
  const truckOutputPerHour = basePh * phaseMult * prodMult * carFactory.level * carFactory.count;

  // Retail capacity (trucks/hour that can be SOLD for profit)
  const retailCapacityPerHour = 10 * dealership.level * dealership.count;

  // PRODUCTION time to target (NOT retail sell-through)
  if (truckOutputPerHour <= 0) return null;
  const productionTimeHours = targetTrucks / truckOutputPerHour;

  // Revenue from selling at retail (for profit calculation)
  const trucksSoldPerHour = Math.min(truckOutputPerHour, retailCapacityPerHour);
  if (trucksSoldPerHour <= 0) return null;

  const truckRetailPrice = retailPrices[57] || marketPrices[57] || MAT_REF_PRICES[57] || 446;
  const qualityMult = 1 + truckQuality * 0.05;
  const sellingPrice = truckRetailPrice * qualityMult;
  const grossRevenuePerHour = trucksSoldPerHour * sellingPrice;

  // Costs per hour
  const marketFeePerHour = grossRevenuePerHour * 0.03;
  const transportPerHour = grossRevenuePerHour * 5 * 0.01;
  const inputCostPerHour = trucksSoldPerHour * inputCostPerTruck;

  // Wages
  let hourlyWages = 0;
  for (const b of buildings) {
    const building = BUILDINGS.find(bld => bld.id === b.buildingId);
    if (building) {
      hourlyWages += (building.wages * b.level) * b.count;
    }
  }
  const overheadPerHour = hourlyWages * 0.15;

  const netProfitPerHour = grossRevenuePerHour - marketFeePerHour - transportPerHour - inputCostPerHour - hourlyWages - overheadPerHour;

  // ROI
  const roi = constructionCost > 0 ? (netProfitPerHour * 24 * 30) / constructionCost * 100 : 0;

  // Total time = construction + PRODUCTION (not retail sell-through)
  const totalTimeToTarget = constructionTime + productionTimeHours;

  // Cash flow validation: need cash for construction + operating until first revenue
  const operatingCashNeeded = (inputCostPerHour + hourlyWages + overheadPerHour) * 24;
  const cashRemaining = startingCash - constructionCost - operatingCashNeeded;
  const cashFlowValid = cashRemaining >= 0;

  return {
    buildings,
    totalSlots,
    constructionTime,
    constructionCost,
    truckOutputPerHour,
    retailCapacityPerHour,
    productionTimeHours,
    totalTimeToTarget,
    netProfitPerHour,
    roi,
    cashFlowValid,
    inputCostPerTruck,
    makeBuyDecisions,
    cashRemaining,
  };
}

// Generate all valid building combinations
function generateBuildingCombinations(inputs: OptimizerInputs): BuildingPlan[][] {
  const { maxSlots, startingBuildings } = inputs;
  
  // Building types that can be used (production + retail)
  const buildingTypes = [
    { id: "1", name: "Car Factory", maxLevel: 5 },      // Truck production
    { id: "2", name: "Car Dealership", maxLevel: 5 },   // Retail (for profit)
    { id: "D", name: "Propulsion Factory", maxLevel: 4 }, // Engines
    { id: "Y", name: "Factory", maxLevel: 4 },           // Steel, Alu, Basic Interior, Car Body
    { id: "L", name: "Electronics Factory", maxLevel: 4 }, // OBC, Displays
    { id: "T", name: "Fashion Factory", maxLevel: 3 },   // Fabric
    { id: "E", name: "Power Plant", maxLevel: 3 },       // Power
    { id: "R", name: "Refinery", maxLevel: 3 },          // Plastic, Chemicals
    { id: "8", name: "Aerospace Electronics", maxLevel: 2 }, // OBC alt
    { id: "a", name: "Automotive R&D", maxLevel: 2 },    // Research
  ];

  // Start with existing buildings (can be kept, upgraded, or demolished)
  const baseBuildings = new Map<string, number>();
  for (const sb of startingBuildings) {
    baseBuildings.set(sb.buildingId, sb.level);
  }

  const combinations: BuildingPlan[][] = [];

  function generateRecursive(
    index: number,
    current: BuildingPlan[],
    slotsUsed: number,
    cashSpent: number
  ) {
    if (index >= buildingTypes.length) {
      if (current.length > 0) combinations.push([...current]);
      return;
    }

    const bt = buildingTypes[index];
    const existingLevel = baseBuildings.get(bt.id) || 0;
    
    // Option 1: Don't build this type (demolish if exists) - cost 0, time 0
    generateRecursive(index + 1, current, slotsUsed, cashSpent);

    // Option 2: Keep existing building as-is (if it exists)
    if (existingLevel > 0) {
      const newPlan: BuildingPlan = { buildingId: bt.id, level: existingLevel, count: 1 };
      generateRecursive(index + 1, [...current, newPlan], slotsUsed + 1, cashSpent);
    }

    // Option 3: Upgrade existing or build new at levels > existingLevel
    // For buildings that exist, start from existingLevel + 1 (upgrade)
    // For new buildings, start from 1
    const startLevel = existingLevel > 0 ? existingLevel + 1 : 1;
    for (let level = startLevel; level <= bt.maxLevel; level++) {
      // Can build 1 or 2 of this type (for factories)
      for (let count = 1; count <= (bt.id === "1" || bt.id === "2" ? 2 : 1); count++) {
        const newSlots = slotsUsed + count;
        if (newSlots > maxSlots) continue;

        // For upgrades, calculate cost from existingLevel
        const startLevelForCost = existingLevel > 0 ? existingLevel + 1 : 1;
        const buildCost = calcBuildCost(bt.id, level, startLevelForCost) * count;
        const newCash = cashSpent + buildCost;
        if (newCash > inputs.startingCash) continue;

        const newPlan: BuildingPlan = { buildingId: bt.id, level, count };
        generateRecursive(index + 1, [...current, newPlan], newSlots, newCash);
      }
    }
  }

  generateRecursive(0, [], 0, 0);
  return combinations;
}

export function optimizeChallenge(inputs: OptimizerInputs): OptimizedPlan[] {
  const combinations = generateBuildingCombinations(inputs);
  
  const validPlans: OptimizedPlan[] = [];
  
  for (const combo of combinations) {
    const plan = evaluatePlan(combo, inputs, inputs.startingBuildings);
    if (plan && plan.cashFlowValid && plan.netProfitPerHour > 0) {
      validPlans.push(plan);
    }
  }

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