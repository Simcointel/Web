/**
 * SimCompanies.com Official API v3 Integration
 * Core endpoints only - placeholder endpoints removed
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

// Raw API response types (for mapping)
interface RawCompanyProfile {
  id?: number;
  username?: string;
  companyPublicInfo?: { company?: string; logo?: string; level?: number; rank?: number; online?: string; productionModifier?: number; salesModifier?: number; extraBuildingSlots?: number };
  name?: string;
  level?: number;
  rank?: number;
  online?: string;
  productionModifier?: number;
  salesModifier?: number;
  extraBuildingSlots?: number;
  history?: { value?: number; bondsPayable?: number };
  cash?: number;
  infrastructure?: { workers?: number; recreationBonus?: number; administrationOverhead?: number; buildings?: Array<{ id?: number; kind?: string; level?: number; size?: number; busy?: Record<string, number>; slot?: number }> };
  happiness?: number;
  governmentOrderTierIndex?: number;
  storage?: { capacity?: number; used?: number; items?: Array<{ resourceId?: number; resourceName?: string; quality?: number; amount?: number }> };
  contracts?: Array<{ id?: number; type?: string; resourceId?: number; resourceName?: string; quality?: number; amount?: number; price?: number; remaining?: number }>;
  logo?: string;
}

interface RawBuilding {
  id?: number;
  kind?: string;
  level?: number;
  size?: number;
  busy?: Record<string, number>;
  slot?: number;
}

interface RawStorageItem {
  resourceId?: number;
  resourceName?: string;
  quality?: number;
  amount?: number;
}

interface RawContract {
  id?: number;
  type?: string;
  resourceId?: number;
  resourceName?: string;
  quality?: number;
  amount?: number;
  price?: number;
  remaining?: number;
}

interface RawResource {
  id?: number;
  name?: string;
  category?: string;
  categoryName?: string;
  basePrice?: number;
  demandElasticity?: number;
  supplyElasticity?: number;
  decayRate?: number;
  productionTime?: number;
  inputs?: Array<{ resourceId?: number; amount?: number }>;
  outputs?: Array<{ resourceId?: number; amount?: number; probability?: number }>;
}

interface RawMarketOrder {
  id?: number;
  companyId?: number;
  companyName?: string;
  type?: string;
  resourceId?: number;
  resourceName?: string;
  quality?: number;
  amount?: number;
  remaining?: number;
  price?: number;
  createdAt?: string;
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

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_CONFIG = {
  COMPANY_PROFILE: 5 * 60 * 1000,      // 5 minutes
  RESOURCES: 15 * 60 * 1000,           // 15 minutes
  MARKET_ORDERS: 2 * 60 * 1000,        // 2 minutes
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
    const data = await fetchWithRetry<RawCompanyProfile>(url);
    
    return mapCompanyProfile(data);
  }, CACHE_CONFIG.COMPANY_PROFILE);
}

function mapCompanyProfile(data: RawCompanyProfile): CompanyProfile {
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
    buildings: (data.infrastructure?.buildings ?? []).map((b: RawBuilding) => ({
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
      items: (data.storage?.items ?? []).map((i: RawStorageItem) => ({
        resourceId: i.resourceId ?? 0,
        resourceName: i.resourceName ?? '',
        quality: i.quality ?? 1,
        amount: i.amount ?? 0,
      })),
    },
    contracts: (data.contracts ?? []).map((c: RawContract) => ({
      id: c.id ?? 0,
      type: (c.type === 'purchase' ? 'purchase' : 'sale'),
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
    const response = await fetchWithRetry<RawResource[]>(`${API_BASE}/resources/`);
    return response.map(mapResource);
  }, CACHE_CONFIG.RESOURCES);
}

function mapResource(data: RawResource): Resource {
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
    inputs: (data.inputs ?? []).map((i) => ({
      resourceId: i.resourceId ?? 0,
      amount: i.amount ?? 0,
    })),
    outputs: (data.outputs ?? []).map((o) => ({
      resourceId: o.resourceId ?? 0,
      amount: o.amount ?? 0,
      probability: o.probability,
    })),
  };
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
    const response = await fetchWithRetry<RawMarketOrder[]>(url);
    return response.map(mapMarketOrder);
  }, CACHE_CONFIG.MARKET_ORDERS);
}

function mapMarketOrder(data: RawMarketOrder): MarketOrder {
  return {
    id: data.id ?? 0,
    companyId: data.companyId ?? 0,
    companyName: data.companyName ?? '',
    type: (data.type === 'purchase' ? 'buy' : 'sell'),
    resourceId: data.resourceId ?? 0,
    resourceName: data.resourceName ?? '',
    quality: data.quality ?? 1,
    amount: data.amount ?? 0,
    remaining: data.remaining ?? 0,
    price: data.price ?? 0,
    createdAt: data.createdAt ?? '',
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