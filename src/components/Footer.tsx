export function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <span className="w-5 h-5 bg-brand-600 rounded flex items-center justify-center text-white text-[8px] font-bold">SI</span>
            SimcoIntel &mdash; Economic Intelligence Platform
          </div>
          <div className="flex items-center gap-3 text-xs text-surface-400">
            <span>Deterministic analysis</span>
            <span className="w-1 h-1 rounded-full bg-surface-300" />
            <span>v3.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
