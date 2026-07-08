import { useState, useEffect, useMemo, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { RETAIL_PRODUCT_MAP, BUILDINGS } from "../data/simco_static";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Loader2, RefreshCw, BarChart3, DollarSign, Search, ChevronRight, Package } from "lucide-react";
import type { ProfitMarginsResponse } from "../types/api";

interface RetailInfo {
  quality: number; buildingLevelsNeededPerUnitPerHour: number; modeledProductionCostPerUnit: number;
  modeledStoreWages: number; modeledUnitsSoldAnHour: number; saturation: number; averagePrice: number; salesWages: number;
}
interface ApiResource { id: number; name: string; retailInfo: RetailInfo | null; inputs: Record<string, { name: string; quantity: number }>; producedAnHour: number; wages: number; }

async function fetchApi(realm: number): Promise<{ resources: ApiResource[]; vwaps: Record<number, number> }> {
  const [res, vw] = await Promise.all([
    fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/resources?disable_pagination=True`)}`).then(r => r.json()),
    fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/market/vwaps`)}`).then(r => r.json()),
  ]);
  const vwaps: Record<number, number> = {};
  for (const v of (vw as any)?.vwaps ?? []) { if (!(v.resourceId in vwaps) || v.quality > 0) vwaps[v.resourceId] = v.vwap; }
  return {
    resources: (res as any).resources.map((r: any) => ({
      id: r.id, name: r.name,
      retailInfo: r.retailInfo?.[0] ?? null,
      inputs: r.inputs ?? {},
      producedAnHour: r.producedAnHour ?? 0,
      wages: r.wages ?? 0,
    })),
    vwaps,
  };
}

function satToDemand(sat: number) { return Math.round((1 - sat) * 100); }
function fmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function fmt$(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(2)}`; }

const tabs = ["retail", "premiums", "tree"] as const;
type Tab = typeof tabs[number];

export function MarketIntelPage() {
  useEffect(() => { document.title = "SimCo Intel - Market Intelligence"; }, []);
  const [realm] = useSharedRealm();
  const [tab, setTab] = useState<Tab>("retail");
  const [data, setData] = useState<{ resources: ApiResource[]; vwaps: Record<number, number> } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: marginsData } = useDataRepoPoll(() => dataRepo.fetchProfitMargins(realm), 120000, [realm]);
  const margins = (marginsData as ProfitMarginsResponse | undefined)?.resources ?? [];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchApi(realm)); }
    finally { setLoading(false); }
  }, [realm]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const vwaps = data?.vwaps ?? {};
  const resMap = useMemo(() => {
    const m: Record<number, ApiResource> = {};
    for (const r of data?.resources ?? []) m[r.id] = r;
    return m;
  }, [data]);

  return (
    <div className="space-y-5 animate-slide-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-indigo-600" /></div>
          <div><h1 className="text-lg font-bold">Market Intelligence</h1><p className="text-xs text-surface-400">Product rankings, quality premiums & supply chains</p></div>
        </div>
        <button onClick={fetchAll} disabled={loading} className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-40"><RefreshCw size={15} className={`${loading ? "animate-spin" : ""}`} /></button>
      </div>

      <div className="flex gap-1 bg-surface-100 dark:bg-surface-900 rounded-xl p-0.5 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${tab === t ? "bg-white dark:bg-surface-800 text-brand-600 shadow-sm" : "text-surface-500 hover:text-surface-700"}`}>
            {t === "retail" ? "Top Retail Products" : t === "premiums" ? "Quality Premiums" : "Supply Chain"}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="flex items-center gap-3 py-12 justify-center text-surface-400"><Loader2 size={18} className="animate-spin" /> Loading market data...</div>
      ) : (<>
        {tab === "retail" && <RetailRankingsTab resMap={resMap} vwaps={vwaps} margins={margins} realm={realm} />}
        {tab === "premiums" && <QualityPremiumsTab realm={realm} />}
        {tab === "tree" && <SupplyChainTab resMap={resMap} vwaps={vwaps} margins={margins} />}
      </>)}
    </div>
  );
}

