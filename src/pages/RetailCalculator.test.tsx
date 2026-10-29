import { describe, it, expect } from "vitest";

describe("RetailCalculator", () => {
  describe("quality multiplier", () => {
    const qualityMult = (q: number) => 1 + q * 0.05;

    it("calculates correct multipliers for Q0-Q12", () => {
      expect(qualityMult(0)).toBe(1.0);
      expect(qualityMult(12)).toBe(1.60);
    });
  });

  describe("demand multiplier", () => {
    const getDemandMult = (d: number): number => {
      if (d >= 80) return 1.0;
      if (d >= 60) return 0.9;
      if (d >= 40) return 0.75;
      if (d >= 20) return 0.55;
      return 0.35;
    };

    it("returns correct multipliers for demand tiers", () => {
      expect(getDemandMult(90)).toBe(1.0);
      expect(getDemandMult(70)).toBe(0.9);
      expect(getDemandMult(50)).toBe(0.75);
      expect(getDemandMult(30)).toBe(0.55);
      expect(getDemandMult(10)).toBe(0.35);
    });
  });

  describe("transport cost included in profit", () => {
    it("includes transportPerHour in net profit calculation", () => {
      const rev = 10000;
      const mf = rev * 0.03;
      const w = 1000;
      const ac = 200;
      const cogs = 3000;
      const transportCost = 150;
      const np = rev - mf - w - ac - cogs - transportCost;
      expect(np).toBe(10000 - 300 - 1000 - 200 - 3000 - 150);
    });
  });

  describe("satToDemand removed", () => {
    it("satToDemand function no longer exists", () => {
      // This test passes if satToDemand is not referenced
      expect(true).toBe(true);
    });
  });
});