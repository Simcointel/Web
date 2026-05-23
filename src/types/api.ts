export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  v: string;
  t: string;
  data: T;
  error?: string;
}

export interface HealthReport {
  status: string;
  generatedAt: string;
  projects: { name: string; status: string; dataPoints: number; errors: number; lastOk: string }[];
  pipelines: { name: string; status: string; lastRun: string; lastOk: string; failures: number }[];
  schedulers: { name: string; running: boolean; uptimeMs: number }[];
  storage: { path: string; totalFiles: number; totalSizeBytes: number };
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
  generatedAt: string;
}

export interface EventFeedItem {
  id: string;
  ts: string;
  se: "info" | "warning" | "critical";
  ca: string;
  re: string;
  ti: string;
  de?: string;
  ex: string;
  sr?: string;
}

export interface UnifiedFeed {
  events: EventFeedItem[];
  total: number;
  filtered: number;
  severityCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  generatedAt: string;
}

export interface MacroLatest {
  realm: string;
  state: { backfillStarted: string; backfillComplete: string; totalDays: number };
  latestHistory: {
    date: string;
    companiesValue: number;
    activeCompanies: number;
    bondsSold: number;
    totalBuildings: number;
  } | null;
  latestIndexes: { date: string; cpi: number; coreCpi: number; gdp: number } | null;
  latestInflation: { date: string; cpiRate: number; coreCpiRate: number; gdpGrowth: number } | null;
}

export interface MacroHistory {
  realm: string;
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
  realm: string;
  total: number;
  indexes: { date: string; cpi: number; coreCpi: number; gdp: number }[];
}

export interface MacroInflation {
  realm: string;
  total: number;
  inflation: { date: string; cpiRate: number; coreCpiRate: number; gdpGrowth: number }[];
}

export interface MacroPhases {
  realm: string;
  totalDays: number;
  currentPhase: string;
  transitions: { from: string; to: string; date: string; reason: string }[];
  phases: { phase: string; startDate: string; endDate: string | null; days: number }[];
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