// ─── Tab 1: Retail Rankings ───────────────────────────────
function RetailRankingsTab({ resMap, vwaps, margins }: { resMap: Record<number, ApiResource>; vwaps: Record<number, number>; margins: any[]; realm: number }) {
  const rows = useMemo(() => {
    const storeNames: Record<string, string> = {};
    for (const b of BUILDINGS.filter((b: any) => b.type === "retail" && b.id !== "r" && b.id !== "B")) storeNames[b.id] = b.name;

    const out: Array<{ storeId: string; storeName: string; productId: number; productName: string; demand: number; vwap: number; avgPrice: number; cost: number; margin: number; profit: number; retailInfo: RetailInfo }> = [];

    for (const [sid, pids] of Object.entries(RETAIL_PRODUCT_MAP)) {
      const sn = storeNames[sid] ?? sid;
      for (const pid of pids) {
        const ri = resMap[pid]?.retailInfo;
        if (!ri) continue;
        const vwap = margins.find((m: any) => m.id === pid)?.outputVwap ?? vwaps[pid] ?? 0;
        const price = ri.averagePrice || vwap;
        const cost = ri.modeledProductionCostPerUnit || vwap;
        const profit = price - cost;
        const margin = price > 0 ? (profit / price) * 100 : 0;
        out.push({ storeId: sid, storeName: sn, productId: pid, productName: resMap[pid]?.name ?? `#${pid}`, demand: satToDemand(ri.saturation), vwap, avgPrice: ri.averagePrice, cost, margin, profit, retailInfo: ri });
      }
    }
    return out.sort((a, b) => b.profit - a.profit);
  }, [resMap, vwaps, margins]);

  const [sortCol, setSortCol] = useState<string>("profit");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    let items = [...rows];
    if (search) { const s = search.toLowerCase(); items = items.filter(r => r.productName.toLowerCase().includes(s) || r.storeName.toLowerCase().includes(s)); }
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "productName": cmp = a.productName.localeCompare(b.productName); break;
        case "storeName": cmp = a.storeName.localeCompare(b.storeName); break;
        case "demand": cmp = a.demand - b.demand; break;
        case "margin": cmp = a.margin - b.margin; break;
        case "profit": cmp = a.profit - b.profit; break;
        case "price": cmp = a.avgPrice - b.vwap; break;
        default: cmp = a.profit - b.profit;
      }
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [rows, sortCol, sortAsc, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Search product or store..." value={search} onChange={e => setSearch(e.target.value)} className="input w-full pl-9" />
        </div>
             <span className="text-[10px] font-bold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-lg">{sorted.length} combos</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-xs">
          <thead><tr className="bg-surface-50 dark:bg-surface-900 text-surface-500 font-bold uppercase text-[10px] tracking-wider">
            {["Store", "Product", "Demand", "Est. Price", "Cost", "Profit/u", "Margin"].map(h => (
              <th key={h} className="text-left px-4 py-3 cursor-pointer hover:text-brand-600" onClick={() => { setSortCol(h === "Est. Price" ? "price" : h === "Demand" ? "demand" : h === "Cost" ? "cost" : h === "Profit/u" ? "profit" : h === "Margin" ? "margin" : h === "Store" ? "storeName" : "productName"); setSortAsc(sortCol === h ? !sortAsc : false); }}>
                {h}{sortCol === (h === "Est. Price" ? "price" : h === "Demand" ? "demand" : h === "Cost" ? "cost" : h === "Profit/u" ? "profit" : h === "Margin" ? "margin" : h === "Store" ? "storeName" : "productName") ? (sortAsc ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {sorted.map((r, i) => (
              <tr key={`${r.storeId}-${r.productId}-${i}`} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                <td className="px-4 py-2.5 font-bold">{r.storeName}</td>
                <td className="px-4 py-2.5">{r.productName}</td>
                <td className="px-4 py-2.5"><span className={`font-bold ${r.demand >= 60 ? "text-emerald-600" : r.demand >= 40 ? "text-amber-500" : "text-rose-500"}`}>{r.demand}%</span></td>
                <td className="px-4 py-2.5">${fmt(r.avgPrice || r.vwap)}</td>
                <td className="px-4 py-2.5 text-surface-500">${fmt(r.cost)}</td>
                <td className={`px-4 py-2.5 font-bold ${r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>${fmt(r.profit)}</td>
                <td className={`px-4 py-2.5 font-bold ${r.margin >= 20 ? "text-emerald-600" : r.margin >= 0 ? "text-amber-500" : "text-rose-500"}`}>{r.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 2: Quality Premiums ──────────────────────────────
function QualityPremiumsTab({ realm }: { realm: number }) {
  const [data, setData] = useState<{ resourceId: number; resourceName: string; qualities: Array<{ q: number; vwap: number }> }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPremiums = useCallback(async () => {
    setLoading(true);
    try {
      const [res, vw] = await Promise.all([
        fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/resources?disable_pagination=True`)}`).then(r => r.json()),
        fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/market/vwaps`)}`).then(r => r.json()),
      ]);
      const vwaps: Record<number, Array<{ q: number; vwap: number }>> = {};
      for (const v of (vw as any)?.vwaps ?? []) {
        if (!vwaps[v.resourceId]) vwaps[v.resourceId] = [];
        vwaps[v.resourceId].push({ q: v.quality, vwap: v.vwap });
      }
      const nameMap: Record<number, string> = {};
      for (const r of (res as any).resources) nameMap[r.id] = r.name;

      const out = Object.entries(vwaps)
        .filter(([_, qs]) => qs.length >= 2 && qs[0].q === 0)
        .map(([rid, qs]) => ({
          resourceId: Number(rid),
          resourceName: nameMap[Number(rid)] ?? `#${rid}`,
          qualities: qs.sort((a, b) => a.q - b.q),
        }))
        .sort((a, b) => a.resourceName.localeCompare(b.resourceName));
      setData(out);
    } finally { setLoading(false); }
  }, [realm]);

  useEffect(() => { fetchPremiums(); }, [fetchPremiums]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-surface-400">VWAP price per quality level. Shows the premium you pay (or earn) for higher quality goods. Q0 = baseline.</p>
      {loading && <div className="flex items-center gap-2 text-xs text-surface-400 py-2"><Loader2 size={14} className="animate-spin" /> Loading quality data...</div>}
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800 max-h-[70vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-50 dark:bg-surface-900 z-10"><tr className="text-surface-500 font-bold uppercase text-[10px] tracking-wider">
            <th className="text-left px-3 py-2">Resource</th>
            {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(q => <th key={q} className="text-right px-2 py-2">Q{q}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {data?.map(r => (
              <tr key={r.resourceId} className="hover:bg-surface-50 dark:hover:bg-surface-900/50">
                <td className="px-3 py-2 font-bold whitespace-nowrap">{r.resourceName}</td>
                {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(q => {
                  const v = r.qualities.find(x => x.q === q);
                  const base = r.qualities.find(x => x.q === 0)?.vwap ?? 1;
                  return (
                    <td key={q} className="px-2 py-2 text-right">
                      {v ? <><span className="font-bold">{fmt$(v.vwap)}</span><br /><span className={`text-[9px] ${v.vwap > base ? "text-emerald-500" : "text-surface-400"}`}>+{((v.vwap / base - 1) * 100).toFixed(0)}%</span></> : <span className="text-surface-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 3: Supply Chain ──────────────────────────────────
function SupplyChainTab({ resMap, vwaps, margins }: { resMap: Record<number, ApiResource>; vwaps: Record<number, number>; margins: any[] }) {
  const [searchId, setSearchId] = useState("");
  const rootId = searchId ? Number(searchId) : 0;
  const root = resMap[rootId];

  if (!root) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-surface-400">Select a product to see its full supply chain with market prices.</p>
        <select value={searchId} onChange={e => setSearchId(e.target.value)} className="input max-w-sm">
          <option value="">Choose product...</option>
          {Object.entries(resMap).filter(([_, r]) => Object.keys(r.inputs).length > 0).sort(([,a], [,b]) => a.name.localeCompare(b.name)).map(([id, r]) => <option key={id} value={id}>{r.name} (#{id})</option>)}
        </select>
      </div>
    );
  }

  const getPrice = (id: number) => margins.find((m: any) => m.id === id)?.outputVwap ?? vwaps[id] ?? 0;

  function Tree({ nodeId, depth = 0 }: { nodeId: number; depth?: number }) {
    const node = resMap[nodeId];
    if (!node) return null;
    const inputs = Object.entries(node.inputs);
    const price = getPrice(nodeId);
    return (
      <div className="border-l-2 border-surface-200 dark:border-surface-700 ml-3 pl-4 py-1">
        <div className="flex items-center gap-2 py-1">
          <Package size={12} className="text-surface-400 shrink-0" />
          <span className="font-bold text-sm">{node.name}</span>
          <span className="text-[10px] text-surface-400">#{nodeId}</span>
          <span className="text-xs font-bold text-brand-600">${fmt(price)}</span>
          {depth === 0 && node.wages > 0 && <span className="text-[10px] text-surface-400">wages: ${fmt(node.wages)}/h</span>}
          {depth === 0 && node.producedAnHour > 0 && <span className="text-[10px] text-surface-400">{fmt(node.producedAnHour)}/h</span>}
        </div>
        {inputs.length > 0 && (
          <div className="space-y-1">
            {inputs.map(([id, inp]) => {
              const subPrice = getPrice(Number(id));
              const total = subPrice * inp.quantity;
              const hasChildren = resMap[Number(id)]?.inputs && Object.keys(resMap[Number(id)].inputs).length > 0;
              return (
                <div key={id}>
                  <div className="flex items-center gap-2 py-0.5 text-xs">
                    <ChevronRight size={10} className="text-surface-300 shrink-0" />
                    <span>{inp.name}</span>
                    <span className="text-surface-400">×{inp.quantity}</span>
                    <span className="text-surface-400">@</span>
                    <span className="font-bold">${fmt(subPrice)}</span>
                    <span className="text-surface-400">= ${fmt(total)}</span>
                  </div>
                  {hasChildren && <Tree nodeId={Number(id)} depth={depth + 1} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <select value={searchId} onChange={e => setSearchId(e.target.value)} className="input">
          <option value="">Change product...</option>
          {Object.entries(resMap).filter(([_, r]) => Object.keys(r.inputs).length > 0).sort(([,a], [,b]) => a.name.localeCompare(b.name)).map(([id, r]) => <option key={id} value={id}>{r.name} (#{id})</option>)}
        </select>
      </div>
      <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-6 bg-white dark:bg-surface-950">
        <Tree nodeId={rootId} />
      </div>
    </div>
  );
}
