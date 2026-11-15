export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  v: string;
  t: string;
  data: T;
  error?: string;
}

// ============ Events ============
export interface NormalizedEvent {
  id: string;
  se: string;
  ts: string;
  ca: string;
  ti: string;
  de: string;
  da: Record<string, unknown>;
  ty: string;
}

export interface EventsResponse {
  events: NormalizedEvent[];
  total: number;
}

// ============ Dashboard ============
export type DashboardMap = Record<string, RealmDashboard>;

// ============ Public API Types (Backend /api/public/* responses) ============

export interface PublicStatus {
  api: string;
  version: string;
  realms: number[];
  endpoints: {
    macro: string;
    indexes: string;
    inflation: string;
    resources: string;
    export: string;
  };
  generatedAt: string;
}

export interface PublicMacro {
  realm: string;
  latest: {
    companiesValue: number | null;
    activeCompanies: number | null;
    bondsSold: number | null;
    totalBuildings: number | null;
  };
  latestIndexes: { cpi: number | null; coreCpi: number | null; gdp: number | null } | null;
  latestInflation: { cpiRate: number | null; coreCpiRate: number | null; gdpGrowth: number | null } | null;
  generatedAt: string;
}

// Raw backend API response types (matching publicData.ts)
export interface RawMacroHistoryEntry {
  d: string;
  ac: number;
  cv: number;
  tb: number;
  bs: number;
  ph: string;
  cp: boolean;
}

export interface RawMacroHistoryResponse {
  realm: number;
  totalEntries: number;
  yearsAvailable: number[];
  history: RawMacroHistoryEntry[];
}

export interface RawMacroHistoryListResponse {
  [realm: string]: {
    years: number[];
    totalEntries: number;
  };
}

export interface RawMacroIndexEntry {
  ix: Record<string, { v: number }>;
}

export interface RawMacroIndexesResponse {
  realm: number;
  total: number;
  indexes: RawMacroIndexEntry[];
}

export interface RawMacroInflationEntry {
  in: Record<string, { ch: number }>;
}

export interface RawMacroInflationResponse {
  realm: number;
  total: number;
  inflation: RawMacroInflationEntry[];
}

export interface RawMacroPhase {
  date: string;
  phase: string;
}

export interface RawMacroTransition {
  from: string;
  to: string;
  date: string;
}

export interface RawMacroPhases {
  realm: number;
  totalDays: number;
  currentPhase: string | null;
  transitions: RawMacroTransition[];
  phases: RawMacroPhase[];
}

export interface RawMacroLatestResponse {
  realm: number;
  latestHistory: RawMacroHistoryEntry | null;
  latestIndexes: unknown;
  latestInflation: unknown;
}

// Export API
export interface ExportDataset {
  name: string;
  description: string;
  url: string;
}

export interface ExportListResponse {
  datasets: ExportDataset[];
}

export interface ExportResponse {
  dataset: string;
  realm: number;
  format: string;
}

// Health & Status
export interface HealthResponse {
  status: string;
  checks: Record<string, unknown>;
  timestamp: string;
}

export interface StatusResponse {
  health: HealthResponse;
  failures: Record<string, unknown>;
  scheduler: {
    running: boolean;
    uptimeMs: number;
  };
  realms: number[];
  timestamp: string;
}

// Sync
export interface SyncFile {
  path: string;
  content: string;
}

export interface SyncResponse {
  files: SyncFile[];
}

// ============ UI Types (transformed by dataRepo for frontend consumption) ============

export interface MacroHistoryPoint {
  date: string;
  activeCompanies: number;
  companiesValue: number;
  totalBuildings: number;
  bondsSold: number;
  phase: string;
  checkpoint: string;
}

export interface MacroHistoryResponse {
  history: MacroHistoryPoint[];
  total: number;
}

export interface IndexPoint {
  date: string;
  cpi: number | null;
  coreCpi: number | null;
  gdp: number | null;
}

