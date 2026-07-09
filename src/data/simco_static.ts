export const BUILDINGS = [
  // === Production Buildings (Concrete/Bricks/Planks/CU) ===
  { "id": "P", "name": "Farm", "type": "production", "cost": 6900, "baseTime": 1, "wages": 103.5, "resources": [{ "id": 101, "qty": 8 }, { "id": 102, "qty": 110 }, { "id": 108, "qty": 32 }, { "id": 111, "qty": 2 }] },
  { "id": "F", "name": "Ranch", "type": "production", "cost": 10350, "baseTime": 2, "wages": 138, "resources": [{ "id": 101, "qty": 12 }, { "id": 102, "qty": 165 }, { "id": 108, "qty": 48 }, { "id": 111, "qty": 3 }] },
  { "id": "e", "name": "Slaughterhouse", "type": "production", "cost": 20700, "baseTime": 4, "wages": 414, "resources": [{ "id": 101, "qty": 24 }, { "id": 102, "qty": 330 }, { "id": 108, "qty": 96 }, { "id": 111, "qty": 6 }] },
  { "id": "i", "name": "Mill", "type": "production", "cost": 27600, "baseTime": 3, "wages": 379.5, "resources": [{ "id": 101, "qty": 32 }, { "id": 102, "qty": 440 }, { "id": 108, "qty": 128 }, { "id": 111, "qty": 8 }] },
  { "id": "6", "name": "Beverage factory", "type": "production", "cost": 13800, "baseTime": 2, "wages": 241.5, "resources": [{ "id": 101, "qty": 16 }, { "id": 102, "qty": 220 }, { "id": 108, "qty": 64 }, { "id": 111, "qty": 4 }] },
  { "id": "j", "name": "Bakery", "type": "production", "cost": 37950, "baseTime": 5, "wages": 448.5, "resources": [{ "id": 101, "qty": 44 }, { "id": 102, "qty": 605 }, { "id": 108, "qty": 176 }, { "id": 111, "qty": 11 }] },
  { "id": "k", "name": "Food processing plant", "type": "production", "cost": 86250, "baseTime": 6, "wages": 379.5, "resources": [{ "id": 101, "qty": 100 }, { "id": 102, "qty": 1375 }, { "id": 108, "qty": 400 }, { "id": 111, "qty": 25 }] },
  { "id": "m", "name": "Catering", "type": "production", "cost": 103500, "baseTime": 4, "wages": 655.5, "resources": [{ "id": 101, "qty": 120 }, { "id": 102, "qty": 1650 }, { "id": 108, "qty": 480 }, { "id": 111, "qty": 30 }] },
  { "id": "o", "name": "Concrete plant", "type": "production", "cost": 58650, "baseTime": 5, "wages": 379.5, "resources": [{ "id": 101, "qty": 68 }, { "id": 102, "qty": 935 }, { "id": 108, "qty": 272 }, { "id": 111, "qty": 17 }] },
  { "id": "x", "name": "Construction factory", "type": "production", "cost": 72450, "baseTime": 6, "wages": 483, "resources": [{ "id": 101, "qty": 84 }, { "id": 102, "qty": 1155 }, { "id": 108, "qty": 336 }, { "id": 111, "qty": 21 }] },
  { "id": "g", "name": "General contractor", "type": "production", "cost": 48300, "baseTime": 2, "wages": 345, "resources": [{ "id": 101, "qty": 56 }, { "id": 102, "qty": 770 }, { "id": 108, "qty": 224 }, { "id": 111, "qty": 14 }] },
  { "id": "Q", "name": "Quarry", "type": "production", "cost": 13800, "baseTime": 2, "wages": 276, "abundance": true, "resources": [{ "id": 101, "qty": 16 }, { "id": 102, "qty": 220 }, { "id": 108, "qty": 64 }, { "id": 111, "qty": 4 }] },
  { "id": "M", "name": "Mine", "type": "production", "cost": 24150, "baseTime": 4, "wages": 276, "abundance": true, "resources": [{ "id": 101, "qty": 28 }, { "id": 102, "qty": 385 }, { "id": 108, "qty": 112 }, { "id": 111, "qty": 7 }] },
  { "id": "Y", "name": "Factory", "type": "production", "cost": 48300, "baseTime": 3, "wages": 414, "resources": [{ "id": 101, "qty": 56 }, { "id": 102, "qty": 770 }, { "id": 108, "qty": 224 }, { "id": 111, "qty": 14 }] },
  { "id": "T", "name": "Fashion factory", "type": "production", "cost": 13800, "baseTime": 2, "wages": 138, "resources": [{ "id": 101, "qty": 16 }, { "id": 102, "qty": 220 }, { "id": 108, "qty": 64 }, { "id": 111, "qty": 4 }] },
  { "id": "E", "name": "Power plant", "type": "production", "cost": 51750, "baseTime": 3, "wages": 414, "resources": [{ "id": 101, "qty": 60 }, { "id": 102, "qty": 825 }, { "id": 108, "qty": 240 }, { "id": 111, "qty": 15 }] },
  { "id": "O", "name": "Oil rig", "type": "production", "cost": 69000, "baseTime": 4, "wages": 517.5, "abundance": true, "resources": [{ "id": 101, "qty": 80 }, { "id": 102, "qty": 1100 }, { "id": 108, "qty": 320 }, { "id": 111, "qty": 20 }] },
  { "id": "R", "name": "Refinery", "type": "production", "cost": 69000, "baseTime": 4, "wages": 483, "resources": [{ "id": 101, "qty": 80 }, { "id": 102, "qty": 1100 }, { "id": 108, "qty": 320 }, { "id": 111, "qty": 20 }] },
  { "id": "W", "name": "Water reservoir", "type": "production", "cost": 20700, "baseTime": 2, "wages": 345, "resources": [{ "id": 101, "qty": 24 }, { "id": 102, "qty": 330 }, { "id": 108, "qty": 96 }, { "id": 111, "qty": 6 }] },
  { "id": "S", "name": "Shipping depot", "type": "production", "cost": 51750, "baseTime": 3, "wages": 310.5, "resources": [{ "id": 101, "qty": 60 }, { "id": 102, "qty": 825 }, { "id": 108, "qty": 240 }, { "id": 111, "qty": 15 }] },
  { "id": "L", "name": "Electronics factory", "type": "production", "cost": 82800, "baseTime": 5, "wages": 379.5, "resources": [{ "id": 101, "qty": 96 }, { "id": 102, "qty": 1320 }, { "id": 108, "qty": 384 }, { "id": 111, "qty": 24 }] },
  { "id": "1", "name": "Car factory", "type": "production", "cost": 93150, "baseTime": 6, "wages": 448.5, "resources": [{ "id": 101, "qty": 108 }, { "id": 102, "qty": 1485 }, { "id": 108, "qty": 432 }, { "id": 111, "qty": 27 }] },
  { "id": "7", "name": "Aerospace factory", "type": "production", "cost": 106950, "baseTime": 6, "wages": 586.5, "resources": [{ "id": 101, "qty": 124 }, { "id": 102, "qty": 1705 }, { "id": 108, "qty": 496 }, { "id": 111, "qty": 31 }] },
  { "id": "D", "name": "Propulsion factory", "type": "production", "cost": 103500, "baseTime": 7, "wages": 621, "resources": [{ "id": 101, "qty": 120 }, { "id": 102, "qty": 1650 }, { "id": 108, "qty": 480 }, { "id": 111, "qty": 30 }] },
  { "id": "0", "name": "Hangar", "type": "production", "cost": 100050, "baseTime": 3, "wages": 414, "resources": [{ "id": 101, "qty": 116 }, { "id": 102, "qty": 1595 }, { "id": 108, "qty": 464 }, { "id": 111, "qty": 29 }] },
  { "id": "8", "name": "Aerospace electronics", "type": "production", "cost": 141450, "baseTime": 6, "wages": 724.5, "resources": [{ "id": 101, "qty": 164 }, { "id": 102, "qty": 2255 }, { "id": 108, "qty": 656 }, { "id": 111, "qty": 41 }] },
  { "id": "9", "name": "Vertical integration facility", "type": "production", "cost": 113850, "baseTime": 3, "wages": 414, "resources": [{ "id": 101, "qty": 132 }, { "id": 102, "qty": 1815 }, { "id": 108, "qty": 528 }, { "id": 111, "qty": 33 }] },
  { "id": "l", "name": "Launch pad", "type": "production", "cost": 138000, "baseTime": 12, "wages": 414, "resources": [{ "id": 101, "qty": 144 }, { "id": 102, "qty": 1980 }, { "id": 108, "qty": 576 }, { "id": 111, "qty": 36 }] },
  { "id": "V", "name": "Vehicle workshop", "type": "production", "cost": 93150, "baseTime": 6, "wages": 414, "resources": [{ "id": 101, "qty": 108 }, { "id": 102, "qty": 1485 }, { "id": 108, "qty": 432 }, { "id": 111, "qty": 27 }] },
  // === Research Buildings ===
  { "id": "s", "name": "Software R&D", "type": "production", "cost": 65550, "baseTime": 3, "wages": 414, "resources": [{ "id": 101, "qty": 76 }, { "id": 102, "qty": 1045 }, { "id": 108, "qty": 304 }, { "id": 111, "qty": 19 }] },
  { "id": "f", "name": "Fashion & Design", "type": "production", "cost": 72450, "baseTime": 2, "wages": 448.5, "resources": [{ "id": 101, "qty": 84 }, { "id": 102, "qty": 1155 }, { "id": 108, "qty": 336 }, { "id": 111, "qty": 21 }] },
  { "id": "q", "name": "Kitchen", "type": "production", "cost": 82800, "baseTime": 4, "wages": 414, "resources": [{ "id": 101, "qty": 96 }, { "id": 102, "qty": 1320 }, { "id": 108, "qty": 384 }, { "id": 111, "qty": 24 }] },
  { "id": "b", "name": "Breeding laboratory", "type": "production", "cost": 96600, "baseTime": 5, "wages": 414, "resources": [{ "id": 101, "qty": 112 }, { "id": 102, "qty": 1540 }, { "id": 108, "qty": 448 }, { "id": 111, "qty": 28 }] },
  { "id": "c", "name": "Chemistry laboratory", "type": "production", "cost": 96600, "baseTime": 5, "wages": 414, "resources": [{ "id": 101, "qty": 112 }, { "id": 102, "qty": 1540 }, { "id": 108, "qty": 448 }, { "id": 111, "qty": 28 }] },
  { "id": "p", "name": "Plant research center", "type": "production", "cost": 103500, "baseTime": 5, "wages": 414, "resources": [{ "id": 101, "qty": 120 }, { "id": 102, "qty": 1650 }, { "id": 108, "qty": 480 }, { "id": 111, "qty": 30 }] },
  { "id": "a", "name": "Automotive R&D", "type": "production", "cost": 138000, "baseTime": 6, "wages": 552, "resources": [{ "id": 101, "qty": 160 }, { "id": 102, "qty": 2200 }, { "id": 108, "qty": 640 }, { "id": 111, "qty": 40 }] },
  { "id": "h", "name": "Physics laboratory", "type": "production", "cost": 165600, "baseTime": 7, "wages": 586.5, "resources": [{ "id": 101, "qty": 192 }, { "id": 102, "qty": 2640 }, { "id": 108, "qty": 768 }, { "id": 111, "qty": 48 }] },
  { "id": "y", "name": "Academy", "type": "production", "cost": 65550, "baseTime": 3, "wages": 414, "resources": [{ "id": 101, "qty": 76 }, { "id": 102, "qty": 1045 }, { "id": 108, "qty": 304 }, { "id": 111, "qty": 19 }] },
  // === Resource Buildings ===
  { "id": "v", "name": "Forest nursery", "type": "production", "cost": 20700, "baseTime": 2, "wages": 103.5, "resources": [{ "id": 101, "qty": 24 }, { "id": 102, "qty": 330 }, { "id": 108, "qty": 96 }, { "id": 111, "qty": 6 }] },
  // === Retail Buildings (Concrete/Bricks/Planks/CU) ===
  { "id": "G", "name": "Grocery store", "type": "retail", "cost": 10350, "baseTime": 1, "wages": 138, "resources": [{ "id": 101, "qty": 12 }, { "id": 102, "qty": 165 }, { "id": 108, "qty": 48 }, { "id": 111, "qty": 2 }] },
  { "id": "C", "name": "Electronics store", "type": "retail", "cost": 17250, "baseTime": 1, "wages": 172.5, "resources": [{ "id": 101, "qty": 20 }, { "id": 102, "qty": 275 }, { "id": 108, "qty": 80 }, { "id": 111, "qty": 5 }] },
  { "id": "d", "name": "Hardware store", "type": "retail", "cost": 13800, "baseTime": 4, "wages": 172.5, "resources": [{ "id": 101, "qty": 16 }, { "id": 102, "qty": 220 }, { "id": 108, "qty": 64 }, { "id": 111, "qty": 4 }] },
  { "id": "A", "name": "Gas station", "type": "retail", "cost": 24150, "baseTime": 2, "wages": 345, "resources": [{ "id": 101, "qty": 28 }, { "id": 102, "qty": 385 }, { "id": 108, "qty": 112 }, { "id": 111, "qty": 7 }] },
  { "id": "H", "name": "Fashion store", "type": "retail", "cost": 17250, "baseTime": 3, "wages": 310.5, "resources": [{ "id": 101, "qty": 20 }, { "id": 102, "qty": 275 }, { "id": 108, "qty": 80 }, { "id": 111, "qty": 5 }] },
  { "id": "2", "name": "Car dealership", "type": "retail", "cost": 20700, "baseTime": 3, "wages": 379.5, "resources": [{ "id": 101, "qty": 24 }, { "id": 102, "qty": 330 }, { "id": 108, "qty": 96 }, { "id": 111, "qty": 6 }] },
  { "id": "B", "name": "Sales offices", "type": "retail", "cost": 62100, "baseTime": 2, "wages": 586.5, "resources": [{ "id": 101, "qty": 72 }, { "id": 102, "qty": 990 }, { "id": 108, "qty": 288 }, { "id": 111, "qty": 18 }] },
  { "id": "r", "name": "Restaurant", "type": "retail", "cost": 89700, "baseTime": 3, "wages": 655.5, "resources": [] },
  { "id": "t", "name": "Halloween market", "type": "retail", "cost": 13800, "baseTime": 2, "wages": 207, "resources": [{ "id": 101, "qty": 16 }, { "id": 102, "qty": 220 }, { "id": 108, "qty": 64 }, { "id": 111, "qty": 4 }] },
  { "id": "u", "name": "Xmas market", "type": "retail", "cost": 17250, "baseTime": 3, "wages": 207, "resources": [{ "id": 101, "qty": 20 }, { "id": 102, "qty": 275 }, { "id": 108, "qty": 80 }, { "id": 111, "qty": 5 }] },
  { "id": "z", "name": "Beach market", "type": "retail", "cost": 10350, "baseTime": 1, "wages": 207, "resources": [{ "id": 101, "qty": 12 }, { "id": 102, "qty": 165 }, { "id": 108, "qty": 48 }, { "id": 111, "qty": 3 }] },
  // === Special (Cash-only) ===
  { "id": "5", "name": "Lake", "type": "retail", "cost": 138000, "baseTime": 12, "wages": 0, "resources": [] }
];

