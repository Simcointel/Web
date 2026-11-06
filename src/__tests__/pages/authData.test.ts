import { describe, it, expect } from "vitest";
import { applyAuthData } from "../../pages/corporate-suite/authData";
import { DEFAULT_STATE } from "../../pages/corporate-suite/types";

const now = new Date("2026-11-06T10:00:00Z");

describe("applyAuthData", () => {
  it("maps account fields into suite state", () => {
    const next = applyAuthData(DEFAULT_STATE, {
      authCompany: {
        companyId: 5090204,
        company: "ONE GROUP OF ENTERPRISES",
        logo: "https://example.com/logo.png",
        level: 24,
        rank: 5979,
        money: 1859157,
        extraBuildingSlots: 4,
        productionModifier: 4,
        salesModifier: 1,
      },
    }, now);

    expect(next.companyId).toBe("5090204");
    expect(next.companyName).toBe("ONE GROUP OF ENTERPRISES");
    expect(next.companyLogo).toBe("https://example.com/logo.png");
    expect(next.companyLevel).toBe(24);
    expect(next.companyRank).toBe(5979);
    expect(next.extraSlots).toBe(4);
    expect(next.settings.cash).toBe(1859157);
    expect(next.settings.prodBonus).toBe(16);
    expect(next.settings.profileSalesBonus).toBe(1);
    expect(next.lastSynced).toBe(now.toLocaleTimeString());
  });

  it("keeps fields the payload does not carry", () => {
    const prev = {
      ...DEFAULT_STATE,
      companyName: "OLD",
      workers: 500,
      companyValue: 12345,
      map: [{ id: "b1", level: 2 }],
      settings: { ...DEFAULT_STATE.settings, prodBonus: 12, cash: 99 },
    };
    const next = applyAuthData(prev, { authCompany: { company: "NEW" } }, now);

    expect(next.companyName).toBe("NEW");
    expect(next.workers).toBe(500);
    expect(next.companyValue).toBe(12345);
    expect(next.map).toEqual([{ id: "b1", level: 2 }]);
    expect(next.settings.prodBonus).toBe(12);
    expect(next.settings.cash).toBe(99);
  });

  it("ignores non-finite numbers", () => {
    const next = applyAuthData(DEFAULT_STATE, {
      authCompany: { level: NaN as unknown as number, money: undefined, productionModifier: undefined },
    }, now);
    expect(next.companyLevel).toBe(DEFAULT_STATE.companyLevel);
    expect(next.settings.cash).toBe(DEFAULT_STATE.settings.cash);
    expect(next.settings.prodBonus).toBe(DEFAULT_STATE.settings.prodBonus);
  });
});