export interface MacroIndexesResponse {
  indexes: IndexPoint[];
  total: number;
}

export interface InflationPoint {
  date: string;
  cpiRate: number | null;
  coreCpiRate: number | null;
  gdpGrowth: number | null;
}

export interface MacroInflationResponse {
  inflation: InflationPoint[];
  total: number;
}

// Profit Margins
export interface ProfitMarginResource {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  producedPerHour: number;
  revenuePerHour: number;
  inputCostPerHour: number;
  wagesPerHour: number;
  transportPerHour: number;
  netProfitPerHour: number;
  marginPct: number;
  marginDelta: number | null;
  profitDelta: number | null;
  marginDirection: string | null;
  forecastMargin: number | null;
  trendDirection: string | null;
  outputVwap: number | null;
}

export interface ProfitMarginsResponse {
  ts: string;
  realm: number;
  resources: ProfitMarginResource[];
  total: number;
}

export interface PriceHistoryItem {
  date: string;
  vwap: number;
  profit: number;
}

// VWAP Inflation
export interface VWAPInflationEntry {
  date: string;
  overall: Record<string, number>;
  quality: Record<string, number>;
  product: Record<string, number>;
  both: Record<string, number>;
}

export interface VWAPInflationResponse {
  vwapInflation: VWAPInflationEntry[];
  total: number;
}

// Retail
export interface RetailData {
  retail: Record<string, { saturation: number; [key: string]: unknown }>;
}

export interface DashboardScores {
  eh: number;
  ms: number;
  st: number;
  ip: number;
  sr: number;
}

export interface DashboardRegime {
  na: string;
  sc: number;
}

export interface RealmDashboard {
  scores: DashboardScores;
  regime: DashboardRegime;
  alerts: number;
  sectors: number;
  generatedAt?: string;
}

export interface MacroLatest {
  latestHistory: {
    date: string;
    companiesValue: number;
    activeCompanies: number;
    bondsSold: number;
    totalBuildings: number;
  } | null;
  latestIndexes: { cpi: number | null; coreCpi: number | null; gdp: number | null } | null;
  latestInflation: { cpiRate: number | null; coreCpiRate: number | null; gdpGrowth: number | null } | null;
}

export interface MacroHistory {
  realm?: string;
  totalEntries: number;
  yearsAvailable: string[];
  history: {
    date: string;
    companiesValue: number;
    activeCompanies: number;
    bondsSold: number;
    totalBuildings: number;
  }[];
}

export interface MacroIndexes {
  realm?: string;
  total: number;
  indexes: { date: string; cpi: number; coreCpi: number; gdp: number }[];
}

export interface MacroInflation {
  realm?: string;
  total: number;
  inflation: { date: string; cpiRate: number; coreCpiRate: number; gdpGrowth: number }[];
}

export interface ReferencePrice {
  t: string;
  ref: { cpi: number; coreCpi: number };
}

export interface PhaseRecord {
  phase: string;
  startDate: string;
  endDate: string | null;
  days: number;
}

export interface MacroPhases {
  realm?: string;
  totalDays: number;
  currentPhase: string | null;
  transitions: { from: string; to: string; date: string; reason: string }[];
  phases: PhaseRecord[];
}

export interface IntelligenceMomentum {
  [realm: string]: { realm: string; momentum: number; direction: string; trend: number };
}

export interface IntelligenceVolatility {
  [realm: string]: { realm: string; volatility: number; classification: string; trend: number };
}

export interface IntelligenceRegime {
  [realm: string]: { realm: string; regime: string; score: number; confidence: string };
}

export interface SectorView {
  sector: string;
  strength: number;
  momentum: number;
  leader: string;
  volatility: number;
}

export interface CorrelationData {
  realm: string;
  pair: string;
  coefficient: number;
  strength: string;
}