export const CONSTRUCTION_MATERIALS = [
  { id: 101, name: "Reinforced concrete", basePrice: 500 },
  { id: 102, name: "Bricks", basePrice: 15 },
  { id: 108, name: "Planks", basePrice: 30 },
  { id: 111, name: "Construction units", basePrice: 2673.75 }
];

// Retail store → sellable product IDs
// Game API resource IDs per retail store (from api.simcotools.com)
// These are the ACTUAL game IDs, not the simco_static.ts local IDs.
export const RETAIL_PRODUCT_MAP: Record<string, number[]> = {
  G: [3,4,5,7,8,9,117,119,121,122,123,124,125,126,127,129,130,131,132,134,140,142,143,146,149,152,153,154],
  C: [24,25,26,27,28],
  A: [11,12],
  2: [53,54,55,56,57],
  H: [60,61,62,63,64,65,70,71],
  d: [102,103,108,109,110],
  r: [],     // Restaurant — P2P menu/rating system, not a simple retail product
  B: [],     // Sales offices — B2B contracts
  t: [146,147,148],
  u: [67,144,150],
  z: [153,154],
};

// Game reference prices for construction materials (from game encyclopedia — source of truth)
// These are the MARKET reference prices used for NPC buy/sell orders, NOT scrap prices.
// Scrap uses lower prices (Concrete=$166.66, Bricks=$2.16, Planks=$9.08, CU=$2501.71)
// and is reflected in building.cost (reference value).
export const MAT_REF_PRICES: Record<number, number> = { 101: 500, 102: 15, 108: 30, 111: 2673.75 };

