export const BUILDINGS = [
  { id: 1, name: "Power Plant", type: "production", cost: 6900, baseTime: 4, wages: 103.5 },
  { id: 2, name: "Water Reservoir", type: "production", cost: 6900, baseTime: 4, wages: 103.5 },
  { id: 3, name: "Farm", type: "production", cost: 6900, baseTime: 4, wages: 103.5 },
  { id: 4, name: "Plantation", type: "production", cost: 6900, baseTime: 4, wages: 103.5 },
  { id: 5, name: "Quarry", type: "production", cost: 6900, baseTime: 4, wages: 103.5 },
  { id: 6, name: "Mine", type: "production", cost: 69000, baseTime: 12, wages: 414 },
  { id: 7, name: "Factory", type: "production", cost: 69000, baseTime: 12, wages: 414 },
  { id: 8, name: "Electronics Factory", type: "production", cost: 69000, baseTime: 12, wages: 414 },
  { id: 15, name: "Oil Rig", type: "production", cost: 69000, baseTime: 12, wages: 517.5 },
  { id: 16, name: "Refinery", type: "production", cost: 69000, baseTime: 12, wages: 517.5 },
  { id: 17, name: "Aerospace Factory", type: "production", cost: 138000, baseTime: 16, wages: 724.5 },
  { id: 18, name: "Catering", type: "production", cost: 69000, baseTime: 12, wages: 345 },
  { id: 9, name: "Grocery Store", type: "retail", cost: 6900, baseTime: 4, wages: 138 },
  { id: 10, name: "Electronics Store", type: "retail", cost: 6900, baseTime: 4, wages: 138 },
  { id: 11, name: "Gas Station", type: "retail", cost: 6900, baseTime: 4, wages: 138 },
  { id: 12, name: "Car Dealership", type: "retail", cost: 6900, baseTime: 4, wages: 138 },
  { id: 13, name: "Hardware Store", type: "retail", cost: 6900, baseTime: 4, wages: 138 },
  { id: 14, name: "Fashion Store", type: "retail", cost: 6900, baseTime: 4, wages: 138 },
];

export interface ResourceData {
  id: number;
  name: string;
  transport: number;
  buildingId?: number;
  basePh?: number;
  baseWages?: number;
  inputs?: Record<number, number>;
}

export const RESOURCES: ResourceData[] = [
  { id: 1, name: "Power", transport: 0, buildingId: 1, basePh: 1100, baseWages: 103.5 },
  { id: 2, name: "Water", transport: 0, buildingId: 2, basePh: 1200, baseWages: 103.5 },
  { id: 3, name: "Apples", transport: 1, buildingId: 3, basePh: 202, baseWages: 103.5, inputs: { 2: 3 } },
  { id: 11, name: "Oranges", transport: 1, buildingId: 3, basePh: 180, baseWages: 103.5, inputs: { 2: 3 } },
  { id: 18, name: "Aluminium", transport: 1, buildingId: 7, basePh: 99, baseWages: 414, inputs: { 1: 15 } },
  { id: 40, name: "Crude Oil", transport: 1, buildingId: 15, basePh: 50, baseWages: 517.5, inputs: { 1: 10 } },
  { id: 50, name: "Satellite", transport: 1, buildingId: 17, basePh: 0.1, baseWages: 724.5, inputs: { 1: 100, 18: 50 } },
];

export const CONSTRUCTION_MATERIALS = [
  { id: 1, name: "Reinforced Concrete", basePrice: 166.66 },
  { id: 2, name: "Bricks", basePrice: 2.16 },
  { id: 3, name: "Planks", basePrice: 9.08 },
  { id: 4, name: "Construction Units", basePrice: 2501.71 },
  { id: 5, name: "Windows", basePrice: 38.5 },
  { id: 6, name: "Tools", basePrice: 14.5 }
];
