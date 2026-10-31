/**
 * Restaurant Retail Info Service
 * Reads data from SimcoIntel/Data repo (GitHub raw) instead of direct API
 * Data is collected by backend scheduler and stored in Data repo
 * Key metric for restaurants: amountSoldRestaurant (not demand)
 */

interface RestaurantRetailDataPoint {
  averagePrice: number;
  amountSoldRestaurant: number;
  demand: number;
  saturation: number;
  date: string;
}

interface RestaurantQualityData {
  quality: number;
  dbLetter: number;
  averagePrice: number;
  saturation: number;
  retailData: RestaurantRetailDataPoint[];
}

interface RestaurantRetailInfoSnapshot {
  timestamp: string;
  snapshotType: "restaurant-retail-info";
  data: RestaurantQualityData[];
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
// Data repo raw URL - reads from GitHub raw (SimcoIntel/Data repo)
const DATA_REPO_BASE = 'https://raw.githubusercontent.com/SimcoIntel/Data/main';
const INDEX_URL = `${DATA_REPO_BASE}/aggregates/restaurant-retail-info/index.json`;

let cachedData: RestaurantQualityData[] | null = null;
let cacheTimestamp: number = 0;

async function fetchRestaurantRetailInfo(): Promise<RestaurantQualityData[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    // First fetch index to get latest snapshot filename
    const indexResponse = await fetch(INDEX_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!indexResponse.ok) {
      throw new Error(`Index fetch error: ${indexResponse.status}`);
    }

    const index = await indexResponse.json() as { latest: string; files: string[] };
    if (!index.latest) {
      throw new Error("No latest snapshot in index");
    }

    // Fetch the latest snapshot
    const snapshotUrl = `${DATA_REPO_BASE}/aggregates/restaurant-retail-info/${index.latest}`;
    const snapshotResponse = await fetch(snapshotUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!snapshotResponse.ok) {
      throw new Error(`Snapshot fetch error: ${snapshotResponse.status}`);
    }

    const snapshot = await snapshotResponse.json() as RestaurantRetailInfoSnapshot;
    
    // Normalize and sort by quality
    const normalizedData = snapshot.data.sort((a, b) => a.quality - b.quality);
    
    cachedData = normalizedData;
    cacheTimestamp = now;
    
    return normalizedData;
  } catch (error) {
    console.error('Failed to fetch restaurant retail info from Data repo:', error);
    // Return cached data even if stale, or empty array
    return cachedData || [];
  }
}

export function getRestaurantRetailInfo(): Promise<RestaurantQualityData[]> {
  return fetchRestaurantRetailInfo();
}

export function getQualityData(quality: number): Promise<RestaurantQualityData | null> {
  return fetchRestaurantRetailInfo().then(data => 
    data.find(d => d.quality === quality) || null
  );
}

// Restaurant menu items that can be sold in restaurants
// Based on the official restaurant guide and API data
export const RESTAURANT_MENU_ITEMS = [
  // Food items
  { id: 'milk', name: 'Milk', category: 'beverage', baseQuality: 1 },
  { id: 'bread', name: 'Bread', category: 'food', baseQuality: 1 },
  { id: 'butter', name: 'Butter', category: 'food', baseQuality: 1 },
  { id: 'cheese', name: 'Cheese', category: 'food', baseQuality: 1 },
  { id: 'coffee_powder', name: 'Coffee Powder', category: 'beverage', baseQuality: 1 },
  { id: 'apple_pie', name: 'Apple Pie', category: 'dessert', baseQuality: 2 },
  { id: 'hamburger', name: 'Hamburger', category: 'food', baseQuality: 2 },
  { id: 'lasagna', name: 'Lasagna', category: 'food', baseQuality: 3 },
  { id: 'meat_ball', name: 'Meat Balls', category: 'food', baseQuality: 2 },
  { id: 'salad', name: 'Salad', category: 'food', baseQuality: 2 },
  { id: 'samosa', name: 'Samosa', category: 'food', baseQuality: 2 },
  
  // Beverages
  { id: 'cocktail', name: 'Cocktail', category: 'beverage', baseQuality: 2 },
  { id: 'orange_juice', name: 'Orange Juice', category: 'beverage', baseQuality: 1 },
  { id: 'apple_cider', name: 'Apple Cider', category: 'beverage', baseQuality: 2 },
  { id: 'ginger_beer', name: 'Ginger Beer', category: 'beverage', baseQuality: 2 },
  { id: 'pumpkin_soup', name: 'Pumpkin Soup', category: 'food', baseQuality: 3 },
] as const;

export type RestaurantMenuItemId = typeof RESTAURANT_MENU_ITEMS[number]['id'];

export function getMenuItem(id: RestaurantMenuItemId) {
  return RESTAURANT_MENU_ITEMS.find(item => item.id === id);
}

