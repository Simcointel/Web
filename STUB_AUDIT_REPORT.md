# SimcoIntel Codebase Audit Report: Stubs & Discrepancies

**Date:** June 2025
**Scope:** Data Integrity Audit vs. Official SimCompanies Encyclopedia (v1.1.0-SSE compatible)

## 1. Economic Formula Discrepancies (Corporate Suite)

| Component | Codebase Implementation (Current) | Official Game Formula | Impact |
| :--- | :--- | :--- | :--- |
| **Sales Speed (CMO)** | `(Communication * 0.01) + (Profile * 0.01)` | `Communication / 3` (%) | **High**: Underestimates bonus for highly skilled CMOs. |
| **Patent Probability (CTO)** | `0.0179 + (Science * 0.0015)` | `0.0625 + (Science * 0.000625)` | **High**: Overestimates base success rate; underestimates skill impact. |
| **Accounting Threshold** | `$3M + (Skill * 0.5M) * (1 + Bank * 0.05)` | `$3M + (Skill/2 * $1M) + (BankLvl * $50k * Skill)` | **Medium**: Bank bonus calculation is fundamentally incorrect. |
| **Admin Overhead (AO)** | `(Levels - 1) / 170` | `(Levels - 1) / 170` | **Match**: Correct. |
| **Executive Synergy** | `Primary + floor(Others / 4)` | `Primary + floor(Others / 4)` | **Match**: Correct. |

---

## 2. Building Data Stubs (`simco_static.ts`)

Identified "Default Stubs" where values were duplicated to fill the data structure.

### 2.1 Wage Stubs
The codebase uses a recurring value of **$414/hr** for nearly all Tier-2 buildings.

| Building | Stub Value | Official Value (Normal Phase) |
| :--- | :--- | :--- |
| **Software R&D** | $414.0 | $586.5 |
| **Kitchen** | $414.0 | $517.5 |
| **Slaughterhouse** | $414.0 | $400.8 |
| **Aerospace Factory** | $586.5 | $517.5 |
| **General Contractor** | $414.0 | $345.0 |

### 2.2 Construction Cost Stubs
Most buildings in the code are set to a cost of **$51,750**.

| Building | Stub Value | Official Value (Reference) |
| :--- | :--- | :--- |
| **Bank** | $69,000 | $138,000 |
| **Aerospace Factory** | $106,950 | $1,131,600 (Reference BV) |
| **Software R&D** | $51,750 | $65,550 |

### 2.3 Resource Quantity Stubs
Buildings often use the same generic resource array: `Concrete(60), Bricks(825), Planks(240), CU(15)`.

*   **Discrepancy**: This ignores building-specific requirements (e.g., Banks requiring 40 Tools, Hangar requiring 31 CU).

---

## 3. Resource Metadata Stubs

| Resource | Status | Note |
| :--- | :--- | :--- |
| **Construction Units** | <span style="color:red">Stubbed</span> | Code uses `0.99 basePh`. Official is `1.0`. |
| **Aerospace Items** | <span style="color:orange">Partial</span> | Inputs for BFR, Satellite, and Starship are missing in `RESOURCES` array. |
| **Retail Items** | <span style="color:orange">Partial</span> | Saturation modeling is hardcoded to `1.0` for all items in the UI. |

---

## 4. UI & Functional Placeholders

1.  **Ledger View**: No processing logic for "Cash Receipts" beyond a heuristic average.
2.  **Risk Analysis**: Grid currently only displays "Saturation." Does not pull "Stress" or "Momentum" indicators from the backend service.
3.  **Regime Stability**: The text *"Phase stability is high (84%). Expected transition in 2.4 days"* is a hardcoded placeholder string in `CorporateSuite.tsx`.

---

## Summary
The codebase is functionally robust (UI and logic flows work) but relies on placeholder data for ~70% of building-specific metrics and ~30% of high-level economic formulas. The data provided in the local `buildings_raw.json` and `resources_raw.json` contains the necessary corrections.
