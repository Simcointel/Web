import { describe, it, expect, vi } from "vitest";
import { normalizeMarketData, qualityPremiumCost } from "../../services/restaurantMarketData";

describe("restaurantMarketData", () => {
  it("normalizes margins rows to vwapByName map", () => {
    const margins = { ts: "2026-11-01T00:00:00Z", realm: 0, resources: [{ id: 117, name: "Milk", outputVwap: 7.31 }], total: 1 };
    const retail = { retail: { "117": { saturation: 1.2 } } };
    const macro = { phases: [] };
    const snapshot = [{ dbLetter: 117, quality: 0, averagePrice: 50, saturation: 1.2, retailData: [{ date: "2026-11-01", amountSoldRestaurant: 1000 }] }];
    const out = normalizeMarketData(margins as any, retail as any, macro as any, snapshot as any);
    expect(out.vwapByName.get("Milk")).toBe(7.31);
    expect(out.sources.margins).toBe(true);
  });

  it("retail saturation keyed by numeric resource id", () => {
    const margins = { ts: "2026-11-01T00:00:00Z", realm: 0, resources: [], total: 0 };
    const retail = { retail: { "117": { saturation: 1.2 }, "119": { saturation: 0.5 } } };
    const macro = { phases: [] };
    const snapshot = [{ dbLetter: 117, quality: 0, averagePrice: 50, saturation: 1.2, retailData: [] }];
    const out = normalizeMarketData(margins as any, retail as any, macro as any, snapshot as any);
    expect(out.saturationByResourceId.get(117)).toBe(1.2);
    expect(out.saturationByResourceId.get(119)).toBe(0.5);
  });

  it("snapshot: latest retailData per quality, summed across qualities", () => {
    const margins = { ts: "2026-11-01T00:00:00Z", realm: 0, resources: [], total: 0 };
    const retail = { retail: {} };
    const macro = { phases: [] };
    const snapshot = [
      { dbLetter: 117, quality: 0, averagePrice: 50, saturation: 1.2, retailData: [{ date: "2026-11-01", amountSoldRestaurant: 1000 }] },
      { dbLetter: 117, quality: 1, averagePrice: 60, saturation: 1.1, retailData: [{ date: "2026-10-01", amountSoldRestaurant: 5 }] },
    ];
    const out = normalizeMarketData(margins as any, retail as any, macro as any, snapshot as any);
    expect(out.marketVolumeByResourceId.get(117)).toBe(1005);
  });

  it("snapshot with only dbLetter 150 → empty marketVolume, snapshot false", () => {
    const margins = { ts: "2026-11-01T00:00:00Z", realm: 0, resources: [], total: 0 };
    const retail = { retail: {} };
    const macro = { phases: [] };
    const snapshot = [{ dbLetter: 150, quality: 0, averagePrice: 350, saturation: 1.2, retailData: [{ date: "2026-11-01", amountSoldRestaurant: 100 }] }];
    const out = normalizeMarketData(margins as any, retail as any, macro as any, snapshot as any);
    expect(out.marketVolumeByResourceId.size).toBe(0);
    expect(out.sources.snapshot).toBe(false);
  });

  it("snapshot data missing/not array → no throw, snapshot false", () => {
    const margins = { ts: "2026-11-01T00:00:00Z", realm: 0, resources: [], total: 0 };
    const retail = { retail: {} };
    const macro = { phases: [] };
    const snapshot = null;
    expect(() => normalizeMarketData(margins as any, retail as any, macro as any, snapshot as any)).not.toThrow();
    const out = normalizeMarketData(margins as any, retail as any, macro as any, snapshot as any);
    expect(out.sources.snapshot).toBe(false);
  });

  it("qualityPremiumCost(10, 4, 1) ≈ 10.406", () => {
    expect(qualityPremiumCost(10, 4, 1)).toBeCloseTo(10.406, 3);
  });

  it("qualityPremiumCost handles missing/zero vwap → 0", () => {
    expect(qualityPremiumCost(0, 4, 1)).toBe(0);
    expect(qualityPremiumCost(NaN, 4, 1)).toBe(0);
  });
});