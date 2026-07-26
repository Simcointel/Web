/**
 * SimCompanies.com Official API v3 Integration
 * Enhanced with additional endpoints and caching
 */

import { withCache } from "./data-cache";

const API_BASE = "https://www.simcompanies.com/api/v3";
const API_TIMEOUT = 10000;
const MAX_RETRIES = 3;

// ============================================================================
// Type Definitions
// ============================================================================

export interface CompanyProfile {
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
  buildings: Building[];
  storage: StorageInfo;
  contracts: Contract[];
}

export interface Building {
  id: number;
  kind: string;
  level: number;
  size: number;
  busy?: Record<string, number>;
  slot?: number;
}

export interface StorageInfo {
  capacity: number;
  used: number;
  items: StorageItem[];
}

export interface StorageItem {
  resourceId: number;
  resourceName: string;
  quality: number;
  amount: number;
}

export interface Contract {
  id: number;
  type: "sale" | "purchase";
  resourceId: number;
  resourceName: string;
  quality: number;
  amount: number;
  price: number;
  remaining: number;
}

export interface Resource {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  basePrice: number;
  demandElasticity: number;
  supplyElasticity: number;
  decayRate?: number;
  productionTime: number;
  inputs?: ResourceInput[];
  outputs?: ResourceOutput[];
}

export interface ResourceInput {
  resourceId: number;
  amount: number;
}

export interface ResourceOutput {
  resourceId: number;
  amount: number;
  probability?: number;
}

export interface BuildingType {
  id: number;
  name: string;
  description: string;
  size: number;
  constructionCost: ConstructionCost[];
  constructionTime: number;
  slots: number;
  type: "production" | "retail" | "office" | "storage";
}

export interface ConstructionCost {
  resourceId: number;
  amount: number;
}

export interface MarketOrder {
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

export interface ExchangeRate {
  resource1Id: number;
  resource1Name: string;
  resource2Id: number;
  resource2Name: string;
  rate: number;
  volume: number;
  updatedAt: string;
}

export interface GovernmentContract {
  id: number;
  tier: number;
  resourceId: number;
  resourceName: string;
  amount: number;
  price: number;
  deadline: string;
  requirements: Requirement[];
}

export interface Requirement {
  type: "building" | "resource" | "certification";
  id: number;
  name: string;
  level?: number;
  amount?: number;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  publishedAt: string;
  author?: string;
}

export interface LeagueInfo {
  id: number;
  name: string;
  minRank: number;
  maxRank: number;
  benefits: string[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_CONFIG = {
  COMPANY_PROFILE: 5 * 60 * 1000,      // 5 minutes
  RESOURCES: 15 * 60 * 1000,           // 15 minutes
  BUILDINGS: 30 * 60 * 1000,           // 30 minutes
  MARKET_ORDERS: 2 * 60 * 1000,        // 2 minutes
  EXCHANGE_RATES: 5 * 60 * 1000,       // 5 minutes
  GOVERNMENT_CONTRACTS: 10 * 60 * 1000, // 10 minutes
  NEWS: 30 * 60 * 1000,                // 30 minutes
  LEAGUES: 60 * 60 * 1000,             // 1 hour
};

// ============================================================================
// Core Fetch Function with Retry Logic
// ============================================================================

async function fetchWithRetry<T>(url: string, options?: RequestInit): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = Math.min(API_TIMEOUT, 3000 * (attempt + 1));
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timer);

      if (res.ok) {
        return res.json();
      }

      if (res.status === 429) {
        // Rate limited - exponential backoff
        const waitTime = 2000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }

      if (res.status === 404) {
        throw new Error(`Resource not found: ${url}`);
      }