// Economic phase production multipliers (game uses these internally)
export const PHASE_MULTIPLIERS: Record<string, number> = { boom: 1.25, normal: 1.0, recession: 0.8 };

export interface ResourceData {
  id: number;
  name: string;
  transport: number;
  buildingId?: string | number;
  basePh?: number;
  baseWages?: number;
  inputs?: Record<number, number>;
  retailInfo?: any[];
}

export const RESOURCES: ResourceData[] = [
  { "id": 1, "name": "Power", "transport": 0, "buildingId": "E", "basePh": 2566.94, "baseWages": 414 },
  { "id": 2, "name": "Water", "transport": 0, "buildingId": "W", "basePh": 1626.43, "baseWages": 345 },
  { "id": 3, "name": "Apples", "transport": 1, "buildingId": "P", "basePh": 202.19, "baseWages": 103.5 },
  { "id": 4, "name": "Oranges", "transport": 1, "buildingId": "P", "basePh": 186.01, "baseWages": 103.5 },
  { "id": 5, "name": "Grapes", "transport": 1, "buildingId": "P", "basePh": 161.75, "baseWages": 103.5 },
  { "id": 6, "name": "Grain", "transport": 0.1, "buildingId": "P", "basePh": 808.75, "baseWages": 103.5 },
  { "id": 7, "name": "Steak", "transport": 1, "buildingId": "e", "basePh": 25.67, "baseWages": 414, "inputs": { 115: 0.125 } },
  { "id": 8, "name": "Sausages", "transport": 0.1, "buildingId": "e", "basePh": 77.01, "baseWages": 414, "inputs": { 116: 0.0625 } },
  { "id": 9, "name": "Eggs", "transport": 0.1, "buildingId": "F", "basePh": 316.47, "baseWages": 138, "inputs": { 2: 0.4, 6: 0.5 } },
  { "id": 10, "name": "Crude oil", "transport": 1, "buildingId": "O", "basePh": 41.52, "baseWages": 517.5 },
  { "id": 11, "name": "Petrol", "transport": 1, "buildingId": "R", "basePh": 111.41, "baseWages": 482.3, "inputs": { 10: 0.75, 73: 0.25 } },
  { "id": 12, "name": "Diesel", "transport": 1, "buildingId": "R", "basePh": 115.13, "baseWages": 482.3, "inputs": { 10: 0.75, 73: 0.25 } },
  { "id": 13, "name": "Transport", "transport": 0, "buildingId": "S", "basePh": 3173.95, "baseWages": 310.5 },
  { "id": 14, "name": "Minerals", "transport": 1, "buildingId": "M", "basePh": 119.23, "baseWages": 276 },
  { "id": 15, "name": "Bauxite", "transport": 1, "buildingId": "M", "basePh": 96.52, "baseWages": 276 },
  { "id": 16, "name": "Silicon", "transport": 1, "buildingId": "Y", "basePh": 154.02, "baseWages": 414, "inputs": { 44: 2 } },
  { "id": 17, "name": "Chemicals", "transport": 1, "buildingId": "Y", "basePh": 213.91, "baseWages": 414, "inputs": { 14: 1 } },
  { "id": 18, "name": "Aluminium", "transport": 1, "buildingId": "Y", "basePh": 99.43, "baseWages": 414, "inputs": { 15: 1 } },
  { "id": 19, "name": "Plastic", "transport": 1, "buildingId": "Y", "basePh": 204.25, "baseWages": 483, "inputs": { 10: 0.2 } },
  { "id": 20, "name": "Processors", "transport": 1, "buildingId": "L", "basePh": 9.18, "baseWages": 379.5, "inputs": { 16: 4, 17: 1 } },
  { "id": 21, "name": "Electronic components", "transport": 1, "buildingId": "L", "basePh": 41.33, "baseWages": 379.5, "inputs": { 16: 3, 17: 1 } },
  { "id": 22, "name": "Batteries", "transport": 1, "buildingId": "L", "basePh": 25.26, "baseWages": 379.5, "inputs": { 17: 4 } },
  { "id": 23, "name": "Displays", "transport": 1, "buildingId": "L", "basePh": 32.14, "baseWages": 379.5, "inputs": { 16: 5, 17: 4 } },
  { "id": 24, "name": "Smart phones", "transport": 2, "buildingId": "L", "basePh": 11.48, "baseWages": 379.5, "inputs": { 18: 2, 20: 2, 21: 1, 22: 1, 23: 1 } },
  { "id": 69, "name": "Gold ore", "transport": 1, "buildingId": "M", "basePh": 15.6, "baseWages": 276 },
  { "id": 40, "name": "Cotton", "transport": 0.5, "buildingId": "P", "basePh": 258.8, "baseWages": 103.5 },
  { "id": 41, "name": "Fabric", "transport": 0.5, "buildingId": "T", "basePh": 241.12, "baseWages": 138, "inputs": { 40: 2 } },
  { "id": 42, "name": "Iron ore", "transport": 1, "buildingId": "M", "basePh": 181.69, "baseWages": 276 },
  { "id": 43, "name": "Steel", "transport": 1, "buildingId": "Y", "basePh": 192.52, "baseWages": 414, "inputs": { 42: 1, 17: 0.1 } },
  { "id": 44, "name": "Sand", "transport": 1, "buildingId": "Q", "basePh": 1419.44, "baseWages": 276 },
  { "id": 45, "name": "Glass", "transport": 1, "buildingId": "Y", "basePh": 128.35, "baseWages": 414, "inputs": { 16: 1 } },
  { "id": 46, "name": "Leather", "transport": 1, "buildingId": "F", "basePh": 30.14, "baseWages": 138, "inputs": { 115: 0.125 } },
  { "id": 47, "name": "On-board computer", "transport": 1, "buildingId": "8", "basePh": 13.78, "baseWages": 379.5, "inputs": { 20: 2, 21: 3 } },
  { "id": 48, "name": "Electric motor", "transport": 2, "buildingId": "Y", "basePh": 30.78, "baseWages": 621, "inputs": { 21: 3, 43: 2 } },
  { "id": 50, "name": "Basic interior", "transport": 2, "buildingId": "1", "basePh": 31.89, "baseWages": 448.5, "inputs": { 19: 2, 23: 2, 41: 5 } },
  { "id": 51, "name": "Car body", "transport": 2, "buildingId": "1", "basePh": 23.92, "baseWages": 448.5, "inputs": { 18: 30, 43: 5, 45: 5 } },
  { "id": 52, "name": "Combustion engine", "transport": 2, "buildingId": "1", "basePh": 5.6, "baseWages": 621, "inputs": { 17: 5, 21: 5, 43: 6 } },
  { "id": 73, "name": "Ethanol", "transport": 1, "buildingId": "R", "basePh": 60.94, "baseWages": 241.5, "inputs": { 72: 10 } },
  { "id": 72, "name": "Sugarcane", "transport": 0.1, "buildingId": "P", "basePh": 647, "baseWages": 103.5 },
  { "id": 75, "name": "Carbon fibers", "transport": 0.1, "buildingId": "Y", "basePh": 245.11, "baseWages": 483, "inputs": { 10: 0.1 } },
  { "id": 76, "name": "Carbon composite", "transport": 1, "buildingId": "7", "basePh": 68.45, "baseWages": 414, "inputs": { 75: 8 } },
  { "id": 77, "name": "Fuselage", "transport": 2, "buildingId": "7", "basePh": 3.3, "baseWages": 586.5, "inputs": { 76: 40 } },
  { "id": 78, "name": "Wing", "transport": 2, "buildingId": "7", "basePh": 8.11, "baseWages": 586.5, "inputs": { 18: 5, 76: 30 } },
  { "id": 79, "name": "High grade e-comps", "transport": 1, "buildingId": "8", "basePh": 1.84, "baseWages": 379.5, "inputs": { 16: 4, 17: 3, 69: 0.0625 } },
  { "id": 80, "name": "Flight computer", "transport": 1, "buildingId": "8", "basePh": 2.26, "baseWages": 724.5, "inputs": { 47: 2, 79: 4 } },
  { "id": 81, "name": "Cockpit", "transport": 1, "buildingId": "8", "basePh": 2.26, "baseWages": 724.5, "inputs": { 23: 8, 50: 1, 79: 4 } },
  { "id": 82, "name": "Attitude control", "transport": 1, "buildingId": "8", "basePh": 2.72, "baseWages": 724.5, "inputs": { 22: 5, 43: 3, 48: 3 } },
  { "id": 101, "name": "Reinforced concrete", "transport": 10, "buildingId": "o", "basePh": 188.27, "baseWages": 380, "inputs": { 103: 15, 43: 5, 44: 20 } },
  { "id": 102, "name": "Bricks", "transport": 1, "buildingId": "x", "basePh": 367.35, "baseWages": 380, "inputs": { 104: 0.5 } },
  { "id": 103, "name": "Cement", "transport": 1, "buildingId": "x", "basePh": 298.47, "baseWages": 380, "inputs": { 105: 3 } },
  { "id": 104, "name": "Clay", "transport": 1, "buildingId": "Q", "basePh": 1078.77, "baseWages": 276 },
  { "id": 105, "name": "Limestone", "transport": 1, "buildingId": "Q", "basePh": 794.89, "baseWages": 276 },
  { "id": 106, "name": "Wood", "transport": 1, "buildingId": "v", "basePh": 92.97, "baseWages": 103.5 },
  { "id": 107, "name": "Steel Beams", "transport": 5, "buildingId": "x", "basePh": 129.98, "baseWages": 483, "inputs": { 43: 1 } },
  { "id": 108, "name": "Planks", "transport": 1, "buildingId": "x", "basePh": 115.13, "baseWages": 483, "inputs": { 106: 0.5 } },
  { "id": 109, "name": "Windows", "transport": 1, "buildingId": "x", "basePh": 16.71, "baseWages": 483, "inputs": { 18: 2, 45: 1 } },
  { "id": 110, "name": "Tools", "transport": 1, "buildingId": "x", "basePh": 26, "baseWages": 483, "inputs": { 108: 0.5, 21: 1, 22: 1, 43: 0.5 } },
  { "id": 111, "name": "Construction units", "transport": 0, "buildingId": "x", "basePh": 0.99, "baseWages": 345, "inputs": { 107: 8, 110: 4, 112: 0.125, 12: 5 } },
  { "id": 112, "name": "Bulldozers", "transport": 100, "buildingId": "x", "basePh": 0.125, "baseWages": 483, "inputs": { 43: 40, 110: 10 } },
  { "id": 115, "name": "Cows", "transport": 1, "buildingId": "F", "basePh": 37.68, "baseWages": 138, "inputs": { 139: 12 } },
  { "id": 116, "name": "Pigs", "transport": 1, "buildingId": "F", "basePh": 82.89, "baseWages": 138, "inputs": { 139: 4 } },
  { "id": 117, "name": "Milk", "transport": 1, "buildingId": "F", "basePh": 120.56, "baseWages": 138, "inputs": { 139: 0.5 } },
  { "id": 118, "name": "Coffee beans", "transport": 0.1, "buildingId": "P", "basePh": 412.46, "baseWages": 103.5 },
  { "id": 119, "name": "Coffee powder", "transport": 1, "buildingId": "i", "basePh": 22.96, "baseWages": 380, "inputs": { 118: 10 } },
  { "id": 120, "name": "Vegetables", "transport": 0.2, "buildingId": "P", "basePh": 283.06, "baseWages": 103.5 },
  { "id": 121, "name": "Bread", "transport": 1, "buildingId": "j", "basePh": 11.96, "baseWages": 448.5, "inputs": { 137: 1 } },
  { "id": 122, "name": "Cheese", "transport": 1, "buildingId": "k", "basePh": 5.51, "baseWages": 379.5, "inputs": { 117: 1 } },
  { "id": 133, "name": "Flour", "transport": 0.1, "buildingId": "i", "basePh": 73.29, "baseWages": 379.5, "inputs": { 6: 15 } },
  { "id": 134, "name": "Butter", "transport": 1, "buildingId": "k", "basePh": 13.78, "baseWages": 379.5, "inputs": { 117: 0.5 } },
  { "id": 135, "name": "Sugar", "transport": 1, "buildingId": "i", "basePh": 41.33, "baseWages": 379.5, "inputs": { 72: 1 } },
  { "id": 136, "name": "Cocoa", "transport": 0.1, "buildingId": "P", "basePh": 130.78, "baseWages": 103.5 },
  { "id": 137, "name": "Dough", "transport": 1, "buildingId": "j", "basePh": 11.96, "baseWages": 448.5, "inputs": { 133: 2, 134: 0.5, 9: 1 } },
  { "id": 139, "name": "Fodder", "transport": 1, "buildingId": "i", "basePh": 284.7, "baseWages": 379.5, "inputs": { 120: 0.5, 6: 10 } },
  { "id": 25, "name": "Seeds", "transport": 0.1, "buildingId": "P", "basePh": 0, "baseWages": 0 },
  { "id": 26, "name": "Pumpkin", "transport": 1, "buildingId": "P", "basePh": 0, "baseWages": 0 },
  { "id": 27, "name": "Orange Juice", "transport": 1, "buildingId": "6", "basePh": 0, "baseWages": 0 },
  { "id": 28, "name": "Apple Cider", "transport": 1, "buildingId": "6", "basePh": 0, "baseWages": 0 },
  { "id": 29, "name": "Ginger Beer", "transport": 1, "buildingId": "6", "basePh": 0, "baseWages": 0 },
  { "id": 30, "name": "Frozen Pizza", "transport": 1, "buildingId": "q", "basePh": 0, "baseWages": 0 },
  { "id": 31, "name": "Pasta", "transport": 1, "buildingId": "i", "basePh": 0, "baseWages": 0 },
  { "id": 32, "name": "Chocolate", "transport": 1, "buildingId": "k", "basePh": 0, "baseWages": 0 },
  { "id": 33, "name": "Vegetable Oil", "transport": 1, "buildingId": "i", "basePh": 0, "baseWages": 0 },
  { "id": 130, "name": "Golden Bars", "transport": 1, "buildingId": "Y", "basePh": 0, "baseWages": 0 },
  { "id": 131, "name": "Xmas Ornament", "transport": 1, "buildingId": "T", "basePh": 0, "baseWages": 0 },
  { "id": 132, "name": "Xmas Crackers", "transport": 1, "buildingId": "T", "basePh": 0, "baseWages": 0 },
  { "id": 140, "name": "Tree", "transport": 1, "buildingId": "v", "basePh": 0, "baseWages": 0 },
  { "id": 141, "name": "Software", "transport": 0, "buildingId": "s", "basePh": 0, "baseWages": 0 },
  { "id": 142, "name": "Fashion research", "transport": 0, "buildingId": "f", "basePh": 0, "baseWages": 0 },
  { "id": 143, "name": "Recipes", "transport": 0, "buildingId": "q", "basePh": 0, "baseWages": 0 },
  { "id": 144, "name": "Breeding research", "transport": 0, "buildingId": "b", "basePh": 0, "baseWages": 0 },
  { "id": 145, "name": "Chemistry research", "transport": 0, "buildingId": "c", "basePh": 0, "baseWages": 0 },
  { "id": 146, "name": "Materials research", "transport": 0, "buildingId": "h", "basePh": 0, "baseWages": 0 },
  { "id": 147, "name": "Plant research", "transport": 0, "buildingId": "p", "basePh": 0, "baseWages": 0 },
  { "id": 148, "name": "Aerospace research", "transport": 0, "buildingId": "l", "basePh": 0, "baseWages": 0 },
  { "id": 149, "name": "Automotive research", "transport": 0, "buildingId": "a", "basePh": 0, "baseWages": 0 },
  { "id": 150, "name": "Energy research", "transport": 0, "buildingId": "h", "basePh": 0, "baseWages": 0 },
  { "id": 151, "name": "Mining research", "transport": 0, "buildingId": "h", "basePh": 0, "baseWages": 0 },
  { "id": 152, "name": "Electronics research", "transport": 0, "buildingId": "h", "basePh": 0, "baseWages": 0 }
];
