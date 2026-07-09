import { Trophy, Search } from "lucide-react";

export function RankingsView() {
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-12 text-center">
      <Trophy size={32} className="mx-auto text-surface-300 mb-3" />
      <p className="text-sm font-bold text-surface-500 mb-1">Company Rankings</p>
      <p className="text-xs text-surface-400">Rankings data requires a direct API connection which has been removed for security. Use the Command tab to sync your company and view its metrics.</p>
    </div>
  );
}
