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