export interface AnomalyData {
  realm: string;
  category: string;
  zScore: number;
  deviation: number;
  direction: string;
  timestamp: string;
}

export interface DivergenceData {
  realm: string;
  sector: string;
  strength: number;
  type: string;
  signal: string;
}

export interface ContagionData {
  realm: string;
  origin: string;
  spread: number;
  affected: string[];
  risk: string;
}

export interface ForecastPoint {
  t: string;
  v: number;
  lcb?: number;
  ucb?: number;
}

export interface ForecastSeries {
  fc: ForecastPoint[];
  reliability: number;
  volatility: number;
  trend: "up" | "down" | "stable";
  direction: string;
}

export interface SignalData {
  type: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  affectedSectors: string[];
  estimatedDurationDays: number;
  indicators: { name: string; value: number; threshold: number }[];
  rationale: string;
}

export interface CyclePhase {
  phase: string;
  confidence: number;
  duration: number;
  intensity: number;
  stability: number;
}

export interface CycleTransition {
  from: string;
  to: string;
  probability: number;
}

export interface CycleData {
  current: CyclePhase;
  history: { phase: string; startDate: string; endDate: string | null }[];
  transitions: CycleTransition[];
  stability: number;
  intensity: number;
}

export interface SectorRisk {
  sector: string;
  score: number;
  upstreamPressure: number;
  downstreamPressure: number;
  critical: boolean;
}

export interface BottleneckChain {
  chain: string;
  pressure: number;
  sectors: string[];
}

export interface DependencyData {
  risks: SectorRisk[];
  criticalResources: string[];
  bottleneckChains: BottleneckChain[];
  riskScores: Record<string, number>;
  dependencyMatrix: Record<string, Record<string, number>>;
}

export interface AuthDataPayload {
  authCompany?: {
    companyId?: number;
    company?: string;
    logo?: string;
    level?: number;
    rank?: number;
    money?: number;
    extraBuildingSlots?: number;
    productionModifier?: number;
    salesModifier?: number;
  };
  authUser?: { email?: string };
  levelInfo?: {
    level?: number;
    levelName?: string;
    experience?: number;
    experienceToNextLevel?: number;
    maxBuildings?: number;
    capabilities?: Record<string, boolean>;
  };
  temporals?: { contest?: { id?: number; name?: string } | null };
  syncedAt?: string;
}

// ============ Calculator Types ============

export interface CalculatorLiveData {
  generatedAt: string;
  realm: number;
  economyPhase: "Boom" | "Normal" | "Reccession" | "Recession";
  weatherMultiplier: number;
  livePrices: Record<number, Record<number, number>>;
  saturation: Record<number, Record<number, number>>;
  source: string;
  dataFreshnessMinutes: number;
}

export interface PhaseCoefficients {
  productId: number;
  quality: number;
  phase: "Boom" | "Normal" | "Recession";
  T: number;
  U: number;
  V: number;
  W: number;
  rSquared: number;
  sampleSize: number;
  derivedAt: string;
}

export interface Alert {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  realm?: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  generatedAt: string;
}

// ============ SimCompanies API v3 Types (Client-side) ============

export interface SimCompanyProfile {
  id: number;
  username: string;
  name: string;
  logo?: string;
  level: number;
  rank: number;
  online: string;
  productionModifier: number;
  salesModifier: number;
  extraBuildingSlots: number;
  value: number;
  bondsPayable: number;
  cash: number;
  workers: number;
  happiness: number;
  recreationBonus: number;
  administrationOverhead: number;
  governmentOrderTierIndex: number;
  buildings: SimBuilding[];
  storage: SimStorageInfo;
  contracts: SimContract[];
}

export interface SimBuilding {
  id: number;
  kind: string;
  level: number;
  size: number;
  busy?: Record<string, number>;
  slot?: number;
}

export interface SimStorageInfo {
  capacity: number;
  used: number;
  items: SimStorageItem[];
}

