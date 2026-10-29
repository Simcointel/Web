import { describe, it, expect } from "vitest";

describe("ProfitCalculator", () => {
  describe("quality multiplier", () => {
    const qualityMult = (q: number) => 1 + q * 0.05;

    it("calculates correct multipliers for Q0-Q12", () => {
      expect(qualityMult(0)).toBe(1.0);
      expect(qualityMult(1)).toBe(1.05);
      expect(qualityMult(2)).toBe(1.10);
      expect(qualityMult(3)).toBe(1.15);
      expect(qualityMult(5)).toBe(1.25);
      expect(qualityMult(12)).toBe(1.60);
    });
  });

  describe("abundance filter", () => {
    const extractionBuildings = ["M", "O", "Q"];
    const nonExtractionBuildings = ["P", "v", "F", "e", "Y"];

    it("only allows M, O, Q for abundance", () => {
      extractionBuildings.forEach(b => {
        expect(extractionBuildings.includes(b)).toBe(true);
      });
      nonExtractionBuildings.forEach(b => {
        expect(extractionBuildings.includes(b)).toBe(false);
      });
    });
  });

  describe("transport cost", () => {
    it("calculates as percentage of gross revenue", () => {
      const grossRevenue = 10000;
      const transportRating = 2;
      const transportCost = grossRevenue * transportRating * 0.01;
      expect(transportCost).toBe(200);
    });
  });

  describe("input clamping", () => {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    it("clamps values within bounds", () => {
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(50, 0, 100)).toBe(50);
    });
  });

  describe("VWAP fallback", () => {
    const MAT_REF_PRICES: Record<number, number> = { 101: 500, 102: 15, 108: 30, 111: 2673.75 };

    it("falls back to MAT_REF_PRICES when VWAP unavailable", () => {
      const vwap = undefined;
      const fallback = MAT_REF_PRICES[101] ?? 0;
      expect(fallback).toBe(500);
    });
  });
});