      if (res.status >= 500) {
        lastError = new Error(`Server error: ${res.status}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      throw new Error(`API error: ${res.status}`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('Request timeout');
      } else if (err instanceof Error) {
        lastError = err;
      } else {
        lastError = new Error('Unknown fetch error');
      }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('Fetch failed');
}

// ============================================================================
// Company Endpoints
// ============================================================================

/**
 * Fetch company profile by username or ID
 */
export async function fetchCompanyProfile(identifier: string | number, realm = 0): Promise<CompanyProfile> {
  const cacheKey = `company:${realm}:${identifier}`;
  
  return withCache(cacheKey, async () => {
    const basePath = realm === 1 
      ? `${API_BASE}/entrepreneurs/companies`
      : `${API_BASE}/companies`;
    
    const url = `${basePath}/${identifier}/`;
    const data = await fetchWithRetry<any>(url);
    
    return mapCompanyProfile(data);
  }, CACHE_CONFIG.COMPANY_PROFILE);
}

function mapCompanyProfile(data: any): CompanyProfile {
  return {
    id: data.id ?? 0,
    username: data.username ?? data.companyPublicInfo?.company ?? '',
    name: data.name ?? data.companyPublicInfo?.company ?? '',
    logo: data.logo ?? data.companyPublicInfo?.logo,
    level: data.level ?? data.companyPublicInfo?.level ?? 1,
    rank: data.rank ?? data.companyPublicInfo?.rank ?? 0,
    online: data.online ?? data.companyPublicInfo?.online ?? '',
    productionModifier: data.productionModifier ?? data.companyPublicInfo?.productionModifier ?? 1,
    salesModifier: data.salesModifier ?? data.companyPublicInfo?.salesModifier ?? 1,
    extraBuildingSlots: data.extraBuildingSlots ?? data.companyPublicInfo?.extraBuildingSlots ?? 0,
    value: data.history?.value ?? 0,
    bondsPayable: data.history?.bondsPayable ?? 0,
    cash: data.cash ?? 0,
    workers: data.infrastructure?.workers ?? 0,
    happiness: data.happiness ?? 0,
    recreationBonus: data.infrastructure?.recreationBonus ?? 0,
    administrationOverhead: data.infrastructure?.administrationOverhead ?? 0,
    governmentOrderTierIndex: data.governmentOrderTierIndex ?? 0,
    buildings: (data.infrastructure?.buildings ?? []).map((b: any) => ({
      id: b.id ?? 0,
      kind: b.kind ?? '',
      level: b.level ?? 1,
      size: b.size ?? 0,
      busy: b.busy ?? {},
      slot: b.slot,
    })),
    storage: {
      capacity: data.storage?.capacity ?? 0,
      used: data.storage?.used ?? 0,
      items: (data.storage?.items ?? []).map((i: any) => ({
        resourceId: i.resourceId ?? 0,
        resourceName: i.resourceName ?? '',
        quality: i.quality ?? 1,
        amount: i.amount ?? 0,
      })),
    },
    contracts: (data.contracts ?? []).map((c: any) => ({
      id: c.id ?? 0,
      type: c.type ?? 'sale',
      resourceId: c.resourceId ?? 0,
      resourceName: c.resourceName ?? '',
      quality: c.quality ?? 1,
      amount: c.amount ?? 0,
      price: c.price ?? 0,
      remaining: c.remaining ?? 0,
    })),
  };
}

/**
 * Search companies by name fragment (requires web scraping workaround)
 */
export async function searchCompanies(query: string, realm = 0): Promise<CompanyProfile[]> {
  const cacheKey = `company_search:${realm}:${query}`;
  
  return withCache(cacheKey, async () => {
    // Note: Official API doesn't support search, this is a placeholder
    // for future implementation using alternative methods
    console.warn('Company search not supported by official API');
    return [];
  }, 60 * 1000); // 1 minute cache
}

/**
 * Get company buildings details
 */
export async function fetchCompanyBuildings(identifier: string | number, realm = 0): Promise<Building[]> {
  const profile = await fetchCompanyProfile(identifier, realm);
  return profile.buildings;
}

/**
 * Get company storage contents
 */
export async function fetchCompanyStorage(identifier: string | number, realm = 0): Promise<StorageInfo> {
  const profile = await fetchCompanyProfile(identifier, realm);
  return profile.storage;
}

// ============================================================================
// Resources & Production
// ============================================================================

/**
 * Fetch all resources with production chains
 */
export async function fetchAllResources(): Promise<Resource[]> {
  return withCache('resources:all', async () => {
    // Static resource data - would need to be maintained or fetched from game data
    // This is a placeholder for actual implementation
    const response = await fetchWithRetry<any[]>(`${API_BASE}/resources/`);
    return response.map(mapResource);
  }, CACHE_CONFIG.RESOURCES);
}

function mapResource(data: any): Resource {
  return {
    id: data.id ?? 0,
    name: data.name ?? '',
    category: data.category ?? '',
    categoryName: data.categoryName ?? '',
    basePrice: data.basePrice ?? 0,
    demandElasticity: data.demandElasticity ?? 0,
    supplyElasticity: data.supplyElasticity ?? 0,
    decayRate: data.decayRate,
    productionTime: data.productionTime ?? 0,
    inputs: (data.inputs ?? []).map((i: any) => ({
      resourceId: i.resourceId ?? 0,
      amount: i.amount ?? 0,
    })),
    outputs: (data.outputs ?? []).map((o: any) => ({
      resourceId: o.resourceId ?? 0,
      amount: o.amount ?? 0,
      probability: o.probability,
    })),
  };
}

/**
 * Fetch single resource details
 */
export async function fetchResource(resourceId: number): Promise<Resource> {
  const cacheKey = `resource:${resourceId}`;
  
  return withCache(cacheKey, async () => {
    const data = await fetchWithRetry<any>(`${API_BASE}/resources/${resourceId}/`);
    return mapResource(data);
  }, CACHE_CONFIG.RESOURCES);
}

// ============================================================================
// Buildings
// ============================================================================

/**
 * Fetch all building types
 */
export async function fetchAllBuildings(): Promise<BuildingType[]> {
  return withCache('buildings:all', async () => {
    const response = await fetchWithRetry<any[]>(`${API_BASE}/buildings/`);
    return response.map(mapBuildingType);
  }, CACHE_CONFIG.BUILDINGS);
}

function mapBuildingType(data: any): BuildingType {
  return {
    id: data.id ?? 0,
    name: data.name ?? '',
    description: data.description ?? '',
    size: data.size ?? 0,
    constructionCost: (data.constructionCost ?? []).map((c: any) => ({
      resourceId: c.resourceId ?? 0,
      amount: c.amount ?? 0,
    })),
    constructionTime: data.constructionTime ?? 0,
    slots: data.slots ?? 0,
    type: data.type ?? 'production',
  };
}

/**
 * Fetch building type details
 */
export async function fetchBuildingType(buildingId: number): Promise<BuildingType> {
  const cacheKey = `building:${buildingId}`;
  
  return withCache(cacheKey, async () => {
    const data = await fetchWithRetry<any>(`${API_BASE}/buildings/${buildingId}/`);
    return mapBuildingType(data);
  }, CACHE_CONFIG.BUILDINGS);
}

// ============================================================================
// Market & Exchange
// ============================================================================

/**
 * Fetch market orders for a resource
 */
export async function fetchMarketOrders(resourceId: number, type?: 'sell' | 'buy'): Promise<MarketOrder[]> {
  const cacheKey = `market:${resourceId}:${type ?? 'all'}`;
  
  return withCache(cacheKey, async () => {
    let url = `${API_BASE}/market/orders/${resourceId}/`;
    if (type) {
      url += `?type=${type}`;
    }
    const response = await fetchWithRetry<any[]>(url);
    return response.map(mapMarketOrder);
  }, CACHE_CONFIG.MARKET_ORDERS);
}

function mapMarketOrder(data: any): MarketOrder {
  return {
    id: data.id ?? 0,
    companyId: data.companyId ?? 0,
    companyName: data.companyName ?? '',
    type: data.type ?? 'sell',
    resourceId: data.resourceId ?? 0,
    resourceName: data.resourceName ?? '',
    quality: data.quality ?? 1,
    amount: data.amount ?? 0,
    remaining: data.remaining ?? 0,
    price: data.price ?? 0,
    createdAt: data.createdAt ?? '',
  };
}

/**
 * Fetch exchange rates between resources
 */
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  return withCache('exchange:rates', async () => {
    const response = await fetchWithRetry<any[]>(`${API_BASE}/exchange/rates/`);
    return response.map(mapExchangeRate);
  }, CACHE_CONFIG.EXCHANGE_RATES);
}

function mapExchangeRate(data: any): ExchangeRate {
  return {
    resource1Id: data.resource1Id ?? 0,
    resource1Name: data.resource1Name ?? '',
    resource2Id: data.resource2Id ?? 0,
    resource2Name: data.resource2Name ?? '',
    rate: data.rate ?? 0,
    volume: data.volume ?? 0,
    updatedAt: data.updatedAt ?? '',
  };
}

// ============================================================================
// Government Contracts
// ============================================================================

/**
 * Fetch available government contracts
 */
export async function fetchGovernmentContracts(tier?: number): Promise<GovernmentContract[]> {
  const cacheKey = `gov:contracts:${tier ?? 'all'}`;
  
  return withCache(cacheKey, async () => {
    let url = `${API_BASE}/government/contracts/`;
    if (tier !== undefined) {
      url += `?tier=${tier}`;
    }
    const response = await fetchWithRetry<any[]>(url);
    return response.map(mapGovernmentContract);
  }, CACHE_CONFIG.GOVERNMENT_CONTRACTS);
}

function mapGovernmentContract(data: any): GovernmentContract {
  return {
    id: data.id ?? 0,
    tier: data.tier ?? 1,
    resourceId: data.resourceId ?? 0,
    resourceName: data.resourceName ?? '',
    amount: data.amount ?? 0,
    price: data.price ?? 0,
    deadline: data.deadline ?? '',
    requirements: (data.requirements ?? []).map((r: any) => ({
      type: r.type ?? 'building',
      id: r.id ?? 0,
      name: r.name ?? '',
      level: r.level,
      amount: r.amount,
    })),
  };
}

// ============================================================================
// News & Information
// ============================================================================

/**
 * Fetch game news
 */
export async function fetchNews(category?: string): Promise<NewsItem[]> {
  const cacheKey = `news:${category ?? 'all'}`;
  
  return withCache(cacheKey, async () => {
    let url = `${API_BASE}/news/`;
    if (category) {
      url += `?category=${category}`;
    }
    const response = await fetchWithRetry<any[]>(url);
    return response.map(mapNewsItem);
  }, CACHE_CONFIG.NEWS);
}

function mapNewsItem(data: any): NewsItem {
  return {
    id: data.id ?? 0,
    title: data.title ?? '',
    summary: data.summary ?? '',
    content: data.content ?? '',
    category: data.category ?? '',
    publishedAt: data.publishedAt ?? '',
    author: data.author,
  };
}

// ============================================================================
// Leagues & Rankings
// ============================================================================

/**
 * Fetch league information
 */
export async function fetchLeagues(): Promise<LeagueInfo[]> {
  return withCache('leagues:all', async () => {
    const response = await fetchWithRetry<any[]>(`${API_BASE}/leagues/`);
    return response.map(mapLeague);
  }, CACHE_CONFIG.LEAGUES);
}

function mapLeague(data: any): LeagueInfo {
  return {
    id: data.id ?? 0,
    name: data.name ?? '',
    minRank: data.minRank ?? 0,
    maxRank: data.maxRank ?? 0,
    benefits: data.benefits ?? [],
  };
}

/**
 * Fetch top companies ranking
 */
export async function fetchRankings(limit = 100, realm = 0): Promise<CompanyProfile[]> {
  const cacheKey = `rankings:${realm}:${limit}`;
  
  return withCache(cacheKey, async () => {
    const basePath = realm === 1 
      ? `${API_BASE}/entrepreneurs/rankings`
      : `${API_BASE}/rankings`;
    
    const url = `${basePath}/?limit=${limit}`;
    const response = await fetchWithRetry<any[]>(url);
    return response.map(mapCompanyProfile);
  }, 5 * 60 * 1000); // 5 minutes
}

// ============================================================================
// Achievements (if authenticated)
// ============================================================================

/**
 * Fetch player achievements (requires authentication)
 */
export async function fetchAchievements(companyId: string | number): Promise<Achievement[]> {
  const cacheKey = `achievements:${companyId}`;
  
  return withCache(cacheKey, async () => {
    // This endpoint would require authentication
    const response = await fetchWithRetry<any[]>(`${API_BASE}/companies/${companyId}/achievements/`);
    return response.map(mapAchievement);
  }, 10 * 60 * 1000);
}

function mapAchievement(data: any): Achievement {
  return {
    id: data.id ?? 0,
    name: data.name ?? '',
    description: data.description ?? '',
    icon: data.icon ?? '',
    unlocked: data.unlocked ?? false,
    progress: data.progress ?? 0,
    target: data.target ?? 0,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate production efficiency for a company
 */
export function calculateProductionEfficiency(company: CompanyProfile): number {
  const totalBuildings = company.buildings.length;
  const activeBuildings = company.buildings.filter(b => b.busy && Object.keys(b.busy).length > 0).length;
  
  if (totalBuildings === 0) return 0;
  
  const utilizationRate = activeBuildings / totalBuildings;
  const modifier = (company.productionModifier + company.salesModifier) / 2;
  
  return Math.round(utilizationRate * modifier * 100);
}

/**
 * Estimate company WACC (Weighted Average Cost of Capital)
 */
export function estimateWACC(company: CompanyProfile): number {
  const debtRatio = company.bondsPayable / (company.value || 1);
  const equityRatio = 1 - debtRatio;
  
  // Simplified assumptions
  const costOfDebt = 0.08; // 8%
  const costOfEquity = 0.15; // 15%
  const taxRate = 0.25; // 25%
  
  return (equityRatio * costOfEquity) + (debtRatio * costOfDebt * (1 - taxRate));
}

/**
 * Calculate ROIC (Return on Invested Capital)
 */
export function calculateROIC(company: CompanyProfile, hourlyProfit: number): number {
  const investedCapital = company.value;
  if (investedCapital === 0) return 0;
  
  // Annualize hourly profit
  const annualProfit = hourlyProfit * 24 * 365;
  return annualProfit / investedCapital;
}

/**
 * Get EVA (Economic Value Added)
 */
export function calculateEVA(company: CompanyProfile, hourlyProfit: number): number {
  const wacc = estimateWACC(company);
  const roic = calculateROIC(company, hourlyProfit);
  return roic - wacc;
}
