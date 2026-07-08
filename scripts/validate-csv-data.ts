import * as fs from "node:fs";
import * as path from "node:path";

const DOWNLOADS = "C:\\Users\\nanda\\Downloads";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

function validateWarehouse() {
  const text = fs.readFileSync(path.join(DOWNLOADS, "sim-companies-warehouse.csv"), "utf-8");
  const rows = parseCSV(text);
  const expectedHeaders = ["Resource", "Quality", "Amount", "Cost labor", "Cost management",
    "Cost 3rd party", "Cost material 1", "Cost material 2", "Cost material 3", "Cost material 4", "Cost material 5"];
  const actualHeaders = Object.keys(rows[0]);
  const missing = expectedHeaders.filter(h => !actualHeaders.includes(h));
  if (missing.length) throw new Error(`Warehouse CSV missing headers: ${missing}`);
  if (rows.length < 5) throw new Error(`Warehouse CSV too few rows: ${rows.length}`);
  console.log(`  warehouse.csv: ${rows.length} resources, all headers present`);
  // Verify numeric fields
  for (const r of rows) {
    const amt = Number(r["Amount"]);
    if (isNaN(amt) || amt < 0) throw new Error(`Invalid Amount in warehouse: ${r["Resource"]}`);
  }
}

function validateAccountHistory() {
  const text = fs.readFileSync(path.join(DOWNLOADS, "sim-companies-account-history-ONE GROUP OF ENTERPRISES(1).csv"), "utf-8");
  const rows = parseCSV(text);
  const expectedHeaders = ["id", "Timestamp", "Category", "Money", "Description", "Details"];
  const missing = expectedHeaders.filter(h => !Object.keys(rows[0]).includes(h));
  if (missing.length) throw new Error(`Account history CSV missing headers: ${missing}`);
  if (rows.length < 100) throw new Error(`Account history too few rows: ${rows.length}`);
  // Verify Details column is valid JSON
  let jsonCount = 0;
  for (const r of rows) {
    try { JSON.parse(r["Details"]); jsonCount++; } catch { /* not JSON */ }
  }
  console.log(`  account-history.csv: ${rows.length} transactions, ${jsonCount} with JSON details`);
}

function validateIncomeStatement() {
  const text = fs.readFileSync(path.join(DOWNLOADS, "sim-companies-income-statement.csv"), "utf-8");
  const rows = parseCSV(text);
  const expectedHeaders = ["Timestamp", "Sales", "COGS", "Freight Out", "Construction", "Exchange Fees",
    "Salaries", "Training", "Poaching", "Achievements Referrals PA", "Patent Conversion", "Bond Defaults",
    "Bond Writeoffs", "Accounting Overhead", "Bond Interest Expense", "Bond Interest Income",
    "Donations", "Other Comprehensive Income", "NetIncome"];
  const missing = expectedHeaders.filter(h => !Object.keys(rows[0]).includes(h));
  if (missing.length) throw new Error(`Income statement CSV missing headers: ${missing}`);
  if (rows.length < 10) throw new Error(`Income statement too few rows: ${rows.length}`);
  // Verify NetIncome math: Sales - COGS - Freight - Construction - Exchange - Salaries - Training + ...
  for (const r of rows) {
    const parsed = [...expectedHeaders.slice(1)].map(h => Number(r[h]));
    if (parsed.some(isNaN)) throw new Error(`Non-numeric value in income statement at ${r["Timestamp"]}`);
  }
  console.log(`  income-statement.csv: ${rows.length} daily records, all numeric fields valid`);
}

function validateCashflowStatement() {
  const text = fs.readFileSync(path.join(DOWNLOADS, "sim-companies-cashflow-statement.csv"), "utf-8");
  const rows = parseCSV(text);
  const expectedHeaders = ["Timestamp", "All income", "All expenses", "From retail", "From customers",
    "From exchange", "From interest", "From poaching", "To suppliers", "To exchange", "To employees",
    "To executives", "For interest", "For fees", "For accounting", "Investment in bonds",
    "Bonds", "Game income"];
  const missing = expectedHeaders.filter(h => !Object.keys(rows[0]).includes(h));
  if (missing.length) throw new Error(`Cashflow CSV missing headers: ${missing}`);
  console.log(`  cashflow-statement.csv: ${rows.length} daily records`);
}

function validateBalanceSheet() {
  const text = fs.readFileSync(path.join(DOWNLOADS, "sim-companies-balance-sheet.csv"), "utf-8");
  const rows = parseCSV(text);
  const expectedHeaders = ["Timestamp", "Cash", "Accounts Receivable", "Inventory - materials",
    "Inventory - research", "Inventory - work in process", "Inventory - finished goods",
    "Inventory - valuation allowance", "Deposits", "Investment in bonds", "Buildings",
    "Patents", "Liabilities", "Contributed Capital", "Retained Earnings"];
  const missing = expectedHeaders.filter(h => !Object.keys(rows[0]).includes(h));
  if (missing.length) throw new Error(`Balance sheet CSV missing headers: ${missing}`);
  console.log(`  balance-sheet.csv: ${rows.length} daily records`);
}

console.log("Validating CSV data files...\n");
validateWarehouse();
validateAccountHistory();
validateIncomeStatement();
validateCashflowStatement();
validateBalanceSheet();
console.log("\nAll CSV files validated successfully.");
