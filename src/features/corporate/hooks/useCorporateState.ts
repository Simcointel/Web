import { useState, useEffect, useMemo } from 'react';
import { SuiteStateV6, Executive } from '../types';
import { BUILDINGS } from '../../../data/simco_static';

const EMPTY_EXEC: Executive = { name: "", management: 0, accounting: 0, communication: 0, science: 0 };

const DEFAULT_STATE: SuiteStateV6 = {
  activeTab: 'command',
  globalSync: true,
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
    retailResourceId: 24
  },
  debt: { current: 2000000, rate: 0.5 },
  moduleSettings: {
    opsLinked: true, execLinked: true, financeLinked: true,
    logisticsLinked: true, riskLinked: true
  },
  ledger: []
};

const n = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

export function useCorporateState() {
  const [state, setState] = useState<SuiteStateV6>(() => {
    const saved = localStorage.getItem("simco_suite_v6");
    if (!saved) return DEFAULT_STATE;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        board: { ...DEFAULT_STATE.board, ...parsed.board },
        settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
        moduleSettings: { ...DEFAULT_STATE.moduleSettings, ...parsed.moduleSettings },
        ledger: parsed.ledger || []
      };
    } catch (e) {
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem("simco_suite_v6", JSON.stringify(state));
  }, [state]);

  const core = useMemo(() => {
    const { map, board, settings, debt } = state;
    const effProfit = n(settings.estDailyProfit);

    const totalLevels = map.reduce((s, i) => s + n(i.level), 0) + n(settings.whatIfLevel);
    const rawAO = Math.max(0, (totalLevels - 1) / 170);

    const getEff = (primary: number, others: number[]) =>
      n(primary) + Math.floor(others.reduce((s, v) => s + n(v), 0) / 4);

    const effMan = getEff(board.coo.management, [board.cfo.management, board.cmo.management, board.cto.management, board.cooApp.management, board.cfoApp.management, board.cmoApp.management, board.ctoApp.management]);
    const effAcc = getEff(board.cfo.accounting, [board.coo.accounting, board.cmo.accounting, board.cto.accounting, board.cooApp.accounting, board.cfoApp.accounting, board.cmoApp.accounting, board.ctoApp.accounting]);
    const effCom = getEff(board.cmo.communication, [board.coo.communication, board.cfo.communication, board.cto.communication, board.cooApp.communication, board.cfoApp.communication, board.cmo.communication, board.cto.communication]);
    const effSci = getEff(board.cto.science, [board.coo.science, board.cfo.science, board.cmo.science, board.cooApp.science, board.cfoApp.science, board.cmo.science, board.cto.science]);

    const actualAO = rawAO * (1 - (effMan * 0.01));
    const baseTaxThreshold = 3000000 + (effAcc * 500000);
    const taxThreshold = baseTaxThreshold * (1 + (settings.bankLevel * 0.05));

    const salesSpeedBonus = (effCom * 0.01) + (settings.profileSalesBonus * 0.01);
    const patentProb = 0.0179 + (effSci * 0.0015);

    const dailyWages = map.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      return sum + (item.level * (b?.wages || 0) * 24);
    }, 0);

    const dailyInterest = debt.current * (debt.rate / 100);
    const taxableAmount = Math.max(0, effProfit - (taxThreshold / 30));
    const estimatedDailyTax = taxableAmount * 0.07;

    const mapValue = map.reduce((sum, item) => {
      const b = BUILDINGS.find(bu => bu.id === item.id);
      if (!b) return sum;
      let cost = 0;
      for(let l=1; l<=item.level; l++) cost += b.cost * (l <= 2 ? 1 : l-1);
      return sum + cost;
    }, 0);

    return {
      totalLevels, actualAO, rawAO, taxThreshold, salesSpeedBonus, patentProb,
      dailyWages, mapValue, dailyInterest, effMan, effAcc, effCom, effSci,
      estimatedDailyTax,
      totalValuation: mapValue + (effProfit * 30),
      netDaily: effProfit - dailyInterest - estimatedDailyTax - (dailyWages * actualAO)
    };
  }, [state]);

  return { state, setState, core };
}
