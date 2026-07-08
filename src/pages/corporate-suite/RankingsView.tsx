import { useState, useEffect, useMemo } from "react";
import { useSharedRealm } from "../../hooks/useSharedRealm";
import { Trophy, Search, RefreshCw } from "lucide-react";

interface CompanyRank { rank: number; name: string; value: number; tier: number; country: string; rating: number; buildings: number; patentsValue: number; bondsSold: number; }

async function fetchRankings(realm: number): Promise<CompanyRank[]> {
  const all: CompanyRank[] = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.simcotools.com/v1/realms/${realm}/companies?page=${page}&disable_pagination=False`)}`).then(r => r.json());
      for (const c of (res as any)?.companies ?? []) {
        all.push({
          rank: c.rank ?? 0,
          name: c.name ?? `#${c.id}`,
          value: c.value ?? 0,
          tier: c.governmentOrderTierIndex ?? 0,
          country: c.country ?? "—",
          rating: c.rating ?? 0,
          buildings: Object.keys(c.buildings ?? {}).length,
          patentsValue: c.patentsValue ?? 0,
          bondsSold: c.bondsSold ?? 0,
        });
      }
    } catch { /* skip page */ }
  }
  return all.sort((a, b) => a.rank - b.rank);
}

function fmt$(n: number): string { return n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(1)}K` : `$${n}`; }

export function RankingsView() {
  const [realm] = useSharedRealm();
  const [companies, setCompanies] = useState<CompanyRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setCompanies(await fetchRankings(realm));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [realm]);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const s = search.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(s));
  }, [companies, search]);

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Company Rankings</h2>
        <button onClick={fetchAll} disabled={loading} className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-brand-600"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {loading ? "Loading..." : "Refresh"}</button>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input type="text" placeholder="Search company..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-surface-300 dark:border-surface-700 rounded-lg text-sm outline-none bg-white dark:bg-surface-900" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800 max-h-[60vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-50 dark:bg-surface-900 z-10">
            <tr className="text-surface-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="text-left px-3 py-2">Rank</th><th className="text-left px-3 py-2">Company</th><th className="text-right px-3 py-2">Value</th><th className="text-right px-3 py-2">Tier</th><th className="text-right px-3 py-2">Bldgs</th><th className="text-right px-3 py-2">IP Value</th><th className="text-right px-3 py-2">Bonds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {filtered.slice(0, 500).map(c => (
              <tr key={c.rank} className={`hover:bg-surface-50 dark:hover:bg-surface-900/50 ${c.rank <= 10 ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}>
                <td className="px-3 py-2 font-bold">{c.rank <= 10 ? <span className="flex items-center gap-1"><Trophy size={12} className="text-amber-500" />{c.rank}</span> : c.rank}</td>
                <td className="px-3 py-2 font-bold">{c.name}</td>
                <td className="px-3 py-2 text-right font-bold">{fmt$(c.value)}</td>
                <td className="px-3 py-2 text-right">{c.tier}</td>
                <td className="px-3 py-2 text-right">{c.buildings}</td>
                <td className="px-3 py-2 text-right text-violet-600">{fmt$(c.patentsValue)}</td>
                <td className="px-3 py-2 text-right text-amber-600">{fmt$(c.bondsSold)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
