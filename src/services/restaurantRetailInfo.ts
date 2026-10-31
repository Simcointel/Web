/**
 * Restaurant Retail Info API Service
 * Fetches and caches data from https://www.simcompanies.com/api/v4/1/resources-retail-info/
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

interface RestaurantRetailInfoResponse {
  [key: string]: RestaurantQualityData[];
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
const API_URL = 'https://www.simcompanies.com/api/v4/1/resources-retail-info/';

let cachedData: RestaurantQualityData[] | null = null;
let cacheTimestamp: number = 0;

async function fetchRestaurantRetailInfo(): Promise<RestaurantQualityData[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData;
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const rawData = await response.json();
    
    // The API returns an array of quality data objects
    // We need to flatten/normalize it
    const normalizedData: RestaurantQualityData[] = [];
    
    for (const item of rawData) {
      if (item && typeof item.quality === 'number') {
        normalizedData.push({
          quality: item.quality,
          dbLetter: item.dbLetter || 150,
          averagePrice: item.averagePrice || 0,
          saturation: item.saturation || 0,
          retailData: item.retailData || [],
        });
      }
    }

    // Sort by quality
    normalizedData.sort((a, b) => a.quality - b.quality);
    
    cachedData = normalizedData;
    cacheTimestamp = now;
    
    return normalizedData;
  } catch (error) {
    console.error('Failed to fetch restaurant retail info:', error);
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