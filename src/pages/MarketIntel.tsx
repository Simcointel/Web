import { useState, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { RETAIL_PRODUCT_MAP, BUILDINGS, RESOURCES } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { ProfitMarginResource } from "../types/api";
import { BarChart3, DollarSign, Search, ChevronRight, Package } from "lucide-react";
import type { ProfitMarginsResponse } from "../types/api";

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function fmt$(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(2)}`; }

const tabs = ["retail", "premiums", "tree"] as const;
type Tab = typeof tabs[number];

export function MarketIntelPage() {
  const [realm] = useSharedRealm();
  const [tab, setTab] = useState<Tab>("retail");

  const { data: marginsData } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const storeNames: Record<string, string> = {};
  for (const b of BUILDINGS.filter(b => b.type === "retail" && b.id !== "r" && b.id !== "B")) storeNames[b.id] = b.name;

  const resNameMap: Record<number, string> = {};
  for (const r of RESOURCES) { if (r.name) resNameMap[r.id] = r.name; }

  return (
    <div className="space-y-5 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-indigo-600" /></div>
          <div><h1 className="text-lg font-bold">Market Intelligence</h1><p className="text-xs text-surface-400">Product rankings, quality premiums & supply chains</p></div>
        </div>
      </div>

      <div className="flex gap-1 bg-surface-100 dark:bg-surface-900 rounded-xl p-0.5 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${tab === t ? "bg-white dark:bg-surface-800 text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}>
            {t === "retail" ? "Top Retail Products" : t === "premiums" ? "Quality Premiums" : "Supply Chain"}
          </button>
        ))}
      </div>

      {tab === "retail" && <RetailRankingsTab margins={margins} storeNames={storeNames} resNameMap={resNameMap} />}
      {tab === "premiums" && <QualityPremiumsTab />}
      {tab === "tree" && <SupplyChainTab margins={margins} resNameMap={resNameMap} />}
    </div>
  );
}

// ─── Tab 1: Retail Rankings ───────────────────────────────
function RetailRankingsTab({ margins, storeNames, resNameMap }: { margins: ProfitMarginResource[]; storeNames: Record<string, string>; resNameMap: Record<number, string> }) {
  const rows = useMemo(() => {
    const out: Array<{ storeName: string; productName: string; vwap: number }> = [];
    for (const [sid, pids] of Object.entries(RETAIL_PRODUCT_MAP)) {
      const sn = storeNames[sid] ?? sid;
      for (const pid of pids) {
        const vwap = margins.find(m => m.id === pid)?.outputVwap ?? 0;
        if (!vwap) continue;
        out.push({ storeName: sn, productName: resNameMap[pid] ?? `#${pid}`, vwap });
      }
    }
    return out.sort((a, b) => b.vwap - a.vwap);
  }, [margins, storeNames, resNameMap]);

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(r => r.productName.toLowerCase().includes(s) || r.storeName.toLowerCase().includes(s));
  }, [rows, search]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-surface-400">Products ranked by VWAP — higher VWAP typically means higher profit potential at retail.</p>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Search product or store..." value={search} onChange={e => setSearch(e.target.value)} className="input w-full pl-9" />
        </div>
        <span className="text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-lg">{filtered.length} products</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-xs">
          <thead><tr className="bg-surface-50 dark:bg-surface-900 text-surface-500 font-bold uppercase text-[10px] tracking-wider">
            <th className="text-left px-4 py-3">Store</th>
            <th className="text-left px-4 py-3">Product</th>
            <th className="text-right px-4 py-3">VWAP</th>
          </tr></thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {filtered.map((r, i) => (
              <tr key={`${r.storeName}-${r.productName}-${i}`} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                <td className="px-4 py-2.5 font-bold">{r.storeName}</td>
                <td className="px-4 py-2.5">{r.productName}</td>
                <td className="px-4 py-2.5 text-right font-bold text-brand-600">${fmt(r.vwap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 2: Quality Premiums ──────────────────────────────
function QualityPremiumsTab() {
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-12 text-center">
      <DollarSign size={32} className="mx-auto text-surface-300 mb-3" />
      <p className="text-sm font-bold text-surface-500 mb-1">Quality Premiums</p>
      <p className="text-xs text-surface-400">Per-quality VWAP data requires a direct API connection. Use the Profit Margins page for current market prices.</p>
    </div>
  );
}

// ─── Tab 3: Supply Chain ──────────────────────────────────
function SupplyChainTab({ margins, resNameMap }: { margins: ProfitMarginResource[]; resNameMap: Record<number, string> }) {
  const [searchId, setSearchId] = useState("");

  const getPrice = (id: number) => margins.find(m => m.id === id)?.outputVwap ?? 0;

  function Tree({ nodeId }: { nodeId: number }) {
    const res = RESOURCES.find(r => r.id === nodeId);
    if (!res || !res.inputs) return <div className="text-xs text-surface-400 italic py-2">No recipe data available.</div>;
    const inputs = Object.entries(res.inputs);
    const price = getPrice(nodeId);
    return (
      <div className="ml-3 pl-4 py-1">
        <div className="flex items-center gap-2 py-1">
          <Package size={12} className="text-surface-400 shrink-0" />
          <span className="font-bold text-sm">{res.name ?? `#${nodeId}`}</span>
          <span className="text-[10px] text-surface-400">#{nodeId}</span>
          {price > 0 && <span className="text-xs font-bold text-brand-600">${fmt(price)}</span>}
        </div>
        {inputs.length > 0 && (
          <div className="border-l-2 border-surface-200 dark:border-surface-700 ml-1 pl-4 space-y-1">
            {inputs.map(([id, qty]) => {
              const subPrice = getPrice(toNum(id));
              const subRes = RESOURCES.find(r => r.id === toNum(id));
              const total = subPrice * qty;
              const hasChildren = subRes?.inputs && Object.keys(subRes.inputs).length > 0;
              return (
                <div key={id}>
                  <div className="flex items-center gap-2 py-0.5 text-xs">
                    <ChevronRight size={10} className="text-surface-300 shrink-0" />
                    <span>{subRes?.name ?? resNameMap[toNum(id)] ?? `#${id}`}</span>
                    <span className="text-surface-400">×{qty}</span>
                    {subPrice > 0 && <><span className="text-surface-400">@</span><span className="font-bold">${fmt(subPrice)}</span><span className="text-surface-400">= ${fmt(total)}</span></>}
                  </div>
                  {hasChildren && <Tree nodeId={toNum(id)} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const productsWithInputs = RESOURCES.filter(r => r.inputs && Object.keys(r.inputs).length > 0).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  return (
    <div className="space-y-3">
      <p className="text-xs text-surface-400">Select a product to see its recipe tree with current market prices from profit margins.</p>
      <select value={searchId} onChange={e => setSearchId(e.target.value)} className="input max-w-sm">
        <option value="">Choose product...</option>
        {productsWithInputs.map(r => <option key={r.id} value={r.id}>{r.name} (#{r.id})</option>)}
      </select>
      {searchId && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-6 bg-white dark:bg-surface-950">
          <Tree nodeId={toNum(searchId)} />
        </div>
      )}
    </div>
  );
}