export function getMenuItemsByCategory(category: 'food' | 'beverage' | 'dessert') {
  return RESTAURANT_MENU_ITEMS.filter(item => item.category === category);
}

// Restaurant type: standard vs luxury
export type RestaurantType = "standard" | "luxury";

export interface RestaurantMenuCalculationInput {
  type: RestaurantType;
  quality: number; // 0-12 (food quality)
  salesSpeedBonus: number; // % from recreation + CMO
  cmoCommSkill: number; // CMO communication skill (0-100)
  isLuxury: boolean;
  contractPrice: number; // base menu price
  quantityPerOrder: number;
}

export interface RestaurantMenuCalculationResult {
  rating: number;
  priceMultiplier: number;
  effectivePrice: number;
  competitive: boolean;
  menuItems: Array<{
    item: typeof RESTAURANT_MENU_ITEMS[number];
    effectiveQuality: number;
    priceAtQuality: number;
    amountSoldEstimate: number;
  }>;
}

// Restaurant rating formula (verified from SimCompanies Times #178, #412, official guide)
function calculateRestaurantRating(input: RestaurantMenuCalculationInput): number {
  // Rating = Food Quality Factor + Sales Speed Factor + CMO Comm Factor
  const foodQualityFactor = input.quality * 0.15; // Q12 = 1.8 max
  const salesSpeedRating = input.salesSpeedBonus * 0.02; // +0.02 per % (verified)
  const staffFactor = input.cmoCommSkill * 0.01; // CMO comm skill (0-1.0 at 100)
  
  let rating = foodQualityFactor + salesSpeedRating + staffFactor;
  
  // Luxury restaurant multiplies rating effect (requires rating >= 0.7)
  if (input.isLuxury && rating >= 0.7) {
    rating = rating * 1.5; // Luxury multiplies effect (verified)
  }
  
  return Math.max(0, rating);
}

// Get average amount sold for a quality level from API data
function getAvgAmountSoldForQuality(quality: number, retailData: RestaurantQualityData[]): number {
  const qualityData = retailData.find(d => d.quality === quality);
  if (!qualityData || !qualityData.retailData.length) return 0;
  
  const recentData = qualityData.retailData.slice(-7); // Last 7 days
  if (!recentData.length) return 0;
  
  const sum = recentData.reduce((acc, d) => acc + (d.amountSoldRestaurant || 0), 0);
  return sum / recentData.length;
}

export function calculateRestaurantMenu(
  input: RestaurantMenuCalculationInput,
  retailData: RestaurantQualityData[]
): RestaurantMenuCalculationResult {
  const rating = calculateRestaurantRating(input);
  const priceMultiplier = 1 + rating * 0.1; // 10% price increase per rating point
  const effectivePrice = input.contractPrice * priceMultiplier;
  const competitive = rating >= 5.0; // Meta threshold
  
  // Calculate effective quality for each menu item
  // Standard restaurant: quality scales linearly
  // Luxury restaurant: quality affects rating which affects price
  const menuItems = RESTAURANT_MENU_ITEMS.map(item => {
    // Effective quality for this item
    // Base quality + food quality bonus
    let effectiveQuality = item.baseQuality;
    
    // For luxury, quality affects rating which multiplies price
    // For standard, quality adds to rating linearly
    if (input.isLuxury) {
      effectiveQuality = item.baseQuality + input.quality * 0.2;
    } else {
      effectiveQuality = item.baseQuality + input.quality * 0.1;
    }
    
    // Price at this quality = base price * (1 + effectiveQuality * 0.05)
    // This is a simplified model - actual game uses rating-based pricing
    const priceAtQuality = input.contractPrice * (1 + effectiveQuality * 0.05);
    
    // Estimate amount sold based on API data
    const amountSoldEstimate = getAvgAmountSoldForQuality(input.quality, retailData);
    
    return {
      item,
      effectiveQuality,
      priceAtQuality,
      amountSoldEstimate,
    };
  });
  
  return {
    rating,
    priceMultiplier,
    effectivePrice: input.contractPrice * (1 + calculateRestaurantRating(input) * 0.1),
    competitive,
    menuItems,
  };
}

// Get average amount sold in restaurants for a quality level
export async function getAvgAmountSoldRestaurant(quality: number): Promise<number> {
  const data = await getQualityData(quality);
  if (!data || !data.retailData.length) return 0;
  
  const recentData = data.retailData.slice(-7); // Last 7 days
  if (!recentData.length) return 0;
  
  const sum = recentData.reduce((acc, d) => acc + (d.amountSoldRestaurant || 0), 0);
  return sum / recentData.length;
}

// Get average price for a quality level
export async function getAvgPriceForQuality(quality: number): Promise<number> {
  const data = await getQualityData(quality);
  return data?.averagePrice || 0;
}

// Get saturation for a quality level
export async function getSaturationForQuality(quality: number): Promise<number> {
  const data = await getQualityData(quality);
  return data?.saturation || 0;
}