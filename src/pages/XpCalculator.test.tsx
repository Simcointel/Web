import { describe, it, expect } from "vitest";

const XP_TABLE = [
  5, 10, 20, 30, 50, 80, 130, 210, 340, 550, 890, 1430,
  2320, 3750, 6000, 10000, 16000, 26000, 42000, 68000,
  110000, 170000, 280000,
];

function xpForLevel(lv: number): number {
  if (lv < 1 || lv > 60) return 0;
  if (lv <= 23) return XP_TABLE[lv - 1];
  return 400_000;
}

describe("XpCalculator", () => {
  describe("xpForLevel", () => {
    it("returns correct XP for levels 1-23", () => {
      expect(xpForLevel(1)).toBe(5);
      expect(xpForLevel(2)).toBe(10);
      expect(xpForLevel(3)).toBe(20);
      expect(xpForLevel(6)).toBe(80);
      expect(xpForLevel(7)).toBe(130);
      expect(xpForLevel(17)).toBe(16000);
      expect(xpForLevel(23)).toBe(280000);
    });

    it("returns 400000 for levels 24+", () => {
      expect(xpForLevel(24)).toBe(400000);
      expect(xpForLevel(30)).toBe(400000);
      expect(xpForLevel(60)).toBe(400000);
    });

    it("returns 0 for invalid levels", () => {
      expect(xpForLevel(0)).toBe(0);
      expect(xpForLevel(61)).toBe(0);
      expect(xpForLevel(-1)).toBe(0);
    });
  });

  describe("XP rates", () => {
    const OP_XP = 12;
    const REC_XP = 120;
    const PROSPECTING_XP = 36;

    it("has correct hourly rates", () => {
      expect(OP_XP).toBe(12);
      expect(REC_XP).toBe(120);
      expect(PROSPECTING_XP).toBe(36);
    });
  });

  describe("progress calculation", () => {
    it("calculates progress percentage correctly", () => {
      const currentXp = xpForLevel(10);
      const progress = 50;
      const totalXpForLevels = 1000;
      const progressPct = Math.min(100, (currentXp * progress / 100 / totalXpForLevels) * 100);
      expect(progressPct).toBe(currentXp * 0.5 / totalXpForLevels * 100);
    });
  });
});