# Calculator Validation Issues — SimCo Real Data Audit

Date: 2026-10-10
Validated by: 5 parallel audit agents
Status: **CONFIRMED** — user provided correct formulas and values

---

## XpCalculator (CRITICAL — 4 bugs) — CONFIRMED

### XP-001: XP table shifted by 6 levels
- **File:** `src/pages/XpCalculator.tsx:8-11`
- **Current (WRONG):** `[130, 210, 340, 550, 890, 1430, 2320, 3750, 6000, 10000, 16000, 26000, 42000, 68000, 110000, 170000, 280000]`
- **Correct (L1-23):** `[5, 10, 20, 30, 50, 80, 130, 210, 340, 550, 890, 1430, 2320, 3750, 6000, 10000, 16000, 26000, 42000, 68000, 110000, 170000, 280000]`
- **L24+:** 400,000 (flat)
- **Impact:** All XP calculations wrong. L1 shows 130 instead of 5, L17 shows 280k instead of 16k.
- **Fix:** Replace XP_TABLE with correct 23-level values, apply 400k for lv > 23.

### XP-002: Flat 400k XP from L18 instead of L24
- **File:** `src/pages/XpCalculator.tsx:16`
- **Impact:** L18-23 have specific values — massively overstated.
- **Fix:** Extend table to L23, apply 400k only for lv > 23.

### XP-003: Progress bar ignores progress input
- **File:** `src/pages/XpCalculator.tsx:50`
- **Current:** `currentXp / totalXpForLevels * 100` — never changes with progress slider.
- **Fix:** `(currentXp * progress / 100) / totalXpForLevels * 100`.

### XP-004: XP rates — user confirmed
- **User confirmed:** Recreational buildings = 20,160 XP/week (~120/hour). Other buildings = 12 XP/hour (running), 36 XP/hour (building). Prospecting = 36/hour.
- **Current code:** OP_XP = 12, REC_XP = 40, Prospecting = 36.5
- **Fix:** Update REC_XP to 20160/168 ≈ 120/hour. Update prospecting to 36.

---

## ProfitCalculator (5 bugs) — CONFIRMED

### PROF-001: Abundance slider shows for Farm/Forest
- **File:** `src/pages/ProfitCalculator.tsx:49-51, 94`
- **Current:** `["M","O","Q","P","v"]` — but only M (Mine), O (Oil rig), Q (Quarry) have abundance.
- **User confirmed:** Only M/O/Q should have abundance.
- **Fix:** Change to `["M","O","Q"]` in both production calc and slider visibility.

### PROF-002: Quality selector (Q0-Q5) is dead
- **File:** `src/pages/ProfitCalculator.tsx:23, 132-134`
- **User confirmed:** Quality affects price but depends on demand and sell rate. "We have data of all sources so we can do something."
- **Fix:** Wire quality into calculation using available data (demand/sell rate based multiplier).

### PROF-003: Transport cost formula
- **File:** `src/pages/ProfitCalculator.tsx:85`
- **Current (WRONG):** `transport * ph * 0.01`
- **User confirmed:** `transportCost = grossRevenue * transportRating * 0.01` (percentage of revenue)
- **Fix:** Change to `grossRevenue * (selected.transport ?? 0) * 0.01`.

### PROF-004: No input clamping
- **File:** `src/pages/ProfitCalculator.tsx:138, 151, 158, 174`
- **Fix:** Add min/max clamping to all numeric inputs (customPrice, buildingLevel, abundance, overhead).

### PROF-005: Missing VWAP → $0 silent failure
- **File:** `src/pages/ProfitCalculator.tsx:64-76`
- **Fix:** Fall back to MAT_REF_PRICES or show warning when VWAP unavailable.

---

## RetailCalculator (3 bugs) — CONFIRMED

### RET-001: Transport cost completely missing
- **File:** `src/pages/RetailCalculator.tsx:97`
- **Fix:** Add `transportPerHour` from API to net profit formula.

### RET-002: Quality dropdown is dead UI
- **File:** `src/pages/RetailCalculator.tsx:69, 175`
- **User confirmed:** Quality affects price — wire it up.
- **Fix:** Wire quality into calculation (same approach as ProfitCalculator).

### RET-003: `satToDemand` function is dead code
- **File:** `src/pages/RetailCalculator.tsx:51-53`
- **Fix:** Remove or use with API saturation data.

---

## ConstructionCalculator (3 bugs) — CONFIRMED

### CONST-001: Revenue/wages/scrap scaling
- **File:** `src/pages/ConstructionCalculator.tsx:83-84, 214`
- **Current (WRONG):** Scales with `targetLv` (1x, 2x, 3x...)
- **User confirmed:** Should use `max(1, targetLv-1)` like materials do.
- **Fix:** `Math.max(1, targetLv - 1)` for revenue, wages, and scrap value.

### CONST-002: Missing input material costs
- **File:** `src/pages/ConstructionCalculator.tsx:85`
- **User confirmed:** Yes, include input material costs.
- **Fix:** Add `dailyInputCost` from `res.inputs` using matPrices.

### CONST-003: Admin overhead formula
- **File:** `src/pages/ConstructionCalculator.tsx:85`
- **User confirmed:** Admin overhead percentage = `((total building level - 1) / 170) * 100` — this is a percentage applied to wages.
- **Fix:** `adminOverheadCost = wages * (max(1, targetLv - 1) / 170)`.

---

## Data Layer (2 issues) — CONFIRMED

### DATA-001: `outputVwap` can be `undefined`
- **File:** `src/services/dataRepo.ts:329, 359`
- **Fix:** Use `r.vw ?? 0` and update type to `number | null`.

### DATA-002: No live building production data
- **Impact:** `basePh`/`baseWages` only in static file.
- **Fix:** Document as known limitation.

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| CRITICAL | 2 (XP table) | Confirmed — ready to fix |
| HIGH | 5 | Confirmed — ready to fix |
| MEDIUM | 5 | Confirmed — ready to fix |
| LOW | 3 | Confirmed — ready to fix |

Total: **15 bugs** — all confirmed with correct fixes. Ready to implement sequentially.
