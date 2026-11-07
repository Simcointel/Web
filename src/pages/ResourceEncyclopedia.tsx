import { useState, useMemo } from "react";
import { RESOURCES } from "../data/simco_static";
import { usePageTitleKey } from "../hooks/usePageTitle";
import { Search, Copy, Check } from "lucide-react";

export function ResourceEncyclopediaPage() {
  usePageTitleKey('resourceEncyclopedia');

  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = useMemo(
    () => RESOURCES.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.id - b.id),
    [search]
  );

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-[1440px] mx-auto p-3 sm:p-4 lg:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            Resource Encyclopedia
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            All {RESOURCES.length} resources with their IDs (codes) from Sim Companies.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="card border-surface-200 dark:border-surface-800 !shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-surface-500 uppercase tracking-wider text-[10px]">ID</th>
                <th className="px-4 py-3 text-left font-bold text-surface-500 uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-4 py-3 text-right font-bold text-surface-500 uppercase tracking-wider text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-surface-50 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-brand-600 tabular-nums">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-surface-700 dark:text-surface-300">{r.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => copyToClipboard(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase
                        rounded-lg transition-all
                        ${copiedId === r.id
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-surface-100 text-surface-600 hover:bg-brand-100 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-brand-900/30'
                        }"
                      aria-label={`Copy resource ID ${r.id}`}
                    >
                      {copiedId === r.id ? (
                        <>
                          <Check size={12} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 text-center">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
            {filtered.length} of {RESOURCES.length} resources
            {search && ` (filtered from "${search}")`}
          </span>
        </div>
      </div>
    </div>
  );
}