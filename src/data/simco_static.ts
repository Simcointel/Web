export const BUILDINGS = [
  { id: 1, name: "Power Plant", type: "production", cost: 6900, resources: [
    { id: 1, qty: 1, name: "Reinforced Concrete" },
    { id: 2, qty: 10, name: "Bricks" },
    { id: 3, qty: 5, name: "Planks" }
  ], produces: [1] },
  { id: 2, name: "Water Reservoir", type: "production", cost: 6900, resources: [
    { id: 1, qty: 1, name: "Reinforced Concrete" },
    { id: 2, qty: 10, name: "Bricks" },
    { id: 3, qty: 5, name: "Planks" }
  ], produces: [2] },
  { id: 3, name: "Farm", type: "production", cost: 6900, resources: [
     { id: 3, qty: 20, name: "Planks" },
     { id: 2, qty: 100, name: "Bricks" }
  ], produces: [11, 12, 13, 14, 15] },
  { id: 4, name: "Plantation", type: "production", cost: 6900, produces: [16, 17, 18, 19, 20] },
  { id: 5, name: "Quarry", type: "production", cost: 6900, produces: [21, 22, 23] },
  { id: 6, name: "Mine", type: "production", cost: 69000, produces: [24, 25, 26, 27, 28, 29] },
  { id: 7, name: "Factory", type: "production", cost: 69000, produces: [30, 31, 32, 33, 34] },
  { id: 8, name: "Electronics Factory", type: "production", cost: 69000, produces: [35, 36, 37, 38] },
  { id: 9, name: "Grocery Store", type: "retail", cost: 6900, produces: [] },
  { id: 10, name: "Electronics Store", type: "retail", cost: 6900, produces: [] },
  { id: 11, name: "Gas Station", type: "retail", cost: 6900, produces: [] },
  { id: 12, name: "Car Dealership", type: "retail", cost: 6900, produces: [] },
  { id: 13, name: "Hardware Store", type: "retail", cost: 6900, produces: [] },
  { id: 14, name: "Fashion Store", type: "retail", cost: 6900, produces: [] },
];

export const CONSTRUCTION_MATERIALS = [
  { id: 1, name: "Reinforced Concrete", basePrice: 166.66 },
  { id: 2, name: "Bricks", basePrice: 2.16 },
  { id: 3, name: "Planks", basePrice: 9.08 },
  { id: 4, name: "Construction Units", basePrice: 2501.71 },
  { id: 5, name: "Windows", basePrice: 38.5 },
  { id: 6, name: "Tools", basePrice: 14.5 }
];
