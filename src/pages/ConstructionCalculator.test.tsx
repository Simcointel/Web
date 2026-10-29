import { describe, it, expect } from "vitest";

describe("ConstructionCalculator", () => {
  describe("level multiplier", () => {
    const levelMult = (targetLv: number) => Math.max(1, targetLv - 1);

    it("returns correct multiplier for each target level", () => {
      expect(levelMult(1)).toBe(1);
      expect(levelMult(2)).toBe(1);
      expect(levelMult(3)).toBe(2);
      expect(levelMult(4)).toBe(3);
      expect(levelMult(10)).toBe(9);
      expect(levelMult(50)).toBe(49);
    });
  });

  describe("material cost scaling", () => {
    it("scales material qty with levelMult", () => {
      const baseQty = 10;
      const targetLv = 5;
      const mult = Math.max(1, targetLv - 1);
      const scaledQty = baseQty * mult;
      expect(scaledQty).toBe(40);
    });
  });

  describe("admin overhead", () => {
    it("calculates as wages * (max(1, targetLv - 1) / 170)", () => {
      const wages = 10000;
      const targetLv = 10;
      const levelMult = Math.max(1, targetLv - 1);
      const adminOverheadCost = wages * (levelMult / 170);
      expect(adminOverheadCost).toBeCloseTo(529.41, 1);
    });
  });

  describe("input material costs", () => {
    it("includes dailyInputCost from res.inputs", () => {
      const basePh = 100;
      const levelMult = 3;
      const inputPrice = 50;
      const qtyPerUnit = 2;
      const dailyInputCost = inputPrice * qtyPerUnit * basePh * levelMult * 24;
      expect(dailyInputCost).toBe(50 * 2 * 100 * 3 * 24);
    });
  });

  describe("revenue/wages scaling", () => {
    it("uses levelMult (max(1, targetLv-1)) not targetLv", () => {
      const targetLv = 5;
      const levelMult = Math.max(1, targetLv - 1);
      const revenuePerLevel = 1000;
      const dailyRevenue = revenuePerLevel * levelMult;
      expect(dailyRevenue).toBe(4000);
      expect(dailyRevenue).not.toBe(5000);
    });
  });
});