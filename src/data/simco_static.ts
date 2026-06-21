export const BUILDINGS = [
  { id: 1, name: "Power Plant", type: "production", cost: 6900, produces: [1], baseTime: 4, resources: [{ id: 1, qty: 1 }, { id: 2, qty: 10 }, { id: 3, qty: 5 }] },
  { id: 2, name: "Water Reservoir", type: "production", cost: 6900, produces: [2], baseTime: 4, resources: [{ id: 1, qty: 1 }, { id: 2, qty: 10 }, { id: 3, qty: 5 }] },
  { id: 3, name: "Farm", type: "production", cost: 6900, produces: [11, 12, 13, 14, 15], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 4, name: "Plantation", type: "production", cost: 6900, produces: [16, 17, 18, 19, 20], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 5, name: "Quarry", type: "production", cost: 6900, produces: [21, 22, 23], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 6, name: "Mine", type: "production", cost: 69000, produces: [24, 25, 26, 27, 28, 29], baseTime: 12, resources: [{ id: 1, qty: 10 }, { id: 2, qty: 500 }, { id: 3, qty: 200 }] },
  { id: 7, name: "Factory", type: "production", cost: 69000, produces: [30, 31, 32, 33, 34], baseTime: 12, resources: [{ id: 1, qty: 10 }, { id: 2, qty: 500 }, { id: 3, qty: 200 }] },
  { id: 8, name: "Electronics Factory", type: "production", cost: 69000, produces: [35, 36, 37, 38], baseTime: 12, resources: [{ id: 1, qty: 10 }, { id: 2, qty: 500 }, { id: 3, qty: 200 }] },
  { id: 15, name: "Oil Rig", type: "production", cost: 69000, produces: [40], baseTime: 12, resources: [{ id: 1, qty: 10 }, { id: 2, qty: 500 }, { id: 3, qty: 200 }] },
  { id: 16, name: "Refinery", type: "production", cost: 69000, produces: [41, 42, 43], baseTime: 12, resources: [{ id: 1, qty: 10 }, { id: 2, qty: 500 }, { id: 3, qty: 200 }] },
  { id: 17, name: "Aerospace Factory", type: "production", cost: 138000, produces: [50, 51, 52], baseTime: 16, resources: [{ id: 1, qty: 20 }, { id: 2, qty: 1000 }, { id: 3, qty: 400 }] },
  { id: 18, name: "Catering", type: "production", cost: 69000, produces: [60, 61], baseTime: 12, resources: [{ id: 1, qty: 10 }, { id: 2, qty: 500 }, { id: 3, qty: 200 }] },
  { id: 9, name: "Grocery Store", type: "retail", cost: 6900, produces: [], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 10, name: "Electronics Store", type: "retail", cost: 6900, produces: [], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 11, name: "Gas Station", type: "retail", cost: 6900, produces: [], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 12, name: "Car Dealership", type: "retail", cost: 6900, produces: [], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 13, name: "Hardware Store", type: "retail", cost: 6900, produces: [], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
  { id: 14, name: "Fashion Store", type: "retail", cost: 6900, produces: [], baseTime: 4, resources: [{ id: 3, qty: 20 }, { id: 2, qty: 100 }] },
];

export const CONSTRUCTION_MATERIALS = [
  { id: 1, name: "Reinforced Concrete", basePrice: 166.66 },
  { id: 2, name: "Bricks", basePrice: 2.16 },
  { id: 3, name: "Planks", basePrice: 9.08 },
  { id: 4, name: "Construction Units", basePrice: 2501.71 },
  { id: 5, name: "Windows", basePrice: 38.5 },
  { id: 6, name: "Tools", basePrice: 14.5 }
];
