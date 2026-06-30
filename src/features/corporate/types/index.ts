export interface Executive {
  name: string;
  management: number;
  accounting: number;
  communication: number;
  science: number;
}

export interface MapItem {
  id: string;
  level: number;
}

export interface InventoryItem {
  id: number;
  qty: number;
}

export interface SuiteStateV6 {
  activeTab: 'command' | 'ops' | 'exec' | 'finance' | 'logistics' | 'risk' | 'retail' | 'ledger';
  globalSync: boolean;
  map: MapItem[];
  board: {
    coo: Executive; cfo: Executive; cmo: Executive; cto: Executive;
    cooApp: Executive; cfoApp: Executive; cmoApp: Executive; ctoApp: Executive;
  };
  inventory: InventoryItem[];
  settings: {
    prodBonus: number; realm: number; estDailyProfit: number;
    whatIfLevel: number;
    bankLevel: number;
    cash: number;
    bondsSold: number;
    bondsOwned: number;
    profileSalesBonus: number;
    recreationalBuildings: number;
    patentStartingQuality: number;
    patentTargetQuality: number;
    researchUnitCost: number;
    retailResourceId: number;
  };
  debt: { current: number; rate: number; };
  moduleSettings: {
    opsLinked: boolean; execLinked: boolean; financeLinked: boolean;
    logisticsLinked: boolean; riskLinked: boolean;
  };
  showStaff?: boolean;
  ledger: any[];
}
