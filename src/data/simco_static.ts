export const BUILDINGS = [
  { id: 1, name: "Power Plant", type: "production", cost: 6900, baseTime: 4, wages: 103.5, resources: [{ id: 102, qty: 10 }, { id: 103, qty: 5 }] },
  { id: 2, name: "Water Reservoir", type: "production", cost: 6900, baseTime: 4, wages: 103.5, resources: [{ id: 102, qty: 10 }, { id: 103, qty: 5 }] },
  { id: 3, name: "Farm", type: "production", cost: 6900, baseTime: 4, wages: 103.5, resources: [{ id: 103, qty: 20 }, { id: 102, qty: 100 }] },
  { id: 4, name: "Plantation", type: "production", cost: 6900, baseTime: 4, wages: 103.5, resources: [{ id: 103, qty: 20 }, { id: 102, qty: 100 }] },
  { id: 5, name: "Quarry", type: "production", cost: 6900, baseTime: 4, wages: 103.5, abundance: true, resources: [{ id: 103, qty: 20 }, { id: 102, qty: 100 }] },
  { id: 6, name: "Mine", type: "production", cost: 69000, baseTime: 12, wages: 414, abundance: true, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 7, name: "Factory", type: "production", cost: 69000, baseTime: 12, wages: 414, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 8, name: "Electronics Factory", type: "production", cost: 69000, baseTime: 12, wages: 414, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 15, name: "Oil Rig", type: "production", cost: 69000, baseTime: 12, wages: 517.5, abundance: true, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 16, name: "Refinery", type: "production", cost: 69000, baseTime: 12, wages: 517.5, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 17, name: "Aerospace Factory", type: "production", cost: 138000, baseTime: 16, wages: 724.5, resources: [{ id: 101, qty: 20 }, { id: 102, qty: 1000 }, { id: 103, qty: 400 }] },
  { id: 18, name: "Catering", type: "production", cost: 69000, baseTime: 12, wages: 345, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 19, name: "Food Processing Plant", type: "production", cost: 69000, baseTime: 12, wages: 345, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 20, name: "Software House", type: "production", cost: 69000, baseTime: 12, wages: 586.5, resources: [{ id: 101, qty: 5 }, { id: 104, qty: 100 }] },
  { id: 21, name: "Automotive Factory", type: "production", cost: 138000, baseTime: 16, wages: 724.5, resources: [{ id: 101, qty: 20 }, { id: 102, qty: 1000 }, { id: 103, qty: 400 }] },
  { id: 22, name: "Energy Research Lab", type: "research", cost: 69000, baseTime: 12, wages: 517.5, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 23, name: "Physics Lab", type: "research", cost: 69000, baseTime: 12, wages: 517.5, resources: [{ id: 101, qty: 10 }, { id: 102, qty: 500 }, { id: 103, qty: 200 }] },
  { id: 40, name: "Bank", type: "other", cost: 138000, baseTime: 24, wages: 1035, resources: [{ id: 101, qty: 20 }, { id: 104, qty: 500 }] },
  { id: 41, name: "Park", type: "other", cost: 1380, baseTime: 1, wages: 0, resources: [{ id: 103, qty: 5 }] },
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
  { id: 101, name: "Reinforced Concrete", basePrice: 166.66 },
  { id: 102, name: "Bricks", basePrice: 2.16 },
  { id: 103, name: "Planks", basePrice: 9.08 },
  { id: 104, name: "Construction Units", basePrice: 2501.71 },
  { id: 105, name: "Windows", basePrice: 38.5 },
  { id: 106, name: "Tools", basePrice: 14.5 }
];
