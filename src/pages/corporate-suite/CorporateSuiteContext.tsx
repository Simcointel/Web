import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { SuiteStateV6, CoreMetrics, DEFAULT_STATE, n } from "./types";
import type { ProfitMarginsResponse, RetailData } from "../../types/api";
import type { DashboardMap } from "../../types/api";
import { storage } from "../../utils/storage";
import { BUILDINGS } from "../../data/simco_static";

interface CorporateSuiteContextValue {
  state: SuiteStateV6;
  setState: React.Dispatch<React.SetStateAction<SuiteStateV6>>;
  core: CoreMetrics;
  margins: ProfitMarginsResponse | null;
  retail: RetailData | null;
  phase: string;
  isSyncing: boolean;
  notification: { msg: string; type: 'success' | 'error' } | null;
  setNotification: (n: { msg: string; type: 'success' | 'error' } | null) => void;
  onSync: (id: string) => Promise<void>;
  onImportFromExtension: () => void;
  onShowPairingCode: () => void;
}

const CorporateSuiteContext = createContext<CorporateSuiteContextValue | null>(null);

export function useCorporateSuite() {
  const ctx = useContext(CorporateSuiteContext);
  if (!ctx) throw new Error("useCorporateSuite must be used within CorporateSuiteProvider");
  return ctx;
}

interface CorporateSuiteProviderProps {
  children: React.ReactNode;
  margins: ProfitMarginsResponse | null;
  retail: RetailData | null;
  dash: DashboardMap | null;
  realm: number;
}

export function CorporateSuiteProvider({
  children,
  margins,
  retail,
  dash,
  realm,
}: CorporateSuiteProviderProps) {
  const [state, setState] = useState<SuiteStateV6>(() => {
    const saved = storage.getSuiteState<SuiteStateV6>(DEFAULT_STATE);
    return saved;
  });

  // Persist state changes to storage
  const persistState = useCallback((newState: SuiteStateV6) => {
    storage.setSuiteState(newState);
  }, []);

  const setStateWithPersist = useCallback((updater: React.SetStateAction<SuiteStateV6>) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistState(next);
      return next;
    });
  }, [persistState]);

  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const phase = (dash as DashboardMap | undefined)?.[String(realm)]?.regime?.na || 'Normal';

  const { result: core } = useMemo(() => {
    const s = state || DEFAULT_STATE;
    const settings = s.settings || DEFAULT_STATE.settings;
    const effMap = s.map || [];
    const effBoard = s.board || DEFAULT_STATE.board;
    const effProfit = n(settings.estDailyProfit);
    const totalLevels = effMap.reduce((sum, i) => sum + n(i.level), 0) + n(settings.whatIfLevel);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    const getEff = (primary: number, all: number[]) => {
      const sumOthers = all.reduce((acc, v) => acc + n(v), 0) - n(primary);
      return n(primary) + Math.floor(sumOthers / 4);
    };

    const allMan = [effBoard.coo.management, effBoard.cfo.management, effBoard.cmo.management, effBoard.cto.management, effBoard.cooApp.management, effBoard.cfoApp.management, effBoard.cmoApp.management, effBoard.ctoApp.management];
    const allAcc = [effBoard.coo.accounting, effBoard.cfo.accounting, effBoard.cmo.accounting, effBoard.cto.accounting, effBoard.cooApp.accounting, effBoard.cfoApp.accounting, effBoard.cmoApp.accounting, effBoard.ctoApp.accounting];
    const allCom = [effBoard.coo.communication, effBoard.cfo.communication, effBoard.cmo.communication, effBoard.cto.communication, effBoard.cooApp.communication, effBoard.cfoApp.communication, effBoard.cmoApp.communication, effBoard.ctoApp.communication];
    const allSci = [effBoard.coo.science, effBoard.cfo.science, effBoard.cmo.science, effBoard.cto.science, effBoard.cooApp.science, effBoard.cfoApp.science, effBoard.cmoApp.science, effBoard.ctoApp.science];

    const effMan = getEff(effBoard.coo.management, allMan);
    const effAcc = getEff(effBoard.cfo.accounting, allAcc);
    const effCom = getEff(effBoard.cmo.communication, allCom);
    const effSci = getEff(effBoard.cto.science, allSci);

    const taxThreshold = effMan * 100000;
    const salesSpeedBonus = Math.min(effCom * 0.5, 25);
    const patentProb = Math.min(effSci * 0.8, 80);

    const dailyWages = effMap.reduce((sum, item) => {
      const building = BUILDINGS.find(b => b.id === item.id);
      if (!building) return sum;
      return sum + (building.wages || 0) * n(item.level) * 24;
    }, 0);

    const inventoryValue = (s.inventory || []).reduce((sum, item) => {
      const margin = margins?.resources?.find(m => m.id === item.id);
      return sum + n(margin?.outputVwap) * n(item.qty);
    }, 0);

    const mapValue = effMap.reduce((sum, item) => {
      const building = BUILDINGS.find(b => b.id === item.id);
      if (!building) return sum;
      return sum + building.cost * n(item.level);
    }, 0);

    const dailyInterest = (s.debt?.current || 0) * ((s.debt?.rate || 0) / 365);
    const estimatedDailyTax = n(settings.cash) > taxThreshold ? (n(settings.cash) - taxThreshold) * 0.001 : 0;
    const coverageRatio = dailyWages > 0 ? effProfit / dailyWages : 0;

    const buildingProfits = effMap.map(item => {
      const building = BUILDINGS.find(b => b.id === item.id);
      if (!building) return { name: item.id, profit: 0, level: item.level };
      return { name: building.name, profit: (building.wages || 0) * n(item.level) * 24 * 0.1, level: item.level };
    });

    const totalValuation = mapValue + inventoryValue + n(settings.cash);
    const netDaily = effProfit - dailyWages - dailyInterest - estimatedDailyTax;

    return {
      result: {
        totalLevels, actualAO: rawAO * 100, rawAO, taxThreshold, salesSpeedBonus, patentProb,
        dailyWages, inventoryValue, mapValue, dailyInterest, effMan, effAcc, effCom, effSci,
        estimatedDailyTax, coverageRatio, buildingProfits, totalValuation, netDaily,
      },
      metrics: { effMan, effAcc, effCom, effSci },
    };
  }, [state, margins, phase]);

  const onSync = useCallback(async (companyId: string) => {
    setIsSyncing(true);
    setNotification({ msg: "Syncing with extension...", type: 'success' });
    // Implementation in parent component
    setTimeout(() => { setIsSyncing(false); }, 1000);
  }, []);

  const onImportFromExtension = useCallback(() => {
    setNotification({ msg: "Importing from extension...", type: 'success' });
  }, []);

  const onShowPairingCode = useCallback(() => {
    // Implementation in parent component
  }, []);

  const value: CorporateSuiteContextValue = {
    state,
    setState: (updater) => {
      setState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persistState(next);
        return next;
      });
    },
    core,
    margins,
    retail,
    phase,
    isSyncing,
    notification,
    setNotification,
    onSync,
    onImportFromExtension,
    onShowPairingCode,
  };

  return (
    <CorporateSuiteContext.Provider value={value}>
      {children}
    </CorporateSuiteContext.Provider>
  );
}