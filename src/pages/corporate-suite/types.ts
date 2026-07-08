export interface Executive {
  name: string;
  management: number;
  accounting: number;
  communication: number;
  science: number;
}

export interface MapItem { id: string; level: number; instanceId?: number; }
export interface InventoryItem { id: number; qty: number; }

export interface SuiteStateV6 {
  activeTab: 'command' | 'ops' | 'exec' | 'finance' | 'logistics' | 'risk' | 'retail' | 'ledger' | 'rankings' | 'bonds';
  companyId: string;
  ledgerMeta?: { type: string; header: string[] };
  companyName?: string;
  companyLogo?: string;
  companyLevel?: number;
  companyRank?: number;
  companyValue?: number;
  apiAO?: number;
  workers?: number;
  governmentTier?: number;
  extraSlots?: number;
  onlineStatus?: string;
  lastSynced?: string;
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
    abundance: number;
    researchBonus: number;
  };
  debt: { current: number; rate: number; };
  ledger: any[];
}

export const EMPTY_EXEC: Executive = { name: "", management: 0, accounting: 0, communication: 0, science: 0 };

export const DEFAULT_STATE: SuiteStateV6 = {
  activeTab: 'command',
  companyId: "",
  companyLevel: 0,
  companyRank: 0,
  companyValue: 0,
  apiAO: 0,
  workers: 0,
  governmentTier: 0,
  extraSlots: 0,
  onlineStatus: "n/a",
  map: [],
  board: {
    coo: EMPTY_EXEC, cfo: EMPTY_EXEC, cmo: EMPTY_EXEC, cto: EMPTY_EXEC,
    cooApp: EMPTY_EXEC, cfoApp: EMPTY_EXEC, cmoApp: EMPTY_EXEC, ctoApp: EMPTY_EXEC,
  },
  inventory: [],
  settings: {
    prodBonus: 12, realm: 0, estDailyProfit: 250000, whatIfLevel: 0,
    bankLevel: 0, cash: 0, bondsSold: 0, bondsOwned: 0,
    profileSalesBonus: 0, recreationalBuildings: 0,
    patentStartingQuality: 0, patentTargetQuality: 1, researchUnitCost: 179,
    retailResourceId: 24,
    abundance: 100,
    researchBonus: 0
  },
  debt: { current: 2000000, rate: 0.5 },
  ledger: []
};

export const n = (v: any) => {
  if (v === undefined || v === null) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
};