export interface SimStorageItem {
  resourceId: number;
  resourceName: string;
  quality: number;
  amount: number;
}

export interface SimContract {
  id: number;
  type: "sale" | "purchase";
  resourceId: number;
  resourceName: string;
  quality: number;
  amount: number;
  price: number;
  remaining: number;
}

export interface SimResource {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  basePrice: number;
  demandElasticity: number;
  supplyElasticity: number;
  decayRate?: number;
  productionTime: number;
  inputs?: SimResourceInput[];
  outputs?: SimResourceOutput[];
}

export interface SimResourceInput {
  resourceId: number;
  amount: number;
}

export interface SimResourceOutput {
  resourceId: number;
  amount: number;
  probability?: number;
}

export interface SimMarketOrder {
  id: number;
  companyId: number;
  companyName: string;
  type: "sell" | "buy";
  resourceId: number;
  resourceName: string;
  quality: number;
  amount: number;
  remaining: number;
  price: number;
  createdAt: string;
}

// ============ Calculator Engine Types (Client-side) ============

export interface RetailProductMapEntry {
  resourceId: number;
  resourceName: string;
  buildingType: string;
  buildingLevel: number;
  inputs: Array<{ resourceId: number; amount: number }>;
  outputs: Array<{ resourceId: number; amount: number }>;
}

export interface RetailSaturationData {
  [resourceId: number]: {
    [quality: number]: number;
  };
}

export interface CalculatorEngineConfig {
  realm: number;
  phase: "Boom" | "Normal" | "Recession";
  weatherMultiplier: number;
  phaseMultipliers: Record<string, number>;
  referencePrices: Record<number, { cpi: number; coreCpi: number }>;
}

export interface ProductionCalculatorInput {
  buildingType: string;
  buildingLevel: number;
  resourceId: number;
  quality: number;
  quantity: number;
  inputPrices: Record<number, number>;
  wages: number;
  transportCost: number;
}

export interface ProductionCalculatorOutput {
  revenuePerHour: number;
  inputCostPerHour: number;
  wagesPerHour: number;
  transportPerHour: number;
  netProfitPerHour: number;
  marginPct: number;
  producedPerHour: number;
}

export interface RetailCalculatorInput {
  productId: number;
  quality: number;
  buildingLevel: number;
  price: number;
  saturation: number;
  inputPrices: Record<number, number>;
  wages: number;
}

export interface RetailCalculatorOutput {
  revenuePerHour: number;
  costPerHour: number;
  netProfitPerHour: number;
  marginPct: number;
  unitsPerHour: number;
}

export interface ConstructionCalculatorInput {
  buildingType: string;
  targetLevel: number;
  currentLevel: number;
  materialPrices: Record<number, number>;
}

export interface ConstructionCalculatorOutput {
  totalCost: number;
  materials: Array<{ resourceId: number; name: string; quantity: number; cost: number }>;
  timeHours: number;
}

export interface XPCalculatorInput {
  currentLevel: number;
  targetLevel: number;
  activityType: "production" | "construction" | "research" | "retail";
  efficiency: number;
}

export interface XPCalculatorOutput {
  xpRequired: number;
  timeEstimate: string;
  actionsRequired: number;
}

export interface RestaurantPlannerInput {
  restaurantLevel: number;
  menuItems: Array<{
    recipeId: number;
    quantity: number;
    price: number;
  }>;
  ingredientPrices: Record<number, number>;
}

export interface RestaurantPlannerOutput {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  marginPct: number;
  perItem: Array<{
    recipeId: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
}

export interface SalesOfficeCalculatorInput {
  contracts: Array<{
    resourceId: number;
    quality: number;
    amount: number;
    price: number;
    type: "sale" | "purchase";
  }>;
  wages: number;
  overhead: number;
}

export interface SalesOfficeCalculatorOutput {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  marginPct: number;
  perContract: Array<{
    resourceId: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}